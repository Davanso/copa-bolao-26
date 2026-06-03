import { useState } from "react";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
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

  function handleLogout() {
    logout();
    setAnchorEl(null);
    showToast("Você saiu da sua conta.", "info");
    navigate("/");
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
                <Typography variant="caption" color="text.secondary">
                  Brasil no peito, resenha no ranking
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
                      location.pathname === item.path ? "secondary" : "inherit"
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
                {user?.username?.[0]?.toUpperCase() ?? <AccountCircleIcon />}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem disabled>{user?.username}</MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Sair
              </MenuItem>
            </Menu>
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
