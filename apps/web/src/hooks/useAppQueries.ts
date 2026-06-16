import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { queryKeys } from "../services/queryKeys";
import type { Game, Group, RankingItem } from "../services/types";

export type GamesResponse = {
  games: Game[];
};

export type LiveGamesResponse = {
  liveGames: Game[];
};

export type GroupsMeResponse = {
  groups: Group[];
};

export function useGamesQuery({
  enabled = true,
  refetchInterval,
  refetchOnWindowFocus = false,
  staleTime = 120_000,
}: {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
} = {}) {
  return useQuery<GamesResponse>({
    enabled,
    gcTime: 15 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryFn: async () => (await api.get("/games")).data,
    queryKey: queryKeys.games,
    refetchInterval,
    refetchIntervalInBackground: Boolean(refetchInterval),
    refetchOnWindowFocus,
    staleTime,
  });
}

export function useLiveGamesQuery() {
  return useQuery<LiveGamesResponse>({
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryFn: async () => (await api.get("/live-games")).data,
    queryKey: queryKeys.liveGames,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export function useGroupsMeQuery() {
  return useQuery<GroupsMeResponse>({
    gcTime: 15 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryFn: async () => (await api.get("/groups/me")).data,
    queryKey: queryKeys.groupsMe,
    staleTime: 120_000,
  });
}

export function useGroupRankingQuery(groupId: string | null) {
  return useQuery<{ ranking: RankingItem[] }>({
    enabled: Boolean(groupId),
    placeholderData: (previousData) => previousData,
    queryFn: async () => (await api.get(`/groups/${groupId}/ranking`)).data,
    queryKey: queryKeys.ranking(groupId),
    staleTime: 60_000,
  });
}
