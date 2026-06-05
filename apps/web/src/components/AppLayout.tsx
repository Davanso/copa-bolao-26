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

const NavIcon = ({ icon }: { icon: string }) => (
  <Box component="span" aria-hidden="true" sx={{ fontSize: 20, lineHeight: 1 }}>
    {icon}
  </Box>
);

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useMediaQuery("(min-width: 900px)");
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

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
      return;
    }

    const key = `${onboardingStoragePrefix}.${user.id}`;

    if (!localStorage.getItem(key)) {
      setWelcomeOpen(true);
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
    navigate(path, { state: { skipRouteRestore: true } });
  }

  function closeWelcome() {
    if (user) {
      localStorage.setItem(`${onboardingStoragePrefix}.${user.id}`, "true");
    }

    setWelcomeOpen(false);
  }

  return (
    <Box sx={{ pb: desktop ? 4 : 10 }}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Paper
          sx={{
            p: { xs: 1.5, md: 2 },
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

      <Dialog open={welcomeOpen} onClose={closeWelcome} fullWidth>
        <DialogTitle>Bem-vindo ao Copa dos Palpites</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              Um guia rápido para você começar sem tropeçar na bola.
            </Typography>
            <WelcomeStep
              number="1"
              title="Crie ou entre em um grupo"
              description="Use a aba Grupos para montar sua turma ou entrar por código."
            />
            <WelcomeStep
              number="2"
              title="Faça seus palpites"
              description="Na aba Jogos, escolha os placares antes do jogo começar."
            />
            <WelcomeStep
              number="3"
              title="Acompanhe o ranking"
              description="Veja pontuação, cravadas e premiação simbólica do grupo."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button variant="contained" onClick={closeWelcome}>
            Começar
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
