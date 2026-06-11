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
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import { buildInviteLink } from "../services/inviteFlow";
import type { Group } from "../services/types";

const roleLabel: Record<string, string> = {
  owner: "Dono",
  member: "Membro",
};

type GroupsMe = {
  groups: Group[];
};

function apiMessage(error: unknown, fallback: string) {
  return (error as any)?.response?.data?.message ?? fallback;
}

export function GroupsPage() {
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, error, isLoading } = useQuery<{ groups: Group[] }>({
    queryKey: ["groups-me"],
    queryFn: async () => (await api.get("/groups/me")).data,
  });
  const create = useMutation({
    mutationFn: () =>
      api.post<{ group: Group }>("/groups", { name: name.trim() }),
    onSuccess: ({ data }) => {
      setName("");
      showToast("Grupo criado com sucesso!", "success");
      queryClient.setQueryData<GroupsMe>(["groups-me"], (current) => ({
        groups: [
          { ...data.group, memberRole: "owner" },
          ...(current?.groups.filter((group) => group.id !== data.group.id) ??
            []),
        ],
      }));
    },
    onError: (err) =>
      showToast(apiMessage(err, "Não foi possível criar grupo."), "error"),
  });
  const join = useMutation({
    mutationFn: () =>
      api.post<{ group: Group }>("/groups/join", {
        inviteCode: inviteCode.trim().toUpperCase(),
      }),
    onSuccess: ({ data }) => {
      setInviteCode("");
      showToast("Você entrou no grupo!", "success");
      queryClient.setQueryData<GroupsMe>(["groups-me"], (current) => ({
        groups: [
          { ...data.group, memberRole: "member" },
          ...(current?.groups.filter((group) => group.id !== data.group.id) ??
            []),
        ],
      }));
    },
    onError: (err) =>
      showToast(apiMessage(err, "Não foi possível entrar no grupo."), "error"),
  });

  async function copyInvite(code: string) {
    try {
      await copyToClipboard(inviteLink(code));
      showToast("Link de convite copiado!", "success");
    } catch {
      showToast(
        "Não foi possível copiar automaticamente. Selecione o código na tela.",
        "error",
      );
    }
  }

  return (
    <Stack gap={2.5}>
      <Stack>
        <Typography variant="h4">Grupos</Typography>
        <Typography color="text.secondary">
          Crie um grupo para convidar amigos ou entre usando um código.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5 }}>
            <Stack gap={1.25}>
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
          <Paper sx={{ p: 2.5 }}>
            <Stack gap={1.25}>
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

      {isLoading && (
        <LoadingState
          title="Carregando grupos"
          description="Estamos buscando os grupos que você participa."
        />
      )}
      {error && (
        <Alert severity="error">Não foi possível carregar grupos.</Alert>
      )}
      {!isLoading && data?.groups.length === 0 && (
        <EmptyState
          emoji="🏟️"
          title="Nenhum grupo ainda"
          description="Crie seu primeiro grupo ou peça o código de convite para um amigo."
        />
      )}

      <Grid container spacing={2}>
        {data?.groups.map((group) => (
          <Grid item xs={12} md={6} key={group.id}>
            <Paper sx={{ p: 2.5 }}>
              <Stack gap={1.5}>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Typography variant="h6">{group.name}</Typography>
                  <Chip label={roleLabel[group.memberRole ?? ""] ?? "Membro"} />
                </Stack>
                <Typography color="text.secondary">
                  Código: {group.inviteCode}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    Ver detalhes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => copyInvite(group.inviteCode)}
                  >
                    Copiar código
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function inviteLink(code: string) {
  return buildInviteLink(window.location.origin, code);
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.left = "-9999px";
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error("Clipboard indisponível");
  }
}
