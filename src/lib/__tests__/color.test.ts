import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  formatRgb,
  formatHsl,
  parseColor,
  luminance,
  readableTextColor,
  extractPalette,
  type RGB,
} from '../color';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });
  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });
  it('tolerates a missing # and surrounding whitespace', () => {
    expect(hexToRgb('  00ff00 ')).toEqual({ r: 0, g: 255, b: 0 });
  });
  it('returns null for invalid input', () => {
    expect(hexToRgb('#ggg')).toBeNull();
    expect(hexToRgb('nope')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('formats lowercase, zero-padded', () => {
    expect(rgbToHex({ r: 0, g: 136, b: 255 })).toBe('#0088ff');
  });
  it('clamps out-of-range channels', () => {
    expect(rgbToHex({ r: 300, g: -10, b: 128 })).toBe('#ff0080');
  });
  it('round-trips with hexToRgb', () => {
    const hex = '#3a7bd5';
    expect(rgbToHex(hexToRgb(hex)!)).toBe(hex);
  });
});

describe('rgbToHsl / hslToRgb', () => {
  it('converts pure red', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
  });
  it('converts white (no saturation)', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });
  it('converts black', () => {
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
  });
  it('hslToRgb reproduces primary colours', () => {
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
  });
  it('round-trips rgb -> hsl -> rgb closely', () => {
    const rgb: RGB = { r: 58, g: 123, b: 213 };
    const back = hslToRgb(rgbToHsl(rgb));
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
  });
  it('wraps negative and >360 hues', () => {
    expect(hslToRgb({ h: -120, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
    expect(hslToRgb({ h: 480, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
  });
});

describe('formatRgb / formatHsl', () => {
  it('formats rgb()', () => {
    expect(formatRgb({ r: 1, g: 2, b: 3 })).toBe('rgb(1, 2, 3)');
  });
  it('formats hsl()', () => {
    expect(formatHsl({ h: 210, s: 50, l: 40 })).toBe('hsl(210, 50%, 40%)');
  });
});

describe('parseColor', () => {
  it('parses hex', () => {
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });
  it('parses rgb() and rgba()', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30 });
  });
  it('parses hsl()', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 });
  });
  it('clamps rgb channels above 255', () => {
    expect(parseColor('rgb(300, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 });
  });
  it('returns null for junk', () => {
    expect(parseColor('hello')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('luminance / readableTextColor', () => {
  it('white is brighter than black', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(luminance({ r: 0, g: 0, b: 0 }));
  });
  it('picks black text on a light background', () => {
    expect(readableTextColor({ r: 255, g: 255, b: 255 })).toBe('#000000');
  });
  it('picks white text on a dark background', () => {
    expect(readableTextColor({ r: 0, g: 0, b: 0 })).toBe('#ffffff');
  });
});

describe('extractPalette', () => {
  it('returns an empty array for no pixels', () => {
    expect(extractPalette([], 5)).toEqual([]);
  });
  it('returns at most `count` colours', () => {
    const pixels: RGB[] = [];
    for (let i = 0; i < 100; i++) pixels.push({ r: i * 2, g: 255 - i, b: (i * 3) % 256 });
    expect(extractPalette(pixels, 4).length).toBeLessThanOrEqual(4);
  });
  it('separates two distinct clusters', () => {
    const pixels: RGB[] = [];
    for (let i = 0; i < 50; i++) pixels.push({ r: 250, g: 5, b: 5 });
    for (let i = 0; i < 50; i++) pixels.push({ r: 5, g: 5, b: 250 });
    const palette = extractPalette(pixels, 2);
    expect(palette).toHaveLength(2);
    const hasRed = palette.some((c) => c.r > 200 && c.b < 50);
    const hasBlue = palette.some((c) => c.b > 200 && c.r < 50);
    expect(hasRed && hasBlue).toBe(true);
  });
  it('orders the more populous cluster first', () => {
    const pixels: RGB[] = [];
    for (let i = 0; i < 90; i++) pixels.push({ r: 250, g: 0, b: 0 });
    for (let i = 0; i < 10; i++) pixels.push({ r: 0, g: 0, b: 250 });
    const palette = extractPalette(pixels, 2);
    expect(palette[0].r).toBeGreaterThan(palette[0].b);
  });
  it('collapses a single-colour image to one swatch', () => {
    const pixels: RGB[] = Array.from({ length: 40 }, () => ({ r: 100, g: 150, b: 200 }));
    const palette = extractPalette(pixels, 6);
    expect(palette).toHaveLength(1);
    expect(palette[0]).toEqual({ r: 100, g: 150, b: 200 });
  });
});
