import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import {
  formatGameDate,
  isGuessLocked,
  statusLabel,
} from "../services/gameHelpers";
import type { Guess } from "../services/types";

export function GuessesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [guessToEdit, setGuessToEdit] = useState<Guess | null>(null);
  const { data, error, isLoading } = useQuery<{ guesses: Guess[] }>({
    queryKey: ["guesses-me"],
    queryFn: async () => (await api.get("/guesses/me")).data,
  });
  const updateGuess = useMutation({
    mutationFn: ({
      gameId,
      guessHome,
      guessAway,
    }: {
      gameId: string;
      guessHome: number;
      guessAway: number;
    }) => api.post(`/games/${gameId}/guess`, { guessHome, guessAway }),
    onSuccess: () => {
      setGuessToEdit(null);
      showToast("Palpite atualizado com sucesso!", "success");
      queryClient.invalidateQueries({ queryKey: ["guesses-me"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: (err: any) => {
      showToast(
        err.response?.data?.message ?? "Não foi possível atualizar o palpite.",
        "error",
      );
    },
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

      {data?.guesses.map((guess) => {
        const locked = guess.game ? isGuessLocked(guess.game) : true;

        return (
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
                <Stack direction="row" gap={1} alignItems="center">
                  <Chip
                    label={
                      guess.points == null ? "Pendente" : `${guess.points} pts`
                    }
                    color={guess.points === 3 ? "primary" : "default"}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={locked}
                    onClick={() => setGuessToEdit(guess)}
                  >
                    Editar
                  </Button>
                </Stack>
              </Stack>

              {guess.game && (
                <Typography color="text.secondary">
                  {statusLabel[guess.game.status]} ·{" "}
                  {formatGameDate(guess.game.startsAt)}
                  {locked ? " · edição bloqueada" : ""}
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}

      <EditGuessDialog
        guess={guessToEdit}
        loading={updateGuess.isPending}
        onClose={() => setGuessToEdit(null)}
        onSave={(guessHome, guessAway) => {
          if (guessToEdit?.gameId) {
            updateGuess.mutate({
              gameId: guessToEdit.gameId,
              guessHome,
              guessAway,
            });
          }
        }}
      />
    </Stack>
  );
}

function EditGuessDialog({
  guess,
  loading,
  onClose,
  onSave,
}: {
  guess: Guess | null;
  loading: boolean;
  onClose: () => void;
  onSave: (home: number, away: number) => void;
}) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const homeScore = inputToScore(home);
  const awayScore = inputToScore(away);
  const canSave =
    homeScore !== null &&
    awayScore !== null &&
    homeScore <= 30 &&
    awayScore <= 30;

  useEffect(() => {
    setHome(scoreToInput(guess?.guessHome));
    setAway(scoreToInput(guess?.guessAway));
  }, [guess]);

  function save() {
    if (homeScore === null || awayScore === null) {
      return;
    }

    onSave(homeScore, awayScore);
  }

  return (
    <Dialog
      open={Boolean(guess)}
      onClose={loading ? undefined : onClose}
      fullWidth
    >
      <DialogTitle>Editar palpite</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            {guess?.game?.teamHome} x {guess?.game?.teamAway}
          </Typography>
          <Stack direction="row" gap={1.5}>
            <TextField
              fullWidth
              label={guess?.game?.teamHome ?? "Casa"}
              placeholder="0"
              value={home}
              disabled={loading}
              inputProps={{
                inputMode: "numeric",
                maxLength: 2,
                pattern: "[0-9]*",
              }}
              onChange={(event) =>
                setHome(normalizeScoreInput(event.target.value))
              }
            />
            <TextField
              fullWidth
              label={guess?.game?.teamAway ?? "Fora"}
              placeholder="0"
              value={away}
              disabled={loading}
              inputProps={{
                inputMode: "numeric",
                maxLength: 2,
                pattern: "[0-9]*",
              }}
              onChange={(event) =>
                setAway(normalizeScoreInput(event.target.value))
              }
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={loading || !canSave}
          onClick={save}
        >
          Salvar palpite
        </Button>
      </DialogActions>
    </Dialog>
  );
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

function normalizeScoreInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}
