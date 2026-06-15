export function scoreToInput(score?: number | null) {
  return score === undefined || score === null ? "" : String(score);
}

export function inputToScore(value: string) {
  if (!value) {
    return null;
  }

  const score = Number(value);
  return Number.isInteger(score) && score >= 0 ? score : null;
}

export function normalizeScoreInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function isValidScore(value: number | null) {
  return value !== null && value >= 0 && value <= 30;
}
