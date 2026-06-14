import { afterEach, describe, expect, it } from "vitest";
import {
  liveGamesFromWorldCup,
  shouldUseScheduleFallback,
} from "../live-score.routes.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalFallback = process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK;

describe("shouldUseScheduleFallback", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK = originalFallback;
  });

  it("mantém fallback por horário em desenvolvimento", () => {
    process.env.NODE_ENV = "development";
    delete process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK;

    expect(shouldUseScheduleFallback()).toBe(true);
  });

  it("desliga fallback por horário em produção", () => {
    process.env.NODE_ENV = "production";
    delete process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK;

    expect(shouldUseScheduleFallback()).toBe(false);
  });

  it("permite habilitar fallback por variável de ambiente", () => {
    process.env.NODE_ENV = "production";
    process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK = "true";

    expect(shouldUseScheduleFallback()).toBe(true);
  });
});

describe("liveGamesFromWorldCup", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK = originalFallback;
  });

  it("mostra jogos marcados como live mesmo sem fallback por horário", () => {
    process.env.NODE_ENV = "production";
    delete process.env.LIVE_SCORE_ENABLE_SCHEDULE_FALLBACK;

    const liveGames = liveGamesFromWorldCup([
      {
        startsAt: "2026-06-14T19:00:00.000Z",
        status: "live",
      },
      {
        startsAt: "2026-06-14T19:00:00.000Z",
        status: "scheduled",
      },
    ]);

    expect(liveGames).toHaveLength(1);
    expect(liveGames[0]).toMatchObject({
      events: [],
      status: "live",
    });
  });
});
