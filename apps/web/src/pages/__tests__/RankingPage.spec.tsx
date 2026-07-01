import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { describe, expect, it, vi } from "vitest";
import { RankingPage } from "../RankingPage";
import { theme } from "../../styles/theme";

vi.mock("../../hooks/useAppQueries", () => ({
  useGroupRankingQuery: () => ({
    data: {
      ranking: [
        {
          avatarUrl: null,
          exactScores: 1,
          guessesCount: 2,
          pointsByStage: [
            {
              exactScores: 0,
              points: 1,
              scoredGuesses: 1,
              stage: "Fase de grupos",
            },
            {
              exactScores: 1,
              points: 12,
              scoredGuesses: 1,
              stage: "Final",
            },
          ],
          scoredGuesses: 2,
          totalPoints: 13,
          userId: "user-1",
          username: "Ana",
        },
      ],
    },
    isLoading: false,
  }),
  useGroupsMeQuery: () => ({
    data: {
      groups: [
        {
          id: "group-1",
          inviteCode: "ABC123",
          name: "Turma",
          ownerUserId: "owner-1",
          prizeRules: [],
          scoringRules: [],
          symbolicPrizeTotal: 0,
        },
      ],
    },
    isLoading: false,
  }),
}));

function renderRankingPage() {
  render(
    <ThemeProvider theme={theme}>
      <RankingPage />
    </ThemeProvider>,
  );
}

describe("RankingPage", () => {
  it("mostra detalhe de pontos por fase no ranking", async () => {
    const user = userEvent.setup();
    renderRankingPage();

    await user.click(
      screen.getByRole("button", {
        name: "Ver detalhes dos pontos de Ana",
      }),
    );

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Detalhe dos pontos de Ana")).toBeTruthy();
    expect(within(dialog).getByText("Fase de grupos")).toBeTruthy();
    expect(within(dialog).getByText("Final")).toBeTruthy();
    expect(within(dialog).getByText("1 ponto")).toBeTruthy();
    expect(within(dialog).getByText("12 pontos")).toBeTruthy();
  });
});
