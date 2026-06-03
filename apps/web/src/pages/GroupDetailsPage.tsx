import {
  Alert,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { api } from "../services/api";
import type { Group, GroupMember } from "../services/types";

const roleLabel = { owner: "Dono", member: "Membro" };

export function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useQuery<{
    group: Group;
    members: GroupMember[];
  }>({
    queryKey: ["group", groupId],
    queryFn: async () => (await api.get(`/groups/${groupId}`)).data,
    enabled: Boolean(groupId),
  });

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
