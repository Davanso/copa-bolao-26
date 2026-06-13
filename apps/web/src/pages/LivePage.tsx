import { useEffect, useMemo } from "react";
import { Alert, Grid, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { GameHeader } from "../components/GameHeader";
import {
  GuessableGamesSection,
  missingGuessGames,
  upcomingGamesToday,
  upcomingReminderGames,
} from "../components/GuessableGamesSection";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { Game } from "../services/types";

type GamesResponse = {
  games: Game[];
};

const todayReminderStoragePrefix = "bolao.dailyGuessReminder";

export function LivePage() {
  const { showToast } = useToast();
  const liveQuery = useQuery<{ liveGames: Game[] }>({
    queryKey: ["live"],
    queryFn: async () => (await api.get("/live-games")).data,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const gamesQuery = useQuery<GamesResponse>({
    queryKey: ["games"],
    queryFn: async () => (await api.get("/games")).data,
    staleTime: 60_000,
  });
  const games = gamesQuery.data?.games ?? [];
  const todayGames = useMemo(() => upcomingGamesToday(games), [games]);
  const reminderGames = useMemo(() => upcomingReminderGames(games), [games]);
  const missingTodayGuesses = useMemo(
    () => missingGuessGames(todayGames),
    [todayGames],
  );
  const missingReminderGuesses = useMemo(
    () => missingGuessGames(reminderGames),
    [reminderGames],
  );

  useEffect(() => {
    if (!missingTodayGuesses.length) {
      return;
    }

    const reminderKey = `${todayReminderStoragePrefix}.${todayKey()}`;

    if (localStorage.getItem(reminderKey)) {
      return;
    }

    showToast(
      `Você ainda tem ${missingTodayGuesses.length} palpite${
        missingTodayGuesses.length === 1 ? "" : "s"
      } para fazer hoje.`,
      "warning",
    );
    localStorage.setItem(reminderKey, "true");
  }, [missingTodayGuesses.length, showToast]);

  return (
    <Stack gap={3}>
      <Stack>
        <Typography variant="h4">Ao vivo</Typography>
        <Typography color="text.secondary">
          Acompanhe o que está rolando agora e não perca os próximos palpites.
        </Typography>
      </Stack>

      <LiveNowSection
        error={liveQuery.error}
        isLoading={liveQuery.isLoading}
        liveGames={liveQuery.data?.liveGames ?? []}
      />

      <GuessableGamesSection
        title="Próximos jogos de hoje"
        description="Somente partidas ainda não iniciadas no dia de hoje."
        emptyTitle="Sem mais jogos hoje"
        emptyDescription="Quando houver partidas ainda hoje, elas aparecem aqui."
        games={todayGames}
        loading={gamesQuery.isLoading}
      />

      <GuessableGamesSection
        title="Não se esqueça de palpitar"
        description="Jogos dos próximos 3 dias que ainda aceitam palpite."
        emptyTitle="Tudo em dia"
        emptyDescription="Você não tem jogos próximos pendentes para palpitar."
        games={missingReminderGuesses}
        loading={gamesQuery.isLoading}
      />
    </Stack>
  );
}

function LiveNowSection({
  error,
  isLoading,
  liveGames,
}: {
  error: unknown;
  isLoading: boolean;
  liveGames: Game[];
}) {
  return (
    <Stack gap={1.5}>
      {isLoading && (
        <LoadingState
          title="Buscando jogos ao vivo"
          description="Estamos consultando a API da Copa."
        />
      )}
      {Boolean(error) && (
        <Alert severity="error">Não foi possível carregar jogos ao vivo.</Alert>
      )}
      {!isLoading && !liveGames.length && (
        <EmptyState
          emoji="🌙"
          title="Nada rolando agora"
          description="Nenhum jogo está ao vivo neste momento."
        />
      )}

      <Grid container spacing={2} justifyContent="center">
        {liveGames.map((game) => (
          <Grid item xs={12} md={10} lg={7} key={game.id}>
            <GameCard game={game} featured />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function GameCard({
  featured = false,
  game,
}: {
  featured?: boolean;
  game: Game;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: featured
          ? "rgba(0, 156, 59, .26)"
          : "rgba(15, 23, 42, .10)",
        borderRadius: 2,
        boxShadow: "none",
        p: featured ? { xs: 1.75, sm: 2.25 } : { xs: 1.5, sm: 2 },
      }}
    >
      <GameHeader game={game} />
    </Paper>
  );
}

function SectionTitle({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Stack>
      <Typography variant="h5">{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Stack>
  );
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date());
}
