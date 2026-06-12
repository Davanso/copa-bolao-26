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
});
