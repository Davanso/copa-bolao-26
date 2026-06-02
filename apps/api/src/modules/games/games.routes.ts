import { Router, type RequestHandler } from "express";
import { prisma } from "../../db/prisma.js";
import { requireAdmin, requireAuth } from "../../shared/auth/auth.js";
import { HttpError } from "../../shared/errors/http.js";
import { resultSchema } from "../../shared/validation/schemas.js";
import { upsertGuess } from "../guesses/guesses.routes.js";
import { calculatePoints } from "../guesses/scoring.js";
import {
  getWorldCupGame,
  getWorldCupGames,
} from "../world-cup/world-cup.provider.js";

export const gamesRouter = Router();

const saveResult: RequestHandler = async (req, res) => {
  const body = resultSchema.parse(req.body);
  const game = await getWorldCupGame(String(req.params.gameId));

  if (!game) {
    throw new HttpError(404, "Jogo não encontrado");
  }

  const guesses = await prisma.guess.findMany({ where: { gameId: game.id } });

  await Promise.all(
    guesses.map((guess) =>
      prisma.guess.update({
        where: { id: guess.id },
        data: {
          points: calculatePoints(
            guess.guessHome,
            guess.guessAway,
            body.scoreHome,
            body.scoreAway,
          ),
        },
      }),
    ),
  );

  res.json({
    game: {
      ...game,
      scoreHome: body.scoreHome,
      scoreAway: body.scoreAway,
      status: body.status,
    },
    recalculated: guesses.length,
  });
};

gamesRouter.get("/", requireAuth, async (req, res) => {
  const { status, team, stage } = req.query;
  const providerGames = await getWorldCupGames();
  const myGuesses = await prisma.guess.findMany({
    where: { userId: req.user!.id },
  });
  const data = providerGames
    .filter((game) => !status || game.status === status)
    .filter((game) => !stage || game.stage === stage)
    .filter(
      (game) =>
        !team ||
        `${game.teamHome} ${game.teamAway}`
          .toLowerCase()
          .includes(String(team).toLowerCase()),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((game) => ({
      ...game,
      myGuess: myGuesses.find((guess) => guess.gameId === game.id) ?? null,
    }));

  res.json({ source: "worldcup26.ir", games: data });
});

gamesRouter.get("/:id", requireAuth, async (req, res) => {
  const game = await getWorldCupGame(String(req.params.id));

  if (!game) {
    throw new HttpError(404, "Jogo não encontrado");
  }

  res.json({
    source: "worldcup26.ir",
    game,
    myGuess:
      (await prisma.guess.findUnique({
        where: { userId_gameId: { userId: req.user!.id, gameId: game.id } },
      })) ?? null,
  });
});

gamesRouter.post("/:gameId/guess", requireAuth, upsertGuess);
gamesRouter.put("/:gameId/guess", requireAuth, upsertGuess);
gamesRouter.post("/:gameId/result", requireAuth, requireAdmin, saveResult);
gamesRouter.put("/:gameId/result", requireAuth, requireAdmin, saveResult);
