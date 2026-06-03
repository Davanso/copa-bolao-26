import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { Game } from "../services/types";
import {
  formatGameDate,
  statusColor,
  statusLabel,
} from "../services/gameHelpers";
import { flagUrlForTeam } from "../services/teamFlags";

export function GameHeader({ game }: { game: Game }) {
  const score =
    game.scoreHome === null || game.scoreAway === null
      ? "Placar ainda não informado"
      : `${game.scoreHome} x ${game.scoreAway}`;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack gap={1.25}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Chip
            size="small"
            label={`${game.stage}${game.groupName ? ` · Grupo ${game.groupName}` : ""}`}
          />
          <Chip
            size="small"
            color={statusColor[game.status]}
            label={
              game.status === "live"
                ? `Ao vivo · ${game.liveMinute ?? "?"}'`
                : statusLabel[game.status]
            }
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          gap={{ xs: 0.75, sm: 1.25 }}
        >
          <TeamName name={game.teamHome} />
          <Typography
            color="text.secondary"
            fontWeight={900}
            sx={{
              flex: "0 0 auto",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            x
          </Typography>
          <TeamName name={game.teamAway} align="right" />
        </Stack>

        <Typography color="text.secondary">{score}</Typography>
        <Typography color="text.secondary">
          {formatGameDate(game.startsAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function TeamName({
  name,
  align = "left",
}: {
  name: string;
  align?: "left" | "right";
}) {
  const flagUrl = flagUrlForTeam(name);
  const isRight = align === "right";

  return (
    <Stack
      direction={{ xs: "row", sm: isRight ? "row-reverse" : "row" }}
      alignItems="center"
      gap={1}
      sx={{
        flex: "1 1 0",
        justifyContent: {
          xs: "center",
          sm: isRight ? "flex-start" : "flex-start",
        },
        minWidth: 0,
      }}
    >
      {flagUrl && (
        <Box
          alt={`Bandeira de ${name}`}
          component="img"
          src={flagUrl}
          sx={{
            borderRadius: 0.75,
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.18)",
            height: 20,
            objectFit: "cover",
            width: 30,
          }}
        />
      )}
      <Typography
        variant="h6"
        title={name}
        sx={{
          minWidth: 0,
          overflow: { xs: "visible", sm: "hidden" },
          textAlign: { xs: "center", sm: isRight ? "right" : "left" },
          textOverflow: { xs: "clip", sm: "ellipsis" },
          whiteSpace: { xs: "normal", sm: "nowrap" },
          wordBreak: "break-word",
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}
