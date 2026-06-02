import { useState } from "react";
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
import { api } from "../services/api";
import type { Group } from "../services/types";

const roleLabel: Record<string, string> = {
  owner: "Dono",
  member: "Membro",
};

function apiMessage(error: unknown, fallback: string) {
  return (error as any)?.response?.data?.message ?? fallback;
}

export function GroupsPage() {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<{ groups: Group[] }>({
    queryKey: ["groups-me"],
    queryFn: async () => (await api.get("/groups/me")).data,
  });
  const create = useMutation({
    mutationFn: () => api.post("/groups", { name: name.trim() }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["groups-me"] });
    },
  });
  const join = useMutation({
    mutationFn: () =>
      api.post("/groups/join", { inviteCode: inviteCode.trim().toUpperCase() }),
    onSuccess: () => {
      setInviteCode("");
      queryClient.invalidateQueries({ queryKey: ["groups-me"] });
    },
  });

  return (
    <Stack gap={2}>
      <Typography variant="h4">Grupos</Typography>
      <Typography color="text.secondary">
        Crie um grupo para convidar amigos. Quem cria o grupo é o único dono e
        administrador dele.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Stack gap={1}>
              <Typography variant="h6">Criar grupo</Typography>
              <TextField
                label="Nome do grupo"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => create.mutate()}
                disabled={!name.trim() || create.isPending}
              >
                Criar grupo
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Stack gap={1}>
              <Typography variant="h6">Entrar por código</Typography>
              <TextField
                label="Código de convite"
                value={inviteCode}
                onChange={(event) =>
                  setInviteCode(event.target.value.toUpperCase())
                }
              />
              <Button
                variant="outlined"
                onClick={() => join.mutate()}
                disabled={!inviteCode.trim() || join.isPending}
              >
                Entrar no grupo
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {isLoading && <Typography>Carregando grupos...</Typography>}
      {error && (
        <Alert severity="error">Não foi possível carregar grupos.</Alert>
      )}
      {create.error && (
        <Alert severity="error">
          {apiMessage(create.error, "Não foi possível criar grupo.")}
        </Alert>
      )}
      {join.error && (
        <Alert severity="error">
          {apiMessage(join.error, "Não foi possível entrar no grupo.")}
        </Alert>
      )}
      {create.isSuccess && <Alert severity="success">Grupo criado.</Alert>}
      {join.isSuccess && (
        <Alert severity="success">Você entrou no grupo.</Alert>
      )}
      {!isLoading && data?.groups.length === 0 && (
        <Alert severity="info">Você ainda não participa de nenhum grupo.</Alert>
      )}

      {data?.groups.map((group) => (
        <Paper key={group.id} sx={{ p: 2 }}>
          <Stack gap={1}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography variant="h6">{group.name}</Typography>
              <Chip label={roleLabel[group.memberRole ?? ""] ?? "Membro"} />
            </Stack>
            <Typography color="text.secondary">
              Código de convite: {group.inviteCode}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
