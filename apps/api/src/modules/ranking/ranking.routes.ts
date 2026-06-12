import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";
import { getWorldCupGames } from "../world-cup/world-cup.provider.js";

export const rankingRouter = Router();

type GuessScore = {
  exact: boolean;
  points: number;
};

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
      const scoresByGuess = user.guesses.map((guess): GuessScore => {
        if (!groupId) {
          return {
            exact: false,
            points: guess.points ?? 0,
          };
        }

        const game = gamesById.get(guess.gameId);

        if (
          !game ||
          game.status !== "finished" ||
          game.scoreHome === null ||
          game.scoreAway === null
        ) {
          return { exact: false, points: 0 };
        }

        const rule = rulesByStage.get(game.stage) ?? {
          exactPoints: 3,
          resultPoints: 1,
        };

        if (
          guess.guessHome === game.scoreHome &&
          guess.guessAway === game.scoreAway
        ) {
          return { exact: true, points: rule.exactPoints };
        }

        const points = sameOutcome(
          guess.guessHome,
          guess.guessAway,
          game.scoreHome,
          game.scoreAway,
        )
          ? rule.resultPoints
          : 0;

        return { exact: false, points };
      });

      return {
        avatarUrl: user.avatarUrl,
        userId: user.id,
        username: user.username,
        totalPoints: scoresByGuess.reduce(
          (sum, score) => sum + score.points,
          0,
        ),
        exactScores: scoresByGuess.filter((score) => score.exact).length,
        scoredGuesses: scoresByGuess.filter((score) => score.points > 0)
          .length,
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
