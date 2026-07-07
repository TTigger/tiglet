import { useEffect, useState } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { useUrlState } from '../lib/urlState';
import { CATEGORIES, TEMPERATURE, convert, formatNumber, type UnitCategory, type UnitDef } from '../lib/units';
import {
  CURRENCIES,
  convertCurrency,
  formatMoney,
  FALLBACK_RATES,
  FALLBACK_RATES_DATE,
  saveRatesCache,
  loadRatesCache,
  type Rates,
} from '../lib/currency';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabUnit: '單位換算',
    tabCurrency: '匯率換算',
    from: '從',
    to: '到',
    ariaValue: '換算數值',
    ariaFromUnit: '來源單位',
    ariaToUnit: '目標單位',
    ariaSwapUnit: '對調單位',
    amount: '金額',
    result: '換算結果',
    ariaAmount: '金額',
    ariaFromCurrency: '來源幣別',
    ariaToCurrency: '目標幣別',
    ariaSwapCurrency: '對調幣別',
    loading: '正在取得即時匯率…',
    staleCache: (u: string) => `⚠️ 目前離線——使用上次成功取得的匯率（${u || '時間不明'}）。`,
    staleFallback: (d: string) => `⚠️ 無法取得即時匯率——使用內建備援匯率（${d} 概略值，僅供參考）。`,
    ratesSource: (u: string) => `匯率資料：${u}（來源 open.er-api.com）`,
    shareHint: '複製本頁網址即可分享這組換算。',
  },
  en: {
    tabUnit: 'Units',
    tabCurrency: 'Currency',
    from: 'From',
    to: 'To',
    ariaValue: 'Value',
    ariaFromUnit: 'Source unit',
    ariaToUnit: 'Target unit',
    ariaSwapUnit: 'Swap units',
    amount: 'Amount',
    result: 'Result',
    ariaAmount: 'Amount',
    ariaFromCurrency: 'Source currency',
    ariaToCurrency: 'Target currency',
    ariaSwapCurrency: 'Swap currencies',
    loading: 'Fetching live exchange rates…',
    staleCache: (u: string) => `⚠️ Currently offline — using the last fetched rates (${u || 'time unknown'}).`,
    staleFallback: (d: string) => `⚠️ Live rates unavailable — using built-in fallback rates (approximate as of ${d}, for reference only).`,
    ratesSource: (u: string) => `Rates: ${u} (source: open.er-api.com)`,
    shareHint: 'Copy this page URL to share this conversion.',
  },
} as const;
type Dict = (typeof L)[Locale];

// lib/units、lib/currency 的選項標籤格式為「中文 符號」——英文介面只取符號段，不動 lib
const optionLabel = (label: string, locale: Locale) =>
  locale === 'en' ? label.split(' ').slice(1).join(' ') || label : label;

const CATEGORY_EN: Record<UnitCategory, string> = {
  length: 'Length',
  mass: 'Mass',
  temperature: 'Temperature',
  area: 'Area',
  volume: 'Volume',
  speed: 'Speed',
  data: 'Data',
};

const CATEGORY_LIST: { id: UnitCategory; label: string; units: UnitDef[] }[] = [
  { id: 'length', label: CATEGORIES.length.label, units: CATEGORIES.length.units },
  { id: 'mass', label: CATEGORIES.mass.label, units: CATEGORIES.mass.units },
  { id: 'temperature', label: TEMPERATURE.label, units: TEMPERATURE.units },
  { id: 'area', label: CATEGORIES.area.label, units: CATEGORIES.area.units },
  { id: 'volume', label: CATEGORIES.volume.label, units: CATEGORIES.volume.units },
  { id: 'speed', label: CATEGORIES.speed.label, units: CATEGORIES.speed.units },
  { id: 'data', label: CATEGORIES.data.label, units: CATEGORIES.data.units },
];

const selectClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-3 text-sm text-ink outline-none transition-colors focus:border-accent';
const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-3 font-mono text-lg tabular-nums text-ink outline-none transition-colors focus:border-accent';

// 整組換算設定活在網址（cat/u1/u2/v 與 cf/ct/amt）——複製網址即可分享
function UnitPanel({ locale, t }: { locale: Locale; t: Dict }) {
  const [catRaw, setCatRaw] = useUrlState('cat', 'length');
  const cat = CATEGORY_LIST.find((c) => c.id === catRaw) ?? CATEGORY_LIST[0];
  const [fromRaw, setFrom] = useUrlState('u1', '');
  const [toRaw, setTo] = useUrlState('u2', '');
  const [value, setValue] = useUrlState('v', '1');

  const from = cat.units.some((u) => u.id === fromRaw) ? fromRaw : cat.units[0].id;
  const to = cat.units.some((u) => u.id === toRaw) ? toRaw : cat.units[1].id;

  function pickCategory(id: UnitCategory) {
    setCatRaw(id);
    setFrom('');
    setTo('');
  }

  const num = Number(value);
  const result = value.trim() === '' || Number.isNaN(num) ? NaN : convert(num, from, to, cat.id);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORY_LIST.map((c) => (
          <button
            key={c.id}
            onClick={() => pickCategory(c.id)}
            aria-pressed={c.id === cat.id}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${c.id === cat.id ? 'border-accent bg-accent text-white' : 'border-edge bg-surface text-ink hover:border-accent'}`}
          >
            {locale === 'en' ? CATEGORY_EN[c.id] : c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">{t.from}</label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} aria-label={t.ariaValue} className={inputClass} />
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t.ariaFromUnit} className={`${selectClass} mt-2`}>
            {cat.units.map((u) => <option key={u.id} value={u.id}>{optionLabel(u.label, locale)}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setFrom(to); setTo(from); }}
          aria-label={t.ariaSwapUnit}
          className="mb-3 rounded-lg border border-edge bg-surface px-3 py-3 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ⇄
        </button>

        <div>
          <label className="mb-1 block text-xs text-muted">{t.to}</label>
          <div className={`${inputClass} flex items-center justify-between gap-2 overflow-hidden`}>
            <span className="truncate">{formatNumber(result)}</span>
            {Number.isFinite(result) && <CopyButton value={formatNumber(result)} />}
          </div>
          <select value={to} onChange={(e) => setTo(e.target.value)} aria-label={t.ariaToUnit} className={`${selectClass} mt-2`}>
            {cat.units.map((u) => <option key={u.id} value={u.id}>{optionLabel(u.label, locale)}</option>)}
          </select>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">{t.shareHint}</p>
    </div>
  );
}

const RATES_API = 'https://open.er-api.com/v6/latest/USD';

function CurrencyPanel({ locale, t }: { locale: Locale; t: Dict }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [stale, setStale] = useState<'cache' | 'fallback' | null>(null); // 非即時匯率的來源標示
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useUrlState('amt', '100');
  const [fromRaw, setFrom] = useUrlState('cf', 'USD');
  const [toRaw, setTo] = useUrlState('ct', 'TWD');

  const valid = (code: string) => CURRENCIES.some((c) => c.code === code);
  const from = valid(fromRaw) ? fromRaw : 'USD';
  const to = valid(toRaw) ? toRaw : 'TWD';

  useEffect(() => {
    let active = true;
    // 三層備援：即時 API → 上次成功的 localStorage 快取 → 內建靜態快照
    const useBackup = () => {
      const cached = loadRatesCache();
      if (cached) {
        setRates(cached.rates);
        setUpdated(cached.updated);
        setStale('cache');
      } else {
        setRates(FALLBACK_RATES);
        setUpdated(FALLBACK_RATES_DATE);
        setStale('fallback');
      }
    };
    fetch(RATES_API)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.result === 'success' && data.rates) {
          setRates(data.rates as Rates);
          setUpdated(data.time_last_update_utc ?? null);
          saveRatesCache(data.rates as Rates, data.time_last_update_utc ?? '');
        } else {
          useBackup();
        }
      })
      .catch(() => active && useBackup())
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const num = Number(amount);
  const result = rates && amount.trim() !== '' && !Number.isNaN(num)
    ? convertCurrency(num, from, to, rates)
    : NaN;

  return (
    <div className="mx-auto max-w-lg">
      {loading && <p className="mb-4 text-sm text-muted">{t.loading}</p>}
      {stale === 'cache' && (
        <p className="mb-4 rounded-lg border border-amber-400 px-3 py-2 text-sm text-amber-600">
          {t.staleCache(updated || '')}
        </p>
      )}
      {stale === 'fallback' && (
        <p className="mb-4 rounded-lg border border-amber-400 px-3 py-2 text-sm text-amber-600">
          {t.staleFallback(FALLBACK_RATES_DATE)}
        </p>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">{t.amount}</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={t.ariaAmount} className={inputClass} />
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t.ariaFromCurrency} className={`${selectClass} mt-2`}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{optionLabel(c.label, locale)}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setFrom(to); setTo(from); }}
          aria-label={t.ariaSwapCurrency}
          className="mb-3 rounded-lg border border-edge bg-surface px-3 py-3 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ⇄
        </button>

        <div>
          <label className="mb-1 block text-xs text-muted">{t.result}</label>
          <div className={`${inputClass} flex items-center justify-between gap-2 overflow-hidden`}>
            <span className="truncate">{formatMoney(result)}</span>
            {Number.isFinite(result) && <CopyButton value={formatMoney(result)} />}
          </div>
          <select value={to} onChange={(e) => setTo(e.target.value)} aria-label={t.ariaToCurrency} className={`${selectClass} mt-2`}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{optionLabel(c.label, locale)}</option>)}
          </select>
        </div>
      </div>

      {updated && <p className="mt-4 text-xs text-muted">{t.ratesSource(updated)}</p>}
      <p className="mt-2 text-xs text-muted">{t.shareHint}</p>
    </div>
  );
}

export default function Converter({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  // 帶著匯率參數開啟時直接落在匯率分頁
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'unit';
    const q = new URLSearchParams(window.location.search);
    return q.has('cf') || q.has('ct') || q.has('amt') ? 'currency' : 'unit';
  });
  const tabs = [
    { id: 'unit', label: t.tabUnit },
    { id: 'currency', label: t.tabCurrency },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      {tab === 'unit' ? <UnitPanel locale={locale} t={t} /> : <CurrencyPanel locale={locale} t={t} />}
    </div>
  );
}
