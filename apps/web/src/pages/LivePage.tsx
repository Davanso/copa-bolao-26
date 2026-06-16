import { useEffect, useMemo } from "react";
import { Alert, Grid, Stack, Typography } from "@mui/material";
import { EmptyState } from "../components/EmptyState";
import { GameCardShell } from "../components/GameCardShell";
import { GameHeader } from "../components/GameHeader";
import { GuessableGamesSection } from "../components/GuessableGamesSection";
import { LoadingState } from "../components/LoadingState";
import { RevealedGuessCard } from "../components/RevealedGuessCard";
import { useGamesQuery, useLiveGamesQuery } from "../hooks/useAppQueries";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  liveGamesWithGuesses,
  missingGuessGames,
  upcomingGamesToday,
  upcomingReminderGames,
} from "../services/gameFilters";
import type { Game } from "../services/types";

type GamesResponse = {
  games: Game[];
};

const todayReminderStoragePrefix = "bolao.dailyGuessReminder";

export function LivePage() {
  const { showToast } = useToast();
  const liveQuery = useLiveGamesQuery();
  const gamesQuery = useGamesQuery({
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });
  const games = gamesQuery.data?.games ?? [];
  const liveGames = useMemo(
    () => liveGamesWithGuesses(liveQuery.data?.liveGames ?? [], games),
    [games, liveQuery.data?.liveGames],
  );
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
        liveGames={liveGames}
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
        <LoadingState title="Buscando jogos ao vivo" description="" />
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
  const { user } = useAuth();
  const guess = game.myGuess;

  return (
    <GameCardShell featured={featured}>
      <Stack gap={1.5}>
        <GameHeader game={game} />
        {guess && (
          <Stack gap={1}>
            <Typography variant="subtitle2">Seu palpite</Typography>
            <RevealedGuessCard
              avatarUrl={user?.avatarUrl}
              guessAway={guess.guessAway}
              guessHome={guess.guessHome}
              username={user?.username ?? "Você"}
            />
          </Stack>
        )}
      </Stack>
    </GameCardShell>
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
