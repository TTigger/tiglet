import { describe, it, expect } from 'vitest';
import { parseOptions, pickIndex } from '../wheel';

describe('parseOptions', () => {
  it('splits lines, trims, drops blanks', () => {
    expect(parseOptions(' a \n\n b \nc ')).toEqual(['a', 'b', 'c']);
  });
  it('returns empty array for empty input', () => expect(parseOptions('   ')).toEqual([]));
});

describe('pickIndex', () => {
  it('maps rng 0 to first index', () => expect(pickIndex(4, () => 0)).toBe(0));
  it('maps rng near 1 to last index', () => expect(pickIndex(4, () => 0.999)).toBe(3));
  it('returns -1 for empty', () => expect(pickIndex(0, () => 0.5)).toBe(-1));
});
