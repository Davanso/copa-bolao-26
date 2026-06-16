import { afterEach, describe, expect, it } from "vitest";
import { footballDataConfigStatus } from "../football-data.provider.js";

const originalToken = process.env.FOOTBALL_DATA_API_TOKEN;
const originalCompetition = process.env.FOOTBALL_DATA_COMPETITION;
const originalTtl = process.env.FOOTBALL_DATA_CACHE_TTL_MS;

describe("footballDataConfigStatus", () => {
  afterEach(() => {
    process.env.FOOTBALL_DATA_API_TOKEN = originalToken;
    process.env.FOOTBALL_DATA_COMPETITION = originalCompetition;
    process.env.FOOTBALL_DATA_CACHE_TTL_MS = originalTtl;
  });

  it("indica quando a football-data esta sem token", () => {
    delete process.env.FOOTBALL_DATA_API_TOKEN;

    expect(footballDataConfigStatus()).toMatchObject({
      competition: "WC",
      enabled: false,
    });
  });

  it("le configuracao em runtime", () => {
    process.env.FOOTBALL_DATA_API_TOKEN = "token";
    process.env.FOOTBALL_DATA_COMPETITION = "WC";
    process.env.FOOTBALL_DATA_CACHE_TTL_MS = "70000";

    expect(footballDataConfigStatus()).toEqual({
      cacheTtlMs: 70_000,
      competition: "WC",
      enabled: true,
    });
  });
});
