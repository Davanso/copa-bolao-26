import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { api } from "../services/api";
import type { Group, RankingItem } from "../services/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const podiumConfig = [
  {
    accent: "#f6c343",
    emoji: "🥇",
    height: 172,
    label: "Campeão",
  },
  {
    accent: "#8fb3ff",
    emoji: "🥈",
    height: 142,
    label: "Vice",
  },
  {
    accent: "#da8c4b",
    emoji: "🥉",
    height: 122,
    label: "Terceiro",
  },
];

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
  const ranking = rankingQuery.data?.ranking ?? [];
  const podium = ranking.slice(0, 3);
  const others = ranking.slice(3);

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
        <LoadingState
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
        <Paper
          sx={{
            background:
              "linear-gradient(135deg, rgba(0,156,59,.14), rgba(0,82,180,.12))",
            border: "1px solid rgba(0, 82, 180, .14)",
            p: 2.5,
          }}
        >
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
        <LoadingState
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

      {podium.length > 0 && (
        <Grid container spacing={2} alignItems="flex-end">
          {podium.map((item, index) => (
            <Grid item xs={12} md={4} key={item.userId}>
              <PodiumCard
                item={item}
                position={index + 1}
                prize={prizeByPosition.get(index + 1) ?? 0}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {others.length > 0 && (
        <Stack gap={1.25}>
          <Typography variant="h6">Classificação geral</Typography>
          {others.map((item, index) => (
            <RankingRow
              item={item}
              key={item.userId}
              position={index + 4}
              prize={prizeByPosition.get(index + 4) ?? 0}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function PodiumCard({
  item,
  position,
  prize,
}: {
  item: RankingItem;
  position: number;
  prize: number;
}) {
  const config = podiumConfig[position - 1];

  return (
    <Paper
      sx={{
        border: `1px solid ${config.accent}55`,
        overflow: "hidden",
      }}
    >
      <Stack alignItems="center" gap={1.25} sx={{ p: 2 }}>
        <Typography fontSize={34}>{config.emoji}</Typography>
        <Avatar sx={{ bgcolor: config.accent, color: "#10203f" }}>
          {initials(item.username)}
        </Avatar>
        <Box textAlign="center">
          <Typography variant="h6">{item.username}</Typography>
          <Typography color="text.secondary">{config.label}</Typography>
        </Box>
        <Chip label={`${item.totalPoints} pts`} color="primary" />
      </Stack>
      <Box
        sx={{
          bgcolor: `${config.accent}24`,
          borderTop: `1px solid ${config.accent}55`,
          minHeight: { xs: 90, md: config.height },
          p: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h4">#{position}</Typography>
        <Typography color="text.secondary">
          {item.exactScores} cravados · {item.scoredGuesses} pontuados
        </Typography>
        {prize > 0 && (
          <Typography color="secondary.main" fontWeight={800}>
            {currency.format(prize)}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function RankingRow({
  item,
  position,
  prize,
}: {
  item: RankingItem;
  position: number;
  prize: number;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Stack direction="row" gap={1.5} alignItems="center">
          <Chip label={`#${position}`} />
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {initials(item.username)}
          </Avatar>
          <Typography variant="h6">{item.username}</Typography>
        </Stack>
        <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
          <Typography>
            {item.totalPoints} pts · {item.exactScores} cravados ·{" "}
            {item.scoredGuesses} pontuados
          </Typography>
          {prize > 0 && (
            <Typography color="secondary.main">
              Premiação simbólica: {currency.format(prize)}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}
