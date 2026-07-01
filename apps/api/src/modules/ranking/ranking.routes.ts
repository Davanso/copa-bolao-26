import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";
import { getWorldCupGames } from "../world-cup/world-cup.provider.js";

export const rankingRouter = Router();

type GuessScore = {
  exact: boolean;
  points: number;
  stage: string;
};

type ScoringRule = {
  exactPoints: number;
  resultPoints: number;
  stage: string;
};

const defaultScoringRules: ScoringRule[] = [
  { stage: "Fase de grupos", exactPoints: 3, resultPoints: 1 },
  { stage: "16 avos de final", exactPoints: 4, resultPoints: 2 },
  { stage: "Oitavas de final", exactPoints: 5, resultPoints: 2 },
  { stage: "Quartas de final", exactPoints: 6, resultPoints: 3 },
  { stage: "Semifinal", exactPoints: 8, resultPoints: 4 },
  { stage: "Disputa de terceiro lugar", exactPoints: 8, resultPoints: 4 },
  { stage: "Final", exactPoints: 10, resultPoints: 5 },
];

export async function buildRanking(userIds?: string[], groupId?: string) {
  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : undefined,
    include: { guesses: true },
  });
  const scoringRules = groupId
    ? await prisma.groupScoringRule.findMany({ where: { groupId } })
    : [];
  const rulesByStage = buildRulesByStage(scoringRules);
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
            stage: "Geral",
          };
        }

        const game = gamesById.get(guess.gameId);

        if (
          !game ||
          game.status !== "finished" ||
          game.scoreHome === null ||
          game.scoreAway === null
        ) {
          return { exact: false, points: 0, stage: game?.stage ?? "Pendente" };
        }

        const rule = ruleForStage(rulesByStage, game.stage);

        if (
          guess.guessHome === game.scoreHome &&
          guess.guessAway === game.scoreAway
        ) {
          return { exact: true, points: rule.exactPoints, stage: game.stage };
        }

        const points = sameOutcome(
          guess.guessHome,
          guess.guessAway,
          game.scoreHome,
          game.scoreAway,
        )
          ? rule.resultPoints
          : 0;

        return { exact: false, points, stage: game.stage };
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
        scoredGuesses: scoresByGuess.filter((score) => score.points > 0).length,
        guessesCount: user.guesses.length,
        pointsByStage: buildPointsByStage(scoresByGuess),
      };
    })
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        a.username.localeCompare(b.username),
    );
}

function buildRulesByStage(scoringRules: ScoringRule[]) {
  const rulesByStage = new Map<string, ScoringRule>();

  for (const rule of defaultScoringRules) {
    rulesByStage.set(normalizeScoringStage(rule.stage), rule);
  }

  for (const rule of scoringRules) {
    rulesByStage.set(normalizeScoringStage(rule.stage), rule);
  }

  return rulesByStage;
}

function ruleForStage(rulesByStage: Map<string, ScoringRule>, stage: string) {
  return (
    rulesByStage.get(normalizeScoringStage(stage)) ??
    rulesByStage.get(normalizeScoringStage("Fase de grupos")) ??
    defaultScoringRules[0]
  );
}

function buildPointsByStage(scores: GuessScore[]) {
  const pointsByStage = new Map<
    string,
    {
      exactScores: number;
      points: number;
      scoredGuesses: number;
      stage: string;
    }
  >();

  for (const score of scores) {
    if (score.points <= 0) {
      continue;
    }

    const current = pointsByStage.get(score.stage) ?? {
      exactScores: 0,
      points: 0,
      scoredGuesses: 0,
      stage: score.stage,
    };

    pointsByStage.set(score.stage, {
      ...current,
      exactScores: current.exactScores + (score.exact ? 1 : 0),
      points: current.points + score.points,
      scoredGuesses: current.scoredGuesses + 1,
    });
  }

  return [...pointsByStage.values()].sort(compareStageBreakdown);
}

function compareStageBreakdown(
  firstStage: { stage: string },
  secondStage: { stage: string },
) {
  return stageOrder(firstStage.stage) - stageOrder(secondStage.stage);
}

function stageOrder(stage: string) {
  const order = defaultScoringRules.findIndex(
    (rule) =>
      normalizeScoringStage(rule.stage) === normalizeScoringStage(stage),
  );

  return order === -1 ? 99 : order;
}

function normalizeScoringStage(stage: string) {
  return stage
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^grupo$/, "fase de grupos")
    .replace(/^fase grupos$/, "fase de grupos")
    .replace(/^r32$/, "16 avos de final")
    .replace(/^dezesseis avos$/, "16 avos de final")
    .replace(/^16 avos$/, "16 avos de final")
    .replace(/^r16$/, "oitavas de final")
    .replace(/^oitavas$/, "oitavas de final")
    .replace(/^qf$/, "quartas de final")
    .replace(/^quartas$/, "quartas de final")
    .replace(/^sf$/, "semifinal")
    .replace(/^semi final$/, "semifinal")
    .replace(/^third$/, "disputa de terceiro lugar")
    .replace(/^3 lugar$/, "disputa de terceiro lugar")
    .replace(/^terceiro lugar$/, "disputa de terceiro lugar");
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
