import "dotenv/config";
import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { authRouter } from "./modules/auth/auth.routes.js";
import { gamesRouter } from "./modules/games/games.routes.js";
import { guessesRouter } from "./modules/guesses/guesses.routes.js";
import { rankingRouter } from "./modules/ranking/ranking.routes.js";
import { groupsRouter } from "./modules/groups/groups.routes.js";
import { liveScoreRouter } from "./modules/live-score/live-score.routes.js";
import { errorHandler, HttpError } from "./shared/errors/http.js";

const app = express();
const allowedOrigins = (
  process.env.WEB_ORIGIN ??
  "http://localhost:5173,http://127.0.0.1:5173,http://172.18.224.1:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origem nao permitida pelo CORS: ${origin}`));
    },
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/games", gamesRouter);
app.use("/guesses", guessesRouter);
app.use("/ranking", rankingRouter);
app.use("/groups", groupsRouter);
app.use("/live-games", liveScoreRouter);
app.use((_req, _res) => {
  throw new HttpError(404, "Rota nao encontrada");
});
app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Payload invalido", issues: error.issues });
    }

    return errorHandler(error, req, res, next);
  },
);

const port = Number(process.env.PORT ?? 3333);

import("./db/seed.js")
  .then(({ ensureAdminUser }) => ensureAdminUser())
  .then(() => {
    app.listen(port, () => console.log(`API em http://localhost:${port}`));
  })
  .catch((error) => {
    console.error("Falha ao inicializar API", error);
    process.exit(1);
  });
