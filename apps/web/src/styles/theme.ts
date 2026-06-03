import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#19c463", contrastText: "#03130a" },
    secondary: { main: "#ffd447", contrastText: "#111" },
    error: { main: "#ef3340" },
    info: { main: "#0057b8" },
    background: {
      default: "#04130c",
      paper: "rgba(8, 31, 22, 0.88)",
    },
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, Segoe UI, sans-serif",
    h3: { fontWeight: 950, letterSpacing: "-0.04em" },
    h4: { fontWeight: 930, letterSpacing: "-0.03em" },
    h5: { fontWeight: 850 },
    h6: { fontWeight: 820 },
    button: { fontWeight: 850, textTransform: "none" },
  },
  shape: { borderRadius: 22 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(145deg, rgba(25,196,99,.12), rgba(0,87,184,.08) 45%, rgba(239,51,64,.08))",
          border: "1px solid rgba(255,255,255,.11)",
          boxShadow: "0 24px 80px rgba(0,0,0,.22)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
  },
});
