import { describe, it, expect } from 'vitest';
import { readParam, writeParam } from '../urlState';

describe('readParam', () => {
  it('reads an existing param', () => expect(readParam('?q=12*3', 'q')).toBe('12*3'));
  it('returns null when missing', () => expect(readParam('', 'q')).toBeNull());
});

describe('writeParam', () => {
  it('sets a param', () => expect(writeParam('', 'q', '12*3')).toBe('?q=12*3'));
  it('removes the param when value is empty', () => expect(writeParam('?q=1', 'q', '')).toBe(''));
  it('preserves other params', () => expect(writeParam('?a=1', 'q', '2')).toBe('?a=1&q=2'));
});
