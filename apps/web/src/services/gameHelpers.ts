import type { Game } from "../services/types";

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
