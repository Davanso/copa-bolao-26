import type { Game } from "../../db/types.js";

type OfficialGame = {
  away: string;
  groupName?: string;
  home: string;
  stage: string;
  startsAt: string;
};

export const officialGames: OfficialGame[] = [
  game("México", "África do Sul", "A", "2026-06-11T16:00"),
  game("Coreia do Sul", "República Tcheca", "A", "2026-06-11T23:00"),
  game("Canadá", "Bósnia", "B", "2026-06-12T16:00"),
  game("Estados Unidos", "Paraguai", "D", "2026-06-12T22:00"),
  game("Catar", "Suíça", "B", "2026-06-13T16:00"),
  game("Brasil", "Marrocos", "C", "2026-06-13T19:00"),
  game("Haiti", "Escócia", "C", "2026-06-13T22:00"),
  game("Austrália", "Turquia", "D", "2026-06-14T01:00"),
  game("Alemanha", "Curaçao", "E", "2026-06-14T14:00"),
  game("Holanda", "Japão", "F", "2026-06-14T17:00"),
  game("Costa do Marfim", "Equador", "E", "2026-06-14T20:00"),
  game("Suécia", "Tunísia", "F", "2026-06-14T23:00"),
  game("Espanha", "Cabo Verde", "H", "2026-06-15T13:00"),
  game("Bélgica", "Egito", "G", "2026-06-15T16:00"),
  game("Arábia Saudita", "Uruguai", "H", "2026-06-15T19:00"),
  game("Irã", "Nova Zelândia", "G", "2026-06-15T22:00"),
  game("França", "Senegal", "I", "2026-06-16T16:00"),
  game("Iraque", "Noruega", "I", "2026-06-16T19:00"),
  game("Argentina", "Argélia", "J", "2026-06-16T22:00"),
  game("Áustria", "Jordânia", "J", "2026-06-17T01:00"),
  game("Portugal", "RD Congo", "K", "2026-06-17T14:00"),
  game("Inglaterra", "Croácia", "L", "2026-06-17T17:00"),
  game("Gana", "Panamá", "L", "2026-06-17T20:00"),
  game("Uzbequistão", "Colômbia", "K", "2026-06-17T23:00"),
  game("República Tcheca", "África do Sul", "A", "2026-06-18T13:00"),
  game("Suíça", "Bósnia", "B", "2026-06-18T16:00"),
  game("Canadá", "Catar", "B", "2026-06-18T19:00"),
  game("México", "Coreia do Sul", "A", "2026-06-18T22:00"),
  game("Estados Unidos", "Austrália", "D", "2026-06-19T16:00"),
  game("Escócia", "Marrocos", "C", "2026-06-19T19:00"),
  game("Brasil", "Haiti", "C", "2026-06-19T21:30"),
  game("Turquia", "Paraguai", "D", "2026-06-20T01:00"),
  game("Holanda", "Suécia", "F", "2026-06-20T14:00"),
  game("Alemanha", "Costa do Marfim", "E", "2026-06-20T17:00"),
  game("Equador", "Curaçao", "E", "2026-06-20T21:00"),
  game("Tunísia", "Japão", "F", "2026-06-21T01:00"),
  game("Espanha", "Arábia Saudita", "H", "2026-06-21T13:00"),
  game("Bélgica", "Irã", "G", "2026-06-21T16:00"),
  game("Uruguai", "Cabo Verde", "H", "2026-06-21T19:00"),
  game("Nova Zelândia", "Egito", "G", "2026-06-21T22:00"),
  game("Argentina", "Áustria", "J", "2026-06-22T14:00"),
  game("França", "Iraque", "I", "2026-06-22T18:00"),
  game("Noruega", "Senegal", "I", "2026-06-22T21:00"),
  game("Jordânia", "Argélia", "J", "2026-06-23T00:00"),
  game("Portugal", "Uzbequistão", "K", "2026-06-23T14:00"),
  game("Inglaterra", "Gana", "L", "2026-06-23T17:00"),
  game("Panamá", "Croácia", "L", "2026-06-23T20:00"),
  game("Colômbia", "RD Congo", "K", "2026-06-23T23:00"),
  game("Suíça", "Canadá", "B", "2026-06-24T16:00"),
  game("Bósnia", "Catar", "B", "2026-06-24T16:00"),
  game("Marrocos", "Haiti", "C", "2026-06-24T19:00"),
  game("Escócia", "Brasil", "C", "2026-06-24T19:00"),
  game("África do Sul", "Coreia do Sul", "A", "2026-06-24T22:00"),
  game("República Tcheca", "México", "A", "2026-06-24T22:00"),
  game("Equador", "Alemanha", "E", "2026-06-25T17:00"),
  game("Curaçao", "Costa do Marfim", "E", "2026-06-25T17:00"),
  game("Tunísia", "Holanda", "F", "2026-06-25T20:00"),
  game("Japão", "Suécia", "F", "2026-06-25T20:00"),
  game("Turquia", "Estados Unidos", "D", "2026-06-25T23:00"),
  game("Paraguai", "Austrália", "D", "2026-06-25T23:00"),
  game("Senegal", "Iraque", "I", "2026-06-26T16:00"),
  game("Noruega", "França", "I", "2026-06-26T16:00"),
  game("Cabo Verde", "Arábia Saudita", "H", "2026-06-26T21:00"),
  game("Uruguai", "Espanha", "H", "2026-06-26T21:00"),
  game("Egito", "Irã", "G", "2026-06-27T00:00"),
  game("Nova Zelândia", "Bélgica", "G", "2026-06-27T00:00"),
  game("Croácia", "Gana", "L", "2026-06-27T18:00"),
  game("Panamá", "Inglaterra", "L", "2026-06-27T18:00"),
  game("RD Congo", "Uzbequistão", "K", "2026-06-27T20:30"),
  game("Colômbia", "Portugal", "K", "2026-06-27T20:30"),
  game("Jordânia", "Argentina", "J", "2026-06-27T23:00"),
  game("Argélia", "Áustria", "J", "2026-06-27T23:00"),
  game(
    "África do Sul",
    "Canadá",
    undefined,
    "2026-06-28T16:00",
    "16 avos de final",
  ),
  game("Brasil", "Japão", undefined, "2026-06-29T14:00", "16 avos de final"),
  game(
    "Alemanha",
    "Paraguai",
    undefined,
    "2026-06-29T17:30",
    "16 avos de final",
  ),
  game(
    "Holanda",
    "Marrocos",
    undefined,
    "2026-06-29T22:00",
    "16 avos de final",
  ),
  game(
    "Costa do Marfim",
    "Noruega",
    undefined,
    "2026-06-30T14:00",
    "16 avos de final",
  ),
  game("França", "Suécia", undefined, "2026-06-30T18:00", "16 avos de final"),
  game("México", "Equador", undefined, "2026-06-30T22:00", "16 avos de final"),
  game(
    "Inglaterra",
    "RD Congo",
    undefined,
    "2026-07-01T13:00",
    "16 avos de final",
  ),
  game("Bélgica", "Senegal", undefined, "2026-07-01T17:00", "16 avos de final"),
  game(
    "Estados Unidos",
    "Bósnia",
    undefined,
    "2026-07-01T21:00",
    "16 avos de final",
  ),
  game("Espanha", "Áustria", undefined, "2026-07-02T16:00", "16 avos de final"),
  game(
    "Portugal",
    "Croácia",
    undefined,
    "2026-07-02T20:00",
    "16 avos de final",
  ),
  game("Suíça", "Argélia", undefined, "2026-07-03T00:00", "16 avos de final"),
  game("Austrália", "Egito", undefined, "2026-07-03T15:00", "16 avos de final"),
  game(
    "Argentina",
    "Cabo Verde",
    undefined,
    "2026-07-03T19:00",
    "16 avos de final",
  ),
  game("Colômbia", "Gana", undefined, "2026-07-03T22:30", "16 avos de final"),
  game(
    "Venc. Segunda fase 3",
    "Venc. Segunda fase 4",
    undefined,
    "2026-07-04T14:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 1",
    "Venc. Segunda fase 2",
    undefined,
    "2026-07-04T18:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 9",
    "Venc. Segunda fase 10",
    undefined,
    "2026-07-05T17:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 11",
    "Venc. Segunda fase 12",
    undefined,
    "2026-07-05T21:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 5",
    "Venc. Segunda fase 6",
    undefined,
    "2026-07-06T16:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 7",
    "Venc. Segunda fase 8",
    undefined,
    "2026-07-06T21:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 13",
    "Venc. Segunda fase 14",
    undefined,
    "2026-07-07T13:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Segunda fase 15",
    "Venc. Segunda fase 16",
    undefined,
    "2026-07-07T17:00",
    "Oitavas de final",
  ),
  game(
    "Venc. Oitavas 1",
    "Venc. Oitavas 2",
    undefined,
    "2026-07-09T17:00",
    "Quartas de final",
  ),
  game(
    "Venc. Oitavas 3",
    "Venc. Oitavas 4",
    undefined,
    "2026-07-10T16:00",
    "Quartas de final",
  ),
  game(
    "Venc. Oitavas 5",
    "Venc. Oitavas 6",
    undefined,
    "2026-07-11T18:00",
    "Quartas de final",
  ),
  game(
    "Venc. Oitavas 7",
    "Venc. Oitavas 8",
    undefined,
    "2026-07-11T22:00",
    "Quartas de final",
  ),
  game(
    "Venc. Quartas 1",
    "Venc. Quartas 2",
    undefined,
    "2026-07-14T16:00",
    "Semifinal",
  ),
  game(
    "Venc. Quartas 3",
    "Venc. Quartas 4",
    undefined,
    "2026-07-15T16:00",
    "Semifinal",
  ),
  game(
    "Perd. Semifinal 1",
    "Perd. Semifinal 2",
    undefined,
    "2026-07-18T18:00",
    "Disputa de terceiro lugar",
  ),
  game(
    "Venc. Semifinal 1",
    "Venc. Semifinal 2",
    undefined,
    "2026-07-19T16:00",
    "Final",
  ),
];

const officialStartsAt = new Map(
  officialGames.map((item) => [officialKey(item), brazilToIso(item.startsAt)]),
);

const officialStartsAtByTeams = new Map(
  officialGames.map((item) => [
    officialTeamsKey(item),
    brazilToIso(item.startsAt),
  ]),
);

export function officialStartsAtForGame(game: Game) {
  return (
    officialStartsAt.get(officialGameKey(game)) ??
    officialStartsAtByTeams.get(officialGameTeamsKey(game)) ??
    null
  );
}

export function officialGamesAsMocks(): Game[] {
  return officialGames.map((item, index) => ({
    externalId: `official-${index + 1}`,
    groupName: item.groupName,
    id: `official-${index + 1}`,
    lastLiveSyncAt: new Date().toISOString(),
    liveMinute: null,
    scoreAway: null,
    scoreHome: null,
    stage: item.stage,
    startsAt: brazilToIso(item.startsAt),
    status: "scheduled",
    teamAway: item.away,
    teamHome: item.home,
  }));
}

function game(
  home: string,
  away: string,
  groupName: string | undefined,
  startsAt: string,
  stage = "Fase de grupos",
): OfficialGame {
  return { away, groupName, home, stage, startsAt };
}

function officialKey({
  away,
  groupName,
  home,
  stage,
}: Pick<OfficialGame, "away" | "groupName" | "home" | "stage">) {
  return [stage, normalizeGroup(groupName), ...sortTeams(home, away)].join("|");
}

function officialGameKey(
  game: Pick<Game, "groupName" | "stage" | "teamAway" | "teamHome">,
) {
  return [
    game.stage,
    normalizeGroup(game.groupName),
    ...sortTeams(game.teamHome, game.teamAway),
  ].join("|");
}

function officialTeamsKey({ away, home }: Pick<OfficialGame, "away" | "home">) {
  return sortTeams(home, away).join("|");
}

function officialGameTeamsKey(game: Pick<Game, "teamAway" | "teamHome">) {
  return sortTeams(game.teamHome, game.teamAway).join("|");
}

function sortTeams(home: string, away: string) {
  return [normalize(home), normalize(away)].sort((first, second) =>
    first.localeCompare(second),
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\bbosnia e herzegovina\b/g, "bosnia")
    .replace(/\bbosnia and herzegovina\b/g, "bosnia");
}

function normalizeGroup(value?: string) {
  return normalize(value ?? "")
    .replace(/^grupo\s+/, "")
    .replace(/^group\s+/, "");
}

function brazilToIso(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, hour + 3, minute),
  ).toISOString();
}
