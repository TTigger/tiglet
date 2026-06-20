import { describe, it, expect } from 'vitest';
import { offsetMinutes, offsetLabel, diffMinutes, diffLabel, formatInZone } from '../timezone';

// A fixed winter instant so DST behaviour is deterministic.
const winter = new Date('2024-01-15T12:00:00Z');
// A fixed summer instant for northern-hemisphere DST.
const summer = new Date('2024-07-15T12:00:00Z');

describe('offsetMinutes', () => {
  it('Taipei is UTC+8 year round', () => {
    expect(offsetMinutes(winter, 'Asia/Taipei')).toBe(480);
    expect(offsetMinutes(summer, 'Asia/Taipei')).toBe(480);
  });
  it('UTC is 0', () => {
    expect(offsetMinutes(winter, 'UTC')).toBe(0);
  });
  it('New York is -5 in winter, -4 in summer (DST)', () => {
    expect(offsetMinutes(winter, 'America/New_York')).toBe(-300);
    expect(offsetMinutes(summer, 'America/New_York')).toBe(-240);
  });
});

describe('offsetLabel', () => {
  it('formats positive whole hours', () => expect(offsetLabel(480)).toBe('UTC+8'));
  it('formats negative whole hours', () => expect(offsetLabel(-300)).toBe('UTC-5'));
  it('formats half-hour offsets', () => expect(offsetLabel(330)).toBe('UTC+5:30'));
});

describe('diffMinutes / diffLabel', () => {
  it('Taipei is 13h ahead of New York in winter', () => {
    expect(diffMinutes(winter, 'America/New_York', 'Asia/Taipei')).toBe(780);
  });
  it('labels ahead/behind/same', () => {
    expect(diffLabel(780)).toBe('快 13 小時');
    expect(diffLabel(-90)).toBe('慢 1 小時 30 分');
    expect(diffLabel(0)).toBe('同時區');
  });
});

describe('formatInZone', () => {
  it('renders wall-clock time for the zone', () => {
    // 12:00 UTC is 20:00 in Taipei
    expect(formatInZone(winter, 'Asia/Taipei').time).toBe('20:00');
  });
});
