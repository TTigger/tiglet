import { describe, it, expect } from 'vitest';
import {
  kjToKcal,
  kjFromPower,
  foodEquivalents,
  carbsPerHour,
  sweatRate,
  FOOD_ITEMS,
  DEFAULT_EFFICIENCY,
} from '../energy';

// 錨定：功率計 kJ ÷ 4.184 ÷ 人體效率 ≈ 消耗大卡。
// 效率 22.5% 時 1000 kJ ≈ 1062 kcal —— 即俗稱的「kJ 與大卡約 1:1」。
describe('kjToKcal', () => {
  it('1000 kJ at default 22.5% efficiency ≈ 1062 kcal', () => {
    expect(kjToKcal(1000)).toBeCloseTo(1062.3, 0);
  });

  it('efficiency bounds: 25% → 956 kcal, 20% → 1195 kcal', () => {
    expect(kjToKcal(1000, 0.25)).toBeCloseTo(955.8, 0);
    expect(kjToKcal(1000, 0.2)).toBeCloseTo(1195.0, 0);
  });

  it('0 kJ → 0 kcal', () => {
    expect(kjToKcal(0)).toBe(0);
  });
});

describe('kjFromPower', () => {
  it('200 W for 1 hour = 720 kJ', () => {
    expect(kjFromPower(200, 3600)).toBe(720);
  });

  it('250 W for 90 minutes = 1350 kJ', () => {
    expect(kjFromPower(250, 90 * 60)).toBe(1350);
  });
});

describe('foodEquivalents', () => {
  it('maps kcal to per-item counts', () => {
    const eq = foodEquivalents(500);
    const banana = eq.find((e) => e.item.id === 'banana')!;
    expect(banana.item.kcal).toBe(100);
    expect(banana.count).toBeCloseTo(5, 5);
  });

  it('0 kcal → all zero counts', () => {
    expect(foodEquivalents(0).every((e) => e.count === 0)).toBe(true);
  });

  it('every food item has positive kcal and a label', () => {
    for (const f of FOOD_ITEMS) {
      expect(f.kcal).toBeGreaterThan(0);
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

describe('carbsPerHour (騎乘中補給建議)', () => {
  it('short ride (<1h) → 0–30 g/hr', () => {
    expect(carbsPerHour(0.75)).toEqual({ min: 0, max: 30 });
  });

  it('medium ride (1–2.5h) → 30–60 g/hr', () => {
    expect(carbsPerHour(1)).toEqual({ min: 30, max: 60 });
    expect(carbsPerHour(2)).toEqual({ min: 30, max: 60 });
  });

  it('long ride (>2.5h) → 60–90 g/hr', () => {
    expect(carbsPerHour(2.5)).toEqual({ min: 60, max: 90 });
    expect(carbsPerHour(5)).toEqual({ min: 60, max: 90 });
  });
});

describe('sweatRate (排汗率)', () => {
  it('掉 1kg、補 1L、騎 2 小時 → 1 L/hr', () => {
    expect(sweatRate(70, 69, 1, 2)).toBeCloseTo(1, 5);
  });

  it('no weight change, no intake → 0', () => {
    expect(sweatRate(70, 70, 0, 2)).toBe(0);
  });

  it('0 duration → NaN (UI shows —)', () => {
    expect(sweatRate(70, 69, 0, 0)).toBeNaN();
  });
});

describe('DEFAULT_EFFICIENCY', () => {
  it('is 22.5%', () => {
    expect(DEFAULT_EFFICIENCY).toBe(0.225);
  });
});
