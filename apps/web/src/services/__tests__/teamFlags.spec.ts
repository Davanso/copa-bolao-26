import { describe, expect, it } from "vitest";
import { flagUrlForTeam } from "../teamFlags";

describe("flagUrlForTeam", () => {
  it("resolve nomes vindos em portugues ou ingles", () => {
    expect(flagUrlForTeam("Brasil")).toContain("/br.png");
    expect(flagUrlForTeam("Brazil")).toContain("/br.png");
    expect(flagUrlForTeam("México")).toContain("/mx.png");
    expect(flagUrlForTeam("Mexico")).toContain("/mx.png");
    expect(flagUrlForTeam("África do Sul")).toContain("/za.png");
    expect(flagUrlForTeam("South Africa")).toContain("/za.png");
    expect(flagUrlForTeam("Canadá")).toContain("/ca.png");
    expect(flagUrlForTeam("Canada")).toContain("/ca.png");
  });

  it("resolve aliases de selecoes com nomes alternativos", () => {
    expect(flagUrlForTeam("Austria")).toContain("/at.png");
    expect(flagUrlForTeam("AUT")).toContain("/at.png");
    expect(flagUrlForTeam("Jordan")).toContain("/jo.png");
    expect(flagUrlForTeam("JOR")).toContain("/jo.png");
    expect(flagUrlForTeam("Gana")).toContain("/gh.png");
    expect(flagUrlForTeam("GHA")).toContain("/gh.png");
    expect(flagUrlForTeam("RD Congo")).toContain("/cd.png");
    expect(flagUrlForTeam("COD")).toContain("/cd.png");
    expect(flagUrlForTeam("Congo DR")).toContain("/cd.png");
  });
});
