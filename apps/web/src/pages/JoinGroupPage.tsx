import { useEffect, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import {
  normalizeInviteCode,
  pendingInviteStorageKey,
  shouldAutoJoinInvite,
} from "../services/inviteFlow";
import type { Group } from "../services/types";

type InvitePreview = {
  id: string;
  name: string;
  description?: string | null;
  inviteCode: string;
  memberCount: number;
  ownerUsername: string;
};

type GroupsMe = {
  groups: Group[];
};

function apiMessage(error: unknown, fallback: string) {
  return (error as any)?.response?.data?.message ?? fallback;
}

export function JoinGroupPage() {
  const { inviteCode = "" } = useParams();
  const normalizedInviteCode = normalizeInviteCode(inviteCode);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const autoJoinAttempted = useRef(false);
  const previewQuery = useQuery<{ group: InvitePreview }>({
    queryKey: ["group-invite", normalizedInviteCode],
    queryFn: async () =>
      (await api.get(`/groups/invite/${normalizedInviteCode}`)).data,
    enabled: Boolean(normalizedInviteCode),
    retry: false,
  });
  const join = useMutation({
    mutationFn: () =>
      api.post<{ group: Group }>("/groups/join", {
        inviteCode: normalizedInviteCode,
      }),
    onSuccess: ({ data }) => {
      localStorage.removeItem(pendingInviteStorageKey);
      showToast("Você entrou no grupo!", "success");
      queryClient.setQueryData<GroupsMe>(["groups-me"], (current) => ({
        groups: [
          { ...data.group, memberRole: "member" },
          ...(current?.groups.filter((group) => group.id !== data.group.id) ??
            []),
        ],
      }));
      navigate(`/groups/${data.group.id}`, { replace: true });
    },
    onError: (error) => {
      const status = (error as any)?.response?.status;
      const groupId = previewQuery.data?.group.id;
      const text = apiMessage(error, "Não foi possível entrar neste grupo.");

      localStorage.removeItem(pendingInviteStorageKey);

      if ((status === 403 || status === 409) && groupId) {
        showToast(
          status === 409 ? "Você já participa deste grupo." : text,
          status === 409 ? "success" : "error",
        );
        navigate(`/groups/${groupId}`, { replace: true });
        return;
      }

      showToast(text, "error");
    },
  });

  useEffect(() => {
    if (!normalizedInviteCode) {
      return;
    }

    localStorage.setItem(pendingInviteStorageKey, normalizedInviteCode);
  }, [normalizedInviteCode]);

  useEffect(() => {
    autoJoinAttempted.current = false;
  }, [normalizedInviteCode, user?.id]);

  useEffect(() => {
    if (
      shouldAutoJoinInvite({
        attempted: autoJoinAttempted.current,
        hasPreview: Boolean(previewQuery.data),
        isJoining: join.isPending,
        isLoggedIn: Boolean(user),
        joined: join.isSuccess,
      })
    ) {
      autoJoinAttempted.current = true;
      join.mutate();
    }
  }, [
    join.isPending,
    join.isSuccess,
    normalizedInviteCode,
    previewQuery.data,
    user,
  ]);

  function goToLogin(mode: "login" | "register") {
    localStorage.setItem(pendingInviteStorageKey, normalizedInviteCode);
    navigate(`/login?mode=${mode}&joinCode=${normalizedInviteCode}`);
  }

  if (!normalizedInviteCode) {
    return (
      <JoinShell>
        <EmptyState
          emoji="🏟️"
          title="Convite inválido"
          description="O link de convite não trouxe um código de grupo."
        />
      </JoinShell>
    );
  }

  if (previewQuery.isLoading) {
    return (
      <JoinShell>
        <LoadingState
          title="Carregando convite"
          description="Estamos conferindo os dados do grupo."
        />
      </JoinShell>
    );
  }

  if (previewQuery.error) {
    return (
      <JoinShell>
        <Alert severity="error">
          {apiMessage(previewQuery.error, "Convite não encontrado.")}
        </Alert>
      </JoinShell>
    );
  }

  if (!previewQuery.data) {
    return null;
  }

  const group = previewQuery.data.group;

  return (
    <JoinShell>
      <Paper
        sx={{
          background:
            "linear-gradient(135deg, #05245f 0%, #063f2a 58%, #0c6b3f 100%)",
          border: "1px solid rgba(255, 204, 41, .42)",
          boxShadow: "0 24px 80px rgba(3, 18, 48, .35)",
          color: "common.white",
          overflow: "hidden",
          p: { xs: 2.5, md: 4 },
        }}
      >
        <Stack gap={2.25}>
          <Stack gap={0.75}>
            <Chip
              label={`Convite ${group.inviteCode}`}
              sx={{
                alignSelf: "flex-start",
                bgcolor: "#ffcc29",
                color: "#08245f",
                fontWeight: 900,
              }}
            />
            <Typography variant="h3">{group.name}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,.78)" }}>
              Criado por {group.ownerUsername} - {group.memberCount}{" "}
              participante{group.memberCount === 1 ? "" : "s"}
            </Typography>
          </Stack>

          {group.description && (
            <Typography sx={{ color: "rgba(255,255,255,.9)", maxWidth: 680 }}>
              {group.description}
            </Typography>
          )}

          {user ? (
            <Alert severity="info">
              {join.isPending
                ? "Entrando no grupo automaticamente..."
                : "Preparando sua entrada no grupo..."}
            </Alert>
          ) : (
            <Stack gap={1.5}>
              <Alert severity="info">
                Entre ou crie sua conta. Depois disso, você entra neste grupo
                automaticamente.
              </Alert>
              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <Button
                  size="large"
                  variant="contained"
                  onClick={() => goToLogin("login")}
                >
                  Já tenho conta
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(255,255,255,.7)",
                    color: "common.white",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,.08)",
                      borderColor: "common.white",
                    },
                  }}
                  onClick={() => goToLogin("register")}
                >
                  Criar conta
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>
    </JoinShell>
  );
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(255,204,41,.30), transparent 28%), radial-gradient(circle at 90% 0%, rgba(0,156,59,.28), transparent 34%), linear-gradient(160deg, #031230 0%, #06245a 48%, #062f24 100%)",
        minHeight: "100vh",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          py: 4,
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
