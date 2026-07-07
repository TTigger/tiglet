import { describe, it, expect } from 'vitest';
import { formatTime, remainingFraction, intervalAt, intervalTotalSec } from '../timer';

describe('interval training (30s work / 15s rest × 3)', () => {
  const cfg = { workSec: 30, restSec: 15, sets: 3 };

  it('total skips the final rest: 3×30 + 2×15 = 120', () => {
    expect(intervalTotalSec(cfg)).toBe(120);
  });

  it('walks through the phases', () => {
    expect(intervalAt(0, cfg)).toEqual({ kind: 'work', set: 1, remaining: 30, totalRemaining: 120 });
    expect(intervalAt(30, cfg)).toEqual({ kind: 'rest', set: 1, remaining: 15, totalRemaining: 90 });
    expect(intervalAt(45, cfg)).toEqual({ kind: 'work', set: 2, remaining: 30, totalRemaining: 75 });
    expect(intervalAt(119, cfg)).toEqual({ kind: 'work', set: 3, remaining: 1, totalRemaining: 1 });
  });

  it('returns null when finished or config invalid', () => {
    expect(intervalAt(120, cfg)).toBeNull();
    expect(intervalAt(0, { workSec: 0, restSec: 10, sets: 3 })).toBeNull();
    expect(intervalAt(0, { workSec: 30, restSec: 10, sets: 0 })).toBeNull();
  });

  it('rest 0 works (Tabata 式無休息銜接)', () => {
    const c = { workSec: 20, restSec: 0, sets: 2 };
    expect(intervalTotalSec(c)).toBe(40);
    expect(intervalAt(20, c)).toEqual({ kind: 'work', set: 2, remaining: 20, totalRemaining: 20 });
  });
});

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
