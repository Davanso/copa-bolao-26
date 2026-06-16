export const queryKeys = {
  games: ["games"] as const,
  groupsMe: ["groups-me"] as const,
  liveGames: ["live-games"] as const,
  ranking: (groupId: string | null) => ["group-ranking", groupId] as const,
};
