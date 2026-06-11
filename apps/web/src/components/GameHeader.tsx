import { Chip, Paper, Stack, Typography } from "@mui/material";
import { TeamFlag } from "./TeamFlag";
import type { Game } from "../services/types";
import {
  formatGameDate,
  statusColor,
  statusLabel,
} from "../services/gameHelpers";

export function GameHeader({ game }: { game: Game }) {
  const hasScore = game.scoreHome !== null && game.scoreAway !== null;

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
            label={`${game.stage}${game.groupName ? ` - Grupo ${game.groupName}` : ""}`}
          />
          <Chip
            size="small"
            color={statusColor[game.status]}
            label={
              game.status === "live"
                ? `Ao vivo - ${game.liveMinute ?? "?"}'`
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
          <TeamName name={game.teamHome} score={game.scoreHome} />
          <Typography
            color={hasScore ? "primary.main" : "text.secondary"}
            fontWeight={950}
            sx={{
              flex: "0 0 auto",
              fontSize: hasScore ? 28 : 18,
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            x
          </Typography>
          <TeamName name={game.teamAway} align="right" score={game.scoreAway} />
        </Stack>

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
  score,
}: {
  name: string;
  align?: "left" | "right";
  score: number | null;
}) {
  const isRight = align === "right";

  return (
    <Stack
      direction={{ xs: "row", sm: isRight ? "row-reverse" : "row" }}
      alignItems="center"
      gap={{ xs: 1.25, sm: 1.5 }}
      sx={{
        flex: "1 1 0",
        justifyContent: {
          xs: "center",
          sm: isRight ? "flex-start" : "flex-start",
        },
        minWidth: 0,
      }}
    >
      <TeamFlag name={name} />
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
      {score !== null && (
        <Typography
          variant="h5"
          color="primary.main"
          fontWeight={950}
          sx={{
            lineHeight: 1,
            mx: { xs: 0.5, sm: 1 },
          }}
        >
          {score}
        </Typography>
      )}
    </Stack>
  );
}
