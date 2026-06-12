import { afterEach, describe, expect, it } from "vitest";
import { shouldUseScheduleFallback } from "../live-score.routes.js";

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
