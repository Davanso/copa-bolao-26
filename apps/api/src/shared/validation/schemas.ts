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
