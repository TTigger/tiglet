import { useState } from 'react';
import Tabs from '../components/Tabs';
import { useUrlState } from '../lib/urlState';
import { parseIsoDate, toIso, daysBetween, diffBreakdown, addDays, addMonths, countdownDays, workdaysBetween } from '../lib/dateCalc';

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

function DiffPanel() {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(addDays(todayIso(), 30));
  const [inclusive, setInclusive] = useState(false);
  const valid = parseIsoDate(from) && parseIsoDate(to);
  const days = valid ? daysBetween(from, to, inclusive) : NaN;
  const bd = valid && parseIsoDate(from)! <= parseIsoDate(to)! ? diffBreakdown(from, to) : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateField label="起始日" value={from} onChange={setFrom} />
        <DateField label="結束日" value={to} onChange={setTo} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} />
        含起始日（頭尾都算）
      </label>
      <Result label="相差天數" value={Number.isFinite(days) ? `${days} 天` : '—'} />
      {bd && bd.totalDays > 0 && (
        <>
          <Result label="換算" value={`${bd.years} 年 ${bd.months} 個月 ${bd.days} 天`} />
          <Result label="約為" value={`${(bd.totalDays / 7).toFixed(1)} 週`} />
        </>
      )}
    </div>
  );
}

function AddPanel() {
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
  const weekday = result ? '日一二三四五六'[parseIsoDate(result)!.getDay()] : '';

  return (
    <div className="mx-auto max-w-md space-y-4">
      <DateField label="基準日" value={base} onChange={setBase} />
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">方向</span>
          <select value={direction} onChange={(e) => setDirection(Number(e.target.value) as 1 | -1)} className={inputClass}>
            <option value={1}>之後</option>
            <option value={-1}>之前</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">數量</span>
          <input type="number" min={0} value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">單位</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)} className={inputClass}>
            <option value="days">天</option>
            <option value="weeks">週</option>
            <option value="months">個月</option>
          </select>
        </label>
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        <div className="text-sm text-muted">結果日期</div>
        <div className="my-1 font-mono text-3xl tabular-nums text-ink">{result || '—'}</div>
        {result && <div className="text-sm text-muted">星期{weekday}</div>}
      </div>
      {unit === 'months' && <p className="text-xs text-muted">月底自動夾住：例如 1/31 加一個月會得到 2/28（或閏年 2/29）。</p>}
    </div>
  );
}

function CountdownPanel() {
  // 目標日與名稱放進網址 → 倒數連結可以直接分享
  const [target, setTarget] = useUrlState('t', '');
  const [label, setLabel] = useUrlState('l', '');
  const valid = parseIsoDate(target) !== null;
  const days = valid ? countdownDays(target, todayIso()) : NaN;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <DateField label="目標日" value={target} onChange={setTarget} />
      <label className="block">
        <span className="mb-1 block text-sm text-muted">事件名稱（選填）</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例如：武嶺挑戰" className={inputClass} />
      </label>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
        {valid ? (
          days > 0 ? (
            <>
              <div className="text-sm text-muted">距離{label ? `「${label}」` : '目標日'}還有</div>
              <div className="die-pop my-1 font-mono text-5xl tabular-nums text-accent">{days}</div>
              <div className="text-sm text-muted">天</div>
            </>
          ) : days === 0 ? (
            <div className="font-serif text-2xl text-accent">🎉 就是今天{label ? `：${label}` : ''}！</div>
          ) : (
            <div className="text-lg text-muted">{label ? `「${label}」` : '目標日'}已過 {-days} 天</div>
          )
        ) : (
          <div className="text-sm text-muted">選一個目標日開始倒數</div>
        )}
      </div>
      {valid && <p className="text-center text-sm text-muted">複製本頁網址即可把這個倒數分享給別人。</p>}
    </div>
  );
}

function WorkdaysPanel() {
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(addDays(todayIso(), 14));
  const [excludeText, setExcludeText] = useState('');
  const excludes = excludeText.split('\n').map((s) => s.trim()).filter((s) => parseIsoDate(s));
  const valid = parseIsoDate(from) && parseIsoDate(to);
  const days = valid ? workdaysBetween(from, to, excludes) : 0;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateField label="起始日（含）" value={from} onChange={setFrom} />
        <DateField label="結束日（含）" value={to} onChange={setTo} />
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">額外排除的日期（選填，每行一個 YYYY-MM-DD，例如國定假日）</span>
        <textarea value={excludeText} onChange={(e) => setExcludeText(e.target.value)} rows={3} placeholder={'2026-09-28\n2026-10-10'} className={inputClass} />
      </label>
      <Result label="工作天數（排除週末）" value={valid ? `${days} 天` : '—'} />
      <p className="text-xs text-muted">週六日自動排除；國定假日各年不同，請自行加入排除清單。</p>
    </div>
  );
}

const TABS = [
  { id: 'diff', label: '日期差' },
  { id: 'add', label: '推算日期' },
  { id: 'countdown', label: '倒數日' },
  { id: 'workdays', label: '工作天' },
];

export default function DateCalc() {
  // 帶著倒數參數開啟時直接落在倒數日分頁
  const [tab, setTab] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('t') ? 'countdown' : 'diff'
  );
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'diff' && <DiffPanel />}
      {tab === 'add' && <AddPanel />}
      {tab === 'countdown' && <CountdownPanel />}
      {tab === 'workdays' && <WorkdaysPanel />}
    </div>
  );
}
