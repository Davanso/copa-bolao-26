import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../errors/http.js";

const secret = () => process.env.JWT_SECRET ?? "dev-secret-change-me";

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, secret(), { expiresIn: "7d" });

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new HttpError(401, "Sessão obrigatória");
  }

  const payload = jwt.verify(token, secret()) as { sub: string };
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
