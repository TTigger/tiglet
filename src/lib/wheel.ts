export function parseOptions(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
}

export function pickIndex(count: number, rng: () => number = Math.random): number {
  if (count <= 0) return -1;
  return Math.min(count - 1, Math.floor(rng() * count));
}
