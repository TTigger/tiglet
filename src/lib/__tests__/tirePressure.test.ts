import { describe, it, expect } from 'vitest';
import { recommendPressure, psiToBar, WEIGHT_SPLITS, SURFACES } from '../tirePressure';

// 錨定值：模型以主流計算器（SILCA/SRAM 風格）公開參考值校準——
// 75kg 騎士（總重 85kg）、28mm、有內胎、平滑路面 ≈ 前 68 / 後 73 psi；
// 無內胎 ≈ 前 63 / 後 68 psi。
describe('recommendPressure', () => {
  const base = { totalWeightKg: 85, tireWidthMm: 28, tubeless: false, surface: 'smooth' as const, frontShare: 0.48 };

  it('85kg total on 28mm clincher ≈ F67/R73 psi', () => {
    const r = recommendPressure(base);
    expect(r.frontPsi).toBeCloseTo(67, 0);
    expect(r.rearPsi).toBeCloseTo(73, 0);
  });

  it('tubeless drops pressure ~7%', () => {
    const r = recommendPressure({ ...base, tubeless: true });
    expect(r.frontPsi).toBeCloseTo(62, 0);
    expect(r.rearPsi).toBeCloseTo(68, 0);
  });

  it('narrower tire needs higher pressure: 25mm rear ≈ 87 psi', () => {
    const r = recommendPressure({ ...base, tireWidthMm: 25 });
    expect(r.rearPsi).toBeCloseTo(87, 0);
  });

  it('wider tire needs lower pressure: 32mm rear ≈ 59 psi', () => {
    const r = recommendPressure({ ...base, tireWidthMm: 32 });
    expect(r.rearPsi).toBeCloseTo(59, 0);
  });

  it('rougher surface lowers pressure', () => {
    const smooth = recommendPressure(base);
    const rough = recommendPressure({ ...base, surface: 'rough' });
    const gravel = recommendPressure({ ...base, surface: 'gravel' });
    expect(rough.rearPsi).toBeLessThan(smooth.rearPsi);
    expect(gravel.rearPsi).toBeLessThan(rough.rearPsi);
  });

  it('heavier load raises pressure monotonically', () => {
    const light = recommendPressure({ ...base, totalWeightKg: 70 });
    const heavy = recommendPressure({ ...base, totalWeightKg: 100 });
    expect(heavy.frontPsi).toBeGreaterThan(light.frontPsi);
    expect(heavy.rearPsi).toBeGreaterThan(light.rearPsi);
  });

  it('clamps to sane bounds (20–110 psi)', () => {
    const feather = recommendPressure({ ...base, totalWeightKg: 30, tireWidthMm: 45, surface: 'gravel', tubeless: true });
    expect(feather.frontPsi).toBeGreaterThanOrEqual(20);
    const tank = recommendPressure({ ...base, totalWeightKg: 150, tireWidthMm: 23 });
    expect(tank.rearPsi).toBeLessThanOrEqual(110);
  });

  it('front + rear shares are consistent with frontShare', () => {
    const r = recommendPressure(base);
    expect(r.rearPsi).toBeGreaterThan(r.frontPsi);
  });
});

describe('psiToBar', () => {
  it('100 psi ≈ 6.89 bar', () => {
    expect(psiToBar(100)).toBeCloseTo(6.895, 2);
  });
});

describe('presets', () => {
  it('weight splits include a 48/52 default', () => {
    expect(WEIGHT_SPLITS.some((s) => s.frontShare === 0.48)).toBe(true);
  });

  it('surfaces cover smooth/rough/gravel', () => {
    expect(SURFACES.map((s) => s.id)).toEqual(['smooth', 'rough', 'gravel']);
  });
});
