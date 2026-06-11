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
  SvgIcon,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { TeamFlag } from "../components/TeamFlag";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
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
    () => buildGuessTabs(data?.guesses ?? []),
    [data?.guesses],
  );
  const selectedTab = stageTabs.find((tab) => tab.id === selectedStage);
  const groupedGuesses = useMemo(
    () => groupGuessesForTab(selectedTab),
    [selectedTab],
  );
  const groupLabels = useMemo(
    () => groupedGuesses.map(([groupName]) => groupName),
    [groupedGuesses],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    readExpandedGroups(),
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
      const previousGames = queryClient.getQueryData<GamesResponse>([
        "games",
        "scheduled",
      ]);

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
      queryClient.setQueryData<GamesResponse>(
        ["games", "scheduled"],
        (current) =>
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
      queryClient.setQueryData(["games", "scheduled"], context?.previousGames);
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
                label={`${tab.label} (${tab.guesses.length})`}
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
            <Stack direction="row" justifyContent="space-between" width="100%">
              <Typography variant="h6">{groupName}</Typography>
              <Typography color="text.secondary">
                {guesses.length} palpite{guesses.length === 1 ? "" : "s"}
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
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

function ExpandMoreIcon() {
  return (
    <SvgIcon fontSize="medium" viewBox="0 0 24 24">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </SvgIcon>
  );
}

function GuessCard({ guess, onEdit }: { guess: Guess; onEdit: () => void }) {
  const locked = guess.game ? isGuessLocked(guess.game) : true;

  return (
    <Paper sx={{ p: 2 }}>
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

type GuessTab = {
  id: string;
  label: string;
  guesses: Guess[];
};

const guessTabsConfig = [
  {
    id: "group",
    label: "Fase de grupos",
    match: (guess: Guess) => guess.game?.stage === "Fase de grupos",
  },
  {
    id: "r32",
    label: "16 avos",
    match: (guess: Guess) => guess.game?.stage === "16 avos de final",
  },
  {
    id: "r16",
    label: "Oitavas",
    match: (guess: Guess) => guess.game?.stage === "Oitavas de final",
  },
  {
    id: "qf",
    label: "Quartas",
    match: (guess: Guess) => guess.game?.stage === "Quartas de final",
  },
  {
    id: "sf",
    label: "Semifinal",
    match: (guess: Guess) => guess.game?.stage === "Semifinal",
  },
  {
    id: "final",
    label: "Final",
    match: (guess: Guess) => guess.game?.stage === "Final",
  },
  {
    id: "third",
    label: "3º lugar",
    match: (guess: Guess) => guess.game?.stage === "Disputa de terceiro lugar",
  },
];

function buildGuessTabs(guesses: Guess[]): GuessTab[] {
  return guessTabsConfig
    .map((stage) => ({
      id: stage.id,
      label: stage.label,
      guesses: guesses.filter(stage.match).sort(compareGuesses),
    }))
    .filter((stage) => stage.guesses.length > 0);
}

function groupGuessesForTab(tab?: GuessTab) {
  if (!tab) {
    return [] as [string, Guess[]][];
  }

  const grouped = new Map<string, Guess[]>();

  for (const guess of tab.guesses) {
    const label =
      tab.id === "group" && guess.game?.groupName
        ? `Grupo ${guess.game.groupName}`
        : (guess.game?.stage ?? "Sem jogo");
    grouped.set(label, [...(grouped.get(label) ?? []), guess]);
  }

  return [...grouped.entries()].sort(([first], [second]) =>
    first.localeCompare(second, "pt-BR", { numeric: true }),
  );
}

function compareGuesses(first: Guess, second: Guess) {
  return (
    Date.parse(first.game?.startsAt ?? "") -
    Date.parse(second.game?.startsAt ?? "")
  );
}

function readExpandedGroups() {
  try {
    const storedGroups = localStorage.getItem(expandedGuessesStorageKey);

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
