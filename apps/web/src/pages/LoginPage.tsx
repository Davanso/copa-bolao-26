import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo-fifa.webp";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post(`/auth/${mode}`, { username, password });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
    >
      <Paper component="form" onSubmit={submit} sx={{ p: 4, width: "100%" }}>
        <Stack gap={2.5} alignItems="stretch">
          <Box
            component="img"
            src={logo}
            alt="FIFA 2026"
            sx={{ width: 96, alignSelf: "center" }}
          />
          <Typography variant="h4" align="center">
            Bolão da Copa 2026
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Usuário"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button
            size="large"
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
          <Button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Criar uma conta" : "Já tenho conta"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
