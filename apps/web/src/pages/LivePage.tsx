import { Alert, Grid, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { GameHeader } from "../components/GameHeader";
import { api } from "../services/api";
import type { Game } from "../services/types";

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

      {isLoading && (
        <LoadingState
          title="Buscando jogos ao vivo"
          description="Estamos consultando a API da Copa."
        />
      )}
      {error && (
        <Alert severity="error">Não foi possível carregar jogos ao vivo.</Alert>
      )}
      {!isLoading && !data?.liveGames.length && (
        <EmptyState
          emoji="🌙"
          title="Nada rolando agora"
          description="Nenhum jogo está ao vivo neste momento. Volte quando a bola estiver em campo."
        />
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
