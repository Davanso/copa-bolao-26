import { Router } from "express";
import { requireAuth } from "../../shared/auth/auth.js";
import { getWorldCupGames } from "../world-cup/world-cup.provider.js";
import { getFootballDataLiveGames } from "./football-data.provider.js";

export const liveScoreRouter = Router();

liveScoreRouter.get("/", requireAuth, async (_req, res) => {
  const footballDataLiveGames = await tryFootballDataLiveGames();

  if (footballDataLiveGames) {
    res.json({
      liveGames: footballDataLiveGames.map((game) => ({
        ...game,
        events: [],
      })),
      source: "football-data.org",
      syncedAt: new Date().toISOString(),
    });
    return;
  }

  const games = await getWorldCupGames();
  const liveGames = games
    .filter((game) => game.status === "live" || isInsideLiveWindow(game))
    .map((game) => ({
      ...game,
      events: [],
      status: "live",
    }));

  res.json({
    liveGames,
    source: "worldcup26.ir",
    syncedAt: new Date().toISOString(),
  });
});

async function tryFootballDataLiveGames() {
  try {
    return await getFootballDataLiveGames();
  } catch (error) {
    console.warn("[WARN] football-data.live.failed", error);
    return null;
  }
}

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
