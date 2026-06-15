import { useEffect, useState } from "react";
import { Alert, Grid, Stack, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "./EmptyState";
import { GameCardShell } from "./GameCardShell";
import { GameHeader } from "./GameHeader";
import { GuessFeedbackChips } from "./GuessFeedbackChips";
import { GuessScoreFields } from "./GuessScoreFields";
import { LoadingState } from "./LoadingState";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import { isGuessLocked } from "../services/gameHelpers";
import {
  inputToScore,
  isValidScore,
  scoreToInput,
} from "../services/scoreInput";
import type { Game, Guess } from "../services/types";

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

function GuessableGameCard({ game }: { game: Game }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [home, setHome] = useState(scoreToInput(game.myGuess?.guessHome));
  const [away, setAway] = useState(scoreToInput(game.myGuess?.guessAway));
  const homeScore = inputToScore(home);
  const awayScore = inputToScore(away);
  const locked = isGuessLocked(game);
  const changed =
    homeScore !== null &&
    awayScore !== null &&
    (homeScore !== game.myGuess?.guessHome ||
      awayScore !== game.myGuess?.guessAway);
  const canSave =
    !locked && changed && isValidScore(homeScore) && isValidScore(awayScore);

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
        error.response?.data?.message ?? "Não foi possível salvar o palpite.",
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
    <GameCardShell>
      <Stack gap={1.25}>
        <GameHeader game={game} />
        <GuessFeedbackChips game={game} />

        {locked ? (
          <Alert severity="info">Palpite bloqueado para este jogo.</Alert>
        ) : (
          <GuessScoreFields
            awayLabel={game.teamAway}
            buttonLabel={mutation.isPending ? "Salvando..." : "Salvar"}
            disabled={mutation.isPending}
            draft={{ away, home }}
            homeLabel={game.teamHome}
            saveDisabled={!canSave || mutation.isPending}
            onChange={(draft) => {
              setAway(draft.away);
              setHome(draft.home);
            }}
            onSave={save}
          />
        )}
      </Stack>
    </GameCardShell>
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

function upsertGuessCache(current: GuessesResponse | undefined, guess: Guess) {
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
