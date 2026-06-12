import { describe, expect, it } from "vitest";
import { flagUrlForTeam } from "../teamFlags";

describe("flagUrlForTeam", () => {
  it("resolve nomes vindos em português ou inglês", () => {
    expect(flagUrlForTeam("Brasil")).toContain("/br.png");
    expect(flagUrlForTeam("Brazil")).toContain("/br.png");
    expect(flagUrlForTeam("México")).toContain("/mx.png");
    expect(flagUrlForTeam("Mexico")).toContain("/mx.png");
    expect(flagUrlForTeam("África do Sul")).toContain("/za.png");
    expect(flagUrlForTeam("South Africa")).toContain("/za.png");
    expect(flagUrlForTeam("Canadá")).toContain("/ca.png");
    expect(flagUrlForTeam("Canada")).toContain("/ca.png");
  });
});
