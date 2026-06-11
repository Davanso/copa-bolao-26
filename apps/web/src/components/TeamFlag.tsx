import { Box, CircularProgress, Tooltip } from "@mui/material";
import { useState } from "react";
import { flagUrlForTeam } from "../services/teamFlags";

export function TeamFlag({ name }: { name: string }) {
  const flagUrl = flagUrlForTeam(name);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    flagUrl ? "loading" : "error",
  );

  if (!flagUrl || status === "error") {
    return (
      <Tooltip title={`Bandeira indisponível para ${name}`}>
        <Box
          aria-label={`Bandeira indisponível para ${name}`}
          component="span"
          sx={{
            alignItems: "center",
            bgcolor: "rgba(148, 163, 184, 0.22)",
            border: "1px solid rgba(148, 163, 184, 0.32)",
            borderRadius: 0.75,
            color: "text.secondary",
            display: "inline-flex",
            fontSize: 10,
            fontWeight: 900,
            height: 20,
            justifyContent: "center",
            width: 30,
          }}
        >
          ?
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ height: 20, position: "relative", width: 30 }}>
      {status === "loading" && (
        <CircularProgress
          size={14}
          sx={{
            left: 8,
            position: "absolute",
            top: 3,
          }}
        />
      )}
      <Box
        alt={`Bandeira de ${name}`}
        component="img"
        src={flagUrl}
        sx={{
          borderRadius: 0.75,
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.18)",
          height: 20,
          objectFit: "cover",
          opacity: status === "loaded" ? 1 : 0,
          transition: "opacity 140ms ease",
          width: 30,
        }}
        onError={() => setStatus("error")}
        onLoad={() => setStatus("loaded")}
      />
    </Box>
  );
}
