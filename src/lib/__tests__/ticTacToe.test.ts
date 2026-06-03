import { describe, it, expect } from 'vitest';
import { emptyBoard, winner, isDraw, bestMove, type Board } from '../ticTacToe';

describe('winner', () => {
  it('detects a row win', () => {
    const b: Board = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(winner(b)).toBe('X');
  });
  it('detects a diagonal win', () => {
    const b: Board = ['O', null, null, null, 'O', null, null, null, 'O'];
    expect(winner(b)).toBe('O');
  });
  it('returns null when no winner', () => {
    expect(winner(emptyBoard())).toBeNull();
  });
});

describe('isDraw', () => {
  it('is true on a full board with no winner', () => {
    const b: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(isDraw(b)).toBe(true);
  });
  it('is false on an empty board', () => expect(isDraw(emptyBoard())).toBe(false));
});

describe('bestMove', () => {
  it('takes the winning move', () => {
    const b: Board = ['O', 'O', null, null, 'X', null, null, null, 'X'];
    expect(bestMove(b, 'O')).toBe(2);
  });
  it('blocks the opponent winning move', () => {
    const b: Board = ['X', 'X', null, null, 'O', null, null, null, null];
    expect(bestMove(b, 'O')).toBe(2);
  });
});
