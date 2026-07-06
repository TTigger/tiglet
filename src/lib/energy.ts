// 騎乘做功與熱量換算。
// 功率計顯示的 kJ 是「輸出的機械功」；人體把食物熱量轉成機械功的效率
// 約 20–25%，而 1 kcal = 4.184 kJ —— 兩者幾乎抵銷，所以 kJ ≈ 消耗大卡。

export const KJ_PER_KCAL = 4.184;
export const DEFAULT_EFFICIENCY = 0.225;

export function kjToKcal(kj: number, efficiency: number = DEFAULT_EFFICIENCY): number {
  if (kj === 0) return 0;
  return kj / KJ_PER_KCAL / efficiency;
}

export function kjFromPower(watts: number, seconds: number): number {
  return (watts * seconds) / 1000;
}

export interface FoodItem {
  id: string;
  label: string;
  emoji: string;
  kcal: number;
}

// 常見補給與台灣小吃的概略熱量（估算值）
export const FOOD_ITEMS: FoodItem[] = [
  { id: 'gel', label: '能量膠', emoji: '🧃', kcal: 100 },
  { id: 'banana', label: '香蕉', emoji: '🍌', kcal: 100 },
  { id: 'egg', label: '茶葉蛋', emoji: '🥚', kcal: 75 },
  { id: 'onigiri', label: '御飯糰', emoji: '🍙', kcal: 200 },
  { id: 'bread', label: '菠蘿麵包', emoji: '🍞', kcal: 330 },
  { id: 'braised-pork-rice', label: '滷肉飯', emoji: '🍚', kcal: 550 },
  { id: 'bubble-tea', label: '珍珠奶茶（全糖中杯）', emoji: '🧋', kcal: 600 },
  { id: 'beef-noodle', label: '牛肉麵', emoji: '🍜', kcal: 700 },
];

export interface FoodEquivalent {
  item: FoodItem;
  count: number;
}

export function foodEquivalents(kcal: number): FoodEquivalent[] {
  return FOOD_ITEMS.map((item) => ({ item, count: kcal <= 0 ? 0 : kcal / item.kcal }));
}

// 運動營養通用建議：騎乘中每小時碳水攝取量（g/hr）
export function carbsPerHour(durationHours: number): { min: number; max: number } {
  if (durationHours < 1) return { min: 0, max: 30 };
  if (durationHours < 2.5) return { min: 30, max: 60 };
  return { min: 60, max: 90 };
}

// 排汗率（L/hr）＝（騎乘前體重 − 騎乘後體重 ＋ 補水量）÷ 時數
export function sweatRate(weightBeforeKg: number, weightAfterKg: number, fluidIntakeL: number, durationHours: number): number {
  if (durationHours === 0) return NaN;
  return (weightBeforeKg - weightAfterKg + fluidIntakeL) / durationHours;
}
