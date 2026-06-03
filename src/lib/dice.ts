export function rollDice(count: number, sides: number, rng: () => number = Math.random): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(1 + Math.floor(rng() * sides));
  return out;
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
