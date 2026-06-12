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
  Tab,
  Tabs,
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

const defaultScoringRules = [
  { stage: "Fase de grupos", exactPoints: 3, resultPoints: 1 },
  { stage: "16 avos de final", exactPoints: 4, resultPoints: 2 },
  { stage: "Oitavas de final", exactPoints: 5, resultPoints: 2 },
  { stage: "Quartas de final", exactPoints: 6, resultPoints: 3 },
  { stage: "Semifinal", exactPoints: 8, resultPoints: 4 },
  { stage: "Disputa de terceiro lugar", exactPoints: 8, resultPoints: 4 },
  { stage: "Final", exactPoints: 10, resultPoints: 5 },
];

const scoringRuleTabs = [
  {
    id: "group",
    label: "Fase de grupos",
    stages: ["Fase de grupos"],
  },
  {
    id: "early-knockout",
    label: "Início do mata-mata",
    stages: ["16 avos de final", "Oitavas de final", "Quartas de final"],
  },
  {
    id: "finals",
    label: "Finais",
    stages: ["Semifinal", "Disputa de terceiro lugar", "Final"],
  },
];
const selectedRankingGroupStorageKey = "bolao.ranking.selectedGroupId";

export function RankingPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() =>
    localStorage.getItem(selectedRankingGroupStorageKey),
  );
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
    const groups = groupsQuery.data?.groups ?? [];

    if (!groups.length) {
      return;
    }

    const selectedStillExists = groups.some(
      (group) => group.id === selectedGroupId,
    );

    if (!selectedGroupId || !selectedStillExists) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groupsQuery.data?.groups, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem(selectedRankingGroupStorageKey, selectedGroupId);
    }
  }, [selectedGroupId]);

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
        <Stack gap={1.5}>
          <Paper
            sx={{
              background:
                "linear-gradient(135deg, rgba(0,156,59,.14), rgba(0,82,180,.12))",
              border: "1px solid rgba(0, 82, 180, .14)",
              p: 2.5,
            }}
          >
            <Stack gap={0.75}>
              <Typography variant="h5">
                Ranking: {selectedGroup.name}
              </Typography>
              <Typography color="text.secondary">
                Premiação simbólica total:{" "}
                {currency.format(selectedGroup.symbolicPrizeTotal ?? 0)}
              </Typography>
            </Stack>
          </Paper>

          <ScoringRulesSummary group={selectedGroup} />
        </Stack>
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
        <Avatar
          src={item.avatarUrl ?? undefined}
          sx={{ bgcolor: config.accent, color: "#10203f" }}
        >
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

function ScoringRulesSummary({ group }: { group: Group }) {
  const [selectedTab, setSelectedTab] = useState(scoringRuleTabs[0].id);
  const selectedRuleTab =
    scoringRuleTabs.find((tab) => tab.id === selectedTab) ?? scoringRuleTabs[0];
  const rulesByStage = new Map(
    (group.scoringRules ?? []).map((rule) => [rule.stage, rule]),
  );
  const visibleRules = defaultScoringRules
    .map((rule) => ({
      ...rule,
      ...rulesByStage.get(rule.stage),
    }))
    .filter((rule) => selectedRuleTab.stages.includes(rule.stage));

  return (
    <Paper
      sx={{
        background:
          "linear-gradient(135deg, rgba(0,156,59,.10), rgba(255,204,41,.12))",
        border: "1px solid rgba(0, 156, 59, .16)",
        p: 2,
      }}
    >
      <Stack gap={1.25}>
        <Stack>
          <Typography variant="h6">Regras usadas neste ranking</Typography>
          <Typography color="text.secondary">
            Cada grupo pode ter uma pontuação própria. Este resumo acompanha o
            grupo selecionado e segue as mesmas fases da tela do grupo.
          </Typography>
        </Stack>

        <Paper sx={{ p: 1 }}>
          <Tabs
            value={selectedTab}
            variant="scrollable"
            scrollButtons="auto"
            onChange={(_, value: string) => setSelectedTab(value)}
          >
            {scoringRuleTabs.map((tab) => (
              <Tab key={tab.id} label={tab.label} value={tab.id} />
            ))}
          </Tabs>
        </Paper>

        <Grid container spacing={1}>
          {visibleRules.map((rule) => (
            <Grid item xs={12} sm={6} md={4} key={rule.stage}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Stack gap={0.75}>
                  <Typography fontWeight={900}>{rule.stage}</Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    <Chip
                      color="primary"
                      label={`${rule.exactPoints} pts placar`}
                    />
                    <Chip
                      color="secondary"
                      label={`${rule.resultPoints} pts resultado`}
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Stack>
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
          <Avatar
            src={item.avatarUrl ?? undefined}
            sx={{ bgcolor: "primary.main" }}
          >
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
