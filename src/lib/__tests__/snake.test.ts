import { describe, it, expect } from 'vitest';
import {
  isOpposite,
  placeFood,
  newGame,
  turn,
  step,
  type SnakeState,
} from '../snake';

describe('isOpposite', () => {
  it('detects opposite directions', () => {
    expect(isOpposite('up', 'down')).toBe(true);
    expect(isOpposite('left', 'right')).toBe(true);
  });
  it('is false for perpendicular directions', () => {
    expect(isOpposite('up', 'left')).toBe(false);
  });
});

describe('placeFood', () => {
  it('never lands on the snake', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    const food = placeFood(snake, 2, () => 0);
    expect(snake.some((p) => p.x === food.x && p.y === food.y)).toBe(false);
  });
});

describe('newGame', () => {
  it('creates a length-3 snake moving right', () => {
    const s = newGame(7, () => 0);
    expect(s.snake).toHaveLength(3);
    expect(s.dir).toBe('right');
    expect(s.alive).toBe(true);
    expect(s.score).toBe(0);
  });
});

describe('turn', () => {
  it('ignores a 180° reversal', () => {
    const s = newGame(7, () => 0); // moving right
    expect(turn(s, 'left').dir).toBe('right');
  });
  it('allows a perpendicular turn', () => {
    const s = newGame(7, () => 0);
    expect(turn(s, 'up').dir).toBe('up');
  });
});

describe('step', () => {
  it('advances the head in the current direction', () => {
    const s = newGame(9, () => 0);
    const head = s.snake[0];
    const next = step(s, () => 0);
    expect(next.snake[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(next.snake).toHaveLength(3); // length unchanged when not eating
  });

  it('grows and scores when eating food', () => {
    const base = newGame(9, () => 0);
    const state: SnakeState = { ...base, food: { x: base.snake[0].x + 1, y: base.snake[0].y } };
    const next = step(state, () => 0);
    expect(next.score).toBe(1);
    expect(next.snake).toHaveLength(4);
  });

  it('dies on wall collision', () => {
    const state: SnakeState = {
      snake: [{ x: 4, y: 0 }, { x: 3, y: 0 }],
      dir: 'right',
      food: { x: 0, y: 4 },
      size: 5,
      alive: true,
      score: 0,
    };
    expect(step(state, () => 0).alive).toBe(false);
  });

  it('dies on self collision', () => {
    // U-shaped snake; turning into its own body kills it
    const state: SnakeState = {
      snake: [
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
      ],
      dir: 'down',
      food: { x: 0, y: 0 },
      size: 6,
      alive: true,
      score: 0,
    };
    expect(step(state, () => 0).alive).toBe(false);
  });

  it('does not move once dead', () => {
    const dead: SnakeState = { ...newGame(9, () => 0), alive: false };
    expect(step(dead, () => 0)).toEqual(dead);
  });

  it('can move into the cell the tail is vacating', () => {
    // snake occupying a square; head chasing the tail position is allowed
    const state: SnakeState = {
      snake: [
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      dir: 'down',
      food: { x: 5, y: 5 },
      size: 6,
      alive: true,
      score: 0,
    };
    // head moves to (1,1) which the tail (1,1) is leaving — should survive
    expect(step(state, () => 0).alive).toBe(true);
  });
});
