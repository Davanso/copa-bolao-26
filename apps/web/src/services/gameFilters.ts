import type { Game } from "./types";

const dayMs = 24 * 60 * 60 * 1000;

export function upcomingGamesToday(games: Game[], now = Date.now()) {
  const today = dayKey(new Date(now).toISOString());

  return games
    .filter((game) => Date.parse(game.startsAt) > now)
    .filter((game) => dayKey(game.startsAt) === today)
    .sort(compareByStart);
}

export function upcomingReminderGames(games: Game[], now = Date.now()) {
  const limit = now + 3 * dayMs;

  return games
    .filter((game) => game.status === "scheduled")
    .filter((game) => {
      const startsAt = Date.parse(game.startsAt);
      return startsAt > now && startsAt <= limit;
    })
    .sort(compareByStart);
}

export function missingGuessGames(games: Game[]) {
  return games.filter((game) => !game.myGuess);
}

function compareByStart(firstGame: Game, secondGame: Game) {
  return Date.parse(firstGame.startsAt) - Date.parse(secondGame.startsAt);
}

function dayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date(value));
}
