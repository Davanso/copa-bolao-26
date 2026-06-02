import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { credentialsSchema } from "../../shared/validation/schemas.js";
import { HttpError } from "../../shared/errors/http.js";
import { requireAuth, signToken } from "../../shared/auth/auth.js";

export const authRouter = Router();

const safeUser = (user: {
  id: string;
  username: string;
  role: "user" | "admin";
  createdAt?: Date;
}) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt?.toISOString(),
});

authRouter.post("/register", async (req, res) => {
  const body = credentialsSchema.parse(req.body);
  const existing = await prisma.user.findUnique({
    where: { username: body.username },
  });

  if (existing) {
    throw new HttpError(409, "Usuário já existe");
  }

  const user = await prisma.user.create({
    data: {
      username: body.username,
      passwordHash: await bcrypt.hash(body.password, 10),
      role: "user",
    },
  });

  res.status(201).json({ token: signToken(user.id), user: safeUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const body = credentialsSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { username: body.username },
  });

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, "Credenciais inválidas");
  }

  res.json({ token: signToken(user.id), user: safeUser(user) });
});

authRouter.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
