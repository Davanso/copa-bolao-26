import { Router, type RequestHandler } from "express";
import type { Game } from "../../db/types.js";
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
  const game = await getGameFromProvider(String(req.params.gameId));

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
  const providerGames = await getGamesFromProvider();
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
    .sort(compareGames)
    .map((game) => ({
      ...game,
      myGuess: myGuesses.find((guess) => guess.gameId === game.id) ?? null,
    }));

  res.json({ source: "worldcup26.ir", games: data });
});

gamesRouter.get("/:id", requireAuth, async (req, res) => {
  const game = await getGameFromProvider(String(req.params.id));

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

async function getGamesFromProvider() {
  try {
    return await getWorldCupGames();
  } catch {
    throw new HttpError(
      503,
      "Não foi possível conectar com a API oficial de jogos. Tente novamente em instantes.",
    );
  }
}

async function getGameFromProvider(gameId: string) {
  try {
    return await getWorldCupGame(gameId);
  } catch {
    throw new HttpError(
      503,
      "Não foi possível conectar com a API oficial de jogos. Tente novamente em instantes.",
    );
  }
}

function compareGames(firstGame: Game, secondGame: Game) {
  const firstOrder = gameStageOrder(firstGame);
  const secondOrder = gameStageOrder(secondGame);

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  if (firstGame.groupName && secondGame.groupName) {
    const groupOrder = firstGame.groupName.localeCompare(
      secondGame.groupName,
      "pt-BR",
      {
        numeric: true,
      },
    );

    if (groupOrder !== 0) {
      return groupOrder;
    }
  }

  return Date.parse(firstGame.startsAt) - Date.parse(secondGame.startsAt);
}

function gameStageOrder(game: Game) {
  if (game.groupName) {
    return 0;
  }

  const knockoutOrder: Record<string, number> = {
    "16 avos de final": 1,
    "Oitavas de final": 2,
    "Quartas de final": 3,
    Semifinal: 4,
    Final: 5,
    "Disputa de terceiro lugar": 6,
  };

  return knockoutOrder[game.stage] ?? 99;
}
