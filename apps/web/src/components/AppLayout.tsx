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
  SvgIcon,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import logo from "../assets/logo-fifa.webp";

const nav = [
  { label: "Jogos", path: "/", icon: "ball" },
  { label: "Ao vivo", path: "/live", icon: "live" },
  { label: "Palpites", path: "/guesses", icon: "target" },
  { label: "Ranking", path: "/ranking", icon: "trophy" },
  { label: "Grupos", path: "/groups", icon: "group" },
];
const lastRouteStorageKey = "bolao.lastRoute";
const onboardingStoragePrefix = "bolao.onboarding.seen";
const unsavedGuessesStorageKey = "bolao.unsavedGuesses";
const unsavedStorageKeys = [
  unsavedGuessesStorageKey,
  "bolao.unsaved.groupName",
  "bolao.unsaved.prize",
  "bolao.unsaved.scoring",
];

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

const iconPaths = {
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.8 8.2 3.2-2.1 3.2 2.1-1.1 3.7H9.9z" />
      <path d="m9.9 11.9-3 2.2m7.2-2.2 3 2.2M12 6.1V3m-5.1 11.1-1.7 2.6m11.9-2.6 1.7 2.6M9.9 11.9l1.1 3.6h2l1.1-3.6" />
    </>
  ),
  group: (
    <>
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M5 20a7 7 0 0 1 14 0" />
      <path d="M18 8a3 3 0 0 1 3 3M3 11a3 3 0 0 1 3-3" />
    </>
  ),
  live: (
    <>
      <path d="M8 5v14l11-7z" />
      <path d="M4 7a9 9 0 0 0 0 10M21 7a9 9 0 0 1 0 10" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a3 3 0 0 0 3 3m8-3h3a3 3 0 0 1-3 3M12 13v4m-3 3h6m-8 0h10" />
    </>
  ),
} as const;

const NavIcon = ({ icon }: { icon: string }) => (
  <SvgIcon
    fontSize="small"
    viewBox="0 0 24 24"
    sx={{ fill: "none", stroke: "currentColor", strokeWidth: 1.8 }}
  >
    {iconPaths[icon as keyof typeof iconPaths]}
  </SvgIcon>
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
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openOnboarding, setOpenOnboarding] =
    useState<OnboardingContent | null>(null);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<
    string | null
  >(null);

  function handleLogout() {
    queryClient.clear();
    logout();
    setAnchorEl(null);
    showToast("Voc? saiu da sua conta.", "info");
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
    if (path !== location.pathname && hasUnsavedChanges()) {
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
    for (const key of unsavedStorageKeys) {
      localStorage.setItem(key, "false");
    }
    navigate(pendingNavigationPath, { state: { skipRouteRestore: true } });
    setPendingNavigationPath(null);
  }

  useEffect(() => {
    function confirmBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges()) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", confirmBeforeUnload);

    return () =>
      window.removeEventListener("beforeunload", confirmBeforeUnload);
  }, []);

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
            background:
              "linear-gradient(135deg, #0d4128 0%, #083a20 56%, #036b37 100%)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 3,
            boxShadow: "0 18px 44px rgba(7,59,34,.22)",
            color: "white",
            mb: 3,
            overflow: "hidden",
            p: { xs: 1.5, md: 1 },
            position: "sticky",
            top: 8,
            zIndex: 4,
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
                sx={{
                  borderRadius: 2,
                  height: 52,
                  objectFit: "contain",
                  overflow: "hidden",
                  width: 52,
                }}
              />
              <Box>
                <Typography variant="h5">Copa dos Palpites</Typography>
                <Typography
                  sx={{ color: "rgba(255,255,255,.76)" }}
                  variant="body2"
                >
                  Bolão, grupos e ranking em tempo real
                </Typography>
              </Box>
            </Stack>

            {desktop && (
              <Stack direction="row" gap={1}>
                {nav.map((item) => (
                  <Button
                    key={item.path}
                    startIcon={<NavIcon icon={item.icon} />}
                    onClick={() => goToNav(item.path)}
                    variant={
                      activeNavPath() === item.path ? "contained" : "text"
                    }
                    sx={{
                      bgcolor:
                        activeNavPath() === item.path
                          ? "#d9f99d"
                          : "transparent",
                      borderRadius: 2,
                      color:
                        activeNavPath() === item.path
                          ? "#12351f"
                          : "rgba(255,255,255,.86)",
                      fontWeight: 900,
                      px: 1.5,
                      "&:hover": {
                        bgcolor:
                          activeNavPath() === item.path
                            ? "#bef264"
                            : "rgba(255,255,255,.12)",
                      },
                    }}
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
                src={user?.avatarUrl ?? undefined}
                sx={{
                  bgcolor: "#d9f99d",
                  color: "#12351f",
                  fontWeight: 900,
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
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate("/user", { state: { skipRouteRestore: true } });
                }}
              >
                Meu perfil
              </MenuItem>
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
        <DialogTitle>Sair sem salvar altera??es?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Voc? tem altera??es preenchidas que ainda n?o foram salvas. Se sair
            agora, essas altera??es ser?o perdidas.
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
          sx={{
            border: "1px solid rgba(7,59,34,.16)",
            borderRadius: 3,
            bottom: 8,
            boxShadow: "0 14px 34px rgba(7,59,34,.24)",
            left: 8,
            overflow: "hidden",
            position: "fixed",
            right: 8,
            zIndex: 5,
          }}
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

function hasUnsavedChanges() {
  return unsavedStorageKeys.some((key) => localStorage.getItem(key) === "true");
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
