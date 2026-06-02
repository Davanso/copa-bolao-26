import { Alert, Grid, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Game } from "../services/types";
import { GameHeader } from "../components/GameHeader";

export function LivePage() {
  const { data, error, isLoading } = useQuery<{ liveGames: Game[] }>({
    queryKey: ["live"],
    queryFn: async () => (await api.get("/live-games")).data,
    refetchInterval: 30_000,
  });

  return (
    <Stack gap={2}>
      <Typography variant="h4">Ao vivo</Typography>
      <Typography color="text.secondary">
        Atualização automática a cada 30 segundos.
      </Typography>

      {isLoading && <Typography>Carregando jogos ao vivo...</Typography>}
      {error && (
        <Alert severity="error">Não foi possível carregar ao vivo.</Alert>
      )}
      {!isLoading && !data?.liveGames.length && (
        <Alert severity="info">Nenhum jogo ao vivo agora.</Alert>
      )}

      <Grid container spacing={2}>
        {data?.liveGames.map((game) => (
          <Grid item xs={12} md={6} key={game.id}>
            <GameHeader game={game} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
