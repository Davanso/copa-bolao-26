import { Chip, Paper, Stack, Typography } from "@mui/material";
import type { Game } from "../services/types";
import {
  formatGameDate,
  statusColor,
  statusLabel,
} from "../services/gameHelpers";

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

        <Typography variant="h6">
          {game.teamHome} x {game.teamAway}
        </Typography>

        <Typography color="text.secondary">{score}</Typography>
        <Typography color="text.secondary">
          {formatGameDate(game.startsAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}
