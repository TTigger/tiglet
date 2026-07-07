/** Exchange rates expressed as units-per-base (e.g. with USD base, TWD ≈ 32). */
export type Rates = Record<string, number>;

export interface CurrencyDef {
  code: string;
  label: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', label: '美元 USD' },
  { code: 'TWD', label: '新台幣 TWD' },
  { code: 'EUR', label: '歐元 EUR' },
  { code: 'JPY', label: '日圓 JPY' },
  { code: 'GBP', label: '英鎊 GBP' },
  { code: 'CNY', label: '人民幣 CNY' },
  { code: 'HKD', label: '港幣 HKD' },
  { code: 'KRW', label: '韓元 KRW' },
  { code: 'AUD', label: '澳幣 AUD' },
  { code: 'CAD', label: '加幣 CAD' },
  { code: 'SGD', label: '新加坡幣 SGD' },
  { code: 'CHF', label: '瑞士法郎 CHF' },
];

/**
 * 離線備援匯率（USD 基準的概略快照，2026-07 初）。
 * 只在「拿不到即時匯率、localStorage 也沒有上次成功的快取」時使用，
 * UI 必須明確標示這是備援值。
 */
export const FALLBACK_RATES_DATE = '2026-07-01';
export const FALLBACK_RATES: Rates = {
  USD: 1,
  TWD: 32.5,
  EUR: 0.92,
  JPY: 155,
  GBP: 0.78,
  CNY: 7.25,
  HKD: 7.8,
  KRW: 1380,
  AUD: 1.5,
  CAD: 1.37,
  SGD: 1.34,
  CHF: 0.88,
};

const RATES_CACHE_KEY = 'tiglet:rates-cache';

export interface CachedRates {
  rates: Rates;
  updated: string;
}

/** 把成功取得的匯率存進 localStorage，離線時當作第一層備援。 */
export function saveRatesCache(rates: Rates, updated: string): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, updated })); } catch { /* ignore */ }
}

export function loadRatesCache(): CachedRates | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    return parsed && typeof parsed.rates === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Convert an amount between two currencies using a shared-base rate table. */
export function convertCurrency(amount: number, from: string, to: string, rates: Rates): number {
  const rf = rates[from];
  const rt = rates[to];
  if (!rf || !rt) return NaN;
  return (amount / rf) * rt;
}

/** Format a monetary amount with thousands separators and 2 decimals. */
export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
