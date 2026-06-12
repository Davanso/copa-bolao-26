import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../errors/http.js";

export function jwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new HttpError(500, "JWT_SECRET não configurado");
  }

  return "dev-secret-change-me";
}

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: "7d" });

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new HttpError(401, "Sessão obrigatória");
  }

  const payload = jwt.verify(token, jwtSecret()) as { sub: string };
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    throw new HttpError(401, "Sessão inválida");
  }

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    throw new HttpError(403, "Acesso admin obrigatório");
  }

  next();
}
