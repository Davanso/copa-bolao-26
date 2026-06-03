import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { Game } from "../services/types";
import {
  formatGameDate,
  statusColor,
  statusLabel,
} from "../services/gameHelpers";
import { flagForTeam } from "../services/teamFlags";

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

        <Stack gap={0.75}>
          <TeamName name={game.teamHome} />
          <Typography color="text.secondary" fontWeight={800}>
            x
          </Typography>
          <TeamName name={game.teamAway} />
        </Stack>

        <Typography color="text.secondary">{score}</Typography>
        <Typography color="text.secondary">
          {formatGameDate(game.startsAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function TeamName({ name }: { name: string }) {
  const flag = flagForTeam(name);

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      {flag && (
        <Box component="span" sx={{ fontSize: 26, lineHeight: 1 }}>
          {flag}
        </Box>
      )}
      <Typography variant="h6">{name}</Typography>
    </Stack>
  );
}
