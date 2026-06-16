export function rollDice(count: number, sides: number, rng: () => number = Math.random): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(1 + Math.floor(rng() * sides));
  return out;
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

// Pip layout for a six-sided die, expressed as indices on a 3×3 grid:
//   0 1 2
//   3 4 5
//   6 7 8
const D6_PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Grid indices (0–8) where a d6 face `value` shows a pip. Empty for non-1–6 values. */
export function pipsFor(value: number): number[] {
  return D6_PIPS[value] ?? [];
}
