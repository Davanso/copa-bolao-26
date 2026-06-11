import type { Game, GameStatus } from "../../db/types.js";
import {
  officialGamesAsMocks,
  officialStartsAtForGame,
} from "./official-schedule.js";

const providerUrl =
  process.env.WORLD_CUP_API_URL ?? "https://worldcup26.ir/get/games";
const isDevelopment = process.env.NODE_ENV !== "production";
const apiDateBrazilDisplayOffsetHours = Number(
  process.env.WORLD_CUP_API_BRAZIL_DISPLAY_OFFSET_HOURS ?? 6,
);

let cachedAt = 0;
let cachedGames: Game[] = [];

const cacheTtlMs = 60_000;

const teamTranslations: Record<string, string> = {
  Algeria: "Argélia",
  Argentina: "Argentina",
  Australia: "Austrália",
  Belgium: "Bélgica",
  Bosnia: "Bósnia",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  "Cape Verde": "Cabo Verde",
  Colombia: "Colômbia",
  Croatia: "Croácia",
  "Czech Republic": "República Tcheca",
  Curaçao: "Curaçao",
  Ecuador: "Equador",
  Egypt: "Egito",
  England: "Inglaterra",
  France: "França",
  Germany: "Alemanha",
  Ghana: "Gana",
  Haiti: "Haiti",
  Iran: "Irã",
  Iraq: "Iraque",
  "Ivory Coast": "Costa do Marfim",
  Japan: "Japão",
  Mexico: "México",
  Morocco: "Marrocos",
  Netherlands: "Holanda",
  "New Zealand": "Nova Zelândia",
  Norway: "Noruega",
  Panama: "Panam?",
  Paraguay: "Paraguai",
  Portugal: "Portugal",
  Qatar: "Catar",
  "DR Congo": "RD Congo",
  "Democratic Republic of the Congo": "RD Congo",
  "Saudi Arabia": "Arábia Saudita",
  Scotland: "Escócia",
  Senegal: "Senegal",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  Spain: "Espanha",
  Sweden: "Suécia",
  Switzerland: "Suíça",
  Tunisia: "Tunísia",
  Turkey: "Turquia",
  "United States": "Estados Unidos",
  Uruguay: "Uruguai",
  Uzbekistan: "Uzbequist?o",
};

type WorldCupApiGame = {
  _id?: string;
  id: string;
  home_score?: string;
  away_score?: string;
  group?: string;
  local_date?: string;
  finished?: string;
  time_elapsed?: string;
  type?: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
};

type WorldCupApiResponse = {
  games?: WorldCupApiGame[];
};

export async function getWorldCupGames() {
  if (Date.now() - cachedAt <= cacheTtlMs) {
    return cachedGames;
  }

  let response: Response;

  try {
    response = await fetch(providerUrl);
  } catch (error) {
    return fallbackGames(error);
  }

  if (!response.ok) {
    return fallbackGames(
      new Error(`World Cup API retornou HTTP ${response.status}`),
    );
  }

  const payload = (await response.json()) as WorldCupApiResponse;
  cachedGames = (payload.games ?? []).map(normalizeGame);
  cachedAt = Date.now();

  return cachedGames;
}

export async function getWorldCupGame(gameId: string) {
  const games = await getWorldCupGames();
  return games.find((game) => game.id === gameId);
}

function normalizeGame(game: WorldCupApiGame): Game {
  const status = normalizeStatus(game);
  const liveMinute =
    status === "live" ? normalizeMinute(game.time_elapsed) : null;

  const normalizedGame: Game = {
    id: String(game.id),
    externalId: game._id,
    teamHome: translateTeam(game.home_team_name_en ?? game.home_team_label),
    teamAway: translateTeam(game.away_team_name_en ?? game.away_team_label),
    startsAt: parseApiDate(game.local_date).toISOString(),
    stage: normalizeStage(game.type),
    groupName: game.group,
    scoreHome: normalizeScore(game.home_score, status),
    scoreAway: normalizeScore(game.away_score, status),
    status,
    liveMinute,
    lastLiveSyncAt: new Date().toISOString(),
  };

  return {
    ...normalizedGame,
    startsAt:
      officialStartsAtForGame(normalizedGame) ?? normalizedGame.startsAt,
  };
}

function translateTeam(value?: string) {
  if (!value) {
    return "A definir";
  }

  return teamTranslations[value] ?? translatePlaceholder(value);
}

function translatePlaceholder(value: string) {
  return value
    .replace("Winner", "Vencedor")
    .replace("Loser", "Perdedor")
    .replace("Runner-up", "2º lugar")
    .replace("Group", "Grupo")
    .replace("Match", "Jogo")
    .replace("3rd", "3º lugar");
}

function normalizeStatus(game: WorldCupApiGame): GameStatus {
  if (game.finished === "TRUE") {
    return "finished";
  }

  if (!game.time_elapsed || game.time_elapsed === "notstarted") {
    return "scheduled";
  }

  return "live";
}

function normalizeMinute(value?: string) {
  if (!value) {
    return null;
  }

  const minute = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(minute) ? minute : null;
}

function normalizeScore(value: string | undefined, status: GameStatus) {
  if (status === "scheduled") {
    return null;
  }

  const score = Number(value ?? 0);
  return Number.isFinite(score) ? score : 0;
}

function normalizeStage(type?: string) {
  const labels: Record<string, string> = {
    group: "Fase de grupos",
    r32: "16 avos de final",
    r16: "Oitavas de final",
    qf: "Quartas de final",
    sf: "Semifinal",
    third: "Disputa de terceiro lugar",
    final: "Final",
  };

  return labels[type ?? ""] ?? "Copa do Mundo";
}

export function parseApiDate(value?: string) {
  if (!value) {
    return new Date(0);
  }

  const [datePart, timePart = "00:00"] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return apiLocalDateToBrazilInstant({
    day,
    hour,
    minute,
    month,
    offsetHours: apiDateBrazilDisplayOffsetHours,
    year,
  });
}

export function apiLocalDateToBrazilInstant({
  day,
  hour,
  minute,
  month,
  offsetHours,
  year,
}: {
  day: number;
  hour: number;
  minute: number;
  month: number;
  offsetHours: number;
  year: number;
}) {
  return new Date(
    Date.UTC(year, month - 1, day, hour + offsetHours, minute, 0, 0),
  );
}

function fallbackGames(error: unknown) {
  if (cachedGames.length) {
    return cachedGames;
  }

  if (isDevelopment) {
    cachedGames = officialGamesAsMocks();
    cachedAt = Date.now();
    return cachedGames;
  }

  throw error;
}
