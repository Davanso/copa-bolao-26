export type Role = "user" | "admin";
export type GameStatus = "scheduled" | "live" | "finished" | "postponed";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};
export type Game = {
  id: string;
  externalId?: string;
  teamHome: string;
  teamAway: string;
  startsAt: string;
  stage: string;
  groupName?: string;
  scoreHome: number | null;
  scoreAway: number | null;
  status: GameStatus;
  liveMinute: number | null;
  lastLiveSyncAt: string | null;
};
export type Guess = {
  id: string;
  userId: string;
  gameId: string;
  guessHome: number;
  guessAway: number;
  points: number | null;
  createdAt: string;
  updatedAt: string;
};
export type BolaoGroup = {
  id: string;
  name: string;
  description?: string;
  ownerUserId: string;
  inviteCode: string;
  createdAt: string;
};
export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
};
