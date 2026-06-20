export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const clamp255 = (n: number) => clamp(Math.round(n), 0, 255);

/** Parse "#rgb", "#rrggbb" (with or without leading #) into RGB, or null. */
export function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Format RGB as a lowercase "#rrggbb" string. */
export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => clamp255(n).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Convert RGB (0-255) to HSL (h 0-360, s/l 0-100). */
export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn: h = ((gn - bn) / d) % 6; break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Convert HSL (h 0-360, s/l 0-100) to RGB (0-255). */
export function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hn < 60) { rp = c; gp = x; }
  else if (hn < 120) { rp = x; gp = c; }
  else if (hn < 180) { gp = c; bp = x; }
  else if (hn < 240) { gp = x; bp = c; }
  else if (hn < 300) { rp = x; bp = c; }
  else { rp = c; bp = x; }
  return {
    r: clamp255((rp + m) * 255),
    g: clamp255((gp + m) * 255),
    b: clamp255((bp + m) * 255),
  };
}

export const formatRgb = ({ r, g, b }: RGB): string =>
  `rgb(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)})`;

export const formatHsl = ({ h, s, l }: HSL): string =>
  `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;

/**
 * Parse a color from hex, rgb()/rgba() or hsl()/hsla() text. Returns RGB or null.
 * Tolerant of whitespace and an optional alpha component (alpha is dropped).
 */
export function parseColor(input: string): RGB | null {
  const str = input.trim();
  if (str === '') return null;

  const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (rgbMatch) {
    return {
      r: clamp255(Number(rgbMatch[1])),
      g: clamp255(Number(rgbMatch[2])),
      b: clamp255(Number(rgbMatch[3])),
    };
  }

  const hslMatch = str.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (hslMatch) {
    return hslToRgb({ h: Number(hslMatch[1]), s: Number(hslMatch[2]), l: Number(hslMatch[3]) });
  }

  return hexToRgb(str);
}

/** Relative luminance (WCAG) — useful for picking readable label text on a swatch. */
export function luminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const c = clamp(v, 0, 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Choose black or white text for best contrast against the given background. */
export const readableTextColor = (rgb: RGB): '#000000' | '#ffffff' =>
  luminance(rgb) > 0.179 ? '#000000' : '#ffffff';

function widestChannel(bucket: RGB[]): { range: number; channel: keyof RGB } {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of bucket) {
    if (p.r < rMin) rMin = p.r; if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g; if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b; if (p.b > bMax) bMax = p.b;
  }
  const rRange = rMax - rMin, gRange = gMax - gMin, bRange = bMax - bMin;
  if (rRange >= gRange && rRange >= bRange) return { range: rRange, channel: 'r' };
  if (gRange >= bRange) return { range: gRange, channel: 'g' };
  return { range: bRange, channel: 'b' };
}

function averageColor(bucket: RGB[]): RGB {
  const sum = bucket.reduce((a, p) => ({ r: a.r + p.r, g: a.g + p.g, b: a.b + p.b }), { r: 0, g: 0, b: 0 });
  const n = bucket.length;
  return { r: Math.round(sum.r / n), g: Math.round(sum.g / n), b: Math.round(sum.b / n) };
}

/**
 * Median-cut palette extraction. Splits the pixel set along its widest colour
 * channel until `count` buckets exist, then returns each bucket's average
 * colour, ordered by population (most dominant first). Pure and deterministic.
 */
export function extractPalette(pixels: RGB[], count = 6): RGB[] {
  if (pixels.length === 0 || count <= 0) return [];
  let buckets: RGB[][] = [pixels.slice()];

  while (buckets.length < count) {
    let bestIdx = -1;
    let bestRange = 0; // require a non-zero spread to split (identical pixels collapse to one swatch)
    let bestChannel: keyof RGB = 'r';
    buckets.forEach((bucket, i) => {
      if (bucket.length < 2) return;
      const { range, channel } = widestChannel(bucket);
      if (range > bestRange) { bestRange = range; bestIdx = i; bestChannel = channel; }
    });
    if (bestIdx === -1) break; // nothing left to split

    const bucket = buckets[bestIdx];
    bucket.sort((a, b) => a[bestChannel] - b[bestChannel]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(bestIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  return buckets
    .filter((b) => b.length > 0)
    .sort((a, b) => b.length - a.length)
    .map(averageColor);
}
