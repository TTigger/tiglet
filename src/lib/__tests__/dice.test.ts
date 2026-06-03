import { describe, it, expect } from 'vitest';
import { rollDice, sum } from '../dice';

describe('rollDice', () => {
  it('rng 0 yields all 1s', () => expect(rollDice(3, 6, () => 0)).toEqual([1, 1, 1]));
  it('rng near 1 yields all max', () => expect(rollDice(2, 6, () => 0.999)).toEqual([6, 6]));
  it('returns the requested count', () => expect(rollDice(5, 20, () => 0.5)).toHaveLength(5));
});

describe('sum', () => {
  it('adds values', () => expect(sum([1, 2, 3])).toBe(6));
  it('is 0 for empty', () => expect(sum([])).toBe(0));
});
