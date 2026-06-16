/** Fraction of a countdown still remaining: 1 = full, 0 = finished. */
export function remainingFraction(seconds: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, seconds / total));
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
