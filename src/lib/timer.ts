// ---- 間歇訓練（work/rest × 組數；最後一組不接休息）----

export interface IntervalConfig {
  workSec: number;
  restSec: number;
  sets: number;
}

export interface IntervalState {
  kind: 'work' | 'rest';
  set: number; // 1 起算
  remaining: number; // 本階段剩餘秒
  totalRemaining: number;
}

export function intervalTotalSec(cfg: IntervalConfig): number {
  if (cfg.sets <= 0 || cfg.workSec <= 0) return 0;
  return cfg.sets * cfg.workSec + Math.max(0, cfg.sets - 1) * cfg.restSec;
}

/** 由經過秒數推得目前階段；完成（或設定無效）回傳 null。 */
export function intervalAt(elapsedSec: number, cfg: IntervalConfig): IntervalState | null {
  const total = intervalTotalSec(cfg);
  if (total <= 0 || elapsedSec >= total) return null;
  const cycle = cfg.workSec + cfg.restSec;
  const idx = Math.floor(elapsedSec / cycle);
  const inCycle = elapsedSec - idx * cycle;
  const kind = inCycle < cfg.workSec ? 'work' : 'rest';
  const remaining = kind === 'work' ? cfg.workSec - inCycle : cycle - inCycle;
  return { kind, set: idx + 1, remaining, totalRemaining: total - elapsedSec };
}

/** Fraction of a countdown still remaining: 1 = full, 0 = finished. */
export function remainingFraction(seconds: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, seconds / total));
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
