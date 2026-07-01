export type User = {
  avatarUrl?: string | null;
  email?: string | null;
  firstName?: string | null;
  id: string;
  lastName?: string | null;
  role: "user" | "admin";
  username: string;
};

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
  avatarUrl?: string | null;
  userId: string;
  username: string;
  totalPoints: number;
  exactScores: number;
  scoredGuesses: number;
  guessesCount: number;
  pointsByStage?: RankingStagePoints[];
};

export type RankingStagePoints = {
  exactScores: number;
  points: number;
  scoredGuesses: number;
  stage: string;
};

export type PrizeRule = {
  id?: string;
  position: number;
  percentage: number;
};

export type ScoringRule = {
  id?: string;
  stage: string;
  exactPoints: number;
  resultPoints: number;
};

export type Group = {
  imageUrl?: string | null;
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  ownerUserId: string;
  symbolicPrizeTotal: number;
  prizeRules?: PrizeRule[];
  scoringRules?: ScoringRule[];
  memberRole?: "owner" | "member";
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "member";
  symbolicContribution: number;
  guessesCount: number;
  joinedAt: string;
  user: User;
};
