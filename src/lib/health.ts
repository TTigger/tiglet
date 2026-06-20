export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

/** Body Mass Index from weight (kg) and height (cm). NaN for non-positive input. */
export function bmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return NaN;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Category using Taiwan HPA thresholds (18.5 / 24 / 27). */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 24) return 'normal';
  if (value < 27) return 'overweight';
  return 'obese';
}

/** Healthy weight range (kg) for a height, spanning BMI 18.5–24. */
export function healthyWeightRange(heightCm: number): [number, number] {
  if (heightCm <= 0) return [NaN, NaN];
  const m = heightCm / 100;
  return [18.5 * m * m, 24 * m * m];
}
