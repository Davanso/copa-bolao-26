export const pendingInviteStorageKey = "bolao.pendingInviteCode";

export function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().toUpperCase();
}

export function buildInviteLink(origin: string, inviteCode: string) {
  return `${origin}/join/${normalizeInviteCode(inviteCode)}`;
}

export function nextPathAfterAuth(
  search: string,
  storedInviteCode: string | null,
) {
  const params = new URLSearchParams(search);
  const inviteCode = params.get("joinCode") ?? storedInviteCode;

  return inviteCode ? `/join/${normalizeInviteCode(inviteCode)}` : "/";
}

export function nextLoginModePath(
  currentSearch: string,
  nextMode: "login" | "register",
) {
  const currentParams = new URLSearchParams(currentSearch);
  const nextParams = new URLSearchParams({ mode: nextMode });
  const joinCode = currentParams.get("joinCode");

  if (joinCode) {
    nextParams.set("joinCode", normalizeInviteCode(joinCode));
  }

  return `/login?${nextParams.toString()}`;
}

export function shouldAutoJoinInvite({
  attempted,
  hasPreview,
  isJoining,
  isLoggedIn,
  joined,
}: {
  attempted: boolean;
  hasPreview: boolean;
  isJoining: boolean;
  isLoggedIn: boolean;
  joined: boolean;
}) {
  return isLoggedIn && hasPreview && !isJoining && !joined && !attempted;
}
