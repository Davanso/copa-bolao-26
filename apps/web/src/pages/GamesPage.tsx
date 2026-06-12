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
import { isGameFinished, isGuessLocked } from "../services/gameHelpers";
import type { Game, Guess } from "../services/types";

const expandedGroupsStorageKey = "bolao.games.expandedGroups";
const unsavedGuessesStorageKey = "bolao.unsavedGuesses";

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
  silent?: boolean;
};

type GuessDraft = {
  home: string;
  away: string;
};

export function GamesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedStage, setSelectedStage] = useState("group");
  const { data, error, isLoading } = useQuery<{ games: Game[] }>({
    queryKey: ["games"],
    queryFn: async () => (await api.get("/games")).data,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
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
  const [drafts, setDrafts] = useState<Record<string, GuessDraft>>({});
  const [savingGameIds, setSavingGameIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      for (const game of data?.games ?? []) {
        if (!nextDrafts[game.id]) {
          nextDrafts[game.id] = {
            away: scoreToInput(game.myGuess?.guessAway),
            home: scoreToInput(game.myGuess?.guessHome),
          };
        }
      }

      return nextDrafts;
    });
  }, [data?.games]);

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

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"]);
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

      queryClient.setQueryData<GamesResponse>(["games"], (current) =>
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
      queryClient.setQueryData<GamesResponse>(["games"], (current) =>
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
      if (!payload.silent) {
        showToast("Palpite salvo com sucesso!", "success");
      }
    },
    onError: (err: any, _payload, context) => {
      queryClient.setQueryData(["games"], context?.previousGames);
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
  const allGames = data?.games ?? [];
  const pendingDrafts = useMemo(
    () =>
      allGames
        .map((game) => {
          const draft = drafts[game.id];
          const guessHome = inputToScore(draft?.home ?? "");
          const guessAway = inputToScore(draft?.away ?? "");
          const changed =
            guessHome !== null &&
            guessAway !== null &&
            (guessHome !== game.myGuess?.guessHome ||
              guessAway !== game.myGuess?.guessAway);

          return {
            game,
            guessAway,
            guessHome,
            changed,
          };
        })
        .filter(
          (
            item,
          ): item is {
            game: Game;
            guessAway: number;
            guessHome: number;
            changed: boolean;
          } =>
            item.guessHome !== null &&
            item.guessAway !== null &&
            item.changed &&
            !isGuessLocked(item.game) &&
            item.guessHome <= 30 &&
            item.guessAway <= 30,
        ),
    [allGames, drafts],
  );

  async function saveGuess(payload: GuessPayload) {
    setSavingGameIds((currentIds) => new Set(currentIds).add(payload.gameId));

    try {
      await mutation.mutateAsync(payload);
    } finally {
      setSavingGameIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(payload.gameId);
        return nextIds;
      });
    }
  }

  async function saveAllGuesses() {
    if (!pendingDrafts.length) {
      return;
    }

    const payloads = pendingDrafts.map(({ game, guessAway, guessHome }) => ({
      gameId: game.id,
      guessAway,
      guessHome,
      silent: true,
    }));

    setSavingGameIds((currentIds) => {
      const nextIds = new Set(currentIds);
      for (const payload of payloads) {
        nextIds.add(payload.gameId);
      }
      return nextIds;
    });

    try {
      await Promise.all(
        payloads.map((payload) => mutation.mutateAsync(payload)),
      );
      showToast("Todos os palpites foram salvos!", "success");
    } finally {
      setSavingGameIds((currentIds) => {
        const nextIds = new Set(currentIds);
        for (const payload of payloads) {
          nextIds.delete(payload.gameId);
        }
        return nextIds;
      });
    }
  }

  useEffect(() => {
    localStorage.setItem(
      unsavedGuessesStorageKey,
      pendingDrafts.length > 0 ? "true" : "false",
    );

    return () => {
      localStorage.setItem(unsavedGuessesStorageKey, "false");
    };
  }, [pendingDrafts.length]);

  useEffect(() => {
    function confirmBeforeUnload(event: BeforeUnloadEvent) {
      if (!pendingDrafts.length) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", confirmBeforeUnload);

    return () =>
      window.removeEventListener("beforeunload", confirmBeforeUnload);
  }, [pendingDrafts.length]);

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
        <Paper
          sx={{
            border: "1px solid rgba(15, 23, 42, .08)",
            borderRadius: 2,
            boxShadow: "none",
            p: 1,
          }}
        >
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
          disableGutters
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
          sx={{
            border: "1px solid rgba(15, 23, 42, .10)",
            borderRadius: 2,
            boxShadow: "none",
            overflow: "hidden",
            "&:before": { display: "none" },
            "& + &": { mt: 1.5 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: "rgba(0, 156, 59, .06)",
              borderBottom: expandedGroups.has(groupName)
                ? "1px solid rgba(15, 23, 42, .08)"
                : "0",
              minHeight: 58,
            }}
          >
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
          <AccordionDetails sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {games.map((game) => (
                <Grid item xs={12} lg={6} key={game.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      bgcolor: "background.paper",
                      borderColor: "rgba(15, 23, 42, .10)",
                      borderRadius: 2,
                      boxShadow: "none",
                      p: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <GameHeader game={game} />
                    <GuessForm
                      draft={
                        drafts[game.id] ?? {
                          away: scoreToInput(game.myGuess?.guessAway),
                          home: scoreToInput(game.myGuess?.guessHome),
                        }
                      }
                      game={game}
                      saving={savingGameIds.has(game.id)}
                      onChange={(draft) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [game.id]: draft,
                        }))
                      }
                      onSave={(guessHome, guessAway) =>
                        saveGuess({
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

      {pendingDrafts.length > 0 && (
        <Button
          size="large"
          variant="contained"
          disabled={savingGameIds.size > 0}
          onClick={saveAllGuesses}
          sx={{
            bottom: { xs: 82, md: 28 },
            boxShadow: 5,
            position: "fixed",
            right: { xs: 16, md: 32 },
            zIndex: 8,
          }}
        >
          Salvar tudo ({pendingDrafts.length})
        </Button>
      )}
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
  draft,
  game,
  onChange,
  saving,
  onSave,
}: {
  draft: GuessDraft;
  game: Game;
  onChange: (draft: GuessDraft) => void;
  saving: boolean;
  onSave: (home: number, away: number) => void;
}) {
  const locked = isGuessLocked(game);
  const home = draft.home;
  const away = draft.away;
  const homeScore = inputToScore(home);
  const awayScore = inputToScore(away);
  const changed =
    homeScore !== null &&
    awayScore !== null &&
    (homeScore !== game.myGuess?.guessHome ||
      awayScore !== game.myGuess?.guessAway);
  const canSave =
    !locked &&
    !saving &&
    changed &&
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
          onChange={(event) =>
            onChange({
              ...draft,
              home: normalizeScoreInput(event.target.value),
            })
          }
        />
        <TextField
          label={game.teamAway}
          placeholder="0"
          value={away}
          disabled={locked || saving}
          inputProps={{ inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" }}
          sx={{ minWidth: { xs: "100%", sm: 150 }, flex: 1 }}
          onChange={(event) =>
            onChange({
              ...draft,
              away: normalizeScoreInput(event.target.value),
            })
          }
        />
        <Button
          size="large"
          variant="contained"
          disabled={!canSave}
          onClick={saveGuess}
          sx={{ minWidth: { xs: "100%", sm: 170 } }}
        >
          {saving ? "Salvando..." : game.myGuess ? "Atualizar" : "Salvar"}
        </Button>
      </Stack>

      {locked && (
        <Typography variant="caption" color="text.secondary">
          {isGameFinished(game)
            ? `Este jogo já foi encerrado. Resultado oficial: ${game.scoreHome} x ${game.scoreAway}.`
            : "Palpite bloqueado: o jogo já começou ou não está agendado."}
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
