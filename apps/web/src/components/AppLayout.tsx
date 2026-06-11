import { useEffect, useState } from "react";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import logo from "../assets/logo-fifa.webp";

const nav = [
  { label: "Jogos", path: "/", icon: "⚽" },
  { label: "Ao vivo", path: "/live", icon: "🔥" },
  { label: "Palpites", path: "/guesses", icon: "🎯" },
  { label: "Ranking", path: "/ranking", icon: "🏆" },
  { label: "Grupos", path: "/groups", icon: "👥" },
];
const lastRouteStorageKey = "bolao.lastRoute";
const onboardingStoragePrefix = "bolao.onboarding.seen";
const unsavedGuessesStorageKey = "bolao.unsavedGuesses";

type OnboardingContent = {
  id: string;
  title: string;
  description: string;
  action: string;
  steps: {
    title: string;
    description: string;
  }[];
};

const onboardingByPage: OnboardingContent[] = [
  {
    id: "games",
    title: "Bem-vindo aos jogos",
    description:
      "Aqui você escolhe a fase, abre cada grupo e salva seus palpites antes da bola rolar.",
    action: "Entendi",
    steps: [
      {
        title: "Abra um grupo",
        description: "Use as abas e acordeões para encontrar a partida certa.",
      },
      {
        title: "Digite o placar",
        description: "Você pode editar enquanto o jogo ainda está agendado.",
      },
      {
        title: "Respeite o bloqueio",
        description: "Quando o jogo começa, o backend bloqueia alterações.",
      },
    ],
  },
  {
    id: "live",
    title: "Jogos ao vivo",
    description:
      "Quando a API informar partidas em andamento, elas aparecem aqui com atualização automática.",
    action: "Ver ao vivo",
    steps: [
      {
        title: "Atualização automática",
        description: "A tela consulta a API a cada 30 segundos.",
      },
      {
        title: "Palpites bloqueados",
        description: "Jogo em andamento não permite novo palpite ou edição.",
      },
      {
        title: "Sem jogo agora",
        description: "Se nada estiver rolando, mostramos uma mensagem clara.",
      },
    ],
  },
  {
    id: "guesses",
    title: "Meus palpites",
    description:
      "Esta tela junta todos os placares que você já salvou para revisar e editar com facilidade.",
    action: "Revisar palpites",
    steps: [
      {
        title: "Use as abas",
        description: "Os palpites ficam separados por fase da competição.",
      },
      {
        title: "Edite rápido",
        description:
          "Clique em editar enquanto a partida ainda permite ajuste.",
      },
      {
        title: "Veja pontos",
        description: "Depois do jogo, a pontuação aparece no card.",
      },
    ],
  },
  {
    id: "ranking",
    title: "Ranking do grupo",
    description:
      "Escolha um grupo para ver pódio, classificação e premiação simbólica.",
    action: "Ver ranking",
    steps: [
      {
        title: "Selecione o grupo",
        description: "Cada grupo tem um ranking separado.",
      },
      {
        title: "Compare pontuações",
        description: "Acompanhe pontos, cravadas e palpites pontuados.",
      },
      {
        title: "Veja prêmios",
        description: "Se houver valor simbólico, ele aparece por posição.",
      },
    ],
  },
  {
    id: "groups",
    title: "Grupos do bolão",
    description:
      "Crie sua turma, copie o código de convite ou entre em um grupo existente.",
    action: "Gerenciar grupos",
    steps: [
      {
        title: "Crie um grupo",
        description: "Quem cria vira dono e pode administrar detalhes.",
      },
      {
        title: "Divulgue o código",
        description: "Copie o código e envie para seus amigos entrarem.",
      },
      {
        title: "Configure valores",
        description: "Nos detalhes, o dono ajusta a premiação simbólica.",
      },
    ],
  },
  {
    id: "group-details",
    title: "Detalhes do grupo",
    description:
      "Aqui ficam convite, participantes, palpites feitos e premiação simbólica.",
    action: "Ver detalhes",
    steps: [
      {
        title: "Compartilhe o convite",
        description: "Use o código do grupo para chamar participantes.",
      },
      {
        title: "Acompanhe membros",
        description: "Veja quem entrou e quantos palpites cada pessoa fez.",
      },
      {
        title: "Premiação simbólica",
        description: "O app só organiza valores combinados fora dele.",
      },
    ],
  },
];

const NavIcon = ({ icon }: { icon: string }) => (
  <Box component="span" aria-hidden="true" sx={{ fontSize: 20, lineHeight: 1 }}>
    {icon}
  </Box>
);

function onboardingKey(userId: string) {
  return `${onboardingStoragePrefix}.${userId}`;
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useMediaQuery("(min-width: 900px)");
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openOnboarding, setOpenOnboarding] =
    useState<OnboardingContent | null>(null);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<
    string | null
  >(null);

  function handleLogout() {
    logout();
    setAnchorEl(null);
    showToast("Você saiu da sua conta.", "info");
    navigate("/");
  }

  useEffect(() => {
    if (location.pathname !== "/login") {
      localStorage.setItem(
        lastRouteStorageKey,
        `${location.pathname}${location.search}`,
      );
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) {
      setOpenOnboarding(null);
      return;
    }

    const key = onboardingKey(user.id);

    if (!localStorage.getItem(key)) {
      setOpenOnboarding(onboardingByPage[0]);
    } else {
      setOpenOnboarding(null);
    }
  }, [user]);

  function activeNavPath() {
    const activeItem = nav.find((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path),
    );

    return activeItem?.path ?? "/";
  }

  function goToNav(path: string) {
    if (
      location.pathname === "/" &&
      path !== "/" &&
      localStorage.getItem(unsavedGuessesStorageKey) === "true"
    ) {
      setPendingNavigationPath(path);
      return;
    }

    navigate(path, { state: { skipRouteRestore: true } });
  }

  function confirmPendingNavigation() {
    if (!pendingNavigationPath) {
      return;
    }

    localStorage.setItem(unsavedGuessesStorageKey, "false");
    navigate(pendingNavigationPath, { state: { skipRouteRestore: true } });
    setPendingNavigationPath(null);
  }

  function closeWelcome() {
    if (user && openOnboarding) {
      localStorage.setItem(onboardingKey(user.id), "true");
    }

    setOpenOnboarding(null);
  }

  return (
    <Box sx={{ pb: desktop ? 4 : 10 }}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Paper
          sx={{
            p: { xs: 1.5, md: 1 },
            mb: 3,
            position: "sticky",
            top: 8,
            zIndex: 4,
            backdropFilter: "blur(18px)",
          }}
        >
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
                alt="FIFA 2026"
                sx={{ width: 52, height: 52, objectFit: "contain" }}
              />
              <Box>
                <Typography variant="h5">Copa dos Palpites</Typography>
              </Box>
            </Stack>

            {desktop && (
              <Stack direction="row" gap={1}>
                {nav.map((item) => (
                  <Button
                    key={item.path}
                    startIcon={<NavIcon icon={item.icon} />}
                    onClick={() => goToNav(item.path)}
                    color={
                      activeNavPath() === item.path ? "secondary" : "inherit"
                    }
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}

            <IconButton
              aria-label="Menu do usuário"
              onClick={(event) => setAnchorEl(event.currentTarget)}
            >
              <Avatar
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                }}
              >
                {user?.username?.[0]?.toUpperCase() ?? "👤"}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem disabled>{user?.username}</MenuItem>
              <MenuItem onClick={handleLogout}>
                <Box component="span" sx={{ mr: 1 }}>
                  ↪
                </Box>
                Sair
              </MenuItem>
            </Menu>
          </Stack>
        </Paper>

        <Outlet />
      </Container>

      <Dialog open={Boolean(openOnboarding)} onClose={closeWelcome} fullWidth>
        <DialogTitle>{openOnboarding?.title}</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              {openOnboarding?.description}
            </Typography>
            {openOnboarding?.steps.map((step, index) => (
              <WelcomeStep
                description={step.description}
                key={step.title}
                number={`${index + 1}`}
                title={step.title}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button variant="contained" onClick={closeWelcome}>
            {openOnboarding?.action ?? "Entendi"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingNavigationPath)}
        onClose={() => setPendingNavigationPath(null)}
        fullWidth
      >
        <DialogTitle>Sair sem salvar palpites?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Você tem palpites preenchidos que ainda não foram salvos. Se sair
            agora, essas alterações serão perdidas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setPendingNavigationPath(null)}>
            Continuar editando
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmPendingNavigation}
          >
            Sair sem salvar
          </Button>
        </DialogActions>
      </Dialog>

      {!desktop && (
        <Paper
          sx={{ position: "fixed", left: 8, right: 8, bottom: 8, zIndex: 5 }}
        >
          <BottomNavigation
            showLabels
            value={activeNavPath()}
            onChange={(_, value) => goToNav(value)}
          >
            {nav.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                value={item.path}
                icon={<NavIcon icon={item.icon} />}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}

function WelcomeStep({
  description,
  number,
  title,
}: {
  description: string;
  number: string;
  title: string;
}) {
  return (
    <Stack direction="row" gap={1.5}>
      <Avatar sx={{ bgcolor: "primary.main", height: 34, width: 34 }}>
        {number}
      </Avatar>
      <Box>
        <Typography fontWeight={800}>{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
    </Stack>
  );
}
