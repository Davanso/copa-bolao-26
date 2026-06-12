import { useEffect, useMemo } from "react";
import { Alert, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { GameHeader } from "../components/GameHeader";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { Game } from "../services/types";

type GamesResponse = {
  games: Game[];
};

const todayReminderStoragePrefix = "bolao.dailyGuessReminder";
const dayMs = 24 * 60 * 60 * 1000;

export function LivePage() {
  const navigate = useNavigate();
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
  const missingTodayGuesses = todayGames.filter((game) => !game.myGuess);
  const missingReminderGuesses = reminderGames.filter((game) => !game.myGuess);

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

      <UpcomingSection
        title="Próximos jogos de hoje"
        description="Somente partidas ainda não iniciadas no dia de hoje."
        emptyTitle="Sem mais jogos hoje"
        emptyDescription="Quando houver partidas ainda hoje, elas aparecem aqui."
        games={todayGames}
        loading={gamesQuery.isLoading}
      />

      <UpcomingSection
        title="Não se esqueça de palpitar"
        description="Jogos dos próximos 3 dias que ainda aceitam palpite."
        emptyTitle="Tudo em dia"
        emptyDescription="Você não tem jogos próximos pendentes para palpitar."
        games={missingReminderGuesses}
        loading={gamesQuery.isLoading}
        action={
          missingReminderGuesses.length > 0 ? (
            <Button
              variant="contained"
              onClick={() =>
                navigate("/", { state: { skipRouteRestore: true } })
              }
            >
              Ir para palpites
            </Button>
          ) : undefined
        }
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
      <SectionTitle
        title="Ao vivo agora"
        description="Atualização automática a cada 30 segundos."
      />

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

function UpcomingSection({
  action,
  description,
  emptyDescription,
  emptyTitle,
  games,
  loading,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  games: Game[];
  loading: boolean;
  title: string;
}) {
  return (
    <Stack gap={1.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={1.5}
      >
        <SectionTitle title={title} description={description} />
        {action}
      </Stack>

      {loading && (
        <LoadingState
          title="Carregando próximos jogos"
          description="Buscando a tabela oficial."
        />
      )}
      {!loading && !games.length && (
        <EmptyState
          emoji="✅"
          title={emptyTitle}
          description={emptyDescription}
        />
      )}

      <Grid container spacing={2}>
        {games.map((game) => (
          <Grid item xs={12} md={6} lg={4} key={game.id}>
            <GameCard game={game} />
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
      <Stack gap={1.25}>
        <GameHeader game={game} />
        {!game.myGuess && game.status === "scheduled" && (
          <Typography color="warning.main" fontWeight={800} variant="body2">
            Palpite pendente
          </Typography>
        )}
      </Stack>
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

function upcomingGamesToday(games: Game[]) {
  const now = Date.now();
  const today = todayKey();

  return games
    .filter((game) => Date.parse(game.startsAt) > now)
    .filter((game) => dayKey(game.startsAt) === today)
    .sort(compareByStart);
}

function upcomingReminderGames(games: Game[]) {
  const now = Date.now();
  const limit = now + 3 * dayMs;

  return games
    .filter((game) => game.status === "scheduled")
    .filter((game) => {
      const startsAt = Date.parse(game.startsAt);
      return startsAt > now && startsAt <= limit;
    })
    .sort(compareByStart);
}

function compareByStart(firstGame: Game, secondGame: Game) {
  return Date.parse(firstGame.startsAt) - Date.parse(secondGame.startsAt);
}

function todayKey() {
  return dayKey(new Date().toISOString());
}

function dayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date(value));
}
