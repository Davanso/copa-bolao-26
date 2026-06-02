import { Router, type RequestHandler } from "express";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";
import { HttpError } from "../../shared/errors/http.js";
import { guessSchema } from "../../shared/validation/schemas.js";
import {
  getWorldCupGame,
  getWorldCupGames,
} from "../world-cup/world-cup.provider.js";

export const guessesRouter = Router();

export const upsertGuess: RequestHandler = async (req, res) => {
  const body = guessSchema.parse(req.body);
  const game = await getWorldCupGame(String(req.params.gameId));

  if (!game) {
    throw new HttpError(404, "Jogo não encontrado");
  }

  const gameStarted = Date.now() >= Date.parse(game.startsAt);
  const gameLocked = gameStarted || game.status !== "scheduled";

  if (gameLocked) {
    throw new HttpError(
      403,
      "Palpite bloqueado: o jogo já começou ou não está agendado",
    );
  }

  const guess = await prisma.guess.upsert({
    where: {
      userId_gameId: {
        userId: req.user!.id,
        gameId: game.id,
      },
    },
    create: {
      userId: req.user!.id,
      gameId: game.id,
      guessHome: body.guessHome,
      guessAway: body.guessAway,
    },
    update: {
      guessHome: body.guessHome,
      guessAway: body.guessAway,
    },
  });

  res
    .status(guess.createdAt.getTime() === guess.updatedAt.getTime() ? 201 : 200)
    .json({ guess });
};

guessesRouter.get("/me", requireAuth, async (req, res) => {
  const providerGames = await getWorldCupGames();
  const guesses = await prisma.guess.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  const data = guesses.map((guess) => ({
    ...guess,
    game: providerGames.find((game) => game.id === guess.gameId),
  }));

  res.json({ guesses: data });
});
