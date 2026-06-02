import type { Request, Response, NextFunction } from "express";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const notFound = (message = "Nao encontrado") =>
  new HttpError(404, message);
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError)
    return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: "Erro interno" });
}
