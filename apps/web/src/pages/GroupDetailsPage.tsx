import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import {
  compressImageToDataUrl,
  ImageUploadError,
} from "../services/imageUpload";
import type {
  Group,
  GroupMember,
  PrizeRule,
  ScoringRule,
} from "../services/types";

type GroupDetails = {
  group: Group;
  members: GroupMember[];
};

type GroupsMe = {
  groups: Group[];
};

const roleLabel = { owner: "Dono", member: "Membro" };
const unsavedGroupNameStorageKey = "bolao.unsaved.groupName";
const unsavedPrizeStorageKey = "bolao.unsaved.prize";
const unsavedScoringStorageKey = "bolao.unsaved.scoring";
const defaultScoringRules: ScoringRule[] = [
  { stage: "Fase de grupos", exactPoints: 3, resultPoints: 1 },
  { stage: "16 avos de final", exactPoints: 4, resultPoints: 2 },
  { stage: "Oitavas de final", exactPoints: 5, resultPoints: 2 },
  { stage: "Quartas de final", exactPoints: 6, resultPoints: 3 },
  { stage: "Semifinal", exactPoints: 8, resultPoints: 4 },
  { stage: "Disputa de terceiro lugar", exactPoints: 8, resultPoints: 4 },
  { stage: "Final", exactPoints: 10, resultPoints: 5 },
];
const scoringRuleTabs = [
  {
    id: "group",
    label: "Fase de grupos",
    stages: ["Fase de grupos"],
  },
  {
    id: "early-knockout",
    label: "Início do mata-mata",
    stages: ["16 avos de final", "Oitavas de final", "Quartas de final"],
  },
  {
    id: "finals",
    label: "Finais",
    stages: ["Semifinal", "Disputa de terceiro lugar", "Final"],
  },
];
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function apiMessage(error: unknown, fallback: string) {
  return (error as any)?.response?.data?.message ?? fallback;
}

function memberContributions(members: GroupMember[]) {
  return Object.fromEntries(
    members.map((member) => [
      member.userId,
      String(member.symbolicContribution ?? 0),
    ]),
  );
}

function updateGroupInList(
  queryClient: QueryClient,
  groupId: string | undefined,
  groupPatch: Partial<Group>,
) {
  if (!groupId) {
    return;
  }

  queryClient.setQueryData<GroupsMe>(["groups-me"], (current) => {
    if (!current) {
      return current;
    }

    return {
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, ...groupPatch } : group,
      ),
    };
  });
}

export function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [groupImageUrl, setGroupImageUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
    null,
  );
  const groupQueryKey = ["group", groupId] as const;
  const groupsMeQueryKey = ["groups-me"] as const;
  const groupRankingQueryKey = ["group-ranking", groupId] as const;
  const { data, error, isLoading } = useQuery<GroupDetails>({
    queryKey: groupQueryKey,
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data,
    enabled: Boolean(groupId),
  });
  const savePrize = useMutation({
    mutationFn: (payload: {
      contributions: { userId: string; amount: number }[];
      rules: PrizeRule[];
    }) => api.put<GroupDetails>(`/groups/${groupId}/symbolic-prize`, payload),
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: groupQueryKey }),
        queryClient.cancelQueries({ queryKey: groupsMeQueryKey }),
      ]);

      const previousGroup =
        queryClient.getQueryData<GroupDetails>(groupQueryKey);
      const previousGroups =
        queryClient.getQueryData<GroupsMe>(groupsMeQueryKey);
      const total = payload.contributions.reduce(
        (sum, contribution) => sum + contribution.amount,
        0,
      );

      queryClient.setQueryData<GroupDetails>(groupQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          group: {
            ...current.group,
            prizeRules: payload.rules,
            symbolicPrizeTotal: total,
          },
          members: current.members.map((member) => ({
            ...member,
            symbolicContribution:
              payload.contributions.find(
                (contribution) => contribution.userId === member.userId,
              )?.amount ?? 0,
          })),
        };
      });
      updateGroupInList(queryClient, groupId, {
        prizeRules: payload.rules,
        symbolicPrizeTotal: total,
      });

      return { previousGroup, previousGroups };
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData<GroupDetails>(groupQueryKey, data);
      updateGroupInList(queryClient, groupId, data.group);
      showToast("Premiação simbólica salva.", "success");
      queryClient.invalidateQueries({ queryKey: groupRankingQueryKey });
    },
    onError: (err, _payload, context) => {
      queryClient.setQueryData(groupQueryKey, context?.previousGroup);
      queryClient.setQueryData(groupsMeQueryKey, context?.previousGroups);
      showToast(
        apiMessage(err, "Não foi possível salvar a premiação."),
        "error",
      );
    },
  });
  const saveScoringRules = useMutation({
    mutationFn: (rules: ScoringRule[]) =>
      api.put<{ group: Group }>(`/groups/${groupId}/scoring-rules`, {
        rules,
      }),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<GroupDetails>(groupQueryKey, (current) =>
        current
          ? { ...current, group: { ...current.group, ...data.group } }
          : current,
      );
      updateGroupInList(queryClient, groupId, data.group);
      showToast("Regras de pontuação salvas.", "success");
      queryClient.invalidateQueries({ queryKey: groupRankingQueryKey });
    },
    onError: (err) =>
      showToast(
        apiMessage(err, "Não foi possível salvar as regras de pontuação."),
        "error",
      ),
  });
  const updateGroup = useMutation({
    mutationFn: () =>
      api.put<{ group: Group }>(`/groups/${groupId}`, {
        description: data?.group.description,
        imageUrl: groupImageUrl,
        name: groupName.trim(),
      }),
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: groupQueryKey }),
        queryClient.cancelQueries({ queryKey: groupsMeQueryKey }),
      ]);

      const previousGroup =
        queryClient.getQueryData<GroupDetails>(groupQueryKey);
      const previousGroups =
        queryClient.getQueryData<GroupsMe>(groupsMeQueryKey);
      const name = groupName.trim();
      const imageUrl = groupImageUrl || null;

      queryClient.setQueryData<GroupDetails>(groupQueryKey, (current) =>
        current
          ? { ...current, group: { ...current.group, imageUrl, name } }
          : current,
      );
      updateGroupInList(queryClient, groupId, { imageUrl, name });
      setEditGroupOpen(false);

      return { previousGroup, previousGroups };
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData<GroupDetails>(groupQueryKey, (current) =>
        current
          ? { ...current, group: { ...current.group, ...data.group } }
          : current,
      );
      updateGroupInList(queryClient, groupId, data.group);
      setEditGroupOpen(false);
      showToast("Nome do grupo atualizado.", "success");
    },
    onError: (err, _variables, context) => {
      queryClient.setQueryData(groupQueryKey, context?.previousGroup);
      queryClient.setQueryData(groupsMeQueryKey, context?.previousGroups);
      setEditGroupOpen(true);
      showToast(apiMessage(err, "Não foi possível editar o grupo."), "error");
    },
  });
  const deleteGroup = useMutation({
    mutationFn: () => api.delete(`/groups/${groupId}`),
    onSuccess: () => {
      showToast("Grupo deletado com sucesso.", "success");
      queryClient.removeQueries({ queryKey: groupQueryKey });
      queryClient.setQueryData<GroupsMe>(groupsMeQueryKey, (current) =>
        current
          ? {
              groups: current.groups.filter((group) => group.id !== groupId),
            }
          : current,
      );
      navigate("/groups", { replace: true });
    },
    onError: (err) =>
      showToast(apiMessage(err, "Não foi possível deletar o grupo."), "error"),
  });
  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/groups/${groupId}/members/${userId}`),
    onMutate: async (userId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: groupQueryKey }),
        queryClient.cancelQueries({ queryKey: groupRankingQueryKey }),
      ]);

      const previousGroup =
        queryClient.getQueryData<GroupDetails>(groupQueryKey);

      queryClient.setQueryData<GroupDetails>(groupQueryKey, (current) => {
        if (!current) {
          return current;
        }

        const members = current.members.filter(
          (member) => member.userId !== userId,
        );
        const total = members.reduce(
          (sum, member) => sum + (member.symbolicContribution ?? 0),
          0,
        );

        return {
          group: { ...current.group, symbolicPrizeTotal: total },
          members,
        };
      });

      return { previousGroup };
    },
    onSuccess: () => {
      setMemberToRemove(null);
      showToast("Participante removido do grupo.", "success");
      queryClient.invalidateQueries({ queryKey: groupRankingQueryKey });
    },
    onError: (err, _userId, context) => {
      queryClient.setQueryData(groupQueryKey, context?.previousGroup);
      showToast(
        apiMessage(err, "Não foi possível remover o participante."),
        "error",
      );
    },
  });

  const isOwner = data?.group.ownerUserId === user?.id;

  useEffect(() => {
    setGroupName(data?.group.name ?? "");
    setGroupImageUrl(data?.group.imageUrl ?? "");
  }, [data?.group.imageUrl, data?.group.name]);

  useEffect(() => {
    const dirty = Boolean(
      data &&
      (groupName.trim() !== data.group.name ||
        groupImageUrl !== (data.group.imageUrl ?? "")),
    );
    localStorage.setItem(unsavedGroupNameStorageKey, dirty ? "true" : "false");

    return () => localStorage.setItem(unsavedGroupNameStorageKey, "false");
  }, [data, groupImageUrl, groupName]);

  async function handleGroupImage(file?: File) {
    if (!file) {
      return;
    }

    try {
      setGroupImageUrl(await compressImageToDataUrl(file));
    } catch (error) {
      showToast(
        error instanceof ImageUploadError
          ? error.message
          : "Não foi possível preparar a imagem.",
        "error",
      );
    }
  }

  return (
    <Stack gap={2.5}>
      <Button
        sx={{ alignSelf: "flex-start" }}
        onClick={() => navigate("/groups")}
      >
        ← Voltar para grupos
      </Button>

      {isLoading && (
        <LoadingState
          title="Carregando grupo"
          description="Buscando participantes e detalhes do convite."
        />
      )}
      {error && (
        <Alert severity="error">Não foi possível carregar este grupo.</Alert>
      )}

      {data && (
        <>
          <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack gap={1.5}>
              <Chip
                label="Grupo de bolão"
                color="secondary"
                sx={{ alignSelf: "flex-start" }}
              />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "flex-start" }}
                justifyContent="space-between"
                gap={2}
              >
                <Stack direction="row" alignItems="center" gap={2}>
                  <Avatar
                    src={data.group.imageUrl ?? undefined}
                    variant="rounded"
                    sx={{
                      bgcolor: "primary.main",
                      borderRadius: 3,
                      color: "primary.contrastText",
                      fontSize: 24,
                      fontWeight: 950,
                      height: 72,
                      width: 72,
                    }}
                  >
                    {data.group.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Typography variant="h4">{data.group.name}</Typography>
                </Stack>
                {isOwner && (
                  <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                    <Button
                      variant="outlined"
                      disabled={updateGroup.isPending}
                      onClick={() => setEditGroupOpen(true)}
                    >
                      Editar grupo
                    </Button>
                    <Button
                      color="error"
                      variant="outlined"
                      disabled={deleteGroup.isPending}
                      onClick={() => setDeleteGroupOpen(true)}
                    >
                      Deletar grupo
                    </Button>
                  </Stack>
                )}
              </Stack>
              <Typography color="text.secondary">
                Código de convite: <strong>{data.group.inviteCode}</strong>
              </Typography>
            </Stack>
          </Paper>

          <PrizeCard
            group={data.group}
            members={data.members}
            isOwner={Boolean(isOwner)}
            saving={savePrize.isPending}
            onSave={(payload) => savePrize.mutate(payload)}
          />

          <ScoringRulesCard
            group={data.group}
            isOwner={Boolean(isOwner)}
            saving={saveScoringRules.isPending}
            onSave={(rules) => saveScoringRules.mutate(rules)}
          />

          <Grid container spacing={2}>
            {data.members.map((member) => (
              <Grid item xs={12} md={6} key={member.id}>
                <Paper sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack>
                      <Stack direction="row" alignItems="center" gap={1.5}>
                        <Avatar src={member.user.avatarUrl ?? undefined}>
                          {member.user.username.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {member.user.username}
                          </Typography>
                          <Typography color="text.secondary">
                            Participante
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {member.guessesCount} palpite
                            {member.guessesCount === 1 ? "" : "s"} feito
                            {member.guessesCount === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Chip label={roleLabel[member.role]} />
                      {isOwner && member.role !== "owner" && (
                        <Button
                          color="error"
                          size="small"
                          variant="outlined"
                          disabled={removeMember.isPending}
                          onClick={() => setMemberToRemove(member)}
                        >
                          Remover
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <ConfirmDialog
            open={deleteGroupOpen}
            title="Deletar grupo?"
            confirmLabel="Sim, deletar grupo"
            loading={deleteGroup.isPending}
            onClose={() => setDeleteGroupOpen(false)}
            onConfirm={() => deleteGroup.mutate()}
          >
            Você está prestes a deletar o grupo{" "}
            <strong>{data.group.name}</strong>. Essa ação remove participantes,
            premiação simbólica e não pode ser desfeita.
          </ConfirmDialog>

          <ConfirmDialog
            open={Boolean(memberToRemove)}
            title="Remover participante?"
            confirmLabel="Remover participante"
            loading={removeMember.isPending}
            onClose={() => setMemberToRemove(null)}
            onConfirm={() => {
              if (memberToRemove) {
                removeMember.mutate(memberToRemove.userId);
              }
            }}
          >
            {memberToRemove && (
              <>
                Remover <strong>{memberToRemove.user.username}</strong> deste
                grupo? Ele deixa de aparecer no ranking e na premiação
                simbólica.
              </>
            )}
          </ConfirmDialog>

          <Dialog
            open={editGroupOpen}
            onClose={
              updateGroup.isPending ? undefined : () => setEditGroupOpen(false)
            }
            fullWidth
          >
            <DialogTitle>Editar grupo</DialogTitle>
            <DialogContent>
              <Stack gap={2} sx={{ pt: 1 }}>
                <Typography color="text.secondary">
                  Escolha um nome claro e uma foto para sua turma encontrar o
                  grupo com facilidade.
                </Typography>
                <Stack direction="row" alignItems="center" gap={2}>
                  <Avatar
                    src={groupImageUrl || undefined}
                    variant="rounded"
                    sx={{
                      bgcolor: "primary.main",
                      borderRadius: 3,
                      height: 72,
                      width: 72,
                    }}
                  >
                    {groupName.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Stack gap={0.75}>
                    <Button component="label" variant="outlined">
                      Trocar foto
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={(event) =>
                          handleGroupImage(event.target.files?.[0])
                        }
                      />
                    </Button>
                    {groupImageUrl && (
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => setGroupImageUrl("")}
                      >
                        Remover foto
                      </Button>
                    )}
                  </Stack>
                </Stack>
                <TextField
                  autoFocus
                  label="Nome do grupo"
                  value={groupName}
                  disabled={updateGroup.isPending}
                  inputProps={{ maxLength: 48 }}
                  onChange={(event) => setGroupName(event.target.value)}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button
                disabled={updateGroup.isPending}
                onClick={() => setEditGroupOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                disabled={
                  updateGroup.isPending ||
                  groupName.trim().length < 3 ||
                  (groupName.trim() === data.group.name &&
                    groupImageUrl === (data.group.imageUrl ?? ""))
                }
                onClick={() => updateGroup.mutate()}
              >
                Salvar grupo
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Stack>
  );
}

function ConfirmDialog({
  children,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
  open,
  title,
}: {
  children: React.ReactNode;
  confirmLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{children}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PrizeCard({
  group,
  members,
  isOwner,
  saving,
  onSave,
}: {
  group: Group;
  members: GroupMember[];
  isOwner: boolean;
  saving: boolean;
  onSave: (payload: {
    contributions: { userId: string; amount: number }[];
    rules: PrizeRule[];
  }) => void;
}) {
  const [perMemberValue, setPerMemberValue] = useState(() =>
    String(commonContributionValue(members)),
  );
  const [rules, setRules] = useState<PrizeRule[]>(
    group.prizeRules?.length
      ? group.prizeRules
      : [
          { position: 1, percentage: 70 },
          { position: 2, percentage: 20 },
          { position: 3, percentage: 10 },
        ],
  );

  useEffect(() => {
    setPerMemberValue(String(commonContributionValue(members)));
    setRules(
      group.prizeRules?.length
        ? group.prizeRules
        : [
            { position: 1, percentage: 70 },
            { position: 2, percentage: 20 },
            { position: 3, percentage: 10 },
          ],
    );
  }, [group, members]);

  const memberCount = members.length;
  const perMemberAmount = contributionToNumber(perMemberValue);
  const total = perMemberAmount * memberCount;
  const percentageTotal = useMemo(
    () => rules.reduce((sum, rule) => sum + Number(rule.percentage), 0),
    [rules],
  );
  const prizeDirty = useMemo(() => {
    const initialValue = String(commonContributionValue(members));
    const initialRules = group.prizeRules?.length
      ? group.prizeRules
      : [
          { position: 1, percentage: 70 },
          { position: 2, percentage: 20 },
          { position: 3, percentage: 10 },
        ];

    return (
      perMemberValue !== initialValue ||
      JSON.stringify(rules) !== JSON.stringify(initialRules)
    );
  }, [group.prizeRules, members, perMemberValue, rules]);

  useEffect(() => {
    localStorage.setItem(unsavedPrizeStorageKey, prizeDirty ? "true" : "false");

    return () => localStorage.setItem(unsavedPrizeStorageKey, "false");
  }, [prizeDirty]);

  function updateRule(index: number, field: keyof PrizeRule, value: number) {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule,
      ),
    );
  }

  const payloadContributions = members.map((member) => ({
    userId: member.userId,
    amount: perMemberAmount,
  }));

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack gap={2}>
        <Stack>
          <Typography variant="h5">Premiação simbólica</Typography>
          <Typography color="text.secondary">
            {isOwner
              ? "Defina um valor simbólico por pessoa. O app multiplica pela quantidade de membros e calcula a divisão."
              : "Resumo do valor total combinado e como ele será dividido."}
          </Typography>
        </Stack>

        <Paper
          sx={{
            bgcolor: "rgba(0, 156, 59, 0.08)",
            border: "1px solid rgba(0, 156, 59, 0.18)",
            p: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            gap={1}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Valor total simbólico
              </Typography>
              <Typography variant="h4">{currency.format(total)}</Typography>
              <Typography color="text.secondary">
                {memberCount} membro{memberCount === 1 ? "" : "s"} a{" "}
                {currency.format(perMemberAmount)} cada
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {isOwner && (
          <Stack gap={1}>
            <Typography variant="h6">Valor por pessoa</Typography>
            <TextField
              fullWidth
              label="Quanto cada membro apostou simbólicamente"
              placeholder="0"
              value={perMemberValue}
              disabled={saving}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              helperText={`${memberCount} membro${memberCount === 1 ? "" : "s"} no grupo. Total: ${currency.format(total)}`}
              onChange={(event) =>
                setPerMemberValue(event.target.value.replace(/\D/g, ""))
              }
            />
          </Stack>
        )}

        <Grid container spacing={1.5}>
          {rules.map((rule, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper sx={{ p: 1.5 }}>
                <Stack gap={1}>
                  {isOwner ? (
                    <>
                      <TextField
                        label="Posição"
                        value={rule.position}
                        disabled={saving}
                        inputProps={{
                          inputMode: "numeric",
                          maxLength: 2,
                          pattern: "[0-9]*",
                        }}
                        onChange={(event) =>
                          updateRule(
                            index,
                            "position",
                            inputToLimit(event.target.value, 20),
                          )
                        }
                      />
                      <TextField
                        label="Percentual"
                        value={rule.percentage}
                        disabled={saving}
                        inputProps={{
                          inputMode: "numeric",
                          maxLength: 3,
                          pattern: "[0-9]*",
                        }}
                        onChange={(event) =>
                          updateRule(
                            index,
                            "percentage",
                            inputToLimit(event.target.value, 100),
                          )
                        }
                      />
                    </>
                  ) : (
                    <>
                      <Typography variant="h6">
                        {rule.position}º lugar
                      </Typography>
                      <Typography color="text.secondary">
                        {rule.percentage}% do total
                      </Typography>
                    </>
                  )}
                  <Typography color="text.secondary">
                    {currency.format((total * rule.percentage) / 100)}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {isOwner && (
          <Typography
            color={
              percentageTotal === 100 || total === 0
                ? "text.secondary"
                : "error"
            }
          >
            Soma dos percentuais: {percentageTotal}%
          </Typography>
        )}

        {isOwner && (
          <Button
            variant="contained"
            disabled={saving || (total > 0 && percentageTotal !== 100)}
            onClick={() =>
              onSave({
                contributions: payloadContributions,
                rules: total > 0 ? rules : [],
              })
            }
          >
            Salvar premiação simbólica
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function contributionToNumber(value: string) {
  return value ? Number(value) : 0;
}

function commonContributionValue(members: GroupMember[]) {
  if (!members.length) {
    return 0;
  }

  const firstContribution = members[0].symbolicContribution ?? 0;
  const sameForEveryone = members.every(
    (member) => (member.symbolicContribution ?? 0) === firstContribution,
  );

  return sameForEveryone ? firstContribution : 0;
}

function ScoringRulesCard({
  group,
  isOwner,
  onSave,
  saving,
}: {
  group: Group;
  isOwner: boolean;
  onSave: (rules: ScoringRule[]) => void;
  saving: boolean;
}) {
  const [rules, setRules] = useState<ScoringRule[]>(() =>
    mergeScoringRules(group.scoringRules),
  );
  const [selectedTab, setSelectedTab] = useState(scoringRuleTabs[0].id);
  const selectedRuleTab =
    scoringRuleTabs.find((tab) => tab.id === selectedTab) ?? scoringRuleTabs[0];
  const visibleRules = rules.filter((rule) =>
    selectedRuleTab.stages.includes(rule.stage),
  );
  const scoringDirty = useMemo(
    () =>
      JSON.stringify(rules) !==
      JSON.stringify(mergeScoringRules(group.scoringRules)),
    [group.scoringRules, rules],
  );

  useEffect(() => {
    setRules(mergeScoringRules(group.scoringRules));
  }, [group.scoringRules]);

  useEffect(() => {
    localStorage.setItem(
      unsavedScoringStorageKey,
      scoringDirty ? "true" : "false",
    );

    return () => localStorage.setItem(unsavedScoringStorageKey, "false");
  }, [scoringDirty]);

  function updateRule(
    stage: string,
    field: "exactPoints" | "resultPoints",
    value: number,
  ) {
    setRules((currentRules) =>
      currentRules.map((rule) =>
        rule.stage === stage ? { ...rule, [field]: value } : rule,
      ),
    );
  }

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack gap={2}>
        <Stack>
          <Typography variant="h5">Pontuação do grupo</Typography>
          <Typography color="text.secondary">
            {isOwner
              ? "Personalize quanto vale cravar o placar e acertar apenas o resultado em cada fase."
              : "Estas são as regras de pontuação definidas pelo dono do grupo."}
          </Typography>
        </Stack>

        <Paper
          sx={{
            bgcolor: "rgba(0, 82, 180, 0.07)",
            border: "1px solid rgba(0, 82, 180, 0.16)",
            p: 2,
          }}
        >
          <Stack gap={0.75}>
            <Typography fontWeight={900}>Como funciona</Typography>
            <Typography color="text.secondary">
              Placar exato vale a pontuação cheia da fase. Se errar o placar,
              mas acertar vitória/empate/derrota, vale a pontuação de resultado.
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 1 }}>
          <Tabs
            value={selectedTab}
            variant="scrollable"
            scrollButtons="auto"
            onChange={(_, value: string) => setSelectedTab(value)}
          >
            {scoringRuleTabs.map((tab) => (
              <Tab key={tab.id} label={tab.label} value={tab.id} />
            ))}
          </Tabs>
        </Paper>

        <Grid container spacing={1.5}>
          {visibleRules.map((rule) => (
            <Grid item xs={12} md={6} lg={4} key={rule.stage}>
              <Paper sx={{ p: 1.5 }}>
                <Stack gap={1.25}>
                  <Typography fontWeight={900}>{rule.stage}</Typography>
                  <Stack direction="row" gap={1}>
                    <TextField
                      fullWidth
                      label="Placar exato"
                      value={rule.exactPoints}
                      disabled={!isOwner || saving}
                      inputProps={{
                        inputMode: "numeric",
                        maxLength: 3,
                        pattern: "[0-9]*",
                      }}
                      onChange={(event) =>
                        updateRule(
                          rule.stage,
                          "exactPoints",
                          inputToLimit(event.target.value, 100),
                        )
                      }
                    />
                    <TextField
                      fullWidth
                      label="Resultado"
                      value={rule.resultPoints}
                      disabled={!isOwner || saving}
                      inputProps={{
                        inputMode: "numeric",
                        maxLength: 3,
                        pattern: "[0-9]*",
                      }}
                      onChange={(event) =>
                        updateRule(
                          rule.stage,
                          "resultPoints",
                          inputToLimit(event.target.value, 100),
                        )
                      }
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {isOwner && (
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => onSave(rules)}
          >
            Salvar regras de pontuação
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function mergeScoringRules(rules?: ScoringRule[]) {
  const rulesByStage = new Map((rules ?? []).map((rule) => [rule.stage, rule]));

  return defaultScoringRules.map((rule) => ({
    ...rule,
    ...rulesByStage.get(rule.stage),
  }));
}

function inputToLimit(value: string, max: number) {
  const number = Number(value.replace(/\D/g, ""));

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(number, max);
}
