export function calculatePoints(
  guessHome: number,
  guessAway: number,
  scoreHome: number,
  scoreAway: number,
) {
  if (guessHome === scoreHome && guessAway === scoreAway) return 3;
  const guessDiff = Math.sign(guessHome - guessAway);
  const scoreDiff = Math.sign(scoreHome - scoreAway);
  return guessDiff === scoreDiff ? 1 : 0;
}
