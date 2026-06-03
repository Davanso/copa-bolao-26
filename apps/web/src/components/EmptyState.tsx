import { Paper, Stack, Typography } from "@mui/material";

export function EmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        minHeight: 240,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <Stack gap={1.5} alignItems="center" maxWidth={520}>
        <Typography sx={{ fontSize: 56, lineHeight: 1 }}>{emoji}</Typography>
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
    </Paper>
  );
}
