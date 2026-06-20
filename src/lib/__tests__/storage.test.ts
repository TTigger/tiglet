import { describe, it, expect, beforeEach } from 'vitest';
import { getFavorites, isFavorite, toggleFavorite, getRecent, pushRecent, getNumber, setNumber } from '../storage';

beforeEach(() => { localStorage.clear(); });

describe('favorites', () => {
  it('starts empty', () => expect(getFavorites()).toEqual([]));
  it('toggles a favorite on and off', () => {
    toggleFavorite('calculator');
    expect(isFavorite('calculator')).toBe(true);
    toggleFavorite('calculator');
    expect(isFavorite('calculator')).toBe(false);
  });
});

describe('recent', () => {
  it('keeps most-recent first and de-duplicates', () => {
    pushRecent('a');
    pushRecent('b');
    pushRecent('a');
    expect(getRecent()).toEqual(['a', 'b']);
  });
  it('caps the list at 6 entries', () => {
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(pushRecent);
    expect(getRecent()).toHaveLength(6);
    expect(getRecent()[0]).toBe('g');
  });
});

describe('numbers', () => {
  it('returns the fallback when absent', () => expect(getNumber('missing', 7)).toBe(7));
  it('round-trips a stored number', () => {
    setNumber('best', 2048);
    expect(getNumber('best')).toBe(2048);
  });
  it('falls back on unparseable values', () => {
    localStorage.setItem('junk', 'not-a-number');
    expect(getNumber('junk', 3)).toBe(3);
  });
});
