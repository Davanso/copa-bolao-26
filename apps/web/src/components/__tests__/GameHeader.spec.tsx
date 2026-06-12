import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import { GameHeader } from "../GameHeader";
import { theme } from "../../styles/theme";
import type { Game } from "../../services/types";

const finishedGame: Game = {
  groupName: "A",
  id: "game-1",
  liveMinute: 87,
  scoreAway: 2,
  scoreHome: 0,
  stage: "Fase de grupos",
  startsAt: "2026-06-11T19:00:00.000Z",
  status: "finished",
  teamAway: "México",
  teamHome: "África do Sul",
};

function renderHeader(game: Game = finishedGame) {
  render(
    <ThemeProvider theme={theme}>
      <GameHeader game={game} />
    </ThemeProvider>,
  );
}

describe("GameHeader", () => {
  it("mostra o placar em bloco central horizontal", () => {
    renderHeader();

    const score = screen.getByLabelText("Resultado 0 a 2");

    expect(within(score).getByText("0")).toBeTruthy();
    expect(within(score).getByText("x")).toBeTruthy();
    expect(within(score).getByText("2")).toBeTruthy();
    expect(screen.getByText("África do Sul")).toBeTruthy();
    expect(screen.getByText("México")).toBeTruthy();
  });

  it("não mostra minutagem do jogo no status", () => {
    renderHeader({ ...finishedGame, status: "live" });

    expect(screen.getByText("Ao vivo")).toBeTruthy();
    expect(screen.queryByText(/87/)).toBeNull();
  });
});
