// Classic 75-ball bingo. Card is a 5×5 grid indexed [row][col].
// The centre cell ([2][2]) is the FREE space, stored as 0.
export type BingoCard = number[][];

export const FREE = 0;
const SIZE = 5;
const LETTERS = 'BINGO';

// Column j draws from a fixed range: B 1-15, I 16-30, N 31-45, G 46-60, O 61-75.
const COL_RANGES: [number, number][] = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Generate a valid bingo card: each column holds 5 distinct numbers from its range, centre is FREE. */
export function generateCard(rng: () => number = Math.random): BingoCard {
  const card: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let col = 0; col < SIZE; col++) {
    const [lo, hi] = COL_RANGES[col];
    const pool: number[] = [];
    for (let n = lo; n <= hi; n++) pool.push(n);
    const picked = shuffle(pool, rng).slice(0, SIZE);
    for (let row = 0; row < SIZE; row++) card[row][col] = picked[row];
  }
  card[2][2] = FREE;
  return card;
}

/** Draw the next ball (1-75) not yet in `called`, or null if every ball is out. */
export function drawBall(called: number[], rng: () => number = Math.random): number | null {
  const set = new Set(called);
  const remaining: number[] = [];
  for (let n = 1; n <= 75; n++) if (!set.has(n)) remaining.push(n);
  if (remaining.length === 0) return null;
  return remaining[Math.floor(rng() * remaining.length)];
}

/** Letter + number label for a ball, e.g. 7 → "B-7", 70 → "O-70". */
export function ballLabel(n: number): string {
  const col = Math.min(SIZE - 1, Math.floor((n - 1) / 15));
  return `${LETTERS[col]}-${n}`;
}

// All winning lines as lists of [row, col]: 5 rows, 5 columns, 2 diagonals.
const LINES: [number, number][][] = (() => {
  const lines: [number, number][][] = [];
  for (let r = 0; r < SIZE; r++) lines.push(Array.from({ length: SIZE }, (_, c) => [r, c] as [number, number]));
  for (let c = 0; c < SIZE; c++) lines.push(Array.from({ length: SIZE }, (_, r) => [r, c] as [number, number]));
  lines.push(Array.from({ length: SIZE }, (_, i) => [i, i] as [number, number]));
  lines.push(Array.from({ length: SIZE }, (_, i) => [i, SIZE - 1 - i] as [number, number]));
  return lines;
})();

const CORNERS: [number, number][] = [[0, 0], [0, SIZE - 1], [SIZE - 1, 0], [SIZE - 1, SIZE - 1]];

export interface BingoEval {
  /** [row][col] marked state; FREE and daubed cells are true. */
  marked: boolean[][];
  /** Flattened indices (row*5+col) belonging to a completed pattern, for highlighting. */
  winning: number[];
  /** Human labels of completed patterns, e.g. ["2 線", "四角"]. */
  patterns: string[];
  bingo: boolean;
  blackout: boolean;
}

/**
 * Evaluate a card against the player's daubed cells (flattened indices).
 * The FREE centre always counts as marked. Detects lines, four corners and a blackout.
 */
export function evaluate(card: BingoCard, marks: number[]): BingoEval {
  const set = new Set(marks);
  const marked = card.map((row, r) => row.map((v, c) => v === FREE || set.has(r * SIZE + c)));

  const win = new Set<number>();
  const patterns: string[] = [];

  let lineCount = 0;
  for (const line of LINES) {
    if (line.every(([r, c]) => marked[r][c])) {
      lineCount++;
      line.forEach(([r, c]) => win.add(r * SIZE + c));
    }
  }
  if (lineCount > 0) patterns.push(`${lineCount} 線`);

  const corners = CORNERS.every(([r, c]) => marked[r][c]);
  if (corners) {
    patterns.push('四角');
    CORNERS.forEach(([r, c]) => win.add(r * SIZE + c));
  }

  const blackout = marked.every((row) => row.every(Boolean));
  if (blackout) {
    patterns.push('全滿');
    for (let i = 0; i < SIZE * SIZE; i++) win.add(i);
  }

  return { marked, winning: [...win], patterns, bingo: lineCount > 0 || corners || blackout, blackout };
}
