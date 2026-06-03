import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { api } from "../services/api";
import { formatGameDate, statusLabel } from "../services/gameHelpers";
import type { Guess } from "../services/types";

export function GuessesPage() {
  const { data, error, isLoading } = useQuery<{ guesses: Guess[] }>({
    queryKey: ["guesses-me"],
    queryFn: async () => (await api.get("/guesses/me")).data,
  });

  return (
    <Stack gap={2}>
      <Typography variant="h4">Meus palpites</Typography>

      {isLoading && (
        <EmptyState
          emoji="🎯"
          title="Carregando palpites"
          description="Buscando seus placares salvos."
        />
      )}
      {error && (
        <Alert severity="error">Não foi possível carregar palpites.</Alert>
      )}
      {!isLoading && data?.guesses.length === 0 && (
        <EmptyState
          emoji="📝"
          title="Nenhum palpite salvo"
          description="Escolha um jogo na tabela e registre seu placar antes do início."
        />
      )}

      {data?.guesses.map((guess) => (
        <Paper key={guess.id} sx={{ p: 2 }}>
          <Stack gap={1}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              gap={2}
            >
              <Typography variant="h6">
                {guess.game?.teamHome} {guess.guessHome} x {guess.guessAway}{" "}
                {guess.game?.teamAway}
              </Typography>
              <Chip
                label={
                  guess.points == null ? "Pendente" : `${guess.points} pts`
                }
                color={guess.points === 3 ? "primary" : "default"}
              />
            </Stack>

            {guess.game && (
              <Typography color="text.secondary">
                {statusLabel[guess.game.status]} ·{" "}
                {formatGameDate(guess.game.startsAt)}
              </Typography>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
