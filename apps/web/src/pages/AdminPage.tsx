import { useState } from "react";
import {
  Alert,
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
import { useAuth } from "../hooks/useAuth";
import { formatGameDate, statusLabel } from "../services/gameHelpers";

export function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<{ games: Game[] }>({
    queryKey: ["games", "admin"],
    queryFn: async () => (await api.get("/games")).data,
  });
  const mutation = useMutation({
    mutationFn: ({
      gameId,
      scoreHome,
      scoreAway,
    }: {
      gameId: string;
      scoreHome: number;
      scoreAway: number;
    }) =>
      api.post(`/games/${gameId}/result`, {
        scoreHome,
        scoreAway,
        status: "finished",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games"] }),
  });

  if (user?.role !== "admin") {
    return (
      <Alert severity="warning">
        Área disponível apenas para administradores.
      </Alert>
    );
  }

  return (
    <Stack gap={2}>
      <Typography variant="h4">Administração</Typography>
      <Typography color="text.secondary">
        Salvar resultado final recalcula automaticamente os pontos dos palpites.
      </Typography>

      {isLoading && <Typography>Carregando jogos...</Typography>}
      {error && (
        <Alert severity="error">Não foi possível carregar jogos.</Alert>
      )}
      {mutation.error && (
        <Alert severity="error">Erro ao salvar resultado.</Alert>
      )}
      {mutation.isSuccess && <Alert severity="success">Resultado salvo.</Alert>}

      <Grid container spacing={2}>
        {data?.games.map((game) => (
          <Grid item xs={12} md={6} key={game.id}>
            <ResultCard
              game={game}
              saving={mutation.isPending}
              onSave={(scoreHome, scoreAway) =>
                mutation.mutate({ gameId: game.id, scoreHome, scoreAway })
              }
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function ResultCard({
  game,
  saving,
  onSave,
}: {
  game: Game;
  saving: boolean;
  onSave: (home: number, away: number) => void;
}) {
  const [home, setHome] = useState(game.scoreHome ?? 0);
  const [away, setAway] = useState(game.scoreAway ?? 0);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack gap={1.25}>
        <Typography variant="h6">
          {game.teamHome} x {game.teamAway}
        </Typography>
        <Typography color="text.secondary">
          {statusLabel[game.status]} · {formatGameDate(game.startsAt)}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <TextField
            type="number"
            label={game.teamHome}
            value={home}
            inputProps={{ min: 0, max: 30 }}
            onChange={(event) => setHome(Number(event.target.value))}
          />
          <TextField
            type="number"
            label={game.teamAway}
            value={away}
            inputProps={{ min: 0, max: 30 }}
            onChange={(event) => setAway(Number(event.target.value))}
          />
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => onSave(home, away)}
          >
            Salvar resultado
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
