export function parseNames(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
}

export function drawWinners(names: string[], count: number, rng: () => number = Math.random): string[] {
  const pool = [...names];
  const winners: string[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}
