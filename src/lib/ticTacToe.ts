export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[]; // length 9, index 0..8

const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const emptyBoard = (): Board => Array(9).fill(null);

/** The three indices of the winning line, or null if there is no winner. */
export function winningLine(b: Board): number[] | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}

export function winner(b: Board): Player | null {
  const line = winningLine(b);
  return line ? (b[line[0]] as Player) : null;
}

export function isDraw(b: Board): boolean {
  return b.every((c) => c !== null) && winner(b) === null;
}

const other = (p: Player): Player => (p === 'X' ? 'O' : 'X');

function minimax(b: Board, toMove: Player, me: Player): number {
  const w = winner(b);
  if (w === me) return 1;
  if (w === other(me)) return -1;
  if (isDraw(b)) return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      const next = [...b];
      next[i] = toMove;
      scores.push(minimax(next, other(toMove), me));
    }
  }
  return toMove === me ? Math.max(...scores) : Math.min(...scores);
}

export function bestMove(b: Board, player: Player): number {
  let best = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      const next = [...b];
      next[i] = player;
      const score = minimax(next, other(player), player);
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}
