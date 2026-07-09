// WCAG 相對亮度與對比度。用來確保分類色當小字時在卡片底色上讀得清楚，
// 不靠目測。純函式，只吃 #RRGGBB。

function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * 把顏色逐步壓暗，直到它在 `bg`（假設是淺色）上達到 `target` 對比。
 * 每個通道乘以遞減的係數，亮度單調下降，所以對比單調上升 —— 迴圈必定收斂。
 * 已達標的顏色原樣回傳。
 */
export function darkenUntilReadable(color: string, bg: string, target = 4.5): string {
  const rgb = channels(color);
  const toHex = (factor: number) =>
    '#' + rgb.map((c) => Math.round(c * factor).toString(16).padStart(2, '0')).join('');

  for (let factor = 1; factor > 0.3; factor -= 0.02) {
    const candidate = toHex(factor);
    if (contrastRatio(candidate, bg) >= target) return candidate;
  }
  return toHex(0.3);
}
