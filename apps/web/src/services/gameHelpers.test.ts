import { describe, expect, it } from "vitest";
import { formatGameDate } from "./gameHelpers";

describe("formatGameDate", () => {
  it("formata sempre no fuso de São Paulo", () => {
    expect(formatGameDate("2026-06-11T19:00:00.000Z")).toBe(
      "11 de jun. de 2026, 16:00",
    );
  });
});
