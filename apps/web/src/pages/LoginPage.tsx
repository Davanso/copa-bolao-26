import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { api, apiBaseUrl } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setMode(params.get("mode") === "register" ? "register" : "login");
  }, [location.search]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const { data } = await api.post(`/auth/${mode}`, { username, password });
      const successMessage =
        mode === "login"
          ? "Login realizado com sucesso!"
          : "Conta criada com sucesso!";
      setFeedback({ type: "success", text: successMessage });
      showToast(successMessage, "success");
      login(data.token, data.user);
      navigate("/", { replace: true });
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
    <Container
      maxWidth="lg"
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 4 }}
    >
      <GridShell>
        <Paper component="form" onSubmit={submit} sx={{ p: { xs: 3, md: 4 } }}>
          <Stack gap={2.25}>
            <Box
              component="img"
              src={logo}
              alt="FIFA 2026"
              sx={{ width: 86 }}
            />
            <Box>
              <Typography variant="h4">
                {isRegister ? "Criar conta" : "Entrar"}
              </Typography>
              <Typography color="text.secondary">
                Use apenas usuário e senha. Sem e-mail, sem burocracia.
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

            <TextField
              label="Usuário"
              value={username}
              autoComplete="username"
              disabled={loading}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <TextField
              label="Senha"
              type="password"
              value={password}
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={loading}
              onChange={(event) => setPassword(event.target.value)}
              required
              helperText={
                isRegister ? "Use pelo menos 6 caracteres." : undefined
              }
            />
            <Button
              size="large"
              type="submit"
              variant="contained"
              disabled={loading || !username.trim() || !password}
              sx={{ minHeight: 48, position: "relative", overflow: "hidden" }}
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
            <Button
              type="button"
              disabled={loading}
              onClick={() =>
                navigate(isRegister ? "/login" : "/login?mode=register")
              }
            >
              {" "}
              {isRegister ? "Já tenho conta" : "Criar conta"}
            </Button>
          </Stack>
        </Paper>
      </GridShell>
    </Container>
  );
}

function GridShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2.5,
        alignItems: "stretch",
      }}
    >
      <Paper
        sx={{ p: { xs: 3, md: 5 }, display: "flex", alignItems: "center" }}
      >
        <Stack gap={2}>
          <Typography variant="h3">A resenha começa antes do apito.</Typography>
          <Typography color="text.secondary">
            Entre, escolha seus placares e acompanhe o ranking dos seus grupos
            durante a Copa.
          </Typography>
        </Stack>
      </Paper>
      {children}
    </Box>
  );
}
