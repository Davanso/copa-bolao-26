import { describe, expect, it } from "vitest";
import { formatGameDate, guessFeedback } from "../gameHelpers";
import type { Game } from "../types";

describe("formatGameDate", () => {
  it("formata sempre no fuso de São Paulo", () => {
    expect(formatGameDate("2026-06-11T19:00:00.000Z")).toBe(
      "11 de jun. de 2026, 16:00",
    );
  });
});

const baseGame: Game = {
  groupName: "A",
  id: "game-1",
  liveMinute: null,
  scoreAway: null,
  scoreHome: null,
  stage: "Fase de grupos",
  startsAt: "2026-06-11T19:00:00.000Z",
  status: "scheduled",
  teamAway: "México",
  teamHome: "Brasil",
};

describe("guessFeedback", () => {
  it("mostra pendente enquanto o jogo não terminou", () => {
    expect(
      guessFeedback({
        ...baseGame,
        myGuess: {
          gameId: "game-1",
          guessAway: 1,
          guessHome: 2,
          id: "guess-1",
          points: null,
        },
      }),
    ).toMatchObject({ label: "Pendente", result: "pending" });
  });

  it("troca pendente por acerto de resultado quando há placar final", () => {
    expect(
      guessFeedback({
        ...baseGame,
        myGuess: {
          gameId: "game-1",
          guessAway: 0,
          guessHome: 1,
          id: "guess-1",
          points: null,
        },
        scoreAway: 1,
        scoreHome: 2,
        status: "finished",
      }),
    ).toMatchObject({ label: "Acertou o resultado", result: "outcome" });
  });
});
