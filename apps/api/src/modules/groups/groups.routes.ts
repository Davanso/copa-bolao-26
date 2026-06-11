import { Router } from "express";
import { inviteCode } from "../../db/memory.js";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";
import { HttpError } from "../../shared/errors/http.js";
import {
  groupSchema,
  joinGroupSchema,
  scoringRulesSchema,
  symbolicPrizeSchema,
} from "../../shared/validation/schemas.js";
import { buildRanking } from "../ranking/ranking.routes.js";

export const groupsRouter = Router();

groupsRouter.post("/", requireAuth, async (req, res) => {
  const body = groupSchema.parse(req.body);
  const group = await prisma.bolaoGroup.create({
    data: {
      name: body.name,
      description: body.description,
      ownerUserId: req.user!.id,
      inviteCode: await generateUniqueInviteCode(),
      members: {
        create: {
          userId: req.user!.id,
          role: "owner",
        },
      },
    },
  });

  res.status(201).json({ group });
});

groupsRouter.get("/me", requireAuth, async (req, res) => {
  const memberships = await prisma.groupMember.findMany({
    where: { userId: req.user!.id },
    include: {
      group: {
        include: {
          prizeRules: { orderBy: { position: "asc" } },
          scoringRules: { orderBy: { stage: "asc" } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
  const groups = memberships.map((membership) => ({
    ...membership.group,
    memberRole: membership.role,
  }));

  res.json({ groups });
});

groupsRouter.post("/join", requireAuth, async (req, res) => {
  const body = joinGroupSchema.parse(req.body);
  const normalizedInviteCode = body.inviteCode.trim().toUpperCase();
  const group = await prisma.bolaoGroup.findUnique({
    where: { inviteCode: normalizedInviteCode },
  });

  if (!group) {
    throw new HttpError(404, "Código de convite inválido");
  }

  if (group.ownerUserId === req.user!.id) {
    throw new HttpError(403, "Você não pode entrar no seu próprio grupo");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: req.user!.id } },
  });

  if (existingMember) {
    throw new HttpError(409, "Você já participa deste grupo");
  }

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: req.user!.id,
      role: "member",
    },
  });

  res.status(201).json({ group });
});

groupsRouter.get("/:groupId", requireAuth, async (req, res) => {
  const { group } = await ensureMember(
    String(req.params.groupId),
    req.user!.id,
  );
  const rawMembers = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    include: {
      user: {
        select: { id: true, username: true, role: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
  const guessesByUser = await prisma.guess.groupBy({
    by: ["userId"],
    where: { userId: { in: rawMembers.map((member) => member.userId) } },
    _count: { _all: true },
  });
  const guessesCountByUser = new Map(
    guessesByUser.map((item) => [item.userId, item._count._all]),
  );
  const members = rawMembers.map((member) => ({
    ...member,
    guessesCount: guessesCountByUser.get(member.userId) ?? 0,
  }));

  res.json({ group, members });
});

groupsRouter.get("/:groupId/ranking", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  await ensureMember(groupId, req.user!.id);
  const members = await prisma.groupMember.findMany({ where: { groupId } });
  const userIds = members.map((member) => member.userId);

  res.json({ ranking: await buildRanking(userIds, groupId) });
});

groupsRouter.post(
  "/:groupId/invite-code/regenerate",
  requireAuth,
  async (req, res) => {
    const { group } = await ensureOwner(
      String(req.params.groupId),
      req.user!.id,
    );
    const updatedGroup = await prisma.bolaoGroup.update({
      where: { id: group.id },
      data: { inviteCode: await generateUniqueInviteCode(group.inviteCode) },
    });

    res.json({ group: updatedGroup });
  },
);

groupsRouter.put("/:groupId", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  const body = groupSchema.parse(req.body);
  await ensureOwner(groupId, req.user!.id);

  const group = await prisma.bolaoGroup.update({
    where: { id: groupId },
    data: {
      name: body.name,
      description: body.description,
    },
    include: {
      prizeRules: { orderBy: { position: "asc" } },
      scoringRules: { orderBy: { stage: "asc" } },
    },
  });

  res.json({ group });
});

groupsRouter.put("/:groupId/symbolic-prize", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  const body = symbolicPrizeSchema.parse(req.body);
  await ensureOwner(groupId, req.user!.id);

  const members = await prisma.groupMember.findMany({ where: { groupId } });
  const memberUserIds = new Set(members.map((member) => member.userId));
  const total = body.contributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0,
  );

  for (const contribution of body.contributions) {
    if (!memberUserIds.has(contribution.userId)) {
      throw new HttpError(400, "Participante inválido para este grupo");
    }
  }

  const updatedGroup = await prisma.$transaction(async (transaction) => {
    await transaction.groupPrizeRule.deleteMany({ where: { groupId } });
    await transaction.bolaoGroup.update({
      where: { id: groupId },
      data: { symbolicPrizeTotal: total },
    });
    await Promise.all(
      members.map((member) => {
        const contribution = body.contributions.find(
          (item) => item.userId === member.userId,
        );

        return transaction.groupMember.update({
          where: { id: member.id },
          data: { symbolicContribution: contribution?.amount ?? 0 },
        });
      }),
    );

    if (body.rules.length) {
      await transaction.groupPrizeRule.createMany({
        data: body.rules.map((rule) => ({
          groupId,
          position: rule.position,
          percentage: rule.percentage,
        })),
      });
    }

    return transaction.bolaoGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: { prizeRules: { orderBy: { position: "asc" } } },
    });
  });
  const rawUpdatedMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, username: true, role: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
  const guessesByUser = await prisma.guess.groupBy({
    by: ["userId"],
    where: {
      userId: { in: rawUpdatedMembers.map((member) => member.userId) },
    },
    _count: { _all: true },
  });
  const guessesCountByUser = new Map(
    guessesByUser.map((item) => [item.userId, item._count._all]),
  );
  const updatedMembers = rawUpdatedMembers.map((member) => ({
    ...member,
    guessesCount: guessesCountByUser.get(member.userId) ?? 0,
  }));

  res.json({ group: updatedGroup, members: updatedMembers });
});

groupsRouter.put("/:groupId/scoring-rules", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  const body = scoringRulesSchema.parse(req.body);
  await ensureOwner(groupId, req.user!.id);

  const group = await prisma.$transaction(async (transaction) => {
    await transaction.groupScoringRule.deleteMany({ where: { groupId } });

    await transaction.groupScoringRule.createMany({
      data: body.rules.map((rule) => ({
        exactPoints: rule.exactPoints,
        groupId,
        resultPoints: rule.resultPoints,
        stage: rule.stage,
      })),
    });

    return transaction.bolaoGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        prizeRules: { orderBy: { position: "asc" } },
        scoringRules: { orderBy: { stage: "asc" } },
      },
    });
  });

  res.json({ group });
});

groupsRouter.delete("/:groupId", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  await ensureOwner(groupId, req.user!.id);

  await prisma.bolaoGroup.delete({ where: { id: groupId } });
  res.status(204).send();
});

groupsRouter.delete(
  "/:groupId/members/:userId",
  requireAuth,
  async (req, res) => {
    const groupId = String(req.params.groupId);
    const userId = String(req.params.userId);
    await ensureOwner(groupId, req.user!.id);

    if (userId === req.user!.id) {
      throw new HttpError(403, "O dono não pode remover a si mesmo");
    }

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member || member.role === "owner") {
      throw new HttpError(404, "Membro não encontrado");
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.groupMember.delete({ where: { id: member.id } });
      const remainingMembers = await transaction.groupMember.findMany({
        where: { groupId },
      });
      const total = remainingMembers.reduce(
        (sum, groupMember) => sum + groupMember.symbolicContribution,
        0,
      );

      await transaction.bolaoGroup.update({
        where: { id: groupId },
        data: { symbolicPrizeTotal: total },
      });
    });
    res.status(204).send();
  },
);

async function ensureMember(groupId: string, userId: string) {
  const group = await prisma.bolaoGroup.findUnique({
    where: { id: groupId },
    include: {
      prizeRules: { orderBy: { position: "asc" } },
      scoringRules: { orderBy: { stage: "asc" } },
    },
  });

  if (!group) {
    throw new HttpError(404, "Grupo não encontrado");
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member) {
    throw new HttpError(403, "Você não participa deste grupo");
  }

  return { group, member };
}

async function ensureOwner(groupId: string, userId: string) {
  const data = await ensureMember(groupId, userId);

  if (data.group.ownerUserId !== userId || data.member.role !== "owner") {
    throw new HttpError(403, "Apenas quem criou o grupo pode fazer isso");
  }

  return data;
}

async function generateUniqueInviteCode(previousCode?: string) {
  let nextCode = inviteCode();

  while (
    nextCode === previousCode ||
    (await prisma.bolaoGroup.findUnique({ where: { inviteCode: nextCode } }))
  ) {
    nextCode = inviteCode();
  }

  return nextCode;
}
