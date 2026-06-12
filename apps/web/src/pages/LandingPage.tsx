import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-fifa.webp";

const stats = [
  ["Privado", "Grupos por convite"],
  ["Automático", "Ranking por pontuação"],
  ["Transparente", "Visualização dos palpites após o jogo começar"],
];

const features = [
  {
    title: "Grupos para cada turma",
    text: "Crie um grupo, compartilhe o link e acompanhe os participantes em um espaço separado.",
  },
  {
    title: "Palpites com bloqueio real",
    text: "O app bloqueia alterações quando o jogo começa, usando os horários oficiais configurados.",
  },
  {
    title: "Ranking e premiação simbólica",
    text: "Veja pontuação, cravadas, regras personalizadas e divisão simbólica de prêmios.",
  },
  {
    title: "Perfil do participante",
    text: "Cada pessoa pode usar foto, nome, sobrenome, username e e-mail para entrar no bolão.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        bgcolor: "#3d5635",
        color: "#fffdf7",
        minHeight: "100vh",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack gap={{ xs: 5, md: 7 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                component="img"
                src={logo}
                alt="Copa dos Palpites"
                sx={{ height: 44, objectFit: "contain", width: 44 }}
              />
              <Typography fontWeight={950} sx={{ color: "#fffdf7" }}>
                Copa dos Palpites
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              onClick={() => navigate("/login")}
              sx={{
                borderColor: "#d9f99d",
                color: "#d9f99d",
                px: 2.5,
                "&:hover": { bgcolor: "rgba(217, 249, 157, 0.08)" },
              }}
            >
              Entrar
            </Button>
          </Stack>

          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack gap={3}>
                <Chip
                  label="Bolão da Copa 2026"
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: "#9be90c",
                    borderRadius: 1.5,
                    color: "#0f2f1a",
                    fontWeight: 900,
                  }}
                />
                <Stack gap={1.5}>
                  <Typography
                    component="h1"
                    sx={{
                      color: "#fffdf7",
                      fontSize: { xs: 44, md: 72 },
                      fontWeight: 950,
                      letterSpacing: "-0.06em",
                      lineHeight: 0.92,
                    }}
                  >
                    Organize o bolão sem dor de cabeça, sem bagunça.
                  </Typography>
                  <Typography
                    sx={{
                      color: "#c9d4c4",
                      fontSize: { xs: 17, md: 19 },
                      lineHeight: 1.65,
                      maxWidth: 620,
                    }}
                  >
                    Uma plataforma simples para criar grupos, registrar
                    palpites, liberar placares no momento certo e acompanhar o
                    ranking da turma durante a Copa.
                  </Typography>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={() => navigate("/login?mode=register")}
                    sx={{
                      bgcolor: "#d9f99d",
                      color: "#0f2f1a",
                      minHeight: 52,
                      px: 4,
                      fontWeight: 900,
                      "&:hover": { bgcolor: "#bef264" },
                    }}
                  >
                    Criar conta
                  </Button>
                  <Button
                    size="large"
                    variant="text"
                    onClick={() => navigate("/login")}
                    sx={{ color: "#d9f99d", minHeight: 52, px: 3, fontWeight: 900 }}
                  >
                    Já tenho acesso
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <ProductPreview />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {stats.map(([value, label]) => (
              <Grid item xs={12} md={4} key={value}>
                <Paper
                  sx={{
                    bgcolor: "#fffdf7",
                    border: "1px solid #d4cbb9",
                    boxShadow: "none",
                    p: 2.5,
                  }}
                >
                  <Typography
                    sx={{ color: "#0f2f1a", fontSize: 28, fontWeight: 950 }}
                  >
                    {value}
                  </Typography>
                  <Typography sx={{ color: "#4a5548" }}>{label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            {features.map((feature) => (
              <Grid item xs={12} md={6} key={feature.title}>
                <Paper
                  sx={{
                    bgcolor: "#fffdf7",
                    border: "1px solid #d4cbb9",
                    boxShadow: "none",
                    height: "100%",
                    p: 3,
                  }}
                >
                  <Stack gap={1.25}>
                    <Typography
                      sx={{ color: "#0f2f1a", fontSize: 22, fontWeight: 950 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography sx={{ color: "#4a5548", lineHeight: 1.65 }}>
                      {feature.text}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper
            sx={{
              bgcolor: "#0f2f1a",
              border: "1px solid #0f2f1a",
              boxShadow: "none",
              color: "#fffdf7",
              p: { xs: 3, md: 4 },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Typography variant="h4" sx={{ color: "#fffdf7" }}>
                  Pronto para criar o bolão da sua turma?
                </Typography>
                <Typography sx={{ color: "rgba(255,253,247,.76)", mt: 1 }}>
                  Crie uma conta com nome, sobrenome, username e e-mail. Depois
                  você pode personalizar foto e senha no perfil.
                </Typography>
              </Box>
              <Button
                size="large"
                variant="contained"
                onClick={() => navigate("/login?mode=register")}
                sx={{
                  bgcolor: "#d9f99d",
                  color: "#0f2f1a",
                  minWidth: 180,
                  fontWeight: 900,
                  "&:hover": { bgcolor: "#bef264" },
                }}
              >
                Começar agora
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

function ProductPreview() {
  return (
    <Paper
      sx={{
        bgcolor: "#fffdf7",
        border: "1px solid #d4cbb9",
        boxShadow: "0 26px 80px rgba(20,61,34,.14)",
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Stack gap={2}>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: "#0f2f1a", fontWeight: 950 }}>
            Grupo Família
          </Typography>
          <Chip
            label="12 participantes"
            size="small"
            sx={{ bgcolor: "#d9f99d", color: "#0f2f1a", fontWeight: 700 }}
          />
        </Stack>
        <MockGame home="Brasil" away="México" score="2 x 1" status="Palpite" />
        <MockGame home="Canadá" away="Bósnia" score="1 x 1" status="Hoje" />
        <Divider sx={{ borderColor: "#e0d7c3" }} />
        <Stack gap={1}>
          <Typography sx={{ color: "#0f2f1a", fontWeight: 950 }}>
            Ranking ao vivo
          </Typography>
          <MockRanking name="Guilherme" points="18 pts" />
          <MockRanking name="Marina" points="15 pts" />
          <MockRanking name="Rafael" points="12 pts" />
        </Stack>
      </Stack>
    </Paper>
  );
}

function MockGame({
  away,
  home,
  score,
  status,
}: {
  away: string;
  home: string;
  score: string;
  status: string;
}) {
  return (
    <Paper
      sx={{
        bgcolor: "#f6f5ef",
        border: "1px solid #e0d7c3",
        boxShadow: "none",
        p: 1.5,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ color: "#0f2f1a", fontWeight: 850 }}>
          {home}{" "}
          <Box component="span" sx={{ color: "#7a8a75" }}>
            vs
          </Box>{" "}
          {away}
        </Typography>
        <Stack alignItems="flex-end">
          <Typography sx={{ color: "#0f2f1a", fontWeight: 950 }}>
            {score}
          </Typography>
          <Typography sx={{ color: "#5a695f", fontSize: 12 }}>
            {status}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function MockRanking({ name, points }: { name: string; points: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography sx={{ color: "#4a5548" }}>{name}</Typography>
      <Typography sx={{ color: "#0f2f1a", fontWeight: 900 }}>
        {points}
      </Typography>
    </Stack>
  );
}
