// 傳動齒比計算核心：齒比、gear inches、development、速度與變速器容量。
// 慣例：大盤由大到小、飛輪由小到大；輪組以「周長 mm」為單一真相
//（gear inches 的輪徑由周長反推，避免兩套輪尺寸口徑）。

export interface Drivetrain {
  chainrings: number[];
  cassette: number[];
  circumferenceMm: number;
}

export interface GearEntry {
  chainring: number;
  cog: number;
  ratio: number;
  gearInches: number;
  developmentM: number;
  speedAt: Record<number, number>; // rpm → km/h
}

export interface DerailleurSpec {
  maxCog: number;
  capacity: number;
}

export interface DerailleurCheck {
  capacity: number;
  capacityOk: boolean;
  maxCog: number;
  maxCogOk: boolean;
  ok: boolean;
}

export const SPEED_RPMS = [60, 80, 90, 100] as const;

const MIN_TEETH = 9;
const MAX_TEETH = 60;

export function gearRatio(chainring: number, cog: number): number {
  return chainring / cog;
}

export function developmentM(ratio: number, circumferenceMm: number): number {
  return (ratio * circumferenceMm) / 1000;
}

export function gearInches(ratio: number, circumferenceMm: number): number {
  const diameterInches = circumferenceMm / Math.PI / 25.4;
  return ratio * diameterInches;
}

export function speedKmh(ratio: number, circumferenceMm: number, rpm: number): number {
  return (developmentM(ratio, circumferenceMm) * rpm * 60) / 1000;
}

export function cadenceFor(speedKmh_: number, ratio: number, circumferenceMm: number): number {
  const dev = developmentM(ratio, circumferenceMm);
  if (dev === 0) return 0;
  return (speedKmh_ * 1000) / 60 / dev;
}

export function gearTable(dt: Drivetrain): GearEntry[] {
  const rings = [...dt.chainrings].sort((a, b) => b - a);
  const cogs = [...dt.cassette].sort((a, b) => a - b);
  return rings.flatMap((chainring) =>
    cogs.map((cog) => {
      const ratio = gearRatio(chainring, cog);
      const speedAt: Record<number, number> = {};
      for (const rpm of SPEED_RPMS) speedAt[rpm] = speedKmh(ratio, dt.circumferenceMm, rpm);
      return {
        chainring,
        cog,
        ratio,
        gearInches: gearInches(ratio, dt.circumferenceMm),
        developmentM: developmentM(ratio, dt.circumferenceMm),
        speedAt,
      };
    })
  );
}

export interface SetupSummary {
  gearCount: number;
  maxRatio: number;
  minRatio: number;
  rangePercent: number; // 最重檔是最輕檔的幾 %（500% = 5 倍）
  topSpeedAt90: number;
  lowSpeedAt90: number;
  avgStepPercent: number; // 相鄰檔位平均級距
  maxStepPercent: number; // 最大斷差
}

export function setupSummary(dt: Drivetrain): SetupSummary {
  const ratios = gearTable(dt)
    .map((g) => g.ratio)
    .sort((a, b) => b - a);
  const maxRatio = ratios[0];
  const minRatio = ratios[ratios.length - 1];
  const steps: number[] = [];
  for (let i = 0; i < ratios.length - 1; i++) {
    steps.push(((ratios[i] - ratios[i + 1]) / ratios[i + 1]) * 100);
  }
  return {
    gearCount: ratios.length,
    maxRatio,
    minRatio,
    rangePercent: (maxRatio / minRatio) * 100,
    topSpeedAt90: speedKmh(maxRatio, dt.circumferenceMm, 90),
    lowSpeedAt90: speedKmh(minRatio, dt.circumferenceMm, 90),
    avgStepPercent: steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : 0,
    maxStepPercent: steps.length ? Math.max(...steps) : 0,
  };
}

export function totalCapacity(chainrings: number[], cassette: number[]): number {
  const ringDiff = Math.max(...chainrings) - Math.min(...chainrings);
  const cogDiff = Math.max(...cassette) - Math.min(...cassette);
  return ringDiff + cogDiff;
}

export function checkDerailleur(chainrings: number[], cassette: number[], rd: DerailleurSpec): DerailleurCheck {
  const capacity = totalCapacity(chainrings, cassette);
  const maxCog = Math.max(...cassette);
  const capacityOk = capacity <= rd.capacity;
  const maxCogOk = maxCog <= rd.maxCog;
  return { capacity, capacityOk, maxCog, maxCogOk, ok: capacityOk && maxCogOk };
}

// 「50-34」/「11-12-…-28」←→ number[]，供 URL 狀態與自訂輸入共用
export function parseTeeth(text: string): number[] | null {
  if (!text.trim()) return null;
  const parts = text.split('-').map((s) => Number(s.trim()));
  if (parts.some((n) => !Number.isInteger(n) || n < MIN_TEETH || n > MAX_TEETH)) return null;
  return parts;
}

export function formatTeeth(teeth: number[]): string {
  return teeth.join('-');
}

export interface TeethPreset {
  label: string;
  teeth: number[];
}

export interface WheelPreset {
  label: string;
  circumferenceMm: number;
}

export interface DerailleurPreset extends DerailleurSpec {
  label: string;
}

export const CHAINRING_PRESETS: TeethPreset[] = [
  { label: '53/39 標準盤', teeth: [53, 39] },
  { label: '52/36 半壓縮', teeth: [52, 36] },
  { label: '50/34 壓縮盤', teeth: [50, 34] },
  { label: '1× 42T', teeth: [42] },
  { label: '1× 40T', teeth: [40] },
];

export const CASSETTE_PRESETS: TeethPreset[] = [
  { label: '11-25（11速）', teeth: [11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25] },
  { label: '11-28（11速）', teeth: [11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28] },
  { label: '11-30（11速）', teeth: [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30] },
  { label: '11-32（11速）', teeth: [11, 12, 13, 14, 16, 18, 20, 22, 25, 28, 32] },
  { label: '11-34（11速）', teeth: [11, 13, 15, 17, 19, 21, 23, 25, 27, 30, 34] },
  { label: '11-34（12速）', teeth: [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34] },
  { label: '10-36（12速）', teeth: [10, 11, 13, 15, 17, 19, 21, 24, 28, 32, 36] },
];

// 周長取常見碼錶設定表（ETRTO 概略值）
export const WHEEL_PRESETS: WheelPreset[] = [
  { label: '700×23c', circumferenceMm: 2096 },
  { label: '700×25c', circumferenceMm: 2105 },
  { label: '700×28c', circumferenceMm: 2136 },
  { label: '700×32c', circumferenceMm: 2155 },
  { label: '650×47b', circumferenceMm: 2090 },
];

export const DERAILLEUR_PRESETS: DerailleurPreset[] = [
  { label: 'Shimano 短腿（SS）', maxCog: 30, capacity: 35 },
  { label: 'Shimano 中腿（GS）', maxCog: 34, capacity: 39 },
  { label: 'SRAM 短腿', maxCog: 28, capacity: 33 },
  { label: 'SRAM 中腿（WiFLi）', maxCog: 32, capacity: 37 },
];
