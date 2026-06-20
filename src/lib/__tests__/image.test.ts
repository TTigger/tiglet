import { describe, it, expect } from 'vitest';
import {
  computeResize,
  formatBytes,
  reductionPercent,
  clampQuality,
  renameExt,
  supportsQuality,
  FORMAT_MIME,
} from '../image';

describe('computeResize', () => {
  it('scales by percent', () => {
    expect(computeResize(800, 600, { mode: 'scale', scale: 50 })).toEqual({ width: 400, height: 300 });
  });
  it('fits a target width, preserving aspect', () => {
    expect(computeResize(800, 600, { mode: 'width', width: 400 })).toEqual({ width: 400, height: 300 });
  });
  it('fits a target height, preserving aspect', () => {
    expect(computeResize(800, 600, { mode: 'height', height: 300 })).toEqual({ width: 400, height: 300 });
  });
  it('honours exact dimensions, ignoring aspect', () => {
    expect(computeResize(800, 600, { mode: 'exact', width: 123, height: 456 })).toEqual({ width: 123, height: 456 });
  });
  it('never returns a dimension below 1px', () => {
    expect(computeResize(10, 10, { mode: 'scale', scale: 1 })).toEqual({ width: 1, height: 1 });
  });
});

describe('formatBytes', () => {
  it('formats bytes', () => expect(formatBytes(512)).toBe('512 B'));
  it('formats KB with one decimal', () => expect(formatBytes(1536)).toBe('1.5 KB'));
  it('formats MB', () => expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB'));
  it('drops the decimal above 100', () => expect(formatBytes(150 * 1024)).toBe('150 KB'));
  it('shows a dash for invalid input', () => expect(formatBytes(-1)).toBe('—'));
});

describe('reductionPercent', () => {
  it('reports a 75% reduction', () => expect(reductionPercent(1000, 250)).toBe(75));
  it('is negative when the file grows', () => expect(reductionPercent(100, 150)).toBe(-50));
  it('is NaN when before is 0', () => expect(Number.isNaN(reductionPercent(0, 10))).toBe(true));
});

describe('clampQuality', () => {
  it('clamps above 1', () => expect(clampQuality(1.5)).toBe(1));
  it('clamps below 0', () => expect(clampQuality(-0.2)).toBe(0));
  it('defaults NaN to 0.8', () => expect(clampQuality(NaN)).toBe(0.8));
});

describe('renameExt', () => {
  it('swaps the extension', () => expect(renameExt('photo.png', 'webp')).toBe('photo.webp'));
  it('handles names with dots', () => expect(renameExt('my.holiday.jpeg', 'jpg')).toBe('my.holiday.jpg'));
  it('appends when there is no extension', () => expect(renameExt('image', 'png')).toBe('image.png'));
});

describe('format metadata', () => {
  it('maps mime types', () => expect(FORMAT_MIME.webp).toBe('image/webp'));
  it('png does not support a quality slider', () => {
    expect(supportsQuality('png')).toBe(false);
    expect(supportsQuality('jpeg')).toBe(true);
  });
});
