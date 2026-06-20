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
