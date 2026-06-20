import { useEffect, useState } from 'react';
import Tabs from '../components/Tabs';
import { CATEGORIES, TEMPERATURE, convert, formatNumber, type UnitCategory, type UnitDef } from '../lib/units';
import { CURRENCIES, convertCurrency, formatMoney, type Rates } from '../lib/currency';

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

function UnitPanel() {
  const [catId, setCatId] = useState<UnitCategory>('length');
  const cat = CATEGORY_LIST.find((c) => c.id === catId)!;
  const [from, setFrom] = useState(cat.units[0].id);
  const [to, setTo] = useState(cat.units[1].id);
  const [value, setValue] = useState('1');

  function pickCategory(id: UnitCategory) {
    const next = CATEGORY_LIST.find((c) => c.id === id)!;
    setCatId(id);
    setFrom(next.units[0].id);
    setTo(next.units[1].id);
  }

  const num = Number(value);
  const result = value.trim() === '' || Number.isNaN(num) ? NaN : convert(num, from, to, catId);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORY_LIST.map((c) => (
          <button
            key={c.id}
            onClick={() => pickCategory(c.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${c.id === catId ? 'border-accent bg-accent text-white' : 'border-edge bg-surface text-ink hover:border-accent'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">從</label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${selectClass} mt-2`}>
            {cat.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setFrom(to); setTo(from); }}
          aria-label="對調單位"
          className="mb-3 rounded-lg border border-edge bg-surface px-3 py-3 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ⇄
        </button>

        <div>
          <label className="mb-1 block text-xs text-muted">到</label>
          <div className={`${inputClass} flex items-center overflow-hidden`}>{formatNumber(result)}</div>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={`${selectClass} mt-2`}>
            {cat.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

const RATES_API = 'https://open.er-api.com/v6/latest/USD';

function CurrencyPanel() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('TWD');

  useEffect(() => {
    let active = true;
    fetch(RATES_API)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.result === 'success' && data.rates) {
          setRates(data.rates as Rates);
          setUpdated(data.time_last_update_utc ?? null);
        } else {
          setError(true);
        }
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const num = Number(amount);
  const result = rates && amount.trim() !== '' && !Number.isNaN(num)
    ? convertCurrency(num, from, to, rates)
    : NaN;

  return (
    <div className="mx-auto max-w-lg">
      {loading && <p className="mb-4 text-sm text-muted">正在取得即時匯率…</p>}
      {error && <p className="mb-4 text-sm text-red-500">無法取得匯率，請稍後再試。</p>}

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">金額</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${selectClass} mt-2`}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        <button
          onClick={() => { setFrom(to); setTo(from); }}
          aria-label="對調幣別"
          className="mb-3 rounded-lg border border-edge bg-surface px-3 py-3 text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ⇄
        </button>

        <div>
          <label className="mb-1 block text-xs text-muted">換算結果</label>
          <div className={`${inputClass} flex items-center overflow-hidden`}>{formatMoney(result)}</div>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={`${selectClass} mt-2`}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {updated && <p className="mt-4 text-xs text-muted">匯率資料：{updated}（來源 open.er-api.com）</p>}
    </div>
  );
}

const TABS = [
  { id: 'unit', label: '單位換算' },
  { id: 'currency', label: '匯率換算' },
];

export default function Converter() {
  const [tab, setTab] = useState('unit');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'unit' ? <UnitPanel /> : <CurrencyPanel />}
    </div>
  );
}
