import { describe, it, expect } from 'vitest';
import { convert, convertTemperature, formatNumber } from '../units';

describe('convert (length)', () => {
  it('km to m', () => expect(convert(1, 'km', 'm', 'length')).toBe(1000));
  it('in to cm', () => expect(convert(1, 'in', 'cm', 'length')).toBeCloseTo(2.54, 6));
  it('mi to km', () => expect(convert(1, 'mi', 'km', 'length')).toBeCloseTo(1.609344, 6));
});

describe('convert (mass)', () => {
  it('kg to g', () => expect(convert(2, 'kg', 'g', 'mass')).toBe(2000));
  it('lb to kg', () => expect(convert(1, 'lb', 'kg', 'mass')).toBeCloseTo(0.45359237, 6));
});

describe('convert (area / volume / speed / data)', () => {
  it('ping to m²', () => expect(convert(1, 'ping', 'm2', 'area')).toBeCloseTo(3.305785, 5));
  it('l to ml', () => expect(convert(1, 'l', 'ml', 'volume')).toBe(1000));
  it('kmh to mps', () => expect(convert(36, 'kmh', 'mps', 'speed')).toBeCloseTo(10, 6));
  it('gb to mb', () => expect(convert(1, 'gb', 'mb', 'data')).toBe(1024));
});

describe('convert edge cases', () => {
  it('same unit is identity', () => expect(convert(42, 'm', 'm', 'length')).toBe(42));
  it('unknown unit yields NaN', () => expect(Number.isNaN(convert(1, 'xx', 'm', 'length'))).toBe(true));
});

describe('convertTemperature', () => {
  it('C to F', () => expect(convertTemperature(100, 'C', 'F')).toBe(212));
  it('F to C', () => expect(convertTemperature(32, 'F', 'C')).toBe(0));
  it('C to K', () => expect(convertTemperature(0, 'C', 'K')).toBeCloseTo(273.15, 6));
  it('K to C', () => expect(convertTemperature(273.15, 'K', 'C')).toBeCloseTo(0, 6));
  it('round-trips C->F->C', () => expect(convertTemperature(convertTemperature(37, 'C', 'F'), 'F', 'C')).toBeCloseTo(37, 6));
});

describe('formatNumber', () => {
  it('trims floating point noise', () => expect(formatNumber(0.1 + 0.2)).toBe('0.3'));
  it('keeps integers clean', () => expect(formatNumber(1000)).toBe('1000'));
  it('preserves large integers exactly (no 7-sig-fig rounding)', () => {
    expect(formatNumber(convert(1, 'gb', 'b', 'data'))).toBe('1073741824');
  });
  it('keeps fractional precision', () => expect(formatNumber(1.609344)).toBe('1.609344'));
  it('handles zero', () => expect(formatNumber(0)).toBe('0'));
  it('shows dash for NaN', () => expect(formatNumber(NaN)).toBe('—'));
});
