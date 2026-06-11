import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";
import { getWorldCupGames } from "../world-cup/world-cup.provider.js";

export const rankingRouter = Router();

export async function buildRanking(userIds?: string[], groupId?: string) {
  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : undefined,
    include: { guesses: true },
  });
  const scoringRules = groupId
    ? await prisma.groupScoringRule.findMany({ where: { groupId } })
    : [];
  const rulesByStage = new Map(scoringRules.map((rule) => [rule.stage, rule]));
  const gamesById = groupId
    ? new Map((await getWorldCupGames()).map((game) => [game.id, game]))
    : new Map();

  return users
    .map((user) => {
      const pointsByGuess = user.guesses.map((guess) => {
        if (!groupId) {
          return guess.points ?? 0;
        }

        const game = gamesById.get(guess.gameId);

        if (
          !game ||
          game.status !== "finished" ||
          game.scoreHome === null ||
          game.scoreAway === null
        ) {
          return 0;
        }

        const rule = rulesByStage.get(game.stage) ?? {
          exactPoints: 3,
          resultPoints: 1,
        };

        if (
          guess.guessHome === game.scoreHome &&
          guess.guessAway === game.scoreAway
        ) {
          return rule.exactPoints;
        }

        return sameOutcome(
          guess.guessHome,
          guess.guessAway,
          game.scoreHome,
          game.scoreAway,
        )
          ? rule.resultPoints
          : 0;
      });

      return {
        userId: user.id,
        username: user.username,
        totalPoints: pointsByGuess.reduce((sum, points) => sum + points, 0),
        exactScores: pointsByGuess.filter((points) => points >= 3).length,
        scoredGuesses: pointsByGuess.filter((points) => points > 0).length,
        guessesCount: user.guesses.length,
      };
    })
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

function sameOutcome(
  guessHome: number,
  guessAway: number,
  scoreHome: number,
  scoreAway: number,
) {
  return Math.sign(guessHome - guessAway) === Math.sign(scoreHome - scoreAway);
}
