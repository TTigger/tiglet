import { describe, it, expect } from 'vitest';
import { contrastRatio, darkenUntilReadable, relativeLuminance } from '../contrast';

describe('relativeLuminance', () => {
  it('anchors at the extremes', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#FFFFFF')).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(relativeLuminance('#d97757')).toBeCloseTo(relativeLuminance('#D97757'), 12);
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  it('is 1:1 for a colour against itself', () => {
    expect(contrastRatio('#D97757', '#D97757')).toBeCloseTo(1, 12);
  });

  it('does not depend on argument order', () => {
    expect(contrastRatio('#2F6F62', '#FAF9F5')).toBeCloseTo(contrastRatio('#FAF9F5', '#2F6F62'), 12);
  });

  it('reports the terracotta brand colour as too weak on cream', () => {
    // 這正是設計稿抓到的問題：品牌橘直接當小字用讀不清楚
    expect(contrastRatio('#D97757', '#FAF9F5')).toBeLessThan(4.5);
  });
});

describe('darkenUntilReadable', () => {
  const CREAM = '#FAF9F5';

  it('darkens a weak colour until it clears the target', () => {
    const out = darkenUntilReadable('#D97757', CREAM, 4.5);
    expect(contrastRatio(out, CREAM)).toBeGreaterThanOrEqual(4.5);
  });

  it('leaves a colour that already clears the target untouched', () => {
    // 深松綠在 cream 上本來就有 5.58:1
    expect(darkenUntilReadable('#2F6F62', CREAM, 4.5)).toBe('#2f6f62');
  });

  it('returns a valid six-digit hex', () => {
    expect(darkenUntilReadable('#A8853A', CREAM, 4.5)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('is deterministic', () => {
    expect(darkenUntilReadable('#8A6A9B', CREAM, 4.5)).toBe(darkenUntilReadable('#8A6A9B', CREAM, 4.5));
  });

  it('never returns a lighter colour than it was given', () => {
    expect(relativeLuminance(darkenUntilReadable('#D97757', CREAM, 4.5))).toBeLessThanOrEqual(relativeLuminance('#D97757'));
  });
});
