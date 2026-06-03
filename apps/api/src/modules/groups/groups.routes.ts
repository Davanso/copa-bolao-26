import { Router } from "express";
import { inviteCode } from "../../db/memory.js";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../shared/auth/auth.js";
import { HttpError } from "../../shared/errors/http.js";
import {
  groupSchema,
  joinGroupSchema,
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
      group: { include: { prizeRules: { orderBy: { position: "asc" } } } },
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
  const members = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    include: {
      user: {
        select: { id: true, username: true, role: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  res.json({ group, members });
});

groupsRouter.get("/:groupId/ranking", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  await ensureMember(groupId, req.user!.id);
  const members = await prisma.groupMember.findMany({ where: { groupId } });
  const userIds = members.map((member) => member.userId);

  res.json({ ranking: await buildRanking(userIds) });
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

groupsRouter.put("/:groupId/symbolic-prize", requireAuth, async (req, res) => {
  const groupId = String(req.params.groupId);
  const body = symbolicPrizeSchema.parse(req.body);
  await ensureOwner(groupId, req.user!.id);

  const updatedGroup = await prisma.$transaction(async (transaction) => {
    await transaction.groupPrizeRule.deleteMany({ where: { groupId } });
    await transaction.bolaoGroup.update({
      where: { id: groupId },
      data: { symbolicPrizeTotal: body.total },
    });

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

  res.json({ group: updatedGroup });
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

    await prisma.groupMember.delete({ where: { id: member.id } });
    res.status(204).send();
  },
);

async function ensureMember(groupId: string, userId: string) {
  const group = await prisma.bolaoGroup.findUnique({
    where: { id: groupId },
    include: { prizeRules: { orderBy: { position: "asc" } } },
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
