import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "./EmptyState";
import { GameHeader } from "./GameHeader";
import { LoadingState } from "./LoadingState";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import { guessFeedback, isGuessLocked } from "../services/gameHelpers";
import type { Game, Guess } from "../services/types";

const dayMs = 24 * 60 * 60 * 1000;

type GamesResponse = {
  games: Game[];
};

type GuessesResponse = {
  guesses: Guess[];
};

type GuessPayload = {
  gameId: string;
  guessAway: number;
  guessHome: number;
};

export function GuessableGamesSection({
  description,
  emptyDescription,
  emptyTitle,
  games,
  loading,
  title,
}: {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  games: Game[];
  loading: boolean;
  title: string;
}) {
  return (
    <Stack gap={1.5}>
      <SectionTitle title={title} description={description} />

      {loading && (
        <LoadingState
          title="Carregando jogos"
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
            <GuessableGameCard game={game} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export function upcomingGamesToday(games: Game[], now = Date.now()) {
  const today = dayKey(new Date(now).toISOString());

  return games
    .filter((game) => Date.parse(game.startsAt) > now)
    .filter((game) => dayKey(game.startsAt) === today)
    .sort(compareByStart);
}

export function upcomingReminderGames(games: Game[], now = Date.now()) {
  const limit = now + 3 * dayMs;

  return games
    .filter((game) => game.status === "scheduled")
    .filter((game) => {
      const startsAt = Date.parse(game.startsAt);
      return startsAt > now && startsAt <= limit;
    })
    .sort(compareByStart);
}

export function missingGuessGames(games: Game[]) {
  return games.filter((game) => !game.myGuess);
}

function GuessableGameCard({ game }: { game: Game }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [home, setHome] = useState(scoreToInput(game.myGuess?.guessHome));
  const [away, setAway] = useState(scoreToInput(game.myGuess?.guessAway));
  const homeScore = inputToScore(home);
  const awayScore = inputToScore(away);
  const locked = isGuessLocked(game);
  const feedback = guessFeedback(game);
  const changed =
    homeScore !== null &&
    awayScore !== null &&
    (homeScore !== game.myGuess?.guessHome ||
      awayScore !== game.myGuess?.guessAway);
  const canSave =
    !locked &&
    changed &&
    homeScore !== null &&
    awayScore !== null &&
    homeScore <= 30 &&
    awayScore <= 30;

  const mutation = useMutation({
    mutationFn: (payload: GuessPayload) =>
      api.post<{ guess: Guess }>(`/games/${payload.gameId}/guess`, {
        guessAway: payload.guessAway,
        guessHome: payload.guessHome,
      }),
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["games"] }),
        queryClient.cancelQueries({ queryKey: ["guesses-me"] }),
      ]);

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"]);
      const previousGuesses = queryClient.getQueryData<GuessesResponse>([
        "guesses-me",
      ]);
      const optimisticGuess: Guess = {
        game,
        gameId: payload.gameId,
        guessAway: payload.guessAway,
        guessHome: payload.guessHome,
        id: game.myGuess?.id ?? `temp-${payload.gameId}`,
        points: null,
      };

      queryClient.setQueryData<GamesResponse>(["games"], (current) =>
        current
          ? {
              ...current,
              games: current.games.map((item) =>
                item.id === payload.gameId
                  ? { ...item, myGuess: optimisticGuess }
                  : item,
              ),
            }
          : current,
      );
      queryClient.setQueryData<GuessesResponse>(["guesses-me"], (current) =>
        upsertGuessCache(current, optimisticGuess),
      );

      return { previousGames, previousGuesses };
    },
    onError: (error: any, _payload, context) => {
      queryClient.setQueryData(["games"], context?.previousGames);
      queryClient.setQueryData(["guesses-me"], context?.previousGuesses);
      showToast(
        error.response?.data?.message ??
          "Não foi possível salvar o palpite.",
        "error",
      );
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData<GamesResponse>(["games"], (current) =>
        current
          ? {
              ...current,
              games: current.games.map((item) =>
                item.id === data.guess.gameId
                  ? { ...item, myGuess: data.guess }
                  : item,
              ),
            }
          : current,
      );
      queryClient.setQueryData<GuessesResponse>(["guesses-me"], (current) =>
        upsertGuessCache(current, { ...data.guess, game }),
      );
      showToast("Palpite salvo com sucesso!", "success");
    },
  });

  useEffect(() => {
    setHome(scoreToInput(game.myGuess?.guessHome));
    setAway(scoreToInput(game.myGuess?.guessAway));
  }, [game.id, game.myGuess?.guessAway, game.myGuess?.guessHome]);

  function save() {
    if (homeScore === null || awayScore === null) {
      return;
    }

    mutation.mutate({
      gameId: game.id,
      guessAway: awayScore,
      guessHome: homeScore,
    });
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: "rgba(15, 23, 42, .10)",
        borderRadius: 2,
        boxShadow: "none",
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack gap={1.25}>
        <GameHeader game={game} />

        {feedback && (
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip label={feedback.label} color={feedback.color} size="small" />
            {feedback.result !== "pending" && game.myGuess?.points !== null && (
              <Chip
                label={`${game.myGuess?.points ?? 0} pontos`}
                color={(game.myGuess?.points ?? 0) > 0 ? "primary" : "default"}
                size="small"
              />
            )}
          </Stack>
        )}

        {locked ? (
          <Alert severity="info">Palpite bloqueado para este jogo.</Alert>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <TextField
              label={game.teamHome}
              placeholder="0"
              value={home}
              disabled={mutation.isPending}
              inputProps={{ inputMode: "numeric", maxLength: 2 }}
              onChange={(event) => setHome(scoreInput(event.target.value))}
            />
            <TextField
              label={game.teamAway}
              placeholder="0"
              value={away}
              disabled={mutation.isPending}
              inputProps={{ inputMode: "numeric", maxLength: 2 }}
              onChange={(event) => setAway(scoreInput(event.target.value))}
            />
            <Button
              variant="contained"
              disabled={!canSave || mutation.isPending}
              onClick={save}
              sx={{ minWidth: { sm: 120 } }}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </Stack>
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

function upsertGuessCache(
  current: GuessesResponse | undefined,
  guess: Guess,
) {
  if (!current) {
    return current;
  }

  const exists = current.guesses.some((item) => item.gameId === guess.gameId);

  return {
    guesses: exists
      ? current.guesses.map((item) =>
          item.gameId === guess.gameId ? { ...item, ...guess } : item,
        )
      : [guess, ...current.guesses],
  };
}

function compareByStart(firstGame: Game, secondGame: Game) {
  return Date.parse(firstGame.startsAt) - Date.parse(secondGame.startsAt);
}

function dayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date(value));
}

function scoreToInput(score?: number) {
  return score === undefined ? "" : String(score);
}

function inputToScore(value: string) {
  if (!value) {
    return null;
  }

  const score = Number(value);
  return Number.isInteger(score) && score >= 0 ? score : null;
}

function scoreInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}
