export interface Point { x: number; y: number; }
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface SnakeState {
  snake: Point[]; // head first
  dir: Direction;
  food: Point;
  size: number; // grid is size×size
  alive: boolean;
  score: number;
}

const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  );
}

/** Pick a random cell not occupied by the snake. Falls back to the head when full. */
export function placeFood(snake: Point[], size: number, rng: () => number = Math.random): Point {
  const occupied = new Set(snake.map((p) => p.y * size + p.x));
  const free: Point[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!occupied.has(y * size + x)) free.push({ x, y });
    }
  }
  if (free.length === 0) return snake[0];
  return free[Math.floor(rng() * free.length)] ?? free[0];
}

export function newGame(size = 15, rng: () => number = Math.random): SnakeState {
  const mid = Math.floor(size / 2);
  const snake = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return { snake, dir: 'right', food: placeFood(snake, size, rng), size, alive: true, score: 0 };
}

/** Queue a direction change, ignoring 180° reversals. */
export function turn(state: SnakeState, dir: Direction): SnakeState {
  if (isOpposite(state.dir, dir)) return state;
  return { ...state, dir };
}

/** Advance one tick: move, eat, grow, and detect wall/self collisions. */
export function step(state: SnakeState, rng: () => number = Math.random): SnakeState {
  if (!state.alive) return state;
  const { size } = state;
  const d = DELTAS[state.dir];
  const head = { x: state.snake[0].x + d.x, y: state.snake[0].y + d.y };

  if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size) {
    return { ...state, alive: false };
  }

  const eating = head.x === state.food.x && head.y === state.food.y;
  // When not eating the tail vacates its cell, so it can't cause a collision.
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((p) => p.x === head.x && p.y === head.y)) {
    return { ...state, alive: false };
  }

  const snake = [head, ...body];
  if (eating) {
    return { ...state, snake, food: placeFood(snake, size, rng), score: state.score + 1 };
  }
  return { ...state, snake };
}
