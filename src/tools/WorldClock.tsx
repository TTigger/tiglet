import { useEffect, useState } from 'react';
import { CITIES, offsetMinutes, offsetLabel, diffLabel, formatInZone, zonedTimeToInstant } from '../lib/timezone';
import CopyButton from '../components/CopyButton';
import type { Locale } from '../lib/i18n';

// 英文版的時差描述在元件內組字；zh 沿用 lib/timezone 的 diffLabel（lib 不動）
const enDiffParts = (minutes: number): string => {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
};

const L = {
  zh: {
    intl: 'zh-TW',
    loading: '載入中…',
    removeCity: (name: string) => `移除 ${name}`,
    local: '本地',
    addCity: '＋ 新增城市…',
    heading: '時間推算',
    s1: '當',
    s2: '是',
    s3: '時，',
    s4: '是',
    diff: (m: number) => diffLabel(m),
    diffSentence: (to: string, from: string, m: number) => `${to} 比 ${from} ${diffLabel(m)}`,
    converted: (time: string, weekday: string, date: string) => `${time}（${weekday} ${date}）`,
  },
  en: {
    intl: 'en-US',
    loading: 'Loading…',
    removeCity: (name: string) => `Remove ${name}`,
    local: 'Local',
    addCity: '＋ Add city…',
    heading: 'Time conversion',
    s1: 'When',
    s2: 'is',
    s3: 'then in',
    s4: 'it is',
    diff: (m: number) => (m === 0 ? 'same time' : `${enDiffParts(m)} ${m > 0 ? 'ahead' : 'behind'}`),
    diffSentence: (to: string, from: string, m: number) =>
      m === 0 ? `${to} is the same time as ${from}` : `${to} is ${enDiffParts(m)} ${m > 0 ? 'ahead of' : 'behind'} ${from}`,
    converted: (time: string, weekday: string, date: string) => `${time} (${weekday} ${date})`,
  },
} as const;

const HOME = 'Asia/Taipei';
const DEFAULT_CITIES = ['Asia/Taipei', 'Asia/Tokyo', 'Europe/London', 'America/New_York'];

// 城市標籤沿用 lib/timezone 的中文名（兩種語系相同）
const labelOf = (id: string) => CITIES.find((c) => c.id === id)?.label ?? id;
const selectClass =
  'rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent';

export default function WorldClock({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [now, setNow] = useState<Date | null>(null);
  const [cities, setCities] = useState<string[]>(DEFAULT_CITIES);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function addCity(id: string) {
    if (id && !cities.includes(id)) setCities([...cities, id]);
  }
  function removeCity(id: string) {
    setCities(cities.filter((c) => c !== id));
  }

  // 時間推算
  const [fromZone, setFromZone] = useState('Asia/Taipei');
  const [toZone, setToZone] = useState('America/New_York');
  const [time, setTime] = useState('09:00');

  let converted = '—';
  let convDiff = '';
  if (now && /^\d{1,2}:\d{2}$/.test(time)) {
    const [hh, mm] = time.split(':').map(Number);
    const parts: Record<string, string> = {};
    for (const p of new Intl.DateTimeFormat('en-US', { timeZone: fromZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)) {
      parts[p.type] = p.value;
    }
    // Resolve the typed wall-clock time against the source zone's offset *at that
    // time* (DST-aware), not the offset at the current instant.
    const instant = zonedTimeToInstant(Number(parts.year), Number(parts.month), Number(parts.day), hh, mm, fromZone);
    const c = formatInZone(instant, toZone, t.intl);
    converted = t.converted(c.time, c.weekday, c.date);
    convDiff = t.diffSentence(labelOf(toZone), labelOf(fromZone), offsetMinutes(instant, toZone) - offsetMinutes(instant, fromZone));
  }

  if (!now) return <div className="mx-auto max-w-2xl text-center text-muted">{t.loading}</div>;

  const homeOffset = offsetMinutes(now, HOME);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <div className="grid gap-3 sm:grid-cols-2">
          {cities.map((id) => {
            const c = formatInZone(now, id, t.intl);
            const off = offsetMinutes(now, id); // computed once; reused for label and diff
            const diff = off - homeOffset;
            return (
              <div key={id} className="relative rounded-[var(--radius-card)] border border-edge bg-surface p-4">
                {cities.length > 1 && (
                  <button onClick={() => removeCity(id)} aria-label={t.removeCity(labelOf(id))} className="absolute right-3 top-3 text-muted transition-colors hover:text-red-500">×</button>
                )}
                <div className="text-sm text-muted">{labelOf(id)} · {offsetLabel(off)}</div>
                <div className="my-1 font-mono text-3xl tabular-nums text-ink">{c.time}</div>
                <div className="text-sm text-muted">{c.weekday} {c.date}{id !== HOME ? ` · ${t.diff(diff)}` : ` · ${t.local}`}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <select value="" onChange={(e) => addCity(e.target.value)} className={selectClass}>
            <option value="">{t.addCity}</option>
            {CITIES.filter((c) => !cities.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-edge bg-surface p-5">
        <h2 className="mb-4 font-serif text-xl text-ink">{t.heading}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
          <span>{t.s1}</span>
          <select value={fromZone} onChange={(e) => setFromZone(e.target.value)} className={selectClass}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <span>{t.s2}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={selectClass} />
          <span>{t.s3}</span>
          <select value={toZone} onChange={(e) => setToZone(e.target.value)} className={selectClass}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <span>{t.s4}</span>
        </div>
        <p className="mt-4 flex items-center gap-3 font-mono text-2xl tabular-nums text-ink">
          {converted}
          {converted !== '—' && <CopyButton value={`${labelOf(fromZone)} ${time} = ${labelOf(toZone)} ${converted}`} />}
        </p>
        {convDiff && <p className="mt-1 text-sm text-muted">{convDiff}</p>}
      </section>
    </div>
  );
}
