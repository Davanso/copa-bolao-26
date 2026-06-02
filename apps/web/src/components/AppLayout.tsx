import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo-fifa.webp";

const nav = [
  { label: "Jogos", path: "/", icon: "⚽" },
  { label: "Ao vivo", path: "/live", icon: "🔥" },
  { label: "Palpites", path: "/guesses", icon: "🎯" },
  { label: "Ranking", path: "/ranking", icon: "🏆" },
  { label: "Grupos", path: "/groups", icon: "👥" },
];

const NavIcon = ({ icon }: { icon: string }) => (
  <Box component="span" aria-hidden="true" sx={{ fontSize: 20, lineHeight: 1 }}>
    {icon}
  </Box>
);

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useMediaQuery("(min-width: 800px)");
  const { user, logout } = useAuth();

  return (
    <Box sx={{ pb: desktop ? 4 : 10 }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper
          sx={{
            p: 2,
            mb: 3,
            position: "sticky",
            top: 8,
            zIndex: 4,
            backdropFilter: "blur(16px)",
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
                sx={{ width: 46, height: 46, objectFit: "contain" }}
              />
              <Box>
                <Typography variant="h5">Bolão da Copa</Typography>
                <Typography variant="caption" color="text.secondary">
                  palpites, placares e ranking entre amigos
                </Typography>
              </Box>
            </Stack>

            {desktop && (
              <Stack direction="row" gap={1}>
                {nav.map((item) => (
                  <Button
                    key={item.path}
                    startIcon={<NavIcon icon={item.icon} />}
                    onClick={() => navigate(item.path)}
                    color={
                      location.pathname === item.path ? "primary" : "inherit"
                    }
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}

            <Button onClick={logout} variant="outlined">
              {user?.username} · sair
            </Button>
          </Stack>
        </Paper>

        <Outlet />
      </Container>

      {!desktop && (
        <Paper
          sx={{ position: "fixed", left: 8, right: 8, bottom: 8, zIndex: 5 }}
        >
          <BottomNavigation
            showLabels
            value={
              nav.find((item) => item.path === location.pathname)?.path ?? "/"
            }
            onChange={(_, value) => navigate(value)}
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
