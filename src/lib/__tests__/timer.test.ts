import { describe, it, expect } from 'vitest';
import { formatTime } from '../timer';

describe('formatTime', () => {
  it('formats under an hour as MM:SS', () => expect(formatTime(65)).toBe('01:05'));
  it('formats zero', () => expect(formatTime(0)).toBe('00:00'));
  it('formats an hour-plus as HH:MM:SS', () => expect(formatTime(3661)).toBe('01:01:01'));
  it('clamps negatives to zero', () => expect(formatTime(-5)).toBe('00:00'));
});
