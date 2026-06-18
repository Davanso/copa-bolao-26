import { describe, expect, it } from "vitest";
import { perMemberPrizeValue } from "../symbolicPrize";
import type { Group, GroupMember } from "../types";

const group: Group = {
  id: "group-1",
  inviteCode: "ABC123",
  name: "Grupo",
  ownerUserId: "user-1",
  symbolicPrizeTotal: 200,
};

function member(userId: string, symbolicContribution: number): GroupMember {
  return {
    groupId: "group-1",
    guessesCount: 0,
    id: `member-${userId}`,
    joinedAt: "2026-06-18T12:00:00.000Z",
    role: "member",
    symbolicContribution,
    user: {
      id: userId,
      role: "user",
      username: userId,
    },
    userId,
  };
}

describe("perMemberPrizeValue", () => {
  it("mantem valor por pessoa quando novo membro entra com zero", () => {
    expect(
      perMemberPrizeValue(group, [
        member("user-1", 100),
        member("user-2", 100),
        member("user-3", 0),
      ]),
    ).toBe(100);
  });

  it("usa total dividido por membros como fallback", () => {
    expect(
      perMemberPrizeValue(group, [member("user-1", 40), member("user-2", 60)]),
    ).toBe(100);
  });

  it("retorna zero quando grupo nao tem valor", () => {
    expect(
      perMemberPrizeValue(
        {
          ...group,
          symbolicPrizeTotal: 0,
        },
        [member("user-1", 0)],
      ),
    ).toBe(0);
  });
});
