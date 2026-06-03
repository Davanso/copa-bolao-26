import { CircularProgress, Paper, Stack, Typography } from "@mui/material";

export function LoadingState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Paper
      sx={{
        display: "grid",
        minHeight: 240,
        p: { xs: 3, md: 5 },
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <Stack gap={2} alignItems="center" maxWidth={520}>
        <CircularProgress />
        <Stack gap={0.75}>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
