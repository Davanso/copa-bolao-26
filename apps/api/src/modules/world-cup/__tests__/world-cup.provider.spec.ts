import { describe, expect, it } from "vitest";
import { apiLocalDateToBrazilInstant } from "../world-cup.provider.js";
import {
  officialGames,
  officialStartsAtForGame,
} from "../official-schedule.js";

describe("apiLocalDateToBrazilInstant", () => {
  it("converte horário da API para o instante exibido no Brasil", () => {
    const date = apiLocalDateToBrazilInstant({
      day: 11,
      hour: 13,
      minute: 0,
      month: 6,
      offsetHours: 6,
      year: 2026,
    });

    expect(
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date),
    ).toBe("11 de jun. de 2026, 16:00");
  });
});

describe("officialStartsAtForGame", () => {
  it.each(officialGames.map((officialGame) => [officialGame] as const))(
    "retorna o horário oficial para $home x $away",
    (officialGame) => {
      const startsAt = officialStartsAtForGame({
        externalId: "test",
        groupName: officialGame.groupName,
        id: "test",
        lastLiveSyncAt: new Date().toISOString(),
        liveMinute: null,
        scoreAway: null,
        scoreHome: null,
        stage: officialGame.stage,
        startsAt: "2026-01-01T00:00:00.000Z",
        status: "scheduled",
        teamAway: officialGame.away,
        teamHome: officialGame.home,
      });

      expect(startsAt).toBe(brazilToIsoForTest(officialGame.startsAt));
    },
  );

  it("usa a lista oficial como fonte de verdade para fase de grupos", () => {
    const startsAt = officialStartsAtForGame({
      externalId: "test",
      groupName: "A",
      id: "test",
      lastLiveSyncAt: new Date().toISOString(),
      liveMinute: null,
      scoreAway: null,
      scoreHome: null,
      stage: "Fase de grupos",
      startsAt: "2026-06-11T13:00:00.000Z",
      status: "scheduled",
      teamAway: "África do Sul",
      teamHome: "México",
    });

    expect(startsAt).toBe("2026-06-11T19:00:00.000Z");
  });

  it("casa o jogo oficial mesmo se a API inverter mandante e visitante", () => {
    const startsAt = officialStartsAtForGame({
      externalId: "test",
      groupName: "B",
      id: "test",
      lastLiveSyncAt: new Date().toISOString(),
      liveMinute: null,
      scoreAway: null,
      scoreHome: null,
      stage: "Fase de grupos",
      startsAt: "2026-06-12T21:00:00.000Z",
      status: "scheduled",
      teamAway: "Canadá",
      teamHome: "Bósnia",
    });

    expect(startsAt).toBe("2026-06-12T19:00:00.000Z");
  });
});

function brazilToIsoForTest(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, hour + 3, minute),
  ).toISOString();
}
