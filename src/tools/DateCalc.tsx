import { useState } from 'react';
import Tabs from '../components/Tabs';
import { useUrlState } from '../lib/urlState';
import { parseIsoDate, toIso, daysBetween, diffBreakdown, addDays, addMonths, countdownDays, workdaysBetween } from '../lib/dateCalc';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabDiff: '日期差',
    tabAdd: '推算日期',
    tabCountdown: '倒數日',
    tabWorkdays: '工作天',
    startDate: '起始日',
    endDate: '結束日',
    inclusive: '含起始日（頭尾都算）',
    daysBetween: '相差天數',
    days: (n: number) => `${n} 天`,
    breakdown: '換算',
    ymd: (y: number, m: number, d: number) => `${y} 年 ${m} 個月 ${d} 天`,
    approx: '約為',
    weeks: (w: string) => `${w} 週`,
    baseDate: '基準日',
    direction: '方向',
    after: '之後',
    before: '之前',
    amount: '數量',
    unit: '單位',
    unitDays: '天',
    unitWeeks: '週',
    unitMonths: '個月',
    resultDate: '結果日期',
    weekday: (d: number) => `星期${'日一二三四五六'[d]}`,
    clampNote: '月底自動夾住：例如 1/31 加一個月會得到 2/28（或閏年 2/29）。',
    targetDate: '目標日',
    eventName: '事件名稱（選填）',
    eventPlaceholder: '例如：武嶺挑戰',
    untilHeading: (label: string) => `距離${label ? `「${label}」` : '目標日'}還有`,
    untilUnit: '天',
    isToday: (label: string) => `🎉 就是今天${label ? `：${label}` : ''}！`,
    passed: (label: string, n: number) => `${label ? `「${label}」` : '目標日'}已過 ${n} 天`,
    pickTarget: '選一個目標日開始倒數',
    shareCountdown: '複製本頁網址即可把這個倒數分享給別人。',
    startInclusive: '起始日（含）',
    endInclusive: '結束日（含）',
    excludeLabel: '額外排除的日期（選填，每行一個 YYYY-MM-DD，例如國定假日）',
    workdaysResult: '工作天數（排除週末）',
    workdaysNote: '週六日自動排除；國定假日各年不同，請自行加入排除清單。',
  },
  en: {
    tabDiff: 'Date diff',
    tabAdd: 'Add / subtract',
    tabCountdown: 'Countdown',
    tabWorkdays: 'Workdays',
    startDate: 'Start date',
    endDate: 'End date',
    inclusive: 'Include start date (count both ends)',
    daysBetween: 'Days between',
    days: (n: number) => `${n} days`,
    breakdown: 'Breakdown',
    ymd: (y: number, m: number, d: number) => `${y} yr ${m} mo ${d} d`,
    approx: 'Approx.',
    weeks: (w: string) => `${w} weeks`,
    baseDate: 'Base date',
    direction: 'Direction',
    after: 'After',
    before: 'Before',
    amount: 'Amount',
    unit: 'Unit',
    unitDays: 'Days',
    unitWeeks: 'Weeks',
    unitMonths: 'Months',
    resultDate: 'Result date',
    weekday: (d: number) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d],
    clampNote: 'Month-end is clamped: e.g. Jan 31 plus one month gives Feb 28 (or Feb 29 in a leap year).',
    targetDate: 'Target date',
    eventName: 'Event name (optional)',
    eventPlaceholder: 'e.g. Wuling Challenge',
    untilHeading: (label: string) => `Days until ${label ? `"${label}"` : 'the target date'}`,
    untilUnit: 'days',
    isToday: (label: string) => `🎉 It's today${label ? `: ${label}` : ''}!`,
    passed: (label: string, n: number) => `${label ? `"${label}"` : 'The target date'} was ${n} days ago`,
    pickTarget: 'Pick a target date to start the countdown',
    shareCountdown: 'Copy this page URL to share this countdown.',
    startInclusive: 'Start date (incl.)',
    endInclusive: 'End date (incl.)',
    excludeLabel: 'Extra dates to exclude (optional, one YYYY-MM-DD per line, e.g. public holidays)',
    workdaysResult: 'Workdays (weekends excluded)',
    workdaysNote: 'Saturdays and Sundays are excluded automatically; public holidays vary by year — add them to the exclude list yourself.',
  },
} as const;
type Dict = (typeof L)[Locale];

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';

const todayIso = () => toIso(new Date());

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-edge bg-surface px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-mono text-lg tabular-nums text-ink">{value}</span>
    </div>
  );
}

function DiffPanel({ t }: { t: Dict }) {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(addDays(todayIso(), 30));
  const [inclusive, setInclusive] = useState(false);
  const valid = parseIsoDate(from) && parseIsoDate(to);
  const days = valid ? daysBetween(from, to, inclusive) : NaN;
  const bd = valid && parseIsoDate(from)! <= parseIsoDate(to)! ? diffBreakdown(from, to) : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateField label={t.startDate} value={from} onChange={setFrom} />
        <DateField label={t.endDate} value={to} onChange={setTo} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} />
        {t.inclusive}
      </label>
      <Result label={t.daysBetween} value={Number.isFinite(days) ? t.days(days) : '—'} />
      {bd && bd.totalDays > 0 && (
        <>
          <Result label={t.breakdown} value={t.ymd(bd.years, bd.months, bd.days)} />
          <Result label={t.approx} value={t.weeks((bd.totalDays / 7).toFixed(1))} />
        </>
      )}
    </div>
  );
}

function AddPanel({ t }: { t: Dict }) {
  const [base, setBase] = useState(todayIso());
  const [amountStr, setAmountStr] = useState('30');
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [direction, setDirection] = useState<1 | -1>(1);
  const amount = Number(amountStr);
  const valid = parseIsoDate(base) && Number.isInteger(amount) && amount >= 0;
  const result = valid
    ? unit === 'months'
      ? addMonths(base, direction * amount)
      : addDays(base, direction * amount * (unit === 'weeks' ? 7 : 1))
    : '';
  const weekday = result ? t.weekday(parseIsoDate(result)!.getDay()) : '';

  return (
    <div className="mx-auto max-w-md space-y-4">
      <DateField label={t.baseDate} value={base} onChange={setBase} />
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.direction}</span>
          <select value={direction} onChange={(e) => setDirection(Number(e.target.value) as 1 | -1)} className={inputClass}>
            <option value={1}>{t.after}</option>
            <option value={-1}>{t.before}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.amount}</span>
          <input type="number" min={0} value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.unit}</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)} className={inputClass}>
            <option value="days">{t.unitDays}</option>
            <option value="weeks">{t.unitWeeks}</option>
            <option value="months">{t.unitMonths}</option>
          </select>
        </label>
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        <div className="text-sm text-muted">{t.resultDate}</div>
        <div className="my-1 font-mono text-3xl tabular-nums text-ink">{result || '—'}</div>
        {result && <div className="text-sm text-muted">{weekday}</div>}
      </div>
      {unit === 'months' && <p className="text-xs text-muted">{t.clampNote}</p>}
    </div>
  );
}

function CountdownPanel({ t }: { t: Dict }) {
  // 目標日與名稱放進網址 → 倒數連結可以直接分享
  const [target, setTarget] = useUrlState('t', '');
  const [label, setLabel] = useUrlState('l', '');
  const valid = parseIsoDate(target) !== null;
  const days = valid ? countdownDays(target, todayIso()) : NaN;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <DateField label={t.targetDate} value={target} onChange={setTarget} />
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.eventName}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t.eventPlaceholder} className={inputClass} />
      </label>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        {valid ? (
          days > 0 ? (
            <>
              <div className="text-sm text-muted">{t.untilHeading(label)}</div>
              <div className="die-pop my-1 font-mono text-5xl tabular-nums text-accent">{days}</div>
              <div className="text-sm text-muted">{t.untilUnit}</div>
            </>
          ) : days === 0 ? (
            <div className="font-serif text-2xl text-accent">{t.isToday(label)}</div>
          ) : (
            <div className="text-lg text-muted">{t.passed(label, -days)}</div>
          )
        ) : (
          <div className="text-sm text-muted">{t.pickTarget}</div>
        )}
      </div>
      {valid && <p className="text-center text-sm text-muted">{t.shareCountdown}</p>}
    </div>
  );
}

function WorkdaysPanel({ t }: { t: Dict }) {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(addDays(todayIso(), 14));
  const [excludeText, setExcludeText] = useState('');
  const excludes = excludeText.split('\n').map((s) => s.trim()).filter((s) => parseIsoDate(s));
  const valid = parseIsoDate(from) && parseIsoDate(to);
  const days = valid ? workdaysBetween(from, to, excludes) : 0;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateField label={t.startInclusive} value={from} onChange={setFrom} />
        <DateField label={t.endInclusive} value={to} onChange={setTo} />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.excludeLabel}</span>
        <textarea value={excludeText} onChange={(e) => setExcludeText(e.target.value)} rows={3} placeholder={'2026-09-28\n2026-10-10'} className={inputClass} />
      </label>
      <Result label={t.workdaysResult} value={valid ? t.days(days) : '—'} />
      <p className="text-xs text-muted">{t.workdaysNote}</p>
    </div>
  );
}

export default function DateCalc({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  // 帶著倒數參數開啟時直接落在倒數日分頁
  const [tab, setTab] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('t') ? 'countdown' : 'diff'
  );
  const tabs = [
    { id: 'diff', label: t.tabDiff },
    { id: 'add', label: t.tabAdd },
    { id: 'countdown', label: t.tabCountdown },
    { id: 'workdays', label: t.tabWorkdays },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      {tab === 'diff' && <DiffPanel t={t} />}
      {tab === 'add' && <AddPanel t={t} />}
      {tab === 'countdown' && <CountdownPanel t={t} />}
      {tab === 'workdays' && <WorkdaysPanel t={t} />}
    </div>
  );
}
