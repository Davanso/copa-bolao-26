import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { Group, GroupMember, PrizeRule } from "../services/types";

const roleLabel = { owner: "Dono", member: "Membro" };
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

export function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
    null,
  );
  const { data, error, isLoading } = useQuery<{
    group: Group;
    members: GroupMember[];
  }>({
    queryKey: ["group", groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data,
    enabled: Boolean(groupId),
  });
  const savePrize = useMutation({
    mutationFn: (payload: {
      contributions: { userId: string; amount: number }[];
      rules: PrizeRule[];
    }) => api.put(`/groups/${groupId}/symbolic-prize`, payload),
    onSuccess: () => {
      showToast("Premiação simbólica salva.", "success");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups-me"] });
      queryClient.invalidateQueries({ queryKey: ["group-ranking"] });
    },
    onError: (err) =>
      showToast(
        apiMessage(err, "Não foi possível salvar a premiação."),
        "error",
      ),
  });
  const updateGroup = useMutation({
    mutationFn: () =>
      api.put(`/groups/${groupId}`, {
        description: data?.group.description,
        name: groupName.trim(),
      }),
    onSuccess: () => {
      setEditGroupOpen(false);
      showToast("Nome do grupo atualizado.", "success");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups-me"] });
    },
    onError: (err) =>
      showToast(apiMessage(err, "Não foi possível editar o grupo."), "error"),
  });
  const deleteGroup = useMutation({
    mutationFn: () => api.delete(`/groups/${groupId}`),
    onSuccess: () => {
      showToast("Grupo deletado com sucesso.", "success");
      queryClient.invalidateQueries({ queryKey: ["groups-me"] });
      navigate("/groups", { replace: true });
    },
    onError: (err) =>
      showToast(apiMessage(err, "Não foi possível deletar o grupo."), "error"),
  });
  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      setMemberToRemove(null);
      showToast("Participante removido do grupo.", "success");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-ranking"] });
    },
    onError: (err) =>
      showToast(
        apiMessage(err, "Não foi possível remover o participante."),
        "error",
      ),
  });

  const isOwner = data?.group.ownerUserId === user?.id;

  useEffect(() => {
    setGroupName(data?.group.name ?? "");
  }, [data?.group.name]);

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
                <Typography variant="h4">{data.group.name}</Typography>
                {isOwner && (
                  <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                    <Button
                      variant="outlined"
                      disabled={updateGroup.isPending}
                      onClick={() => setEditGroupOpen(true)}
                    >
                      Editar nome
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
                      <Typography variant="h6">
                        {member.user.username}
                      </Typography>
                      <Typography color="text.secondary">
                        Participante
                      </Typography>
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
            <DialogTitle>Editar nome do grupo</DialogTitle>
            <DialogContent>
              <Stack gap={2} sx={{ pt: 1 }}>
                <Typography color="text.secondary">
                  Escolha um nome claro para sua turma encontrar o grupo com
                  facilidade.
                </Typography>
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
                  groupName.trim() === data.group.name
                }
                onClick={() => updateGroup.mutate()}
              >
                Salvar nome
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
  const [contributions, setContributions] = useState<Record<string, string>>(
    () => memberContributions(members),
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
    setContributions(memberContributions(members));
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

  const total = useMemo(
    () =>
      Object.values(contributions).reduce(
        (sum, value) => sum + contributionToNumber(value),
        0,
      ),
    [contributions],
  );
  const percentageTotal = useMemo(
    () => rules.reduce((sum, rule) => sum + Number(rule.percentage), 0),
    [rules],
  );

  function updateRule(index: number, field: keyof PrizeRule, value: number) {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule,
      ),
    );
  }

  function updateContribution(userId: string, value: string) {
    setContributions((current) => ({ ...current, [userId]: value }));
  }

  const payloadContributions = members.map((member) => ({
    userId: member.userId,
    amount: contributionToNumber(contributions[member.userId] ?? ""),
  }));

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack gap={2}>
        <Stack>
          <Typography variant="h5">Premiação simbólica</Typography>
          <Typography color="text.secondary">
            Preencha quanto cada participante combinou simbolicamente. O app
            soma tudo e calcula a divisão pelos percentuais.
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
            </Box>
          </Stack>
        </Paper>

        <Stack gap={1}>
          <Typography variant="h6">Valor por participante</Typography>
          <Grid container spacing={1.5}>
            {members.map((member) => (
              <Grid item xs={12} md={6} key={member.id}>
                <TextField
                  fullWidth
                  label={member.user.username}
                  placeholder="0"
                  value={contributions[member.userId] ?? ""}
                  disabled={!isOwner || saving}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  helperText={roleLabel[member.role]}
                  onChange={(event) =>
                    updateContribution(
                      member.userId,
                      event.target.value.replace(/\D/g, ""),
                    )
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Stack>

        <Grid container spacing={1.5}>
          {rules.map((rule, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper sx={{ p: 1.5 }}>
                <Stack gap={1}>
                  <TextField
                    label="Posição"
                    type="number"
                    value={rule.position}
                    disabled={!isOwner || saving}
                    onChange={(event) =>
                      updateRule(index, "position", Number(event.target.value))
                    }
                  />
                  <TextField
                    label="Percentual"
                    type="number"
                    value={rule.percentage}
                    disabled={!isOwner || saving}
                    onChange={(event) =>
                      updateRule(
                        index,
                        "percentage",
                        Number(event.target.value),
                      )
                    }
                  />
                  <Typography color="text.secondary">
                    {currency.format((total * rule.percentage) / 100)}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography
          color={
            percentageTotal === 100 || total === 0 ? "text.secondary" : "error"
          }
        >
          Soma dos percentuais: {percentageTotal}%
        </Typography>

        {isOwner ? (
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
        ) : (
          <Alert severity="info">
            Apenas o dono do grupo pode editar a premiação simbólica.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

function contributionToNumber(value: string) {
  return value ? Number(value) : 0;
}
