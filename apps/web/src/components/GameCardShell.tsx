import { Paper } from "@mui/material";
import type { ReactNode } from "react";

export function GameCardShell({
  children,
  featured = false,
}: {
  children: ReactNode;
  featured?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: "background.paper",
        borderColor: featured
          ? "rgba(0, 156, 59, .26)"
          : "rgba(15, 23, 42, .10)",
        borderRadius: 2,
        boxShadow: "none",
        p: featured ? { xs: 1.75, sm: 2.25 } : { xs: 1.5, sm: 2 },
      }}
    >
      {children}
    </Paper>
  );
}
