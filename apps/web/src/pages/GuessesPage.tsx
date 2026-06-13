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
import {
  GuessableGamesSection,
  upcomingGamesToday,
} from "../components/GuessableGamesSection";
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
  guessFeedback,
  isGuessLocked,
  statusLabel,
} from "../services/gameHelpers";
import type { Game, Guess } from "../services/types";

const expandedGuessesStorageKey = "bolao.guesses.expandedGroups";

type GamesResponse = {
  games: Game[];
};

export function GuessesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedStage, setSelectedStage] = useState("group");
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    readStringSet(expandedGuessesStorageKey),
  );
  const gamesQuery = useQuery<GamesResponse>({
    queryKey: ["games"],
    queryFn: async () => (await api.get("/games")).data,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
  const games = gamesQuery.data?.games ?? [];
  const todayGames = useMemo(() => upcomingGamesToday(games), [games]);
  const guessedGames = useMemo(
    () => games.filter((game) => game.myGuess),
    [games],
  );
  const stageTabs = useMemo(
    () => buildStageTabs(guessedGames, (game) => game),
    [guessedGames],
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
  const updateGuess = useMutation({
    mutationFn: (payload: {
      gameId: string;
      guessAway: number;
      guessHome: number;
    }) =>
      api.post<{ guess: Guess }>(`/games/${payload.gameId}/guess`, {
        guessAway: payload.guessAway,
        guessHome: payload.guessHome,
      }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<GamesResponse>(["games"], (current) =>
        current
          ? {
              ...current,
              games: current.games.map((game) =>
                game.id === data.guess.gameId
                  ? { ...game, myGuess: data.guess }
                  : game,
              ),
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ["guesses-me"] });
      setEditingGame(null);
      showToast("Palpite atualizado com sucesso!", "success");
    },
    onError: (error: any) => {
      showToast(
        error.response?.data?.message ??
          "Não foi possível atualizar o palpite.",
        "error",
      );
    },
  });

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

  return (
    <Stack gap={3}>
      <Stack>
        <Typography variant="h4">Meus palpites</Typography>
        <Typography color="text.secondary">
          Edite jogos de hoje no topo e acompanhe seus palpites por fase.
        </Typography>
      </Stack>

      {gamesQuery.error && (
        <Alert severity="error">Não foi possível carregar seus palpites.</Alert>
      )}

      <GuessableGamesSection
        title="Próximos jogos de hoje"
        description=""
        emptyTitle="Sem jogos hoje"
        emptyDescription="Não há jogos pendentes para hoje."
        games={todayGames}
        loading={gamesQuery.isLoading}
      />

      <Stack gap={1.5}>
        <Stack>
          <Typography variant="h5">Palpites salvos</Typography>
          <Typography color="text.secondary">
            Organizados por fase e grupo da competição.
          </Typography>
        </Stack>

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

        {!gamesQuery.isLoading && guessedGames.length === 0 && (
          <Alert severity="info">
            Você ainda não salvou nenhum palpite.
          </Alert>
        )}

        {groupedGames.map(([groupName, gamesInGroup]) => (
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
                  {gamesInGroup.length} palpite
                  {gamesInGroup.length === 1 ? "" : "s"}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Stack gap={1.5}>
                {gamesInGroup.map((game) => (
                  <SavedGuessCard
                    game={game}
                    key={game.id}
                    onEdit={() => setEditingGame(game)}
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      <EditGuessDialog
        game={editingGame}
        loading={updateGuess.isPending}
        onClose={() => setEditingGame(null)}
        onSave={(guessHome, guessAway) => {
          if (!editingGame) {
            return;
          }

          updateGuess.mutate({
            gameId: editingGame.id,
            guessAway,
            guessHome,
          });
        }}
      />
    </Stack>
  );
}

function SavedGuessCard({
  game,
  onEdit,
}: {
  game: Game;
  onEdit: () => void;
}) {
  const guess = game.myGuess;
  const locked = isGuessLocked(game);
  const feedback = guessFeedback(game);

  if (!guess) {
    return null;
  }

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
            <TeamWithFlag name={game.teamHome} />
            <Typography fontWeight={900}>
              {guess.guessHome} x {guess.guessAway}
            </Typography>
            <TeamWithFlag name={game.teamAway} />
          </Stack>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
            {feedback && <Chip label={feedback.label} color={feedback.color} />}
            {feedback?.result !== "pending" && guess.points !== null && (
              <Chip
                label={`${guess.points} pontos`}
                color={guess.points > 0 ? "primary" : "default"}
              />
            )}
            {locked ? (
              <Chip
                label="Edição bloqueada"
                color="default"
                variant="outlined"
              />
            ) : (
              <Button size="small" variant="outlined" onClick={onEdit}>
                Editar
              </Button>
            )}
          </Stack>
        </Stack>

        <Typography color="text.secondary">
          {statusLabel[game.status]} · {formatGameDate(game.startsAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function EditGuessDialog({
  game,
  loading,
  onClose,
  onSave,
}: {
  game: Game | null;
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
    setHome(scoreToInput(game?.myGuess?.guessHome));
    setAway(scoreToInput(game?.myGuess?.guessAway));
  }, [game]);

  function save() {
    if (homeScore === null || awayScore === null) {
      return;
    }

    onSave(homeScore, awayScore);
  }

  return (
    <Dialog open={Boolean(game)} onClose={loading ? undefined : onClose} fullWidth>
      <DialogTitle>Editar palpite</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            {game?.teamHome} x {game?.teamAway}
          </Typography>
          <Stack direction="row" gap={1.5}>
            <TextField
              fullWidth
              label={game?.teamHome ?? "Casa"}
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
              label={game?.teamAway ?? "Fora"}
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

function TeamWithFlag({ name }: { name: string }) {
  return (
    <Stack direction="row" alignItems="center" gap={0.75}>
      <TeamFlag name={name} />
      <Typography fontWeight={800}>{name}</Typography>
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

function ExpandMoreIcon() {
  return (
    <SvgIcon fontSize="medium" viewBox="0 0 24 24">
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </SvgIcon>
  );
}
