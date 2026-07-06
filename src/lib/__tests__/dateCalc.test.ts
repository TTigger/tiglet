import { describe, it, expect } from 'vitest';
import {
  parseIsoDate,
  daysBetween,
  diffBreakdown,
  addDays,
  addMonths,
  countdownDays,
  workdaysBetween,
} from '../dateCalc';

describe('parseIsoDate', () => {
  it('parses YYYY-MM-DD', () => {
    const d = parseIsoDate('2026-07-06')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(6);
  });

  it('rejects invalid input', () => {
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate('2026-13-40')).toBeNull();
    expect(parseIsoDate('abc')).toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull(); // JS 會滾動到 3 月，必須擋下
  });
});

describe('daysBetween', () => {
  it('counts calendar days (exclusive)', () => {
    expect(daysBetween('2026-07-06', '2026-07-07')).toBe(1);
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('inclusive option adds the start day', () => {
    expect(daysBetween('2026-07-06', '2026-07-07', true)).toBe(2);
  });

  it('handles leap year: 2024-02-28 → 2024-03-01 is 2 days', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('non-leap year: 2026-02-28 → 2026-03-01 is 1 day', () => {
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('negative when reversed', () => {
    expect(daysBetween('2026-07-07', '2026-07-06')).toBe(-1);
  });

  it('DST-proof across long spans (always integer)', () => {
    expect(Number.isInteger(daysBetween('2020-01-01', '2026-07-06'))).toBe(true);
  });
});

describe('diffBreakdown', () => {
  it('breaks into years / months / days', () => {
    expect(diffBreakdown('2024-03-15', '2026-07-06')).toEqual({ years: 2, months: 3, days: 21, totalDays: 843 });
  });

  it('borrows days from the previous month correctly', () => {
    // 1/31 → 3/1：1 個月（1/31→2/28...）再 1 天
    expect(diffBreakdown('2026-01-31', '2026-03-01')).toMatchObject({ years: 0, months: 1, days: 1 });
  });

  it('same date → all zero', () => {
    expect(diffBreakdown('2026-07-06', '2026-07-06')).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
  });
});

describe('addDays / addMonths', () => {
  it('addDays crosses month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-07-06', -7)).toBe('2026-06-29');
  });

  it('addDays handles leap day', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('addMonths clamps to month end (1/31 + 1mo → 2/28)', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('addMonths keeps day when possible', () => {
    expect(addMonths('2026-07-06', 3)).toBe('2026-10-06');
    expect(addMonths('2026-07-06', -12)).toBe('2025-07-06');
  });
});

describe('countdownDays', () => {
  it('days until a future date', () => {
    expect(countdownDays('2026-12-25', '2026-07-06')).toBe(172);
  });

  it('0 on the day, negative after', () => {
    expect(countdownDays('2026-07-06', '2026-07-06')).toBe(0);
    expect(countdownDays('2026-07-01', '2026-07-06')).toBe(-5);
  });
});

describe('workdaysBetween', () => {
  // 2026-07-06 是週一
  it('counts weekdays in one full week (inclusive)', () => {
    expect(workdaysBetween('2026-07-06', '2026-07-12')).toBe(5); // 一到日 → 5 個工作天
  });

  it('excludes listed dates (例如補假日)', () => {
    expect(workdaysBetween('2026-07-06', '2026-07-12', ['2026-07-08'])).toBe(4);
  });

  it('weekend-only span → 0', () => {
    expect(workdaysBetween('2026-07-11', '2026-07-12')).toBe(0);
  });

  it('single weekday → 1', () => {
    expect(workdaysBetween('2026-07-06', '2026-07-06')).toBe(1);
  });
});
