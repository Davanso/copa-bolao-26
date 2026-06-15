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
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { GameCardShell } from "../components/GameCardShell";
import { LoadingState } from "../components/LoadingState";
import { GameHeader } from "../components/GameHeader";
import { GuessFeedbackChips } from "../components/GuessFeedbackChips";
import { GuessScoreFields } from "../components/GuessScoreFields";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import {
  buildStageTabs,
  groupItemsForTab,
  readStringSet,
} from "../services/gameStages";
import { isGameFinished, isGuessLocked } from "../services/gameHelpers";
import {
  inputToScore,
  isValidScore,
  scoreToInput,
} from "../services/scoreInput";
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
    () => buildStageTabs(data?.games ?? [], (game) => game),
    [data?.games],
  );
  const selectedTab = stageTabs.find((tab) => tab.id === selectedStage);
  const groupedGames = useMemo(
    () => groupItemsForTab(selectedTab, (game) => game),
    [selectedTab],
  );
  const groupLabels = useMemo(
    () => groupedGames.map(([groupName]) => groupName),
    [groupedGames],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    readStringSet(expandedGroupsStorageKey),
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
          emoji="📅"
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
                label={`${tab.label} (${tab.items.length})`}
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
                  <GameCardShell>
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
                  </GameCardShell>
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
    isValidScore(homeScore) &&
    isValidScore(awayScore);

  function saveGuess() {
    if (homeScore === null || awayScore === null) {
      return;
    }

    onSave(homeScore, awayScore);
  }

  return (
    <Stack gap={1.25} sx={{ mt: 1.5 }}>
      <GuessFeedbackChips game={game} />
      <Typography variant="subtitle2">Seu palpite</Typography>
      <GuessScoreFields
        awayLabel={game.teamAway}
        buttonLabel={
          saving ? "Salvando..." : game.myGuess ? "Atualizar" : "Salvar"
        }
        disabled={locked || saving}
        draft={draft}
        homeLabel={game.teamHome}
        saveDisabled={!canSave}
        onChange={onChange}
        onSave={saveGuess}
      />

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

function ExpandMoreIcon() {
  return (
    <SvgIcon fontSize="medium" viewBox="0 0 24 24">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </SvgIcon>
  );
}
