import { Router } from "express";
import { requireAuth } from "../../shared/auth/auth.js";
import { getWorldCupGames } from "../world-cup/world-cup.provider.js";

export const liveScoreRouter = Router();

liveScoreRouter.get("/", requireAuth, async (_req, res) => {
  const games = await getWorldCupGames();
  const liveGames = games
    .filter((game) => game.status === "live" || isInsideLiveWindow(game))
    .map((game) => ({
      ...game,
      status: "live",
      events: [],
    }));

  res.json({
    source: "worldcup26.ir",
    liveGames,
    syncedAt: new Date().toISOString(),
  });
});

function isInsideLiveWindow(game: {
  startsAt: string;
  status: "scheduled" | "live" | "finished" | "postponed";
}) {
  if (game.status === "finished" || game.status === "postponed") {
    return false;
  }

  const startsAt = Date.parse(game.startsAt);

  if (!Number.isFinite(startsAt)) {
    return false;
  }

  const now = Date.now();
  const matchWindowMs = 2.5 * 60 * 60 * 1000;

  return startsAt <= now && now <= startsAt + matchWindowMs;
}
