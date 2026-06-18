import type { Group, GroupMember } from "./types";

export function perMemberPrizeValue(group: Group, members: GroupMember[]) {
  if (!members.length) {
    return 0;
  }

  const positiveContributions = members
    .map((member) => member.symbolicContribution ?? 0)
    .filter((amount) => amount > 0);

  if (positiveContributions.length) {
    const firstPositiveContribution = positiveContributions[0];
    const samePositiveContribution = positiveContributions.every(
      (amount) => amount === firstPositiveContribution,
    );

    if (samePositiveContribution) {
      return firstPositiveContribution;
    }
  }

  if (group.symbolicPrizeTotal > 0) {
    return Math.round(group.symbolicPrizeTotal / members.length);
  }

  return 0;
}
