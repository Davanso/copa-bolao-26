import { randomUUID } from "node:crypto";

export const id = () => randomUUID();
export const inviteCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();
