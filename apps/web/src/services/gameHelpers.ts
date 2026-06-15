import type { Game } from "./types";

export const statusLabel: Record<Game["status"], string> = {
  scheduled: "Agendado",
  live: "Ao vivo",
  finished: "Finalizado",
  postponed: "Adiado",
};

export const statusColor: Record<
  Game["status"],
  "default" | "primary" | "secondary" | "warning" | "success"
> = {
  scheduled: "default",
  live: "primary",
  finished: "success",
  postponed: "warning",
};

export function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function isGuessLocked(game: Game) {
  return Date.now() >= Date.parse(game.startsAt) || game.status !== "scheduled";
}

export function isGameFinished(game: Game) {
  return game.status === "finished";
}

export function guessFeedback(game: Game) {
  const guess = game.myGuess;

  if (!guess) {
    return null;
  }

  if (
    game.status !== "finished" ||
    game.scoreHome === null ||
    game.scoreAway === null
  ) {
    return {
      color: "default" as const,
      label: "Pendente",
      result: "pending" as const,
    };
  }

  if (
    guess.guessHome === game.scoreHome &&
    guess.guessAway === game.scoreAway
  ) {
    return {
      color: "success" as const,
      label: "Cravou o placar",
      result: "exact" as const,
    };
  }

  if (
    Math.sign(guess.guessHome - guess.guessAway) ===
    Math.sign(game.scoreHome - game.scoreAway)
  ) {
    return {
      color: "primary" as const,
      label: "Acertou o resultado",
      result: "outcome" as const,
    };
  }

  return {
    color: "error" as const,
    label: "Errou",
    result: "miss" as const,
  };
}
