import { describe, expect, it } from "vitest";
import { perMemberPrizeValue } from "../groups.routes.js";

describe("perMemberPrizeValue", () => {
  it("mantem o valor por pessoa quando novo membro ainda esta zerado", () => {
    expect(perMemberPrizeValue(200, [100, 100, 0])).toBe(100);
  });

  it("usa total dividido por membros como fallback para dados legados", () => {
    expect(perMemberPrizeValue(200, [40, 60])).toBe(100);
  });

  it("retorna zero quando grupo nao tem valor configurado", () => {
    expect(perMemberPrizeValue(0, [0, 0])).toBe(0);
  });
});
