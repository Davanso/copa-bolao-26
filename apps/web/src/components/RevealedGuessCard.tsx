import { Avatar, Stack, Typography } from "@mui/material";
import { GameCardShell } from "./GameCardShell";
import { GuessScoreBlock } from "./GuessScoreBlock";

export function RevealedGuessCard({
  avatarUrl,
  guessAway,
  guessHome,
  username,
}: {
  avatarUrl?: string | null;
  guessAway: number;
  guessHome: number;
  username: string;
}) {
  return (
    <GameCardShell>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
          <Avatar src={avatarUrl ?? undefined}>
            {username.slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography fontWeight={900} noWrap>
            {username}
          </Typography>
        </Stack>
        <GuessScoreBlock guessAway={guessAway} guessHome={guessHome} />
      </Stack>
    </GameCardShell>
  );
}
