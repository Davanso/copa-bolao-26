import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { api } from "../services/api";
import type { Group, RankingItem } from "../services/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function RankingPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const groupsQuery = useQuery<{ groups: Group[] }>({
    queryKey: ["groups-me"],
    queryFn: async () => (await api.get("/groups/me")).data,
  });
  const rankingQuery = useQuery<{ ranking: RankingItem[] }>({
    queryKey: ["group-ranking", selectedGroupId],
    queryFn: async () =>
      (await api.get(`/groups/${selectedGroupId}/ranking`)).data,
    enabled: Boolean(selectedGroupId),
  });

  useEffect(() => {
    if (!selectedGroupId && groupsQuery.data?.groups.length) {
      setSelectedGroupId(groupsQuery.data.groups[0].id);
    }
  }, [groupsQuery.data?.groups, selectedGroupId]);

  const selectedGroup = groupsQuery.data?.groups.find(
    (group) => group.id === selectedGroupId,
  );
  const prizeByPosition = useMemo(() => {
    const total = selectedGroup?.symbolicPrizeTotal ?? 0;
    return new Map(
      (selectedGroup?.prizeRules ?? []).map((rule) => [
        rule.position,
        (total * rule.percentage) / 100,
      ]),
    );
  }, [selectedGroup]);

  return (
    <Stack gap={2.5}>
      <Stack>
        <Typography variant="h4">Ranking dos grupos</Typography>
        <Typography color="text.secondary">
          Escolha um grupo que você participa para ver a classificação.
        </Typography>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack gap={0.75}>
          <Typography variant="h6">Como funciona a pontuação?</Typography>
          <Typography color="text.secondary">
            Placar exato vale 3 pontos. Acertar o vencedor ou empate vale 1
            ponto. Errar o resultado vale 0 ponto.
          </Typography>
        </Stack>
      </Paper>

      {groupsQuery.isLoading && (
        <EmptyState
          emoji="🏆"
          title="Carregando rankings"
          description="Estamos buscando seus grupos."
        />
      )}
      {groupsQuery.error && (
        <Alert severity="error">Não foi possível carregar seus grupos.</Alert>
      )}
      {!groupsQuery.isLoading && groupsQuery.data?.groups.length === 0 && (
        <EmptyState
          emoji="👥"
          title="Sem grupos para ranquear"
          description="Crie ou entre em um grupo para ver o ranking da sua turma."
        />
      )}

      <Grid container spacing={1.5}>
        {groupsQuery.data?.groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Button
              fullWidth
              variant={group.id === selectedGroupId ? "contained" : "outlined"}
              onClick={() => setSelectedGroupId(group.id)}
            >
              {group.name}
            </Button>
          </Grid>
        ))}
      </Grid>

      {selectedGroup && (
        <Paper sx={{ p: 2 }}>
          <Stack gap={0.75}>
            <Typography variant="h5">Ranking: {selectedGroup.name}</Typography>
            <Typography color="text.secondary">
              Premiação simbólica total:{" "}
              {currency.format(selectedGroup.symbolicPrizeTotal ?? 0)}
            </Typography>
          </Stack>
        </Paper>
      )}
      {rankingQuery.isLoading && selectedGroupId && (
        <EmptyState
          emoji="📊"
          title="Calculando ranking"
          description="Somando pontos e cravadas deste grupo."
        />
      )}
      {rankingQuery.error && (
        <Alert severity="error">Não foi possível carregar este ranking.</Alert>
      )}
      {rankingQuery.data?.ranking.length === 0 && (
        <EmptyState
          emoji="🎯"
          title="Ranking vazio"
          description="Os participantes ainda não fizeram palpites."
        />
      )}

      {rankingQuery.data?.ranking.map((item, index) => {
        const position = index + 1;
        const symbolicPrize = prizeByPosition.get(position) ?? 0;

        return (
          <Paper key={item.userId} sx={{ p: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={1.5}
            >
              <Stack direction="row" gap={2} alignItems="center">
                <Chip
                  color={index < 3 ? "secondary" : "default"}
                  label={`#${position}`}
                />
                <Typography variant="h6">{item.username}</Typography>
              </Stack>
              <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                <Typography>
                  {item.totalPoints} pts · {item.exactScores} cravados ·{" "}
                  {item.scoredGuesses} pontuados
                </Typography>
                {symbolicPrize > 0 && (
                  <Typography color="secondary.main">
                    Premiação simbólica: {currency.format(symbolicPrize)}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
