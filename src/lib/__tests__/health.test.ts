import { describe, it, expect } from 'vitest';
import { bmi, bmiCategory, healthyWeightRange } from '../health';

describe('bmi', () => {
  it('computes from kg and cm', () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2);
  });
  it('returns NaN for non-positive input', () => {
    expect(Number.isNaN(bmi(0, 170))).toBe(true);
    expect(Number.isNaN(bmi(60, 0))).toBe(true);
  });
});

describe('bmiCategory (Taiwan HPA)', () => {
  it('underweight below 18.5', () => expect(bmiCategory(17)).toBe('underweight'));
  it('normal in 18.5–24', () => expect(bmiCategory(22)).toBe('normal'));
  it('overweight in 24–27', () => expect(bmiCategory(25)).toBe('overweight'));
  it('obese at 27+', () => expect(bmiCategory(30)).toBe('obese'));
  it('boundary 24 is overweight', () => expect(bmiCategory(24)).toBe('overweight'));
});

describe('healthyWeightRange', () => {
  it('spans BMI 18.5 to 24', () => {
    const [min, max] = healthyWeightRange(175);
    expect(min).toBeCloseTo(56.66, 1);
    expect(max).toBeCloseTo(73.5, 1);
  });
});
