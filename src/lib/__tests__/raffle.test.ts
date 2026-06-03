import { describe, it, expect } from 'vitest';
import { parseNames, drawWinners } from '../raffle';

describe('parseNames', () => {
  it('splits, trims, drops blanks', () => expect(parseNames('A\n B \n\nC')).toEqual(['A', 'B', 'C']));
});

describe('drawWinners', () => {
  it('draws without repeats', () => {
    const out = drawWinners(['A', 'B', 'C'], 2, () => 0);
    expect(out).toEqual(['A', 'B']);
    expect(new Set(out).size).toBe(out.length);
  });
  it('caps at the pool size', () => {
    expect(drawWinners(['A', 'B'], 5, () => 0)).toHaveLength(2);
  });
  it('returns empty for empty pool', () => expect(drawWinners([], 3, () => 0)).toEqual([]));
});
