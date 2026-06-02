import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#37f29a" },
    secondary: { main: "#ffd166" },
    background: { default: "#07120d", paper: "rgba(12, 28, 20, 0.88)" },
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, Segoe UI, sans-serif",
    h4: { fontWeight: 900 },
    h5: { fontWeight: 850 },
    button: { fontWeight: 800, textTransform: "none" },
  },
  shape: { borderRadius: 18 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(145deg, rgba(55,242,154,.08), rgba(255,255,255,.03))",
          border: "1px solid rgba(255,255,255,.09)",
        },
      },
    },
  },
});
