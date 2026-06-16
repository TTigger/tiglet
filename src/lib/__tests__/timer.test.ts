import { describe, it, expect } from 'vitest';
import { formatTime, remainingFraction } from '../timer';

describe('formatTime', () => {
  it('formats under an hour as MM:SS', () => expect(formatTime(65)).toBe('01:05'));
  it('formats zero', () => expect(formatTime(0)).toBe('00:00'));
  it('formats an hour-plus as HH:MM:SS', () => expect(formatTime(3661)).toBe('01:01:01'));
  it('clamps negatives to zero', () => expect(formatTime(-5)).toBe('00:00'));
});

describe('remainingFraction', () => {
  it('is 1 at the start', () => expect(remainingFraction(300, 300)).toBe(1));
  it('is 0.5 at the halfway point', () => expect(remainingFraction(150, 300)).toBe(0.5));
  it('is 0 when finished', () => expect(remainingFraction(0, 300)).toBe(0));
  it('is 0 when total is 0', () => expect(remainingFraction(0, 0)).toBe(0));
  it('clamps out-of-range values', () => {
    expect(remainingFraction(400, 300)).toBe(1);
    expect(remainingFraction(-5, 300)).toBe(0);
  });
});
