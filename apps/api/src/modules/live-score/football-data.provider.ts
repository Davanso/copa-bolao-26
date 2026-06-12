import type { Game, GameStatus } from "../../db/types.js";
import { officialStartsAtForGame } from "../world-cup/official-schedule.js";

const footballDataBaseUrl =
  process.env.FOOTBALL_DATA_API_URL ?? "https://api.football-data.org/v4";
const footballDataCompetition = process.env.FOOTBALL_DATA_COMPETITION ?? "WC";
const footballDataToken = process.env.FOOTBALL_DATA_API_TOKEN;
const footballDataCacheTtlMs = Number(
  process.env.FOOTBALL_DATA_CACHE_TTL_MS ?? 70_000,
);

let cachedAt = 0;
let cachedLiveGames: Game[] | null = null;

type FootballDataMatch = {
  area?: { name?: string };
  awayTeam?: { name?: string; shortName?: string; tla?: string };
  competition?: { code?: string; name?: string };
  group?: string;
  homeTeam?: { name?: string; shortName?: string; tla?: string };
  id: number;
  lastUpdated?: string;
  matchday?: number;
  score?: {
    fullTime?: { away?: number | null; home?: number | null };
    halfTime?: { away?: number | null; home?: number | null };
  };
  stage?: string;
  status?: string;
  utcDate?: string;
};

type FootballDataResponse = {
  matches?: FootballDataMatch[];
};

export async function getFootballDataLiveGames() {
  if (!footballDataToken) {
    return null;
  }

  if (cachedLiveGames && Date.now() - cachedAt <= footballDataCacheTtlMs) {
    return cachedLiveGames;
  }

  const url = new URL(
    `${footballDataBaseUrl}/competitions/${footballDataCompetition}/matches`,
  );
  url.searchParams.set("status", "LIVE,IN_PLAY,PAUSED");

  const response = await fetch(url, {
    headers: { "X-Auth-Token": footballDataToken },
  });

  if (!response.ok) {
    throw new Error(`Football-Data retornou HTTP ${response.status}`);
  }

  const payload = (await response.json()) as FootballDataResponse;

  cachedLiveGames = (payload.matches ?? []).map(normalizeFootballDataMatch);
  cachedAt = Date.now();

  return cachedLiveGames;
}

function normalizeFootballDataMatch(match: FootballDataMatch): Game {
  const status = normalizeStatus(match.status);
  const scoreHome = scoreValue(match.score?.fullTime?.home);
  const scoreAway = scoreValue(match.score?.fullTime?.away);
  const normalizedGame: Game = {
    externalId: String(match.id),
    groupName: normalizeGroup(match.group),
    id: `football-data-${match.id}`,
    lastLiveSyncAt: match.lastUpdated ?? new Date().toISOString(),
    liveMinute: null,
    scoreAway,
    scoreHome,
    stage: normalizeStage(match.stage),
    startsAt: match.utcDate ?? new Date(0).toISOString(),
    status,
    teamAway: translateTeam(
      match.awayTeam?.shortName ?? match.awayTeam?.name ?? "A definir",
    ),
    teamHome: translateTeam(
      match.homeTeam?.shortName ?? match.homeTeam?.name ?? "A definir",
    ),
  };

  return {
    ...normalizedGame,
    startsAt:
      officialStartsAtForGame(normalizedGame) ?? normalizedGame.startsAt,
  };
}

function normalizeStatus(status?: string): GameStatus {
  if (status === "FINISHED") {
    return "finished";
  }

  if (
    status === "POSTPONED" ||
    status === "SUSPENDED" ||
    status === "CANCELLED"
  ) {
    return "postponed";
  }

  if (status === "LIVE" || status === "IN_PLAY" || status === "PAUSED") {
    return "live";
  }

  return "scheduled";
}

function normalizeStage(stage?: string) {
  const labels: Record<string, string> = {
    FINAL: "Final",
    GROUP_STAGE: "Fase de grupos",
    LAST_16: "Oitavas de final",
    QUARTER_FINALS: "Quartas de final",
    SEMI_FINALS: "Semifinal",
    THIRD_PLACE: "Disputa de terceiro lugar",
  };

  return labels[stage ?? ""] ?? "Copa do Mundo";
}

function normalizeGroup(group?: string) {
  if (!group) {
    return undefined;
  }

  return group.replace("GROUP_", "").replace("Group ", "");
}

function scoreValue(value?: number | null) {
  return typeof value === "number" ? value : null;
}

function translateTeam(value: string) {
  const translations: Record<string, string> = {
    Brazil: "Brasil",
    Canada: "Canadá",
    Mexico: "México",
    USA: "Estados Unidos",
    "United States": "Estados Unidos",
  };

  return translations[value] ?? value;
}
