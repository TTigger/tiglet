export type UnitCategory = 'length' | 'mass' | 'temperature' | 'area' | 'volume' | 'speed' | 'data';

export interface UnitDef {
  id: string;
  label: string;
  toBase: number; // value_in_base = value * toBase
}

export interface CategoryDef {
  label: string;
  units: UnitDef[];
}

// Linear-conversion categories. Temperature is handled separately.
export const CATEGORIES: Record<Exclude<UnitCategory, 'temperature'>, CategoryDef> = {
  length: {
    label: '長度',
    units: [
      { id: 'mm', label: '公釐 mm', toBase: 0.001 },
      { id: 'cm', label: '公分 cm', toBase: 0.01 },
      { id: 'm', label: '公尺 m', toBase: 1 },
      { id: 'km', label: '公里 km', toBase: 1000 },
      { id: 'in', label: '英吋 in', toBase: 0.0254 },
      { id: 'ft', label: '英尺 ft', toBase: 0.3048 },
      { id: 'yd', label: '碼 yd', toBase: 0.9144 },
      { id: 'mi', label: '英里 mi', toBase: 1609.344 },
    ],
  },
  mass: {
    label: '重量',
    units: [
      { id: 'mg', label: '毫克 mg', toBase: 0.001 },
      { id: 'g', label: '公克 g', toBase: 1 },
      { id: 'kg', label: '公斤 kg', toBase: 1000 },
      { id: 't', label: '公噸 t', toBase: 1_000_000 },
      { id: 'oz', label: '盎司 oz', toBase: 28.349523125 },
      { id: 'lb', label: '磅 lb', toBase: 453.59237 },
    ],
  },
  area: {
    label: '面積',
    units: [
      { id: 'cm2', label: '平方公分 cm²', toBase: 0.0001 },
      { id: 'm2', label: '平方公尺 m²', toBase: 1 },
      { id: 'ping', label: '坪', toBase: 3.305785 },
      { id: 'ha', label: '公頃 ha', toBase: 10_000 },
      { id: 'km2', label: '平方公里 km²', toBase: 1_000_000 },
      { id: 'ft2', label: '平方英尺 ft²', toBase: 0.09290304 },
      { id: 'acre', label: '英畝 acre', toBase: 4046.8564224 },
    ],
  },
  volume: {
    label: '體積',
    units: [
      { id: 'ml', label: '毫升 mL', toBase: 0.001 },
      { id: 'l', label: '公升 L', toBase: 1 },
      { id: 'm3', label: '立方公尺 m³', toBase: 1000 },
      { id: 'cup', label: '杯 cup', toBase: 0.2365882365 },
      { id: 'gal', label: '加侖 gal', toBase: 3.785411784 },
    ],
  },
  speed: {
    label: '速度',
    units: [
      { id: 'mps', label: '公尺/秒 m/s', toBase: 1 },
      { id: 'kmh', label: '公里/時 km/h', toBase: 0.2777777778 },
      { id: 'mph', label: '英里/時 mph', toBase: 0.44704 },
      { id: 'knot', label: '節 knot', toBase: 0.5144444444 },
    ],
  },
  data: {
    label: '資料量',
    units: [
      { id: 'b', label: 'Bytes', toBase: 1 },
      { id: 'kb', label: 'KB', toBase: 1024 },
      { id: 'mb', label: 'MB', toBase: 1024 ** 2 },
      { id: 'gb', label: 'GB', toBase: 1024 ** 3 },
      { id: 'tb', label: 'TB', toBase: 1024 ** 4 },
    ],
  },
};

export const TEMPERATURE: CategoryDef = {
  label: '溫度',
  units: [
    { id: 'C', label: '攝氏 °C', toBase: 1 },
    { id: 'F', label: '華氏 °F', toBase: 1 },
    { id: 'K', label: '克耳文 K', toBase: 1 },
  ],
};

export function convertTemperature(value: number, from: string, to: string): number {
  let c: number;
  if (from === 'C') c = value;
  else if (from === 'F') c = (value - 32) * (5 / 9);
  else if (from === 'K') c = value - 273.15;
  else return NaN;

  if (to === 'C') return c;
  if (to === 'F') return c * (9 / 5) + 32;
  if (to === 'K') return c + 273.15;
  return NaN;
}

/** Convert a value between two units of the same category. Returns NaN on unknown units. */
export function convert(value: number, from: string, to: string, category: UnitCategory): number {
  if (category === 'temperature') return convertTemperature(value, from, to);
  const def = CATEGORIES[category];
  const f = def.units.find((u) => u.id === from);
  const t = def.units.find((u) => u.id === to);
  if (!f || !t) return NaN;
  return (value * f.toBase) / t.toBase;
}

/** Trim floating-point noise for display (up to 6 significant decimals). */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const rounded = Number(n.toPrecision(7));
  return String(rounded);
}
