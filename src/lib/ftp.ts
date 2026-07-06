// FTP 訓練區間：Coggan 功率七區、Sweet Spot、W/kg 參考帶與心率區間。
// 區間百分比為業界通用值；W/kg 分級僅為概略參考帶，非官方標準。

export interface PowerZoneDef {
  zone: number;
  name: string;
  minPct: number;
  maxPct: number | null; // null = 無上限
}

export const POWER_ZONES: PowerZoneDef[] = [
  { zone: 1, name: '動態恢復', minPct: 0, maxPct: 55 },
  { zone: 2, name: '耐力', minPct: 56, maxPct: 75 },
  { zone: 3, name: '節奏', minPct: 76, maxPct: 90 },
  { zone: 4, name: '乳酸閾值', minPct: 91, maxPct: 105 },
  { zone: 5, name: '最大攝氧', minPct: 106, maxPct: 120 },
  { zone: 6, name: '無氧耐受', minPct: 121, maxPct: 150 },
  { zone: 7, name: '神經肌肉', minPct: 151, maxPct: null },
];

export interface PowerZone extends PowerZoneDef {
  minW: number;
  maxW: number | null;
}

export function powerZones(ftp: number): PowerZone[] {
  return POWER_ZONES.map((z) => ({
    ...z,
    minW: Math.round((ftp * z.minPct) / 100),
    maxW: z.maxPct === null ? null : Math.round((ftp * z.maxPct) / 100),
  }));
}

export function sweetSpot(ftp: number): { minW: number; maxW: number } {
  return { minW: Math.round(ftp * 0.88), maxW: Math.round(ftp * 0.94) };
}

export function wPerKg(ftp: number, weightKg: number): number {
  if (weightKg <= 0) return NaN;
  return ftp / weightKg;
}

export interface WkgBand {
  label: string;
  min: number;
}

// 概略參考帶（由高至低比對）
export const WKG_BANDS: WkgBand[] = [
  { label: '精英', min: 5.0 },
  { label: '業餘強者', min: 4.0 },
  { label: '進階', min: 3.0 },
  { label: '休閒', min: 2.0 },
  { label: '入門', min: 0 },
];

export function wkgLevel(wkg: number): WkgBand {
  return WKG_BANDS.find((b) => wkg >= b.min) ?? WKG_BANDS[WKG_BANDS.length - 1];
}

export interface HrZone {
  zone: number;
  name: string;
  minBpm: number;
  maxBpm: number | null;
}

// Coggan LTHR 五區
const LTHR_ZONES = [
  { zone: 1, name: '恢復', minPct: 0, maxPct: 68 },
  { zone: 2, name: '耐力', minPct: 69, maxPct: 83 },
  { zone: 3, name: '節奏', minPct: 84, maxPct: 94 },
  { zone: 4, name: '閾值', minPct: 95, maxPct: 105 },
  { zone: 5, name: '無氧', minPct: 106, maxPct: null },
];

export function hrZonesFromLthr(lthr: number): HrZone[] {
  return LTHR_ZONES.map((z) => ({
    zone: z.zone,
    name: z.name,
    minBpm: Math.round((lthr * z.minPct) / 100),
    maxBpm: z.maxPct === null ? null : Math.round((lthr * z.maxPct) / 100),
  }));
}

// 最大心率法五區（50–100%，每 10% 一區）
const MAX_HR_ZONES = [
  { zone: 1, name: '暖身', minPct: 50, maxPct: 60 },
  { zone: 2, name: '燃脂', minPct: 60, maxPct: 70 },
  { zone: 3, name: '有氧', minPct: 70, maxPct: 80 },
  { zone: 4, name: '無氧', minPct: 80, maxPct: 90 },
  { zone: 5, name: '極限', minPct: 90, maxPct: 100 },
];

export function hrZonesFromMax(maxHr: number): HrZone[] {
  return MAX_HR_ZONES.map((z) => ({
    zone: z.zone,
    name: z.name,
    minBpm: Math.round((maxHr * z.minPct) / 100),
    maxBpm: Math.round((maxHr * z.maxPct) / 100),
  }));
}
