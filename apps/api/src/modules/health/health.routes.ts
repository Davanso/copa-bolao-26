import { Router } from "express";
import { prisma } from "../../db/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      ok: true,
      database: "connected",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      ok: false,
      database: "disconnected",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  }
});
