import {
  buildInviteLink,
  nextLoginModePath,
  nextPathAfterAuth,
  normalizeInviteCode,
  shouldAutoJoinInvite,
} from "./inviteFlow";

describe("inviteFlow", () => {
  it("normaliza código de convite antes de usar", () => {
    expect(normalizeInviteCode(" abc123 ")).toBe("ABC123");
  });

  it("monta link público de convite com código normalizado", () => {
    expect(buildInviteLink("https://app.test", " abc123 ")).toBe(
      "https://app.test/join/ABC123",
    );
  });

  it("redireciona para o convite após login quando joinCode vem na URL", () => {
    expect(nextPathAfterAuth("?mode=register&joinCode=abc123", null)).toBe(
      "/join/ABC123",
    );
  });

  it("redireciona para convite salvo quando a URL não traz joinCode", () => {
    expect(nextPathAfterAuth("?mode=login", "xyz789")).toBe("/join/XYZ789");
  });

  it("redireciona para início quando não existe convite pendente", () => {
    expect(nextPathAfterAuth("?mode=login", null)).toBe("/");
  });

  it("preserva joinCode ao alternar entre login e cadastro", () => {
    expect(nextLoginModePath("?mode=login&joinCode=abc123", "register")).toBe(
      "/login?mode=register&joinCode=ABC123",
    );
  });

  it("permite auto-join somente quando usuário logado tem preview pronto", () => {
    expect(
      shouldAutoJoinInvite({
        attempted: false,
        hasPreview: true,
        isJoining: false,
        isLoggedIn: true,
        joined: false,
      }),
    ).toBe(true);
  });

  it.each([
    {
      attempted: true,
      hasPreview: true,
      isJoining: false,
      isLoggedIn: true,
      joined: false,
    },
    {
      attempted: false,
      hasPreview: false,
      isJoining: false,
      isLoggedIn: true,
      joined: false,
    },
    {
      attempted: false,
      hasPreview: true,
      isJoining: true,
      isLoggedIn: true,
      joined: false,
    },
    {
      attempted: false,
      hasPreview: true,
      isJoining: false,
      isLoggedIn: false,
      joined: false,
    },
    {
      attempted: false,
      hasPreview: true,
      isJoining: false,
      isLoggedIn: true,
      joined: true,
    },
  ])("bloqueia auto-join quando estado é %#", (state) => {
    expect(shouldAutoJoinInvite(state)).toBe(false);
  });
});
