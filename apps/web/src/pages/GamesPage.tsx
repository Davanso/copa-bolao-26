import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { GameHeader } from "../components/GameHeader";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import { isGuessLocked } from "../services/gameHelpers";
import type { Game } from "../services/types";

export function GamesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, error, isLoading } = useQuery<{ games: Game[] }>({
    queryKey: ["games", "scheduled"],
    queryFn: async () => (await api.get("/games?status=scheduled")).data,
  });
  const groupedGames = useMemo(
    () => groupGamesByStage(data?.games ?? []),
    [data?.games],
  );
  const groupLabels = useMemo(
    () => groupedGames.map(([groupName]) => groupName),
    [groupedGames],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const hasGames = groupedGames.length > 0;
  const allExpanded =
    hasGames && groupLabels.every((groupName) => expandedGroups.has(groupName));

  useEffect(() => {
    setExpandedGroups((currentGroups) => {
      if (currentGroups.size > 0 || groupLabels.length === 0) {
        return currentGroups;
      }

      return new Set(groupLabels.slice(0, 2));
    });
  }, [groupLabels]);

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
      showToast("Palpite salvo com sucesso!", "success");
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["guesses-me"] });
    },
    onError: (err: any) => {
      showToast(
        err.response?.data?.message ?? "Não foi possível salvar o palpite.",
        "error",
      );
    },
  });

  return (
    <Stack gap={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography variant="h4">Jogos agendados</Typography>
          <Typography color="text.secondary">
            Abra cada grupo, escolha seus placares e salve antes da bola rolar.
          </Typography>
        </Box>

        {hasGames && (
          <Stack direction="row" gap={1} alignItems="center">
            <Button
              size="small"
              variant={allExpanded ? "contained" : "outlined"}
              onClick={() => setExpandedGroups(new Set(groupLabels))}
            >
              Expandir tudo
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setExpandedGroups(new Set())}
            >
              Colapsar tudo
            </Button>
          </Stack>
        )}
      </Stack>

      {isLoading && (
        <EmptyState
          emoji="⚽"
          title="Carregando jogos"
          description="Buscando a tabela oficial da Copa 2026."
        />
      )}
      {error && (
        <Alert severity="error">Não foi possível carregar jogos.</Alert>
      )}
      {!isLoading && data?.games.length === 0 && (
        <EmptyState
          emoji="📅"
          title="Nenhum jogo agendado"
          description="Assim que a API retornar partidas abertas, elas aparecem aqui."
        />
      )}

      {groupedGames.map(([groupName, games]) => (
        <Accordion
          key={groupName}
          expanded={expandedGroups.has(groupName)}
          TransitionProps={{ timeout: 140, unmountOnExit: true }}
          onChange={(_, expanded) => {
            setExpandedGroups((currentGroups) => {
              const nextGroups = new Set(currentGroups);

              if (expanded) {
                nextGroups.add(groupName);
              } else {
                nextGroups.delete(groupName);
              }

              return nextGroups;
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction="row"
              justifyContent="space-between"
              width="100%"
              pr={2}
            >
              <Typography variant="h5">{groupName}</Typography>
              <Typography color="text.secondary">
                {games.length} jogos
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {games.map((game) => (
                <Grid item xs={12} lg={6} key={game.id}>
                  <Paper sx={{ p: 1.25 }}>
                    <GameHeader game={game} />
                    <GuessForm
                      game={game}
                      saving={mutation.isPending}
                      onSave={(guessHome, guessAway) =>
                        mutation.mutate({
                          gameId: game.id,
                          guessHome,
                          guessAway,
                        })
                      }
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
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

function groupGamesByStage(games: Game[]) {
  const grouped = new Map<string, Game[]>();

  for (const game of games) {
    const label = game.groupName ? `Grupo ${game.groupName}` : game.stage;
    grouped.set(label, [...(grouped.get(label) ?? []), game]);
  }

  return [...grouped.entries()]
    .map(
      ([label, groupedGames]) =>
        [
          label,
          [...groupedGames].sort(
            (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
          ),
        ] as [string, Game[]],
    )
    .sort(([firstLabel], [secondLabel]) =>
      compareStageLabels(firstLabel, secondLabel),
    );
}

function compareStageLabels(firstLabel: string, secondLabel: string) {
  const firstOrder = stageOrder(firstLabel);
  const secondOrder = stageOrder(secondLabel);

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  return firstLabel.localeCompare(secondLabel, "pt-BR", { numeric: true });
}

function stageOrder(label: string) {
  if (label.startsWith("Grupo ")) {
    return 0;
  }

  const knockoutOrder: Record<string, number> = {
    "16 avos de final": 1,
    "Oitavas de final": 2,
    "Quartas de final": 3,
    Semifinal: 4,
    Final: 5,
    "Disputa de terceiro lugar": 6,
  };

  return knockoutOrder[label] ?? 99;
}
