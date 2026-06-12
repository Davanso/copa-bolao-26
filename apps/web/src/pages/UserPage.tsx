import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { User } from "../services/types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

type ProfileForm = {
  avatarUrl: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
};

type PasswordForm = {
  confirmPassword: string;
  currentPassword: string;
  nextPassword: string;
};

function apiMessage(error: unknown, fallback: string) {
  return (error as any)?.response?.data?.message ?? fallback;
}

export function UserPage() {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileForm>(() => userToForm(user));
  const [password, setPassword] = useState<PasswordForm>({
    confirmPassword: "",
    currentPassword: "",
    nextPassword: "",
  });
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username;
  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [displayName],
  );
  const profileDirty = user
    ? JSON.stringify(profile) !== JSON.stringify(userToForm(user))
    : false;
  const passwordMismatch =
    password.confirmPassword.length > 0 &&
    password.confirmPassword !== password.nextPassword;
  const samePassword =
    password.currentPassword.length >= 6 &&
    password.currentPassword === password.nextPassword;

  useEffect(() => {
    setProfile(userToForm(user));
  }, [user]);

  const saveProfile = useMutation({
    mutationFn: () => api.put<{ user: User }>("/auth/me", profile),
    onSuccess: ({ data }) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["groups-me"] });
      showToast("Perfil atualizado com sucesso.", "success");
    },
    onError: (error) =>
      showToast(
        apiMessage(error, "Não foi possível salvar o perfil."),
        "error",
      ),
  });
  const savePassword = useMutation({
    mutationFn: () =>
      api.put("/auth/me/password", {
        currentPassword: password.currentPassword,
        nextPassword: password.nextPassword,
      }),
    onSuccess: () => {
      setPassword({
        confirmPassword: "",
        currentPassword: "",
        nextPassword: "",
      });
      showToast("Senha alterada com sucesso.", "success");
    },
    onError: (error) =>
      showToast(
        apiMessage(error, "Não foi possível alterar a senha."),
        "error",
      ),
  });

  async function handleAvatar(file?: File) {
    if (!file) {
      return;
    }

    if (file.size > 450_000) {
      showToast("Use uma imagem menor que 450 KB.", "warning");
      return;
    }

    const avatarUrl = await fileToDataUrl(file);

    setProfile((current) => ({
      ...current,
      avatarUrl,
    }));
  }

  return (
    <Stack gap={3}>
      <Paper
        sx={{
          background:
            "linear-gradient(135deg, #085201 0%, #036800 54%, #00bb73 100%)",
          border: "1px solid rgba(255,255,255,.22)",
          color: "common.white",
          overflow: "hidden",
          p: { xs: 3, md: 4 },
          position: "relative",
        }}
      >
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,.16)",
            borderRadius: 4,
            height: 180,
            position: "absolute",
            right: -48,
            top: -60,
            transform: "rotate(18deg)",
            width: 220,
          }}
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          gap={3}
          sx={{ position: "relative" }}
        >
          <Stack gap={1.25}>
            <Chip
              label="Central do usuário"
              sx={{
                alignSelf: "flex-start",
                bgcolor: "rgba(255,255,255,.92)",
                color: "#5b5e5b",
                fontWeight: 900,
              }}
            />
            <Typography variant="h3">Seu perfil no bolão</Typography>
            <Typography sx={{ color: "rgba(255,255,255,.82)", maxWidth: 640 }}>
              Atualize sua foto, nome público e dados de acesso.
            </Typography>
          </Stack>

          <Stack alignItems="center" gap={1.25}>
            <Avatar
              src={profile.avatarUrl}
              sx={{
                bgcolor: "rgba(255,255,255,.2)",
                border: "3px solid rgba(255,255,255,.85)",
                color: "common.white",
                fontSize: 34,
                height: 112,
                width: 112,
              }}
            >
              {initials || <UserIcon />}
            </Avatar>
            <Button
              component="label"
              startIcon={<CameraIcon />}
              sx={{
                bgcolor: "rgba(255,255,255,.92)",
                color: "#5b5e5b",
                fontWeight: 900,
                "&:hover": { bgcolor: "common.white" },
              }}
            >
              Trocar foto
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(event) => handleAvatar(event.target.files?.[0])}
              />
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack gap={2}>
              <Stack direction="row" gap={1.25} alignItems="center">
                <BadgeIcon />
                <Box>
                  <Typography variant="h5">Dados públicos</Typography>
                  <Typography color="text.secondary">
                    Nome, username e e-mail usados para identificar sua conta.
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={profile.firstName}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sobrenome"
                    value={profile.lastName}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    helperText={
                      profile.username !== user?.username
                        ? "Este será seu novo username para entrar no app."
                        : "Você pode usar este username ou seu e-mail no login."
                    }
                    label="Username"
                    value={profile.username}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    type="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                disabled={
                  !profile.username.trim() ||
                  !profileDirty ||
                  saveProfile.isPending
                }
                onClick={() => saveProfile.mutate()}
                sx={{ alignSelf: "flex-start" }}
              >
                Salvar perfil
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
            <Stack gap={2}>
              <Stack direction="row" gap={1.25} alignItems="center">
                <LockIcon />
                <Box>
                  <Typography variant="h5">Senha</Typography>
                  <Typography color="text.secondary">
                    Troque sua senha mantendo sua conta segura.
                  </Typography>
                </Box>
              </Stack>

              <TextField
                label="Senha atual"
                type="password"
                value={password.currentPassword}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
              <TextField
                label="Nova senha"
                type="password"
                helperText="Use pelo menos 6 caracteres."
                value={password.nextPassword}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    nextPassword: event.target.value,
                  }))
                }
              />
              <TextField
                label="Confirmar nova senha"
                type="password"
                error={passwordMismatch}
                helperText={passwordMismatch ? "As senhas não conferem." : " "}
                value={password.confirmPassword}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
              {password.nextPassword && password.nextPassword.length < 6 && (
                <Alert severity="warning">
                  A nova senha precisa ter pelo menos 6 caracteres.
                </Alert>
              )}
              {samePassword && (
                <Alert severity="warning">
                  A nova senha precisa ser diferente da senha atual.
                </Alert>
              )}
              <Button
                variant="outlined"
                disabled={
                  savePassword.isPending ||
                  password.currentPassword.length < 6 ||
                  password.nextPassword.length < 6 ||
                  passwordMismatch ||
                  samePassword
                }
                onClick={() => savePassword.mutate()}
              >
                Alterar senha
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

function userToForm(user: User | null): ProfileForm {
  return {
    avatarUrl: user?.avatarUrl ?? "",
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

function BadgeIcon() {
  return (
    <SvgIcon color="primary" viewBox="0 0 24 24">
      <path d="M9 3h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a2 2 0 0 1 2-2Zm0 3h6V5H9v1Zm3 8a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm-5 4h10a4.6 4.6 0 0 0-10 0Z" />
    </SvgIcon>
  );
}

function CameraIcon() {
  return (
    <SvgIcon viewBox="0 0 24 24">
      <path d="M9 4h6l1.4 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.6L9 4Zm3 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-2a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </SvgIcon>
  );
}

function LockIcon() {
  return (
    <SvgIcon color="primary" viewBox="0 0 24 24">
      <path d="M17 9h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 10 0v2Zm-2 0V7a3 3 0 0 0-6 0v2h6Zm-3 4a2 2 0 0 0-1 3.73V18h2v-1.27A2 2 0 0 0 12 13Z" />
    </SvgIcon>
  );
}

function UserIcon() {
  return (
    <SvgIcon fontSize="large" viewBox="0 0 24 24">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
    </SvgIcon>
  );
}
