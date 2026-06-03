export type User = { id: string; username: string; role: "user" | "admin" };

export type Game = {
  id: string;
  teamHome: string;
  teamAway: string;
  startsAt: string;
  stage: string;
  groupName?: string;
  scoreHome: number | null;
  scoreAway: number | null;
  status: "scheduled" | "live" | "finished" | "postponed";
  liveMinute: number | null;
  myGuess?: Guess | null;
};

export type Guess = {
  id: string;
  gameId: string;
  guessHome: number;
  guessAway: number;
  points: number | null;
  game?: Game;
};

export type RankingItem = {
  userId: string;
  username: string;
  totalPoints: number;
  exactScores: number;
  scoredGuesses: number;
  guessesCount: number;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  ownerUserId: string;
  memberRole?: "owner" | "member";
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  user: User;
};
