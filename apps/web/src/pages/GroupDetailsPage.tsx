import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
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

export function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data, error, isLoading } = useQuery<{
    group: Group;
    members: GroupMember[];
  }>({
    queryKey: ["group", groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data,
    enabled: Boolean(groupId),
  });
  const savePrize = useMutation({
    mutationFn: (payload: { total: number; rules: PrizeRule[] }) =>
      api.put(`/groups/${groupId}/symbolic-prize`, payload),
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

  const isOwner = data?.group.ownerUserId === user?.id;

  return (
    <Stack gap={2.5}>
      <Button
        sx={{ alignSelf: "flex-start" }}
        onClick={() => navigate("/groups")}
      >
        ← Voltar para grupos
      </Button>

      {isLoading && (
        <EmptyState
          emoji="👥"
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
              <Typography variant="h4">{data.group.name}</Typography>
              <Typography color="text.secondary">
                Código de convite: <strong>{data.group.inviteCode}</strong>
              </Typography>
            </Stack>
          </Paper>

          <PrizeCard
            group={data.group}
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
                    <Chip label={roleLabel[member.role]} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Stack>
  );
}

function PrizeCard({
  group,
  isOwner,
  saving,
  onSave,
}: {
  group: Group;
  isOwner: boolean;
  saving: boolean;
  onSave: (payload: { total: number; rules: PrizeRule[] }) => void;
}) {
  const [total, setTotal] = useState(group.symbolicPrizeTotal ?? 0);
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
    setTotal(group.symbolicPrizeTotal ?? 0);
    setRules(
      group.prizeRules?.length
        ? group.prizeRules
        : [
            { position: 1, percentage: 70 },
            { position: 2, percentage: 20 },
            { position: 3, percentage: 10 },
          ],
    );
  }, [group]);

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

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack gap={2}>
        <Stack>
          <Typography variant="h5">Premiação simbólica</Typography>
          <Typography color="text.secondary">
            Valor apenas simbólico para a brincadeira. O app não processa
            pagamentos.
          </Typography>
        </Stack>

        <TextField
          label="Valor simbólico total"
          type="number"
          value={total}
          disabled={!isOwner || saving}
          inputProps={{ min: 0, inputMode: "numeric" }}
          onChange={(event) => setTotal(Number(event.target.value))}
        />

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
                total,
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
