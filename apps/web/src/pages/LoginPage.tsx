import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { api, apiBaseUrl } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  nextLoginModePath,
  nextPathAfterAuth,
  pendingInviteStorageKey,
} from "../services/inviteFlow";
import logo from "../assets/logo-fifa.webp";

function messageFromError(error: any) {
  if (error?.code === "ERR_NETWORK") {
    return `Não foi possível conectar com a API em ${apiBaseUrl}. No celular, use a API publicada ou o IP da sua máquina.`;
  }

  return error.response?.data?.message ?? "Não foi possível concluir a ação.";
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMode(params.get("mode") === "register" ? "register" : "login");
  }, [location.search]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const payload = isRegister
        ? { email, firstName, lastName, password, username }
        : { identifier: username, password };
      const { data } = await api.post(`/auth/${mode}`, payload);
      const successMessage =
        mode === "login"
          ? "Login realizado com sucesso!"
          : "Conta criada com sucesso!";
      setFeedback({ type: "success", text: successMessage });
      showToast(successMessage, "success");
      queryClient.clear();
      login(data.token, data.user);
      navigate(
        nextPathAfterAuth(
          location.search,
          localStorage.getItem(pendingInviteStorageKey),
        ),
        { replace: true },
      );
    } catch (error: any) {
      const text = messageFromError(error);
      setFeedback({ type: "error", text });
      showToast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <Box sx={{ bgcolor: "#e3fada", color: "#102015", minHeight: "100vh" }}>
      <Container
        maxWidth="lg"
        sx={{
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          py: 4,
        }}
      >
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <AuthIntro />
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper
              component="form"
              onSubmit={submit}
              sx={{
                bgcolor: "#102015",
                border: "1px solid #ded9c8",
                boxShadow: "0 26px 80px rgba(20,61,34,.14)",
                height: "100%",
                p: { xs: 2.5, md: 4 },
              }}
            >
              <Stack gap={2.25}>
                <Stack direction="row" alignItems="center" gap={1.25}>
                  <Box
                    component="img"
                    src={logo}
                    alt="Copa dos Palpites"
                    sx={{ height: 48, objectFit: "contain", width: 48 }}
                  />
                  <Box>
                    <Typography sx={{ color: "#dddddd", fontWeight: 950 }}>
                      Copa dos Palpites
                    </Typography>
                    <Typography sx={{ color: "#dddddd", fontSize: 14 }}>
                      Conta do participante
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  <Typography
                    component="h1"
                    sx={{
                      color: "#dddddd",
                      fontSize: { xs: 34, md: 44 },
                      fontWeight: 950,
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {isRegister ? "Criar conta" : "Entrar"}
                  </Typography>
                  <Typography sx={{ color: "#dddddd", lineHeight: 1.6 }}>
                    {isRegister
                      ? "Recomendamos usar nome e sobrenome para seu grupo identificar você no ranking."
                      : "Entre com seu e-mail ou username. Se você mudou o username no perfil, use o novo."}
                  </Typography>
                </Box>

                {feedback && (
                  <Alert severity={feedback.type}>{feedback.text}</Alert>
                )}
                {loading && (
                  <Alert severity="info">
                    {isRegister ? "Criando sua conta..." : "Entrando..."}
                  </Alert>
                )}

                {isRegister && (
                  <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nome"
                        value={firstName}
                        disabled={loading}
                        onChange={(event) => setFirstName(event.target.value)}
                        helperText="Aparece no seu perfil."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Sobrenome"
                        value={lastName}
                        disabled={loading}
                        onChange={(event) => setLastName(event.target.value)}
                        helperText="Ajuda sua turma no ranking."
                      />
                    </Grid>
                  </Grid>
                )}

                {isRegister && (
                  <TextField
                    label="E-mail"
                    type="email"
                    value={email}
                    autoComplete="email"
                    disabled={loading}
                    onChange={(event) => setEmail(event.target.value)}
                    helperText="Você também poderá usar este e-mail para entrar."
                  />
                )}

                <TextField
                  label={
                    isRegister ? "Username para login" : "E-mail ou username"
                  }
                  value={username}
                  autoComplete="username"
                  disabled={loading}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  helperText={
                    isRegister
                      ? "Escolha um username curto. Ele também serve para login."
                      : "Pode ser seu username ou e-mail cadastrado."
                  }
                />
                <TextField
                  label="Senha"
                  type="password"
                  value={password}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  disabled={loading}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  helperText="Use pelo menos 6 caracteres."
                />

                <Button
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loading || !username.trim() || !password}
                  sx={{
                    bgcolor: "#143d22",
                    color: "#fff",
                    minHeight: 52,
                    overflow: "hidden",
                    position: "relative",
                    "&:hover": { bgcolor: "#0f2f1a" },
                  }}
                >
                  {loading
                    ? isRegister
                      ? "Criando conta..."
                      : "Entrando..."
                    : isRegister
                      ? "Criar conta"
                      : "Entrar"}
                  {loading && (
                    <LinearProgress
                      color="inherit"
                      sx={{
                        bottom: 0,
                        height: 3,
                        left: 0,
                        opacity: 0.7,
                        position: "absolute",
                        right: 0,
                      }}
                    />
                  )}
                </Button>

                <Divider sx={{ borderColor: "#e8e1cb" }} />

                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const nextMode = isRegister ? "login" : "register";
                    navigate(nextLoginModePath(location.search, nextMode));
                  }}
                  sx={{ color: "#e3fada" }}
                >
                  {isRegister ? "Já tenho conta" : "Criar conta"}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function AuthIntro() {
  return (
    <Paper
      sx={{
        bgcolor: "#143d22",
        border: "1px solid #143d22",
        boxShadow: "none",
        color: "#fff",
        height: "100%",
        p: { xs: 3, md: 4 },
      }}
    >
      <Stack justifyContent="space-between" gap={4} sx={{ height: "100%" }}>
        <Stack gap={2}>
          <Typography
            sx={{
              color: "#fff",
              fontSize: { xs: 36, md: 48 },
              fontWeight: 950,
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            Sua identidade no bolão começa aqui.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.72)", lineHeight: 1.65 }}>
            Depois de entrar, você pode abrir a página de perfil para adicionar
            foto, trocar username, atualizar nome e alterar senha.
          </Typography>
        </Stack>
        <Stack gap={1.25}>
          <InfoRow label="Login" value="E-mail ou username" />
          <InfoRow label="Perfil" value="Foto, nome e senha" />
          <InfoRow label="Grupos" value="Convite privado" />
        </Stack>
      </Stack>
    </Paper>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{ borderTop: "1px solid rgba(255,255,255,.16)", pt: 1.25 }}
    >
      <Typography sx={{ color: "rgba(255,255,255,.62)" }}>{label}</Typography>
      <Typography sx={{ color: "#d9f99d", fontWeight: 900 }}>
        {value}
      </Typography>
    </Stack>
  );
}
