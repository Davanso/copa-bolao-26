import { Chip, Stack } from "@mui/material";
import { guessFeedback } from "../services/gameHelpers";
import type { Game } from "../services/types";

export function GuessFeedbackChips({
  game,
  size = "small",
}: {
  game: Game;
  size?: "small" | "medium";
}) {
  const feedback = guessFeedback(game);

  if (!feedback) {
    return null;
  }

  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      <Chip label={feedback.label} color={feedback.color} size={size} />
      {feedback.result !== "pending" && game.myGuess?.points !== null && (
        <Chip
          label={`${game.myGuess?.points ?? 0} pontos`}
          color={(game.myGuess?.points ?? 0) > 0 ? "primary" : "default"}
          size={size}
        />
      )}
    </Stack>
  );
}
