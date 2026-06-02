import { Router } from "express";
import { requireAuth } from "../../shared/auth/auth.js";
import { getWorldCupGames } from "../world-cup/world-cup.provider.js";

export const liveScoreRouter = Router();

liveScoreRouter.get("/", requireAuth, async (_req, res) => {
  const games = await getWorldCupGames();
  const liveGames = games
    .filter((game) => game.status === "live")
    .map((game) => ({
      ...game,
      events: [],
    }));

  res.json({
    source: "worldcup26.ir",
    liveGames,
    syncedAt: new Date().toISOString(),
  });
});
