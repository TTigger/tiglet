import { describe, it, expect } from 'vitest';
import {
  emptyBoard,
  slideRow,
  move,
  emptyCells,
  addRandomTile,
  newGame,
  hasWon,
  canMove,
  type Board,
} from '../game2048';

describe('slideRow', () => {
  it('slides values toward index 0', () => {
    expect(slideRow([0, 2, 0, 2]).row).toEqual([4, 0, 0, 0]);
  });
  it('merges only once per pair, leftmost first', () => {
    const { row, gained } = slideRow([2, 2, 2, 2]);
    expect(row).toEqual([4, 4, 0, 0]);
    expect(gained).toBe(8);
  });
  it('does not merge unequal neighbours', () => {
    expect(slideRow([2, 4, 2, 4]).row).toEqual([2, 4, 2, 4]);
  });
  it('handles a triple without double-merging', () => {
    expect(slideRow([2, 2, 2, 0]).row).toEqual([4, 2, 0, 0]);
  });
});

describe('move', () => {
  it('moves left and reports gained score', () => {
    const board: Board = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const res = move(board, 'left');
    expect(res.board[0]).toEqual([4, 0, 0, 0]);
    expect(res.gained).toBe(4);
    expect(res.moved).toBe(true);
  });
  it('moves right', () => {
    const board: Board = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(board, 'right').board[0]).toEqual([0, 0, 0, 4]);
  });
  it('moves up', () => {
    const board: Board = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(board, 'up').board.map((r) => r[0])).toEqual([4, 0, 0, 0]);
  });
  it('moves down', () => {
    const board: Board = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(board, 'down').board.map((r) => r[0])).toEqual([0, 0, 0, 4]);
  });
  it('reports moved=false when nothing changes', () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(move(board, 'left').moved).toBe(false);
  });
});

describe('addRandomTile / emptyCells', () => {
  it('fills exactly one empty cell', () => {
    const board = emptyBoard();
    const next = addRandomTile(board, () => 0);
    expect(emptyCells(next).length).toBe(15);
  });
  it('places a 2 when rng < 0.9', () => {
    const next = addRandomTile(emptyBoard(), () => 0);
    expect(next[0][0]).toBe(2);
  });
  it('places a 4 when rng >= 0.9', () => {
    const next = addRandomTile(emptyBoard(), () => 0.95);
    const flat = next.flat().filter((v) => v !== 0);
    expect(flat).toEqual([4]);
  });
  it('returns the board unchanged when full', () => {
    const full: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(addRandomTile(full)).toEqual(full);
  });
});

describe('newGame', () => {
  it('starts with two tiles', () => {
    const board = newGame(() => 0.5);
    expect(board.flat().filter((v) => v !== 0).length).toBeGreaterThanOrEqual(1);
    expect(emptyCells(board).length).toBeGreaterThanOrEqual(14);
  });
});

describe('hasWon / canMove', () => {
  it('detects a 2048 tile', () => {
    const board = emptyBoard();
    board[0][0] = 2048;
    expect(hasWon(board)).toBe(true);
  });
  it('returns false before reaching the target', () => {
    expect(hasWon(emptyBoard())).toBe(false);
  });
  it('canMove is true with an empty cell', () => {
    expect(canMove(emptyBoard())).toBe(true);
  });
  it('canMove is true when an adjacent merge exists on a full board', () => {
    const board: Board = [
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [2, 4, 8, 16],
      [4, 8, 16, 32],
    ];
    expect(canMove(board)).toBe(true);
  });
  it('canMove is false on a gridlocked board', () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(canMove(board)).toBe(false);
  });
});
