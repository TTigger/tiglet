export type ImageFormat = 'jpeg' | 'png' | 'webp';

export const FORMAT_MIME: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const FORMAT_EXT: Record<ImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

/** PNG is lossless, so a quality slider does not apply to it. */
export const supportsQuality = (format: ImageFormat): boolean => format !== 'png';

export type ResizeMode = 'scale' | 'width' | 'height' | 'exact';

export interface ResizeOpts {
  mode: ResizeMode;
  scale?: number; // percent, for 'scale'
  width?: number;
  height?: number;
}

/** Target dimensions for a resize, preserving aspect ratio except in 'exact' mode. */
export function computeResize(srcW: number, srcH: number, opts: ResizeOpts): { width: number; height: number } {
  const ratio = srcH === 0 ? 1 : srcW / srcH;
  const px = (n: number) => Math.max(1, Math.round(n));
  switch (opts.mode) {
    case 'scale': {
      const s = (opts.scale ?? 100) / 100;
      return { width: px(srcW * s), height: px(srcH * s) };
    }
    case 'width': {
      const w = px(opts.width ?? srcW);
      return { width: w, height: px(w / ratio) };
    }
    case 'height': {
      const h = px(opts.height ?? srcH);
      return { width: px(h * ratio), height: h };
    }
    case 'exact':
      return { width: px(opts.width ?? srcW), height: px(opts.height ?? srcH) };
    default:
      return { width: px(srcW), height: px(srcH) };
  }
}

/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** Percentage size reduction from `before` to `after` (negative means it grew). */
export function reductionPercent(before: number, after: number): number {
  if (before <= 0) return NaN;
  return (1 - after / before) * 100;
}

/** Clamp a 0–1 quality value, defaulting unparseable input to 0.8. */
export function clampQuality(q: number): number {
  if (!Number.isFinite(q)) return 0.8;
  return Math.min(1, Math.max(0, q));
}

/** Swap a filename's extension, e.g. ("photo.png", "webp") → "photo.webp". */
export function renameExt(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}
