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
  SvgIcon,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { GameHeader } from "../components/GameHeader";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import { isGuessLocked } from "../services/gameHelpers";
import type { Game, Guess } from "../services/types";

const expandedGroupsStorageKey = "bolao.games.expandedGroups";

type GamesResponse = {
  games: Game[];
};

type GuessesResponse = {
  guesses: Guess[];
};

type GuessPayload = {
  gameId: string;
  guessHome: number;
  guessAway: number;
};

export function GamesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedStage, setSelectedStage] = useState("group");
  const { data, error, isLoading } = useQuery<{ games: Game[] }>({
    queryKey: ["games", "scheduled"],
    queryFn: async () => (await api.get("/games?status=scheduled")).data,
  });
  const stageTabs = useMemo(
    () => buildStageTabs(data?.games ?? []),
    [data?.games],
  );
  const selectedTab = stageTabs.find((tab) => tab.id === selectedStage);
  const groupedGames = useMemo(
    () => groupGamesForTab(selectedTab),
    [selectedTab],
  );
  const groupLabels = useMemo(
    () => groupedGames.map(([groupName]) => groupName),
    [groupedGames],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    readExpandedGroups(),
  );
  const hasGames = groupedGames.length > 0;
  const allExpanded =
    hasGames && groupLabels.every((groupName) => expandedGroups.has(groupName));

  useEffect(() => {
    if (!stageTabs.length) {
      return;
    }

    if (!stageTabs.some((tab) => tab.id === selectedStage)) {
      setSelectedStage(stageTabs[0].id);
    }
  }, [selectedStage, stageTabs]);

  useEffect(() => {
    setExpandedGroups((currentGroups) => {
      if (groupLabels.length === 0) {
        return new Set();
      }

      const visibleGroups = new Set(groupLabels);
      return new Set(
        [...currentGroups].filter((groupName) => visibleGroups.has(groupName)),
      );
    });
  }, [groupLabels]);

  useEffect(() => {
    localStorage.setItem(
      expandedGroupsStorageKey,
      JSON.stringify([...expandedGroups]),
    );
  }, [expandedGroups]);

  const mutation = useMutation({
    mutationFn: (payload: GuessPayload) =>
      api.post<{ guess: Guess }>(`/games/${payload.gameId}/guess`, {
        guessAway: payload.guessAway,
        guessHome: payload.guessHome,
      }),
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["games"] }),
        queryClient.cancelQueries({ queryKey: ["guesses-me"] }),
      ]);

      const previousGames = queryClient.getQueryData<GamesResponse>([
        "games",
        "scheduled",
      ]);
      const previousGuesses = queryClient.getQueryData<GuessesResponse>([
        "guesses-me",
      ]);
      const game = previousGames?.games.find(
        (item) => item.id === payload.gameId,
      );
      const optimisticGuess: Guess = {
        game,
        gameId: payload.gameId,
        guessAway: payload.guessAway,
        guessHome: payload.guessHome,
        id: game?.myGuess?.id ?? `temp-${payload.gameId}`,
        points: game?.myGuess?.points ?? null,
      };

      queryClient.setQueryData<GamesResponse>(
        ["games", "scheduled"],
        (current) =>
          current
            ? {
                ...current,
                games: current.games.map((item) =>
                  item.id === payload.gameId
                    ? { ...item, myGuess: optimisticGuess }
                    : item,
                ),
              }
            : current,
      );
      queryClient.setQueryData<GuessesResponse>(["guesses-me"], (current) => {
        if (!current) {
          return current;
        }

        const exists = current.guesses.some(
          (guess) => guess.gameId === payload.gameId,
        );

        return {
          guesses: exists
            ? current.guesses.map((guess) =>
                guess.gameId === payload.gameId
                  ? { ...guess, ...optimisticGuess }
                  : guess,
              )
            : [optimisticGuess, ...current.guesses],
        };
      });

      return { previousGames, previousGuesses };
    },
    onSuccess: ({ data }, payload) => {
      queryClient.setQueryData<GamesResponse>(
        ["games", "scheduled"],
        (current) =>
          current
            ? {
                ...current,
                games: current.games.map((game) =>
                  game.id === payload.gameId
                    ? { ...game, myGuess: data.guess }
                    : game,
                ),
              }
            : current,
      );
      showToast("Palpite salvo com sucesso!", "success");
    },
    onError: (err: any, _payload, context) => {
      queryClient.setQueryData(["games", "scheduled"], context?.previousGames);
      queryClient.setQueryData(["guesses-me"], context?.previousGuesses);
      showToast(
        err.response?.data?.message ?? "Não foi possível salvar o palpite.",
        "error",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["guesses-me"] });
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
            Escolha a fase, abra cada grupo e salve antes da bola rolar.
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
        <LoadingState
          title="Carregando jogos"
          description="Buscando a tabela oficial da Copa 2026."
        />
      )}
      {error && (
        <Alert severity="error">
          {(error as any)?.response?.data?.message ??
            "Não foi possível carregar jogos."}
        </Alert>
      )}
      {!isLoading && data?.games.length === 0 && (
        <EmptyState
          emoji="??"
          title="Nenhum jogo agendado"
          description="Assim que a API retornar partidas abertas, elas aparecem aqui."
        />
      )}

      {stageTabs.length > 0 && (
        <Paper sx={{ p: 1 }}>
          <Tabs
            value={selectedStage}
            variant="scrollable"
            scrollButtons="auto"
            onChange={(_, value: string) => setSelectedStage(value)}
          >
            {stageTabs.map((tab) => (
              <Tab
                key={tab.id}
                label={`${tab.label} (${tab.games.length})`}
                value={tab.id}
              />
            ))}
          </Tabs>
        </Paper>
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

function ExpandMoreIcon() {
  return (
    <SvgIcon fontSize="medium" viewBox="0 0 24 24">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </SvgIcon>
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
  const [home, setHome] = useState(scoreToInput(game.myGuess?.guessHome));
  const [away, setAway] = useState(scoreToInput(game.myGuess?.guessAway));
  const homeScore = inputToScore(home);
  const awayScore = inputToScore(away);
  const canSave =
    !locked &&
    !saving &&
    homeScore !== null &&
    awayScore !== null &&
    homeScore <= 30 &&
    awayScore <= 30;

  function saveGuess() {
    if (homeScore === null || awayScore === null) {
      return;
    }

    onSave(homeScore, awayScore);
  }

  return (
    <Stack gap={1.25} sx={{ mt: 1.5 }}>
      <Typography variant="subtitle2">Seu palpite</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25}>
        <TextField
          label={game.teamHome}
          placeholder="0"
          value={home}
          disabled={locked || saving}
          inputProps={{ inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" }}
          sx={{ minWidth: { xs: "100%", sm: 150 }, flex: 1 }}
          onChange={(event) => setHome(normalizeScoreInput(event.target.value))}
        />
        <TextField
          label={game.teamAway}
          placeholder="0"
          value={away}
          disabled={locked || saving}
          inputProps={{ inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" }}
          sx={{ minWidth: { xs: "100%", sm: 150 }, flex: 1 }}
          onChange={(event) => setAway(normalizeScoreInput(event.target.value))}
        />
        <Button
          size="large"
          variant="contained"
          disabled={!canSave}
          onClick={saveGuess}
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

type StageTab = {
  id: string;
  label: string;
  games: Game[];
};

const stageTabsConfig = [
  {
    id: "group",
    label: "Fase de grupos",
    match: (game: Game) => game.stage === "Fase de grupos",
  },
  {
    id: "r32",
    label: "16 avos",
    match: (game: Game) => game.stage === "16 avos de final",
  },
  {
    id: "r16",
    label: "Oitavas",
    match: (game: Game) => game.stage === "Oitavas de final",
  },
  {
    id: "qf",
    label: "Quartas",
    match: (game: Game) => game.stage === "Quartas de final",
  },
  {
    id: "sf",
    label: "Semifinal",
    match: (game: Game) => game.stage === "Semifinal",
  },
  {
    id: "final",
    label: "Final",
    match: (game: Game) => game.stage === "Final",
  },
  {
    id: "third",
    label: "3º lugar",
    match: (game: Game) => game.stage === "Disputa de terceiro lugar",
  },
];

function buildStageTabs(games: Game[]): StageTab[] {
  return stageTabsConfig
    .map((stage) => ({
      id: stage.id,
      label: stage.label,
      games: games.filter(stage.match).sort(compareGames),
    }))
    .filter((stage) => stage.games.length > 0);
}

function groupGamesForTab(tab?: StageTab) {
  if (!tab) {
    return [] as [string, Game[]][];
  }

  const grouped = new Map<string, Game[]>();

  for (const game of tab.games) {
    const label =
      tab.id === "group" && game.groupName
        ? `Grupo ${game.groupName}`
        : game.stage;
    grouped.set(label, [...(grouped.get(label) ?? []), game]);
  }

  return [...grouped.entries()]
    .map(
      ([label, groupedGames]) =>
        [label, [...groupedGames].sort(compareGames)] as [string, Game[]],
    )
    .sort(([firstLabel], [secondLabel]) =>
      compareGroupLabels(firstLabel, secondLabel),
    );
}

function compareGames(firstGame: Game, secondGame: Game) {
  if (firstGame.groupName && secondGame.groupName) {
    const groupOrder = firstGame.groupName.localeCompare(
      secondGame.groupName,
      "pt-BR",
      { numeric: true },
    );

    if (groupOrder !== 0) {
      return groupOrder;
    }
  }

  return Date.parse(firstGame.startsAt) - Date.parse(secondGame.startsAt);
}

function compareGroupLabels(firstLabel: string, secondLabel: string) {
  if (isGroupLabel(firstLabel) && isGroupLabel(secondLabel)) {
    return firstLabel.localeCompare(secondLabel, "pt-BR", { numeric: true });
  }

  return 0;
}

function isGroupLabel(label: string) {
  return label.startsWith("Grupo ");
}

function readExpandedGroups() {
  try {
    const storedGroups = localStorage.getItem(expandedGroupsStorageKey);

    if (!storedGroups) {
      return new Set<string>();
    }

    const parsedGroups = JSON.parse(storedGroups);

    if (!Array.isArray(parsedGroups)) {
      return new Set<string>();
    }

    return new Set(
      parsedGroups.filter((groupName) => typeof groupName === "string"),
    );
  } catch {
    return new Set<string>();
  }
}
