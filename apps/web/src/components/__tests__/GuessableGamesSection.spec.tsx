import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuessableGamesSection } from "../GuessableGamesSection";
import {
  missingGuessGames,
  upcomingGamesToday,
  upcomingReminderGames,
} from "../../services/gameFilters";
import { api } from "../../services/api";
import { theme } from "../../styles/theme";
import type { Game } from "../../services/types";

const showToastMock = vi.fn();

vi.mock("../../hooks/useToast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

function game(overrides: Partial<Game>): Game {
  return {
    groupName: "A",
    id: "game-1",
    liveMinute: null,
    scoreAway: null,
    scoreHome: null,
    stage: "Fase de grupos",
    startsAt: "2026-06-20T19:00:00.000Z",
    status: "scheduled",
    teamAway: "México",
    teamHome: "Brasil",
    ...overrides,
  };
}

function renderSection(games: Game[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  queryClient.setQueryData(["games"], { games });
  queryClient.setQueryData(["guesses-me"], { guesses: [] });

  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <GuessableGamesSection
          title="Próximos jogos"
          description="Faça seus palpites."
          emptyTitle="Vazio"
          emptyDescription="Sem jogos."
          games={games}
          loading={false}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe("GuessableGamesSection helpers", () => {
  it("separa jogos de hoje e dos próximos 3 dias", () => {
    const now = Date.parse("2026-06-13T12:00:00.000Z");
    const today = game({ id: "today", startsAt: "2026-06-13T19:00:00.000Z" });
    const tomorrow = game({
      id: "tomorrow",
      startsAt: "2026-06-14T19:00:00.000Z",
    });
    const farAway = game({
      id: "far-away",
      startsAt: "2026-06-18T19:00:00.000Z",
    });

    expect(upcomingGamesToday([tomorrow, today], now)).toEqual([today]);
    expect(upcomingReminderGames([farAway, tomorrow, today], now)).toEqual([
      today,
      tomorrow,
    ]);
  });

  it("retorna apenas jogos sem palpite", () => {
    const withGuess = game({
      id: "with-guess",
      myGuess: {
        gameId: "with-guess",
        guessAway: 1,
        guessHome: 2,
        id: "guess-1",
        points: null,
      },
    });
    const withoutGuess = game({ id: "without-guess" });

    expect(missingGuessGames([withGuess, withoutGuess])).toEqual([
      withoutGuess,
    ]);
  });
});

describe("GuessableGamesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "post").mockResolvedValue({
      data: {
        guess: {
          gameId: "game-1",
          guessAway: 1,
          guessHome: 2,
          id: "guess-1",
          points: null,
        },
      },
    });
  });

  it("salva palpite direto pelo card", async () => {
    const user = userEvent.setup();

    renderSection([game({ id: "game-1" })]);

    await user.type(screen.getByLabelText("Brasil"), "2");
    await user.type(screen.getByLabelText("México"), "1");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/games/game-1/guess", {
        guessAway: 1,
        guessHome: 2,
      });
    });
    expect(showToastMock).toHaveBeenCalledWith(
      "Palpite salvo com sucesso!",
      "success",
    );
  });
});
