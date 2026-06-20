export type Board = number[][]; // square grid, 0 = empty cell
export type Direction = 'up' | 'down' | 'left' | 'right';

export const SIZE = 4;
export const WIN_TILE = 2048;

export function emptyBoard(size = SIZE): Board {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

/** Slide one row toward index 0, merging each equal pair once. */
export function slideRow(row: number[]): { row: number[]; gained: number } {
  const nums = row.filter((n) => n !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const merged = nums[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // consume the partner
    } else {
      out.push(nums[i]);
    }
  }
  while (out.length < row.length) out.push(0);
  return { row: out, gained };
}

const transpose = (b: Board): Board => b[0].map((_, c) => b.map((row) => row[c]));
const flipRows = (b: Board): Board => b.map((row) => [...row].reverse());

/** Apply a move; returns the new board, points gained, and whether anything shifted. */
export function move(board: Board, dir: Direction): { board: Board; gained: number; moved: boolean } {
  let work = board.map((r) => [...r]);
  if (dir === 'up' || dir === 'down') work = transpose(work);
  if (dir === 'right' || dir === 'down') work = flipRows(work);

  let gained = 0;
  let out = work.map((row) => {
    const res = slideRow(row);
    gained += res.gained;
    return res.row;
  });

  if (dir === 'right' || dir === 'down') out = flipRows(out);
  if (dir === 'up' || dir === 'down') out = transpose(out);

  const moved = out.some((row, r) => row.some((v, c) => v !== board[r][c]));
  return { board: out, gained, moved };
}

export function emptyCells(board: Board): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) cells.push([r, c]); }));
  return cells;
}

/** Place a 2 (90%) or 4 (10%) on a random empty cell. Returns a new board. */
export function addRandomTile(board: Board, rng: () => number = Math.random): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(rng() * cells.length)] ?? cells[0];
  const next = board.map((row) => [...row]);
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

/** Fresh board seeded with two tiles. */
export function newGame(rng: () => number = Math.random, size = SIZE): Board {
  return addRandomTile(addRandomTile(emptyBoard(size), rng), rng);
}

export const hasWon = (board: Board, target = WIN_TILE): boolean =>
  board.some((row) => row.some((v) => v >= target));

/** True while at least one move is still possible. */
export function canMove(board: Board): boolean {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const v = board[r][c];
      if (c + 1 < board[r].length && board[r][c + 1] === v) return true;
      if (r + 1 < board.length && board[r + 1][c] === v) return true;
    }
  }
  return false;
}
