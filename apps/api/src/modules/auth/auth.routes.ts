import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import {
  loginSchema,
  passwordSchema,
  profileSchema,
  registerSchema,
} from "../../shared/validation/schemas.js";
import { HttpError } from "../../shared/errors/http.js";
import { requireAuth, signToken } from "../../shared/auth/auth.js";

export const authRouter = Router();

const safeUser = (user: {
  avatarUrl?: string | null;
  createdAt?: Date;
  email?: string | null;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  role: "user" | "admin";
  username: string;
}) => ({
  avatarUrl: user.avatarUrl ?? null,
  createdAt: user.createdAt?.toISOString(),
  email: user.email ?? null,
  firstName: user.firstName ?? null,
  id: user.id,
  lastName: user.lastName ?? null,
  role: user.role,
  username: user.username,
});

async function matchesPassword(password: string, passwordHash: string) {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}

function nullable(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

authRouter.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const email = nullable(body.email)?.toLowerCase() ?? null;
  const username = body.username.trim();
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
  });

  if (existing?.username === username) {
    throw new HttpError(409, "Nome de usuário já está em uso");
  }

  if (email && existing?.email === email) {
    throw new HttpError(409, "E-mail já está em uso");
  }

  const user = await prisma.user.create({
    data: {
      email,
      firstName: nullable(body.firstName),
      lastName: nullable(body.lastName),
      passwordHash: await bcrypt.hash(body.password, 10),
      role: "user",
      username,
    },
  });

  res.status(201).json({ token: signToken(user.id), user: safeUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse({
    identifier: req.body.identifier ?? req.body.username,
    password: req.body.password,
  });
  const identifier = body.identifier.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
    },
  });

  if (!user || !(await matchesPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "Credenciais inválidas");
  }

  res.json({ token: signToken(user.id), user: safeUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
  });

  res.json({ user: safeUser(user) });
});

authRouter.put("/me", requireAuth, async (req, res) => {
  const body = profileSchema.parse(req.body);
  const email = nullable(body.email)?.toLowerCase() ?? null;
  const username = body.username.trim();
  const existing = await prisma.user.findFirst({
    where: {
      id: { not: req.user!.id },
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
  });

  if (existing?.username === username) {
    throw new HttpError(409, "Nome de usuário já está em uso");
  }

  if (email && existing?.email === email) {
    throw new HttpError(409, "E-mail já está em uso");
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      avatarUrl: nullable(body.avatarUrl),
      email,
      firstName: nullable(body.firstName),
      lastName: nullable(body.lastName),
      username,
    },
  });

  res.json({ user: safeUser(user) });
});

authRouter.put("/me/password", requireAuth, async (req, res) => {
  const body = passwordSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
  });

  if (!(await matchesPassword(body.currentPassword, user.passwordHash))) {
    throw new HttpError(401, "Senha atual inválida");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(body.nextPassword, 10) },
  });

  res.status(204).send();
});
