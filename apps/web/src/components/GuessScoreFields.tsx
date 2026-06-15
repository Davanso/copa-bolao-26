import { Button, Stack, TextField } from "@mui/material";
import { normalizeScoreInput } from "../services/scoreInput";

export type GuessScoreDraft = {
  away: string;
  home: string;
};

export function GuessScoreFields({
  awayLabel,
  buttonLabel,
  disabled = false,
  draft,
  homeLabel,
  onChange,
  onSave,
  saveDisabled = false,
}: {
  awayLabel: string;
  buttonLabel?: string;
  disabled?: boolean;
  draft: GuessScoreDraft;
  homeLabel: string;
  onChange: (draft: GuessScoreDraft) => void;
  onSave?: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} gap={1.25}>
      <TextField
        fullWidth
        label={homeLabel}
        placeholder="0"
        value={draft.home}
        disabled={disabled}
        inputProps={{ inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" }}
        onChange={(event) =>
          onChange({
            ...draft,
            home: normalizeScoreInput(event.target.value),
          })
        }
      />
      <TextField
        fullWidth
        label={awayLabel}
        placeholder="0"
        value={draft.away}
        disabled={disabled}
        inputProps={{ inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" }}
        onChange={(event) =>
          onChange({
            ...draft,
            away: normalizeScoreInput(event.target.value),
          })
        }
      />
      {buttonLabel && onSave && (
        <Button
          size="large"
          variant="contained"
          disabled={saveDisabled}
          onClick={onSave}
          sx={{ minWidth: { xs: "100%", sm: 170 } }}
        >
          {buttonLabel}
        </Button>
      )}
    </Stack>
  );
}
