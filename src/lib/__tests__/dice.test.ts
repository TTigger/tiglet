import { describe, it, expect } from 'vitest';
import { rollDice, sum, pipsFor } from '../dice';

describe('rollDice', () => {
  it('rng 0 yields all 1s', () => expect(rollDice(3, 6, () => 0)).toEqual([1, 1, 1]));
  it('rng near 1 yields all max', () => expect(rollDice(2, 6, () => 0.999)).toEqual([6, 6]));
  it('returns the requested count', () => expect(rollDice(5, 20, () => 0.5)).toHaveLength(5));
});

describe('sum', () => {
  it('adds values', () => expect(sum([1, 2, 3])).toBe(6));
  it('is 0 for empty', () => expect(sum([])).toBe(0));
});

describe('pipsFor', () => {
  it('1 is a single center pip', () => expect(pipsFor(1)).toEqual([4]));
  it('pip count matches the face value', () => {
    for (let v = 1; v <= 6; v++) expect(pipsFor(v)).toHaveLength(v);
  });
  it('every pip index is within the 3×3 grid', () => {
    for (let v = 1; v <= 6; v++) {
      for (const i of pipsFor(v)) expect(i).toBeGreaterThanOrEqual(0), expect(i).toBeLessThan(9);
    }
  });
  it('is empty for values outside 1–6', () => {
    expect(pipsFor(0)).toEqual([]);
    expect(pipsFor(7)).toEqual([]);
    expect(pipsFor(20)).toEqual([]);
  });
});
