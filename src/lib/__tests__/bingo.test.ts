import { describe, it, expect } from 'vitest';
import { generateCard, drawBall, ballLabel, evaluate, FREE, type BingoCard } from '../bingo';

describe('generateCard', () => {
  const card = generateCard(() => 0.5);
  it('is 5×5', () => {
    expect(card).toHaveLength(5);
    card.forEach((row) => expect(row).toHaveLength(5));
  });
  it('has a FREE centre', () => expect(card[2][2]).toBe(FREE));
  it('keeps every column within its B/I/N/G/O range', () => {
    const ranges: [number, number][] = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        if (col === 2 && row === 2) continue; // FREE
        const v = card[row][col];
        expect(v).toBeGreaterThanOrEqual(ranges[col][0]);
        expect(v).toBeLessThanOrEqual(ranges[col][1]);
      }
    }
  });
  it('has no duplicate numbers within a column', () => {
    for (let col = 0; col < 5; col++) {
      const vals = [0, 1, 2, 3, 4].map((row) => card[row][col]).filter((v) => v !== FREE);
      expect(new Set(vals).size).toBe(vals.length);
    }
  });
});

describe('drawBall', () => {
  it('never returns an already-called ball', () => {
    const called = Array.from({ length: 74 }, (_, i) => i + 1); // 1..74 called, only 75 left
    expect(drawBall(called, () => 0.99)).toBe(75);
  });
  it('returns null when all 75 are called', () => {
    const called = Array.from({ length: 75 }, (_, i) => i + 1);
    expect(drawBall(called)).toBeNull();
  });
});

describe('ballLabel', () => {
  it('labels by column letter', () => {
    expect(ballLabel(7)).toBe('B-7');
    expect(ballLabel(16)).toBe('I-16');
    expect(ballLabel(45)).toBe('N-45');
    expect(ballLabel(60)).toBe('G-60');
    expect(ballLabel(75)).toBe('O-75');
  });
});

describe('evaluate', () => {
  const card: BingoCard = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, FREE, 48, 63],
    [4, 19, 33, 49, 64],
    [5, 20, 34, 50, 65],
  ];
  const idx = (r: number, c: number) => r * 5 + c;

  it('reports no bingo for an empty card (FREE alone is not a line)', () => {
    const e = evaluate(card, []);
    expect(e.bingo).toBe(false);
    expect(e.marked[2][2]).toBe(true); // FREE still marked
  });

  it('detects a completed row', () => {
    const e = evaluate(card, [idx(0, 0), idx(0, 1), idx(0, 2), idx(0, 3), idx(0, 4)]);
    expect(e.bingo).toBe(true);
    expect(e.patterns).toContain('1 線');
    expect(e.winning).toEqual(expect.arrayContaining([0, 1, 2, 3, 4]));
  });

  it('uses FREE for the centre when completing a diagonal', () => {
    const e = evaluate(card, [idx(0, 0), idx(1, 1), idx(3, 3), idx(4, 4)]); // centre is FREE
    expect(e.bingo).toBe(true);
    expect(e.patterns).toContain('1 線');
  });

  it('detects four corners', () => {
    const e = evaluate(card, [idx(0, 0), idx(0, 4), idx(4, 0), idx(4, 4)]);
    expect(e.patterns).toContain('四角');
  });

  it('detects a blackout', () => {
    const all = Array.from({ length: 25 }, (_, i) => i);
    const e = evaluate(card, all);
    expect(e.blackout).toBe(true);
    expect(e.patterns).toContain('全滿');
  });
});
