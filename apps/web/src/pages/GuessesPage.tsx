import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { TeamFlag } from "../components/TeamFlag";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import {
  buildStageTabs,
  groupItemsForTab,
  readStringSet,
} from "../services/gameStages";
import {
  formatGameDate,
  isGuessLocked,
  statusLabel,
} from "../services/gameHelpers";
import type { Game, Guess } from "../services/types";

const expandedGuessesStorageKey = "bolao.guesses.expandedGroups";

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

export function GuessesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [guessToEdit, setGuessToEdit] = useState<Guess | null>(null);
  const [selectedStage, setSelectedStage] = useState("group");
  const { data, error, isLoading } = useQuery<{ guesses: Guess[] }>({
    queryKey: ["guesses-me"],
    queryFn: async () => (await api.get("/guesses/me")).data,
  });
  const stageTabs = useMemo(
    () => buildStageTabs(data?.guesses ?? [], (guess) => guess.game),
    [data?.guesses],
  );
  const selectedTab = stageTabs.find((tab) => tab.id === selectedStage);
  const groupedGuesses = useMemo(
    () => groupItemsForTab(selectedTab, (guess) => guess.game),
    [selectedTab],
  );
  const groupLabels = useMemo(
    () => groupedGuesses.map(([groupName]) => groupName),
    [groupedGuesses],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    readStringSet(expandedGuessesStorageKey),
  );
  const hasGuesses = groupedGuesses.length > 0;
  const allExpanded =
    hasGuesses &&
    groupLabels.every((groupName) => expandedGroups.has(groupName));

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
      expandedGuessesStorageKey,
      JSON.stringify([...expandedGroups]),
    );
  }, [expandedGroups]);

  const updateGuess = useMutation({
    mutationFn: (payload: GuessPayload) =>
      api.post<{ guess: Guess }>(`/games/${payload.gameId}/guess`, {
        guessAway: payload.guessAway,
        guessHome: payload.guessHome,
      }),
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["guesses-me"] }),
        queryClient.cancelQueries({ queryKey: ["games"] }),
      ]);

      const previousGuesses = queryClient.getQueryData<GuessesResponse>([
        "guesses-me",
      ]);
      const previousGames = queryClient.getQueryData<GamesResponse>(["games"]);

      queryClient.setQueryData<GuessesResponse>(["guesses-me"], (current) =>
        current
          ? {
              guesses: current.guesses.map((guess) =>
                guess.gameId === payload.gameId
                  ? {
                      ...guess,
                      guessAway: payload.guessAway,
                      guessHome: payload.guessHome,
                      points: null,
                    }
                  : guess,
              ),
            }
          : current,
      );
      queryClient.setQueryData<GamesResponse>(["games"], (current) =>
        current
          ? {
              ...current,
              games: current.games.map((game) =>
                game.id === payload.gameId && game.myGuess
                  ? {
                      ...game,
                      myGuess: {
                        ...game.myGuess,
                        guessAway: payload.guessAway,
                        guessHome: payload.guessHome,
                        points: null,
                      },
                    }
                  : game,
              ),
            }
          : current,
      );
      setGuessToEdit(null);

      return { previousGames, previousGuesses };
    },
    onSuccess: ({ data }, payload) => {
      queryClient.setQueryData<GuessesResponse>(["guesses-me"], (current) =>
        current
          ? {
              guesses: current.guesses.map((guess) =>
                guess.gameId === payload.gameId
                  ? { ...guess, ...data.guess }
                  : guess,
              ),
            }
          : current,
      );
      showToast("Palpite atualizado com sucesso!", "success");
    },
    onError: (err: any, _payload, context) => {
      queryClient.setQueryData(["guesses-me"], context?.previousGuesses);
      queryClient.setQueryData(["games"], context?.previousGames);
      setGuessToEdit(guessToEdit);
      showToast(
        err.response?.data?.message ?? "Não foi possível atualizar o palpite.",
        "error",
      );
    },
  });

  return (
    <Stack gap={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
      >
        <Typography variant="h4">Meus palpites</Typography>

        {hasGuesses && (
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
          title="Carregando palpites"
          description="Buscando seus placares salvos."
        />
      )}
      {error && (
        <Alert severity="error">Não foi possível carregar palpites.</Alert>
      )}
      {!isLoading && data?.guesses.length === 0 && (
        <EmptyState
          emoji="📝"
          title="Nenhum palpite salvo"
          description="Escolha um jogo na tabela e registre seu placar antes do início."
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

      {groupedGuesses.map(([groupName, guesses]) => (
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
            <Stack direction="row" justifyContent="space-between" width="100%">
              <Typography variant="h6">{groupName}</Typography>
              <Typography color="text.secondary">
                {guesses.length} palpite{guesses.length === 1 ? "" : "s"}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <Stack gap={1.5}>
              {guesses.map((guess) => (
                <GuessCard
                  guess={guess}
                  key={guess.id}
                  onEdit={() => setGuessToEdit(guess)}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      <EditGuessDialog
        guess={guessToEdit}
        loading={updateGuess.isPending}
        onClose={() => setGuessToEdit(null)}
        onSave={(guessHome, guessAway) => {
          if (guessToEdit?.gameId) {
            updateGuess.mutate({
              gameId: guessToEdit.gameId,
              guessHome,
              guessAway,
            });
          }
        }}
      />
    </Stack>
  );
}

function GuessCard({ guess, onEdit }: { guess: Guess; onEdit: () => void }) {
  const locked = guess.game ? isGuessLocked(guess.game) : true;
  const result = guessResult(guess);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: "rgba(15, 23, 42, .10)",
        borderRadius: 2,
        boxShadow: "none",
        p: 2,
      }}
    >
      <Stack gap={1}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={2}
        >
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <TeamWithFlag name={guess.game?.teamHome ?? "Casa"} />
            <Typography fontWeight={900}>
              {guess.guessHome} x {guess.guessAway}
            </Typography>
            <TeamWithFlag name={guess.game?.teamAway ?? "Fora"} />
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            {result && <Chip label={result.label} color={result.color} />}
            <Chip
              label={guess.points == null ? "Pendente" : `${guess.points} pts`}
              color={guess.points === 3 ? "primary" : "default"}
            />
            <Button
              size="small"
              variant="outlined"
              disabled={locked}
              onClick={onEdit}
            >
              Editar
            </Button>
          </Stack>
        </Stack>

        {guess.game && (
          <Typography color="text.secondary">
            {statusLabel[guess.game.status]} ·{" "}
            {formatGameDate(guess.game.startsAt)}
            {locked ? " · edição bloqueada" : ""}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

function TeamWithFlag({ name }: { name: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      <TeamFlag name={name} />
      <Typography fontWeight={800}>{name}</Typography>
    </Stack>
  );
}

function guessResult(guess: Guess) {
  const game = guess.game;

  if (
    !game ||
    game.status !== "finished" ||
    game.scoreHome === null ||
    game.scoreAway === null
  ) {
    return null;
  }

  if (
    guess.guessHome === game.scoreHome &&
    guess.guessAway === game.scoreAway
  ) {
    return { color: "success" as const, label: "Cravou o placar" };
  }

  const guessedOutcome = Math.sign(guess.guessHome - guess.guessAway);
  const realOutcome = Math.sign(game.scoreHome - game.scoreAway);

  if (guessedOutcome === realOutcome) {
    return { color: "primary" as const, label: "Acertou o resultado" };
  }

  return { color: "error" as const, label: "Errou" };
}

function EditGuessDialog({
  guess,
  loading,
  onClose,
  onSave,
}: {
  guess: Guess | null;
  loading: boolean;
  onClose: () => void;
  onSave: (home: number, away: number) => void;
}) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const homeScore = inputToScore(home);
  const awayScore = inputToScore(away);
  const canSave =
    homeScore !== null &&
    awayScore !== null &&
    homeScore <= 30 &&
    awayScore <= 30;

  useEffect(() => {
    setHome(scoreToInput(guess?.guessHome));
    setAway(scoreToInput(guess?.guessAway));
  }, [guess]);

  function save() {
    if (homeScore === null || awayScore === null) {
      return;
    }

    onSave(homeScore, awayScore);
  }

  return (
    <Dialog
      open={Boolean(guess)}
      onClose={loading ? undefined : onClose}
      fullWidth
    >
      <DialogTitle>Editar palpite</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            {guess?.game?.teamHome} x {guess?.game?.teamAway}
          </Typography>
          <Stack direction="row" gap={1.5}>
            <TextField
              fullWidth
              label={guess?.game?.teamHome ?? "Casa"}
              placeholder="0"
              value={home}
              disabled={loading}
              inputProps={{
                inputMode: "numeric",
                maxLength: 2,
                pattern: "[0-9]*",
              }}
              onChange={(event) =>
                setHome(normalizeScoreInput(event.target.value))
              }
            />
            <TextField
              fullWidth
              label={guess?.game?.teamAway ?? "Fora"}
              placeholder="0"
              value={away}
              disabled={loading}
              inputProps={{
                inputMode: "numeric",
                maxLength: 2,
                pattern: "[0-9]*",
              }}
              onChange={(event) =>
                setAway(normalizeScoreInput(event.target.value))
              }
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={loading || !canSave}
          onClick={save}
        >
          Salvar palpite
        </Button>
      </DialogActions>
    </Dialog>
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
