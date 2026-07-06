import { describe, it, expect } from 'vitest';
import {
  gearRatio,
  gearInches,
  developmentM,
  speedKmh,
  cadenceFor,
  gearTable,
  setupSummary,
  totalCapacity,
  checkDerailleur,
  parseTeeth,
  formatTeeth,
  CHAINRING_PRESETS,
  CASSETTE_PRESETS,
  WHEEL_PRESETS,
} from '../gear';

// 錨定值：53/11 @ 700×25c（周長 2105mm）
// 齒比 4.818、development ≈ 10.14 m、90rpm ≈ 54.8 km/h、gear inches ≈ 127
describe('gearRatio', () => {
  it('computes 53/11 ≈ 4.818', () => {
    expect(gearRatio(53, 11)).toBeCloseTo(4.818, 3);
  });

  it('computes 34/34 = 1 (壓縮盤爬坡檔)', () => {
    expect(gearRatio(34, 34)).toBe(1);
  });
});

describe('developmentM', () => {
  it('53/11 @2105mm rolls out ≈ 10.14 m per crank rev', () => {
    expect(developmentM(gearRatio(53, 11), 2105)).toBeCloseTo(10.14, 2);
  });

  it('1:1 ratio equals the wheel circumference in metres', () => {
    expect(developmentM(1, 2105)).toBeCloseTo(2.105, 3);
  });
});

describe('gearInches', () => {
  it('53/11 @2105mm ≈ 127 gear inches', () => {
    expect(gearInches(gearRatio(53, 11), 2105)).toBeCloseTo(127.1, 1);
  });

  it('1:1 @2105mm equals the wheel diameter in inches (≈26.4)', () => {
    expect(gearInches(1, 2105)).toBeCloseTo(26.38, 2);
  });
});

describe('speedKmh', () => {
  it('53/11 @2105mm @90rpm ≈ 54.8 km/h', () => {
    expect(speedKmh(gearRatio(53, 11), 2105, 90)).toBeCloseTo(54.77, 1);
  });

  it('34/28 @2105mm @80rpm 爬坡檔 ≈ 12.3 km/h', () => {
    expect(speedKmh(gearRatio(34, 28), 2105, 80)).toBeCloseTo(12.27, 1);
  });

  it('0 rpm → 0 km/h', () => {
    expect(speedKmh(4, 2105, 0)).toBe(0);
  });
});

describe('cadenceFor (快算反推)', () => {
  it('is the inverse of speedKmh', () => {
    const ratio = gearRatio(50, 17);
    const speed = speedKmh(ratio, 2105, 95);
    expect(cadenceFor(speed, ratio, 2105)).toBeCloseTo(95, 5);
  });

  it('0 speed → 0 rpm', () => {
    expect(cadenceFor(0, 4, 2105)).toBe(0);
  });
});

describe('gearTable', () => {
  const table = gearTable({ chainrings: [50, 34], cassette: [11, 13, 15, 17, 19, 21, 24, 28], circumferenceMm: 2105 });

  it('produces rings × cogs entries', () => {
    expect(table).toHaveLength(16);
  });

  it('sorts by chainring descending then cog ascending', () => {
    expect(table[0]).toMatchObject({ chainring: 50, cog: 11 });
    expect(table[7]).toMatchObject({ chainring: 50, cog: 28 });
    expect(table[8]).toMatchObject({ chainring: 34, cog: 11 });
  });

  it('each entry carries ratio, gearInches, developmentM and speeds', () => {
    const top = table[0];
    expect(top.ratio).toBeCloseTo(50 / 11, 3);
    expect(top.developmentM).toBeCloseTo((50 / 11) * 2.105, 2);
    expect(top.speedAt[90]).toBeCloseTo(((50 / 11) * 2.105 * 90 * 60) / 1000, 1);
  });
});

describe('setupSummary (A/B 比較)', () => {
  it('summarizes range and steps for 50/34 × 11-28', () => {
    const s = setupSummary({ chainrings: [50, 34], cassette: [11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28], circumferenceMm: 2105 });
    expect(s.maxRatio).toBeCloseTo(50 / 11, 3);
    expect(s.minRatio).toBeCloseTo(34 / 28, 3);
    expect(s.rangePercent).toBeCloseTo(((50 / 11) / (34 / 28)) * 100, 1);
    expect(s.topSpeedAt90).toBeCloseTo(speedKmh(50 / 11, 2105, 90), 1);
    expect(s.gearCount).toBe(22);
    expect(s.maxStepPercent).toBeGreaterThan(0);
    expect(s.avgStepPercent).toBeGreaterThan(0);
    expect(s.maxStepPercent).toBeGreaterThanOrEqual(s.avgStepPercent);
  });

  it('single gear → zero steps', () => {
    const s = setupSummary({ chainrings: [40], cassette: [16], circumferenceMm: 2105 });
    expect(s.gearCount).toBe(1);
    expect(s.avgStepPercent).toBe(0);
    expect(s.maxStepPercent).toBe(0);
    expect(s.rangePercent).toBeCloseTo(100, 5);
  });
});

describe('totalCapacity (變速器容量)', () => {
  it('50/34 × 11-30 → (50-34)+(30-11) = 35T', () => {
    expect(totalCapacity([50, 34], [11, 13, 15, 17, 19, 21, 24, 27, 30])).toBe(35);
  });

  it('1x 單盤只算飛輪差：40T × 10-36 → 26T', () => {
    expect(totalCapacity([40], [10, 12, 14, 17, 21, 26, 31, 36])).toBe(26);
  });
});

describe('checkDerailleur', () => {
  // Shimano 105 R7000 GS：最大飛輪 34T、總容量 39T
  const rd = { maxCog: 34, capacity: 39 };

  it('passes 50/34 × 11-30 (容量 35 ≤ 39、最大齒 30 ≤ 34)', () => {
    const r = checkDerailleur([50, 34], [11, 13, 15, 17, 19, 21, 24, 27, 30], rd);
    expect(r).toEqual({ capacity: 35, capacityOk: true, maxCog: 30, maxCogOk: true, ok: true });
  });

  it('fails on max cog: 50/34 × 11-36 exceeds 34T limit', () => {
    const r = checkDerailleur([50, 34], [11, 14, 17, 20, 24, 28, 32, 36], rd);
    expect(r.maxCogOk).toBe(false);
    expect(r.ok).toBe(false);
  });

  it('fails on capacity: 53/39 with huge cassette exceeds 39T', () => {
    const r = checkDerailleur([53, 39], [11, 14, 17, 20, 24, 28, 32, 40], { maxCog: 40, capacity: 39 });
    expect(r.capacity).toBe(43);
    expect(r.capacityOk).toBe(false);
    expect(r.ok).toBe(false);
  });
});

describe('parseTeeth / formatTeeth (URL 與自訂輸入)', () => {
  it('parses "50-34" → [50, 34]', () => {
    expect(parseTeeth('50-34')).toEqual([50, 34]);
  });

  it('parses cassette "11-12-13-14-15-17-19-21-24-28"', () => {
    expect(parseTeeth('11-12-13-14-15-17-19-21-24-28')).toEqual([11, 12, 13, 14, 15, 17, 19, 21, 24, 28]);
  });

  it('rejects garbage: empty / non-numeric / out-of-range teeth → null', () => {
    expect(parseTeeth('')).toBeNull();
    expect(parseTeeth('abc')).toBeNull();
    expect(parseTeeth('50-')).toBeNull();
    expect(parseTeeth('50-0')).toBeNull();
    expect(parseTeeth('50-999')).toBeNull();
  });

  it('formatTeeth round-trips', () => {
    expect(formatTeeth([50, 34])).toBe('50-34');
    expect(parseTeeth(formatTeeth([11, 13, 15]))).toEqual([11, 13, 15]);
  });
});

describe('presets', () => {
  it('chainring presets include 標準/半壓縮/壓縮', () => {
    const labels = CHAINRING_PRESETS.map((p) => p.teeth.join('/'));
    expect(labels).toContain('53/39');
    expect(labels).toContain('52/36');
    expect(labels).toContain('50/34');
  });

  it('cassette presets are ascending and within range', () => {
    for (const p of CASSETTE_PRESETS) {
      const sorted = [...p.teeth].sort((a, b) => a - b);
      expect(p.teeth).toEqual(sorted);
      expect(p.teeth[0]).toBeGreaterThanOrEqual(9);
      expect(p.teeth[p.teeth.length - 1]).toBeLessThanOrEqual(52);
    }
  });

  it('wheel presets include 700×25c at 2105mm', () => {
    const w25 = WHEEL_PRESETS.find((w) => w.label.includes('25'));
    expect(w25?.circumferenceMm).toBe(2105);
  });
});
