const FAV_KEY = 'tiglet:favorites';
const RECENT_KEY = 'tiglet:recent';
const RECENT_MAX = 6;

function read(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: string[]): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore quota/availability */ }
}

/** Read a number from localStorage, returning `fallback` if absent/unparseable. */
export function getNumber(key: string, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

/** Persist a number to localStorage, ignoring quota/availability failures. */
export function setNumber(key: string, value: number): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, String(value)); } catch { /* ignore quota/availability */ }
}

export function getFavorites(): string[] { return read(FAV_KEY); }

export function isFavorite(id: string): boolean { return read(FAV_KEY).includes(id); }

export function toggleFavorite(id: string): string[] {
  const current = read(FAV_KEY);
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  write(FAV_KEY, next);
  return next;
}

export function getRecent(): string[] { return read(RECENT_KEY); }

export function pushRecent(id: string): string[] {
  const current = read(RECENT_KEY).filter((x) => x !== id);
  const next = [id, ...current].slice(0, RECENT_MAX);
  write(RECENT_KEY, next);
  return next;
}
