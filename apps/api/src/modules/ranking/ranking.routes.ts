import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";

export const rankingRouter = Router();

export async function buildRanking(userIds?: string[]) {
  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : undefined,
    include: { guesses: true },
  });

  return users
    .map((user) => ({
      userId: user.id,
      username: user.username,
      totalPoints: user.guesses.reduce(
        (sum, guess) => sum + (guess.points ?? 0),
        0,
      ),
      exactScores: user.guesses.filter((guess) => guess.points === 3).length,
      scoredGuesses: user.guesses.filter((guess) => (guess.points ?? 0) > 0)
        .length,
      guessesCount: user.guesses.length,
    }))
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        a.username.localeCompare(b.username),
    );
}

rankingRouter.get("/", requireAuth, async (_req, res) =>
  res.json({ ranking: await buildRanking() }),
);
