import { describe, it, expect } from 'vitest';
import { percentOf, ofValue, percentChange, discountedPrice, splitTip } from '../percent';

describe('percentOf', () => {
  it('25 is 50% of 50', () => expect(percentOf(25, 50)).toBe(50));
  it('NaN when whole is 0', () => expect(Number.isNaN(percentOf(1, 0))).toBe(true));
});

describe('ofValue', () => {
  it('20% of 80 is 16', () => expect(ofValue(20, 80)).toBe(16));
});

describe('percentChange', () => {
  it('100 -> 150 is +50%', () => expect(percentChange(100, 150)).toBe(50));
  it('100 -> 75 is -25%', () => expect(percentChange(100, 75)).toBe(-25));
  it('NaN from a base of 0', () => expect(Number.isNaN(percentChange(0, 5))).toBe(true));
});

describe('discountedPrice', () => {
  it('20% off 1000 is 800', () => expect(discountedPrice(1000, 20)).toBe(800));
  it('0% off is unchanged', () => expect(discountedPrice(599, 0)).toBe(599));
});

describe('splitTip', () => {
  it('computes tip, total and per-person', () => {
    const r = splitTip(1000, 10, 4);
    expect(r.tip).toBe(100);
    expect(r.total).toBe(1100);
    expect(r.perPerson).toBe(275);
  });
  it('defaults to a single person', () => {
    expect(splitTip(200, 15).perPerson).toBe(230);
  });
  it('NaN per-person when people is 0', () => {
    expect(Number.isNaN(splitTip(100, 10, 0).perPerson)).toBe(true);
  });
});
