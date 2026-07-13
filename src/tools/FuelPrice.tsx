import { useEffect, useState } from 'react';
import type { FuelPriceInfo, FuelPrices } from '../lib/fuelPrice';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    loading: '正在取得中油今日牌價…',
    loadError: '牌價取得失敗，請稍後再試。',
    retry: '重試',
    updated: (d: string) => `價格生效日：${d}`,
    lpgNote: (d: string) => `液化石油氣為車用價格，自 ${d} 起實施`,
    alcoholNote: '酒精汽油未扣除能源署優惠補助',
    perLiter: '元/公升',
    fuels: { gas92: '92 無鉛', gas95: '95 無鉛', gas98: '98 無鉛', alcohol: '酒精汽油', diesel: '超級柴油', lpg: '液化石油氣' } as Record<keyof FuelPrices, string>,
    calcTitle: '加油試算',
    calcFuel: '油品',
    calcLiters: '公升數',
    calcAmount: '金額（元）',
    calcHint: '輸入公升數或金額，另一邊會自動換算。',
    sourceNote: '資料來源：台灣中油公司牌價。實際售價以各加油站公告為準。',
  },
  en: {
    loading: 'Fetching today’s CPC fuel prices…',
    loadError: 'Could not load fuel prices. Please try again.',
    retry: 'Retry',
    updated: (d: string) => `Effective date: ${d}`,
    lpgNote: (d: string) => `LPG is the vehicle price, effective from ${d}`,
    alcoholNote: 'Alcohol gasoline price excludes the Energy Administration subsidy',
    perLiter: 'NT$/L',
    fuels: { gas92: '92 Unleaded', gas95: '95 Unleaded', gas98: '98 Unleaded', alcohol: 'Alcohol Gasoline', diesel: 'Premium Diesel', lpg: 'LPG (Autogas)' } as Record<keyof FuelPrices, string>,
    calcTitle: 'Fill-up calculator',
    calcFuel: 'Fuel',
    calcLiters: 'Liters',
    calcAmount: 'Amount (NT$)',
    calcHint: 'Type liters or an amount — the other side updates automatically.',
    sourceNote: 'Source: CPC Corporation, Taiwan list prices. Actual pump prices may vary by station.',
  },
} as const;
type Dict = (typeof L)[Locale];

const FUEL_ORDER: (keyof FuelPrices)[] = ['gas92', 'gas95', 'gas98', 'alcohol', 'diesel', 'lpg'];

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';

function Calculator({ prices, t }: { prices: FuelPrices; t: Dict }) {
  const [fuel, setFuel] = useState<keyof FuelPrices>('gas95');
  const [liters, setLiters] = useState('40');
  const [amount, setAmount] = useState(() => String(Math.round(40 * prices.gas95)));

  const price = prices[fuel];

  function fromLiters(v: string, f = fuel) {
    setLiters(v);
    const n = Number(v);
    setAmount(v.trim() !== '' && Number.isFinite(n) && n >= 0 ? String(Math.round(n * prices[f] * 100) / 100) : '');
  }
  function fromAmount(v: string) {
    setAmount(v);
    const n = Number(v);
    setLiters(v.trim() !== '' && Number.isFinite(n) && n >= 0 ? String(Math.round((n / price) * 100) / 100) : '');
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-ink">{t.calcTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.calcFuel}</span>
          <select
            value={fuel}
            onChange={(e) => {
              const f = e.target.value as keyof FuelPrices;
              setFuel(f);
              fromLiters(liters, f);
            }}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent"
          >
            {FUEL_ORDER.map((f) => (
              <option key={f} value={f}>{t.fuels[f]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.calcLiters}</span>
          <input value={liters} onChange={(e) => fromLiters(e.target.value)} inputMode="decimal" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.calcAmount}</span>
          <input value={amount} onChange={(e) => fromAmount(e.target.value)} inputMode="decimal" className={inputClass} />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">{t.calcHint}</p>
    </div>
  );
}

export default function FuelPrice({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [info, setInfo] = useState<FuelPriceInfo | null>(null);
  const [failed, setFailed] = useState(false);

  async function load() {
    setFailed(false);
    setInfo(null);
    try {
      const res = await fetch('/api/fuel-price');
      if (!res.ok) throw new Error();
      const data = (await res.json()) as FuelPriceInfo;
      if (!data.prices) throw new Error();
      setInfo(data);
    } catch {
      setFailed(true);
    }
  }
  useEffect(() => {
    load();
  }, []);

  if (failed) {
    return (
      <div className="mx-auto max-w-xl space-y-3 text-center">
        <p className="text-sm text-red-500">{t.loadError}</p>
        <button onClick={load} className="rounded-lg border border-edge px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent">
          {t.retry}
        </button>
      </div>
    );
  }
  if (!info) return <p className="text-center text-sm text-muted">{t.loading}</p>;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {info.trend && <p className="text-sm font-medium text-ink" role="status">{info.trend}</p>}
        {info.updated && <p className="text-xs text-muted">{t.updated(info.updated)}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FUEL_ORDER.map((f) => (
          <li key={f} className="rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3">
            <p className="text-sm text-muted">{t.fuels[f]}</p>
            <p className="font-mono text-2xl tabular-nums text-ink">{info.prices[f].toFixed(1)}</p>
            <p className="text-xs text-muted">{t.perLiter}</p>
          </li>
        ))}
      </ul>

      <Calculator prices={info.prices} t={t} />

      <div className="space-y-1 text-xs text-muted">
        {info.lpgDate && <p>{t.lpgNote(info.lpgDate)}</p>}
        <p>{t.alcoholNote}</p>
        <p>{t.sourceNote}</p>
      </div>
    </div>
  );
}
