import { describe, it, expect } from 'vitest';
import { convertCurrency, formatMoney } from '../currency';

const rates = { USD: 1, TWD: 32, EUR: 0.92, JPY: 150 };

describe('convertCurrency', () => {
  it('converts via the shared base', () => {
    expect(convertCurrency(1, 'USD', 'TWD', rates)).toBe(32);
  });
  it('converts between two non-base currencies', () => {
    // 320 TWD -> USD 10 -> JPY 1500
    expect(convertCurrency(320, 'TWD', 'JPY', rates)).toBeCloseTo(1500, 6);
  });
  it('is identity for same currency', () => {
    expect(convertCurrency(50, 'EUR', 'EUR', rates)).toBe(50);
  });
  it('returns NaN for an unknown currency', () => {
    expect(Number.isNaN(convertCurrency(1, 'USD', 'XYZ', rates))).toBe(true);
  });
});

describe('formatMoney', () => {
  it('adds separators and 2 decimals', () => {
    expect(formatMoney(1234567.5)).toBe('1,234,567.50');
  });
  it('shows dash for NaN', () => {
    expect(formatMoney(NaN)).toBe('—');
  });
});
