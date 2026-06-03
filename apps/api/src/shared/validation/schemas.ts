import { z } from "zod";

export const credentialsSchema = z.object({
  username: z.string().min(3).max(24),
  password: z.string().min(6).max(72),
});

export const guessSchema = z.object({
  guessHome: z.coerce.number().int().min(0).max(30),
  guessAway: z.coerce.number().int().min(0).max(30),
});

export const resultSchema = z.object({
  scoreHome: z.coerce.number().int().min(0).max(30),
  scoreAway: z.coerce.number().int().min(0).max(30),
  status: z.enum(["finished", "live"]).default("finished"),
});

export const groupSchema = z.object({
  name: z.string().min(3).max(48),
  description: z.string().max(160).optional(),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(4).max(12),
});

export const symbolicPrizeSchema = z
  .object({
    total: z.coerce.number().int().min(0).max(1_000_000),
    rules: z
      .array(
        z.object({
          position: z.coerce.number().int().min(1).max(20),
          percentage: z.coerce.number().int().min(0).max(100),
        }),
      )
      .max(20),
  })
  .superRefine((value, context) => {
    const positions = new Set(value.rules.map((rule) => rule.position));

    if (positions.size !== value.rules.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada posição só pode aparecer uma vez.",
        path: ["rules"],
      });
    }

    const totalPercentage = value.rules.reduce(
      (sum, rule) => sum + rule.percentage,
      0,
    );

    if (value.total > 0 && totalPercentage !== 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A soma dos percentuais precisa ser 100%.",
        path: ["rules"],
      });
    }

    if (value.total === 0 && totalPercentage !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sem valor simbólico, os percentuais precisam ser 0%.",
        path: ["rules"],
      });
    }
  });
