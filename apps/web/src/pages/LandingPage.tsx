import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-fifa.webp";

const highlights = [
  ["⚽", "Palpites por jogo", "Chute placares antes da bola rolar."],
  ["🏆", "Ranking entre amigos", "Compare cravadas, pontos e resenha."],
  ["👥", "Grupos privados", "Crie códigos de convite para sua galera."],
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ minHeight: "100vh", py: { xs: 4, md: 8 } }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack gap={3}>
            <Chip
              label="Seu app preferido de bolão!"
              color="secondary"
              sx={{ alignSelf: "flex-start", fontWeight: 900 }}
            />
            <Box>
              <Typography variant="h3" component="h1">
                Vista a amarelinha, crie seu grupo e mande seus palpites.
              </Typography>
              <Typography sx={{ mt: 2, maxWidth: 640 }} color="text.secondary">
                Um bolão simples para brincar com amigos: jogos da Copa,
                palpites de placar, grupos privados e ranking automático.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
              <Button
                size="large"
                variant="contained"
                onClick={() => navigate("/login")}
              >
                Entrar no bolão
              </Button>
              <Button
                size="large"
                variant="outlined"
                onClick={() => navigate("/login?mode=register")}
              >
                Criar conta
              </Button>
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: "auto -20% -30% auto",
                width: 220,
                height: 220,
                borderRadius: "50%",
                bgcolor: "error.main",
                opacity: 0.22,
              }}
            />
            <Box
              component="img"
              src={logo}
              alt="FIFA 2026"
              sx={{ width: 150, mb: 2 }}
            />
            <Typography variant="h4">Copa dos Palpites</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        {highlights.map(([emoji, title, text]) => (
          <Grid item xs={12} md={4} key={title}>
            <Paper sx={{ p: 2.5, height: "100%" }}>
              <Typography sx={{ fontSize: 36 }}>{emoji}</Typography>
              <Typography variant="h6">{title}</Typography>
              <Typography color="text.secondary">{text}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
