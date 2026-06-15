import { Box } from "@mui/material";

export function GuessScoreBlock({
  guessAway,
  guessHome,
}: {
  guessAway: number;
  guessHome: number;
}) {
  return (
    <Box
      aria-label={`Palpite ${guessHome} a ${guessAway}`}
      sx={{
        alignItems: "center",
        bgcolor: "rgba(0, 156, 60, 0.18)",
        border: "1px solid rgba(0, 156, 59, .22)",
        borderRadius: 1.5,
        color: "primary.main",
        display: "flex",
        fontSize: 18,
        fontWeight: 950,
        gap: 1,
        justifyContent: "center",
        lineHeight: 1,
        minWidth: 72,
        px: 1.25,
        py: 0.9,
        whiteSpace: "nowrap",
      }}
    >
      <Box component="span">{guessHome}</Box>
      <Box component="span">x</Box>
      <Box component="span">{guessAway}</Box>
    </Box>
  );
}
