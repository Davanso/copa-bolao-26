import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findManyRules: vi.fn(),
  findManyUsers: vi.fn(),
  getWorldCupGames: vi.fn(),
}));

vi.mock("../../../db/prisma.js", () => ({
  prisma: {
    groupScoringRule: {
      findMany: mocks.findManyRules,
    },
    user: {
      findMany: mocks.findManyUsers,
    },
  },
}));

vi.mock("../../world-cup/world-cup.provider.js", () => ({
  getWorldCupGames: mocks.getWorldCupGames,
}));

const { buildRanking } = await import("../ranking.routes.js");

describe("buildRanking", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("não conta acerto de resultado como placar exato", async () => {
    mocks.findManyUsers.mockResolvedValue([
      {
        avatarUrl: null,
        guesses: [
          {
            gameId: "game-1",
            guessAway: 0,
            guessHome: 1,
          },
        ],
        id: "user-1",
        username: "ana",
      },
    ]);
    mocks.findManyRules.mockResolvedValue([
      {
        exactPoints: 7,
        resultPoints: 4,
        stage: "Fase de grupos",
      },
    ]);
    mocks.getWorldCupGames.mockResolvedValue([
      {
        id: "game-1",
        scoreAway: 1,
        scoreHome: 2,
        stage: "Fase de grupos",
        status: "finished",
      },
    ]);

    const ranking = await buildRanking(["user-1"], "group-1");

    expect(ranking[0]).toMatchObject({
      exactScores: 0,
      scoredGuesses: 1,
      totalPoints: 4,
    });
  });

  it("conta placar exato independente do valor configurado", async () => {
    mocks.findManyUsers.mockResolvedValue([
      {
        avatarUrl: null,
        guesses: [
          {
            gameId: "game-1",
            guessAway: 1,
            guessHome: 2,
          },
        ],
        id: "user-1",
        username: "ana",
      },
    ]);
    mocks.findManyRules.mockResolvedValue([
      {
        exactPoints: 2,
        resultPoints: 1,
        stage: "Fase de grupos",
      },
    ]);
    mocks.getWorldCupGames.mockResolvedValue([
      {
        id: "game-1",
        scoreAway: 1,
        scoreHome: 2,
        stage: "Fase de grupos",
        status: "finished",
      },
    ]);

    const ranking = await buildRanking(["user-1"], "group-1");

    expect(ranking[0]).toMatchObject({
      exactScores: 1,
      scoredGuesses: 1,
      totalPoints: 2,
    });
  });

  it("usa pontuacao personalizada da etapa de mata-mata", async () => {
    mocks.findManyUsers.mockResolvedValue([
      {
        avatarUrl: null,
        guesses: [
          {
            gameId: "game-1",
            guessAway: 1,
            guessHome: 2,
          },
        ],
        id: "user-1",
        username: "ana",
      },
    ]);
    mocks.findManyRules.mockResolvedValue([
      {
        exactPoints: 15,
        resultPoints: 6,
        stage: "Semifinal",
      },
    ]);
    mocks.getWorldCupGames.mockResolvedValue([
      {
        id: "game-1",
        scoreAway: 0,
        scoreHome: 3,
        stage: "Semifinal",
        status: "finished",
      },
    ]);

    const ranking = await buildRanking(["user-1"], "group-1");

    expect(ranking[0]).toMatchObject({
      exactScores: 0,
      pointsByStage: [
        {
          exactScores: 0,
          points: 6,
          scoredGuesses: 1,
          stage: "Semifinal",
        },
      ],
      scoredGuesses: 1,
      totalPoints: 6,
    });
  });

  it("detalha pontos por fase no ranking do grupo", async () => {
    mocks.findManyUsers.mockResolvedValue([
      {
        avatarUrl: null,
        guesses: [
          {
            gameId: "group-game",
            guessAway: 0,
            guessHome: 1,
          },
          {
            gameId: "final-game",
            guessAway: 1,
            guessHome: 2,
          },
        ],
        id: "user-1",
        username: "ana",
      },
    ]);
    mocks.findManyRules.mockResolvedValue([
      {
        exactPoints: 12,
        resultPoints: 5,
        stage: "Final",
      },
    ]);
    mocks.getWorldCupGames.mockResolvedValue([
      {
        id: "group-game",
        scoreAway: 0,
        scoreHome: 2,
        stage: "Fase de grupos",
        status: "finished",
      },
      {
        id: "final-game",
        scoreAway: 1,
        scoreHome: 2,
        stage: "Final",
        status: "finished",
      },
    ]);

    const ranking = await buildRanking(["user-1"], "group-1");

    expect(ranking[0]).toMatchObject({
      pointsByStage: [
        {
          exactScores: 0,
          points: 1,
          scoredGuesses: 1,
          stage: "Fase de grupos",
        },
        {
          exactScores: 1,
          points: 12,
          scoredGuesses: 1,
          stage: "Final",
        },
      ],
      totalPoints: 13,
    });
  });

  it("casa variacoes do nome da etapa ao aplicar regra personalizada", async () => {
    mocks.findManyUsers.mockResolvedValue([
      {
        avatarUrl: null,
        guesses: [
          {
            gameId: "game-1",
            guessAway: 1,
            guessHome: 2,
          },
        ],
        id: "user-1",
        username: "ana",
      },
    ]);
    mocks.findManyRules.mockResolvedValue([
      {
        exactPoints: 18,
        resultPoints: 9,
        stage: "Semi final",
      },
    ]);
    mocks.getWorldCupGames.mockResolvedValue([
      {
        id: "game-1",
        scoreAway: 1,
        scoreHome: 2,
        stage: "Semifinal",
        status: "finished",
      },
    ]);

    const ranking = await buildRanking(["user-1"], "group-1");

    expect(ranking[0]).toMatchObject({
      exactScores: 1,
      scoredGuesses: 1,
      totalPoints: 18,
    });
  });

  it("usa default da etapa quando o grupo nao personalizou aquela fase", async () => {
    mocks.findManyUsers.mockResolvedValue([
      {
        avatarUrl: null,
        guesses: [
          {
            gameId: "game-1",
            guessAway: 1,
            guessHome: 2,
          },
        ],
        id: "user-1",
        username: "ana",
      },
    ]);
    mocks.findManyRules.mockResolvedValue([]);
    mocks.getWorldCupGames.mockResolvedValue([
      {
        id: "game-1",
        scoreAway: 1,
        scoreHome: 2,
        stage: "Final",
        status: "finished",
      },
    ]);

    const ranking = await buildRanking(["user-1"], "group-1");

    expect(ranking[0]).toMatchObject({
      exactScores: 1,
      scoredGuesses: 1,
      totalPoints: 10,
    });
  });
});
