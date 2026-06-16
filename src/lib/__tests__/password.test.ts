import { describe, it, expect } from 'vitest';
import { generatePassword, estimateStrength, strengthScore, type PasswordOptions } from '../password';

const base: PasswordOptions = { length: 12, upper: false, lower: true, digits: false, symbols: false };

describe('generatePassword', () => {
  it('produces the requested length', () => {
    expect(generatePassword({ ...base, length: 16 }).length).toBe(16);
  });
  it('uses only characters from the selected sets', () => {
    const pw = generatePassword({ length: 30, upper: false, lower: false, digits: true, symbols: false });
    expect(/^[23456789]+$/.test(pw)).toBe(true);
  });
  it('returns empty when no set is selected', () => {
    expect(generatePassword({ length: 10, upper: false, lower: false, digits: false, symbols: false })).toBe('');
  });
  it('is deterministic with an injected rng', () => {
    expect(generatePassword({ ...base, length: 4 }, () => 0)).toBe('aaaa');
  });
});

describe('estimateStrength', () => {
  it('rates a short single-set password weak', () => {
    expect(estimateStrength({ length: 6, upper: false, lower: true, digits: false, symbols: false })).toBe('weak');
  });
  it('rates a long multi-set password strong', () => {
    expect(estimateStrength({ length: 20, upper: true, lower: true, digits: true, symbols: true })).toBe('strong');
  });
});

describe('strengthScore', () => {
  it('is 0 when no set is selected', () => {
    expect(strengthScore({ length: 16, upper: false, lower: false, digits: false, symbols: false })).toBe(0);
  });
  it('caps at 1 for a long all-set password', () => {
    expect(strengthScore({ length: 64, upper: true, lower: true, digits: true, symbols: true })).toBe(1);
  });
  it('grows with length and set count', () => {
    const a = strengthScore({ length: 8, upper: false, lower: true, digits: false, symbols: false });
    const b = strengthScore({ length: 16, upper: true, lower: true, digits: false, symbols: false });
    expect(b).toBeGreaterThan(a);
  });
});
