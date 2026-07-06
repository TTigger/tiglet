// 胎壓建議：簡化經驗模型 P(psi) = K × 輪上負重(kg) ÷ 胎寬(mm)^1.6，
// K=340 以主流計算器（SILCA/SRAM 風格）的公開參考值校準
// （75kg 騎士、28mm 有內胎 ≈ 前 68 / 後 73 psi）。僅供起點參考，
// 實際以框/胎標示上限為準。

export type Surface = 'smooth' | 'rough' | 'gravel';

export interface PressureInput {
  totalWeightKg: number; // 騎士＋車＋裝備
  tireWidthMm: number;
  tubeless: boolean;
  surface: Surface;
  frontShare: number; // 前輪負重比例 0–1
}

export interface PressureResult {
  frontPsi: number;
  rearPsi: number;
  frontBar: number;
  rearBar: number;
}

const K = 340;
const WIDTH_EXP = 1.6;
const TUBELESS_FACTOR = 0.93;
const MIN_PSI = 20;
const MAX_PSI = 110;

const SURFACE_FACTORS: Record<Surface, number> = { smooth: 1, rough: 0.93, gravel: 0.85 };

export function psiToBar(psi: number): number {
  return psi * 0.0689476;
}

function clamp(psi: number): number {
  return Math.min(MAX_PSI, Math.max(MIN_PSI, psi));
}

export function recommendPressure(input: PressureInput): PressureResult {
  const widthTerm = Math.pow(input.tireWidthMm, WIDTH_EXP);
  const factor = (input.tubeless ? TUBELESS_FACTOR : 1) * SURFACE_FACTORS[input.surface];
  const wheelPsi = (loadKg: number) => clamp(((K * loadKg) / widthTerm) * factor);
  const frontPsi = wheelPsi(input.totalWeightKg * input.frontShare);
  const rearPsi = wheelPsi(input.totalWeightKg * (1 - input.frontShare));
  return { frontPsi, rearPsi, frontBar: psiToBar(frontPsi), rearBar: psiToBar(rearPsi) };
}

export interface WeightSplit {
  label: string;
  frontShare: number;
}

export const WEIGHT_SPLITS: WeightSplit[] = [
  { label: '較直立（休閒／耐力車）45/55', frontShare: 0.45 },
  { label: '一般公路姿勢 48/52', frontShare: 0.48 },
  { label: '前趴（計時／衝刺取向）50/50', frontShare: 0.5 },
];

export interface SurfaceOption {
  id: Surface;
  label: string;
}

export const SURFACES: SurfaceOption[] = [
  { id: 'smooth', label: '平滑柏油' },
  { id: 'rough', label: '粗糙路面' },
  { id: 'gravel', label: '碎石／林道' },
];
