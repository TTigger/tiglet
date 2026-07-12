import { useEffect, useState } from 'react';
import { checkInvoice, type PrizeLevel, type WinningNumbers } from '../lib/invoice';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    loading: '正在取得財政部開獎號碼…',
    loadError: '開獎號碼取得失敗，請稍後再試。',
    retry: '重試',
    periodLabel: '開獎期別',
    special: '特別獎',
    grand: '特獎',
    first: '頭獎',
    addSixth: '增開六獎',
    specialNote: '8 碼全中 1,000 萬',
    grandNote: '8 碼全中 200 萬',
    firstNote: '全中 20 萬；末 7～3 碼依序 4 萬／1 萬／4 千／1 千／200',
    addSixthNote: '末 3 碼相同 200 元',
    inputLabel: '輸入發票末 3 碼（可續輸到 8 碼確認獎級）',
    inputPlaceholder: '例如 046',
    tooShort: '輸入末 3 碼即可開始對獎',
    noneShort: (n: number) => `末 ${n} 碼沒有對中 —— 這張確定沒獎，不用再輸入了`,
    noneFull: '完整 8 碼沒有對中，這張沒獎',
    win: (name: string, amount: string) => `🎉 中${name}！獎金 ${amount} 元`,
    winMatched: (num: string) => `對中號碼：${num}`,
    upgradeHint: '繼續輸入完整 8 碼，有機會是更高獎級！',
    maybe: (name: string) => `末碼與${name}相同！輸入完整 8 碼確認是否全中`,
    officialLink: '財政部官方公告',
    levelNames: {
      special: '特別獎', grand: '特獎', first: '頭獎', second: '二獎', third: '三獎',
      fourth: '四獎', fifth: '五獎', sixth: '六獎', addSixth: '增開六獎',
    } as Record<PrizeLevel, string>,
    rules: '二獎～六獎為發票末碼與任一組頭獎末碼相同；特別獎與特獎必須 8 碼全中，末碼相同不算。中獎請以財政部公告為準，並留意領獎期限。',
    privacy: '對獎完全在你的瀏覽器進行；伺服器只代抓財政部公告的開獎號碼，你輸入的發票號碼不會送出。',
  },
  en: {
    loading: 'Fetching winning numbers from the Ministry of Finance…',
    loadError: 'Could not load the winning numbers. Please try again.',
    retry: 'Retry',
    periodLabel: 'Draw period',
    special: 'Special Prize',
    grand: 'Grand Prize',
    first: 'First Prize',
    addSixth: 'Additional Sixth',
    specialNote: 'all 8 digits — NT$10,000,000',
    grandNote: 'all 8 digits — NT$2,000,000',
    firstNote: 'all 8 — NT$200,000; last 7–3 digits win 40k / 10k / 4k / 1k / 200',
    addSixthNote: 'last 3 digits — NT$200',
    inputLabel: 'Enter the last 3 digits (keep typing up to 8 to confirm the tier)',
    inputPlaceholder: 'e.g. 046',
    tooShort: 'Type the last 3 digits to start checking',
    noneShort: (n: number) => `Last ${n} digits don't match — this one is definitely not a winner`,
    noneFull: 'No match on the full 8 digits — not a winner',
    win: (name: string, amount: string) => `🎉 ${name} — NT$${amount}!`,
    winMatched: (num: string) => `Matched number: ${num}`,
    upgradeHint: 'Keep typing the full 8 digits — it could be a higher tier!',
    maybe: (name: string) => `The tail matches the ${name}! Enter all 8 digits to confirm`,
    officialLink: 'Official announcement',
    levelNames: {
      special: 'Special Prize', grand: 'Grand Prize', first: 'First Prize', second: 'Second Prize',
      third: 'Third Prize', fourth: 'Fourth Prize', fifth: 'Fifth Prize', sixth: 'Sixth Prize',
      addSixth: 'Additional Sixth Prize',
    } as Record<PrizeLevel, string>,
    rules: 'Second to Sixth Prizes require the invoice tail to match a First Prize number; the Special and Grand Prizes require all 8 digits. Results are subject to the official announcement — mind the claim deadline.',
    privacy: 'Checking happens entirely in your browser; the server only relays the official winning numbers. Your invoice number is never sent anywhere.',
  },
} as const;
type Dict = (typeof L)[Locale];

const numClass = 'font-mono tabular-nums text-ink';

function WinningCard({ w, t }: { w: WinningNumbers; t: Dict }) {
  const rows: { label: string; note: string; nums: string[] }[] = [
    { label: t.special, note: t.specialNote, nums: [w.special] },
    { label: t.grand, note: t.grandNote, nums: [w.grand] },
    { label: t.first, note: t.firstNote, nums: w.first },
    ...(w.sixth.length > 0 ? [{ label: t.addSixth, note: t.addSixthNote, nums: w.sixth }] : []),
  ];
  return (
    <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4">
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <dt className="w-20 shrink-0 text-sm font-medium text-ink">{r.label}</dt>
            <dd className="flex flex-wrap gap-x-4 gap-y-1">
              {r.nums.map((n) => (
                <span key={n} className={`${numClass} text-lg tracking-wider`}>{n}</span>
              ))}
            </dd>
            <dd className="w-full text-xs text-muted sm:ml-24">{r.note}</dd>
          </div>
        ))}
      </dl>
      {w.link && (
        <a href={w.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-muted underline hover:text-accent">
          {t.officialLink} ↗
        </a>
      )}
    </div>
  );
}

function Result({ digits, w, t }: { digits: string; w: WinningNumbers; t: Dict }) {
  if (digits.length < 3) return <p className="text-sm text-muted">{t.tooShort}</p>;
  const hit = checkInvoice(digits, w);
  if (!hit) {
    return (
      <p className="text-sm text-muted" role="status">
        {digits.length < 8 ? t.noneShort(digits.length) : t.noneFull}
      </p>
    );
  }
  const name = t.levelNames[hit.level];
  if (!hit.confirmed) {
    return <p className="text-sm font-medium text-amber-600" role="status">{t.maybe(name)}</p>;
  }
  return (
    <div className="rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-3" role="status">
      <p className="font-medium text-green-700">{t.win(name, hit.amount.toLocaleString())}</p>
      <p className="mt-1 text-xs text-muted">{t.winMatched(hit.matched)}</p>
      {hit.upgradable && <p className="mt-1 text-xs text-amber-600">{t.upgradeHint}</p>}
    </div>
  );
}

export default function InvoiceLottery({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [periods, setPeriods] = useState<WinningNumbers[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [periodIdx, setPeriodIdx] = useState(0);
  const [digits, setDigits] = useState('');

  async function load() {
    setFailed(false);
    setPeriods(null);
    try {
      const res = await fetch('/api/invoice-numbers');
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data.periods) || data.periods.length === 0) throw new Error();
      setPeriods(data.periods);
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
  if (!periods) return <p className="text-center text-sm text-muted">{t.loading}</p>;

  const w = periods[Math.min(periodIdx, periods.length - 1)];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.periodLabel}</span>
        <select
          value={periodIdx}
          onChange={(e) => setPeriodIdx(Number(e.target.value))}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent"
        >
          {periods.map((p, i) => (
            <option key={p.period} value={i}>{p.period}</option>
          ))}
        </select>
      </label>

      <WinningCard w={w} t={t} />

      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.inputLabel}</span>
        <input
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder={t.inputPlaceholder}
          inputMode="numeric"
          maxLength={8}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2.5 text-center text-2xl tracking-[0.3em] font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent"
        />
      </label>

      <Result digits={digits} w={w} t={t} />

      <p className="text-xs text-muted">{t.rules}</p>
      <p className="text-xs text-muted">{t.privacy}</p>
    </div>
  );
}
