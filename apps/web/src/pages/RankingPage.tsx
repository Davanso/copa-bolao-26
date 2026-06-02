import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { RankingItem } from "../services/types";

export function RankingPage() {
  const { data, error, isLoading } = useQuery<{ ranking: RankingItem[] }>({
    queryKey: ["ranking"],
    queryFn: async () => (await api.get("/ranking")).data,
  });

  return (
    <Stack gap={2}>
      <Typography variant="h4">Ranking</Typography>

      <Paper sx={{ p: 2 }}>
        <Stack gap={0.75}>
          <Typography variant="h6">Como funciona a pontuação?</Typography>
          <Typography color="text.secondary">
            Placar exato vale 3 pontos. Acertar o vencedor ou empate vale 1
            ponto. Errar o resultado vale 0 ponto.
          </Typography>
        </Stack>
      </Paper>

      {isLoading && <Typography>Carregando ranking...</Typography>}
      {error && (
        <Alert severity="error">Não foi possível carregar ranking.</Alert>
      )}

      {data?.ranking.map((item, index) => (
        <Paper key={item.userId} sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" gap={2} alignItems="center">
              <Chip
                color={index < 3 ? "secondary" : "default"}
                label={`#${index + 1}`}
              />
              <Typography variant="h6">{item.username}</Typography>
            </Stack>
            <Typography>
              {item.totalPoints} pts · {item.exactScores} cravados ·{" "}
              {item.scoredGuesses} pontuados
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
