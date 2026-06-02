import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Game } from "../services/types";
import { GameHeader } from "../components/GameHeader";
import { isGuessLocked } from "../services/gameHelpers";

export function GamesPage() {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<{ games: Game[] }>({
    queryKey: ["games", "scheduled"],
    queryFn: async () => (await api.get("/games?status=scheduled")).data,
  });
  const groupedGames = useMemo(
    () => groupGamesByGroup(data?.games ?? []),
    [data?.games],
  );
  const mutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["guesses-me"] });
    },
  });

  return (
    <Stack gap={3}>
      <Box>
        <Typography variant="h4">Jogos agendados</Typography>
        <Typography color="text.secondary">
          Jogos separados por grupo, com dados vindos da API da Copa 2026.
        </Typography>
      </Box>

      {isLoading && <Typography>Carregando jogos...</Typography>}
      {error && (
        <Alert severity="error">Não foi possível carregar jogos.</Alert>
      )}
      {mutation.error && (
        <Alert severity="error">
          {(mutation.error as any).response?.data?.message ??
            "Não foi possível salvar o palpite."}
        </Alert>
      )}
      {mutation.isSuccess && (
        <Alert severity="success">Palpite salvo com sucesso.</Alert>
      )}
      {!isLoading && data?.games.length === 0 && (
        <Alert severity="info">Nenhum jogo agendado no momento.</Alert>
      )}

      {groupedGames.map(([groupName, games]) => (
        <Stack key={groupName} gap={1.5}>
          <Typography variant="h5">{groupName}</Typography>
          <Grid container spacing={2}>
            {games.map((game) => (
              <Grid item xs={12} lg={6} key={game.id}>
                <Paper sx={{ p: 1.25 }}>
                  <GameHeader game={game} />
                  <GuessForm
                    game={game}
                    saving={mutation.isPending}
                    onSave={(guessHome, guessAway) =>
                      mutation.mutate({ gameId: game.id, guessHome, guessAway })
                    }
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}

function GuessForm({
  game,
  saving,
  onSave,
}: {
  game: Game;
  saving: boolean;
  onSave: (home: number, away: number) => void;
}) {
  const locked = isGuessLocked(game);
  const [home, setHome] = useState(game.myGuess?.guessHome ?? 0);
  const [away, setAway] = useState(game.myGuess?.guessAway ?? 0);

  return (
    <Stack gap={1.25} sx={{ mt: 1.5 }}>
      <Typography variant="subtitle2">Seu palpite</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25}>
        <TextField
          label={game.teamHome}
          type="number"
          value={home}
          disabled={locked || saving}
          inputProps={{ min: 0, max: 30, inputMode: "numeric" }}
          sx={{ minWidth: { xs: "100%", sm: 150 }, flex: 1 }}
          onChange={(event) => setHome(Number(event.target.value))}
        />
        <TextField
          label={game.teamAway}
          type="number"
          value={away}
          disabled={locked || saving}
          inputProps={{ min: 0, max: 30, inputMode: "numeric" }}
          sx={{ minWidth: { xs: "100%", sm: 150 }, flex: 1 }}
          onChange={(event) => setAway(Number(event.target.value))}
        />
        <Button
          size="large"
          variant="contained"
          disabled={locked || saving}
          onClick={() => onSave(home, away)}
          sx={{ minWidth: { xs: "100%", sm: 170 } }}
        >
          {game.myGuess ? "Atualizar" : "Salvar"}
        </Button>
      </Stack>

      {locked && (
        <Typography variant="caption" color="text.secondary">
          Palpite bloqueado: o jogo já começou ou não está agendado.
        </Typography>
      )}
    </Stack>
  );
}

function groupGamesByGroup(games: Game[]) {
  const grouped = new Map<string, Game[]>();

  for (const game of games) {
    const label = game.groupName ? `Grupo ${game.groupName}` : game.stage;
    grouped.set(label, [...(grouped.get(label) ?? []), game]);
  }

  return [...grouped.entries()];
}
