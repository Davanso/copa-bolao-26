import { describe, expect, it } from "vitest";
import { translateTeam } from "../team-translations.js";

describe("translateTeam", () => {
  it("traduz nomes e siglas vindas da football-data", () => {
    expect(translateTeam("Canada")).toBe("Canadá");
    expect(translateTeam("Mexico")).toBe("México");
    expect(translateTeam("Austria")).toBe("Áustria");
    expect(translateTeam("AUT")).toBe("Áustria");
    expect(translateTeam("Jordan")).toBe("Jordânia");
    expect(translateTeam("JOR")).toBe("Jordânia");
    expect(translateTeam("Ghana")).toBe("Gana");
    expect(translateTeam("GHA")).toBe("Gana");
    expect(translateTeam("Congo DR")).toBe("RD Congo");
    expect(translateTeam("COD")).toBe("RD Congo");
  });
});
