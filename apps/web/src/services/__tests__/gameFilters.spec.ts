import { describe, expect, it } from "vitest";
import { liveGamesWithGuesses } from "../gameFilters";
import type { Game } from "../types";

function game(overrides: Partial<Game>): Game {
  return {
    groupName: "A",
    id: "game-1",
    liveMinute: null,
    scoreAway: null,
    scoreHome: null,
    stage: "Fase de grupos",
    startsAt: "2026-06-15T19:00:00.000Z",
    status: "scheduled",
    teamAway: "México",
    teamHome: "Brasil",
    ...overrides,
  };
}

describe("liveGamesWithGuesses", () => {
  it("enriquece jogos ao vivo com o palpite vindo da lista principal", () => {
    const liveGame = game({ id: "game-1", status: "live" });
    const cachedGame = game({
      id: "game-1",
      myGuess: {
        gameId: "game-1",
        guessAway: 1,
        guessHome: 2,
        id: "guess-1",
        points: null,
      },
    });

    expect(
      liveGamesWithGuesses([liveGame], [cachedGame])[0].myGuess,
    ).toMatchObject({
      guessAway: 1,
      guessHome: 2,
    });
  });

  it("usa jogos com status ao vivo como fallback", () => {
    const cachedLiveGame = game({ id: "game-2", status: "live" });

    expect(liveGamesWithGuesses([], [cachedLiveGame])).toEqual([
      cachedLiveGame,
    ]);
  });

  it("casa football-data com jogo principal por times e horario", () => {
    const liveGame = game({
      id: "football-data-537364",
      status: "live",
      teamAway: "México",
      teamHome: "Brasil",
    });
    const cachedGame = game({
      id: "worldcup-1",
      myGuess: {
        gameId: "worldcup-1",
        guessAway: 0,
        guessHome: 1,
        id: "guess-1",
        points: null,
      },
      teamAway: "México",
      teamHome: "Brasil",
    });

    expect(
      liveGamesWithGuesses([liveGame], [cachedGame])[0].myGuess,
    ).toMatchObject({
      guessAway: 0,
      guessHome: 1,
    });
  });
});
