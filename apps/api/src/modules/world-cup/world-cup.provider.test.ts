import { describe, expect, it } from "vitest";
import { apiLocalDateToBrazilInstant } from "./world-cup.provider.js";

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
