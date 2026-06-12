import { Box, Chip, Stack, Typography } from "@mui/material";
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
    <Box>
      <Stack gap={1.5}>
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <Chip
            size="small"
            label={`${game.stage}${game.groupName ? ` - Grupo ${game.groupName}` : ""}`}
            sx={{ borderRadius: 1.5 }}
          />
          <Chip
            size="small"
            color={statusColor[game.status]}
            label={statusLabel[game.status]}
            sx={{ borderRadius: 1.5 }}
          />
        </Stack>

        <Box
          sx={{
            alignItems: "center",
            columnGap: { xs: 1, sm: 2 },
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr) auto minmax(0, 1fr)",
              sm: "minmax(0, 1fr) auto minmax(0, 1fr)",
            },
          }}
        >
          <TeamName name={game.teamHome} />
          <ScoreBlock
            hasScore={hasScore}
            scoreAway={game.scoreAway}
            scoreHome={game.scoreHome}
          />
          <TeamName name={game.teamAway} align="right" />
        </Box>

        <Typography color="text.secondary">
          {formatGameDate(game.startsAt)}
        </Typography>
      </Stack>
    </Box>
  );
}

function TeamName({
  align = "left",
  name,
}: {
  align?: "left" | "right";
  name: string;
}) {
  const isRight = align === "right";

  return (
    <Stack
      direction={{ xs: "column", sm: isRight ? "row-reverse" : "row" }}
      alignItems="center"
      gap={{ xs: 0.75, sm: 1 }}
      sx={{
        justifySelf: isRight ? "end" : "start",
        minWidth: 0,
        width: "100%",
      }}
    >
      <TeamFlag name={name} />
      <Typography
        fontWeight={900}
        title={name}
        sx={{
          fontSize: { xs: 14, sm: 18 },
          lineHeight: 1.15,
          minWidth: 0,
          overflowWrap: "anywhere",
          textAlign: { xs: "center", sm: isRight ? "right" : "left" },
          wordBreak: "normal",
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}

function ScoreBlock({
  hasScore,
  scoreAway,
  scoreHome,
}: {
  hasScore: boolean;
  scoreAway: number | null;
  scoreHome: number | null;
}) {
  return (
    <Box
      aria-label={hasScore ? `Resultado ${scoreHome} a ${scoreAway}` : "Contra"}
      sx={{
        alignItems: "center",
        bgcolor: hasScore ? "rgba(0, 156, 60, 0.32)" : "rgba(15, 23, 42, .06)",
        border: "1px solid",
        borderColor: hasScore ? "rgba(0, 156, 59, .24)" : "divider",
        borderRadius: 1.5,
        color: hasScore ? "primary.main" : "text.secondary",
        display: "flex",
        fontSize: { xs: 18, sm: 24 },
        fontWeight: 950,
        gap: { xs: 0.75, sm: 1.25 },
        justifyContent: "center",
        lineHeight: 1,
        minWidth: { xs: 58, sm: 86 },
        px: { xs: 1, sm: 1.5 },
        py: { xs: 0.8, sm: 1 },
        whiteSpace: "nowrap",
      }}
    >
      {hasScore ? (
        <>
          <Box component="span">{scoreHome}</Box>
          <Box component="span">x</Box>
          <Box component="span">{scoreAway}</Box>
        </>
      ) : (
        <>
          <Box component="span">-</Box>
          <Box component="span">x</Box>
          <Box component="span">-</Box>
        </>
      )}
    </Box>
  );
}
