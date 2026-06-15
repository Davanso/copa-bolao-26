import { describe, expect, it } from "vitest";
import {
  inputToScore,
  isValidScore,
  normalizeScoreInput,
  scoreToInput,
} from "../scoreInput";

describe("scoreInput", () => {
  it("mantem apenas dois digitos numericos no input", () => {
    expect(normalizeScoreInput("a12b3")).toBe("12");
  });

  it("converte valores vazios e invalidos com seguranca", () => {
    expect(scoreToInput(null)).toBe("");
    expect(scoreToInput(3)).toBe("3");
    expect(inputToScore("")).toBeNull();
    expect(inputToScore("2")).toBe(2);
  });

  it("limita placares validos entre 0 e 30", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(30)).toBe(true);
    expect(isValidScore(null)).toBe(false);
    expect(isValidScore(31)).toBe(false);
  });
});
