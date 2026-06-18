import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
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
  jwt.sign({ sub: userId }, jwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      "30d") as SignOptions["expiresIn"],
  });

export function verifyTokenPayload(token: string) {
  try {
    return jwt.verify(token, jwtSecret()) as { sub: string };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, "Sessão expirada. Entre novamente.");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new HttpError(401, "Sessão inválida. Entre novamente.");
    }

    throw error;
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new HttpError(401, "Sessão obrigatória");
  }

  const payload = verifyTokenPayload(token);
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
