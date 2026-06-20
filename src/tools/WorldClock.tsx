import { useEffect, useState } from 'react';
import { CITIES, offsetMinutes, offsetLabel, diffLabel, formatInZone, zonedTimeToInstant } from '../lib/timezone';

const HOME = 'Asia/Taipei';
const DEFAULT_CITIES = ['Asia/Taipei', 'Asia/Tokyo', 'Europe/London', 'America/New_York'];

const labelOf = (id: string) => CITIES.find((c) => c.id === id)?.label ?? id;
const selectClass =
  'rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent';

export default function WorldClock() {
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
    const c = formatInZone(instant, toZone);
    converted = `${c.time}（${c.weekday} ${c.date}）`;
    convDiff = diffLabel(offsetMinutes(instant, toZone) - offsetMinutes(instant, fromZone));
  }

  if (!now) return <div className="mx-auto max-w-2xl text-center text-muted">載入中…</div>;

  const homeOffset = offsetMinutes(now, HOME);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <div className="grid gap-3 sm:grid-cols-2">
          {cities.map((id) => {
            const c = formatInZone(now, id);
            const off = offsetMinutes(now, id); // computed once; reused for label and diff
            const diff = off - homeOffset;
            return (
              <div key={id} className="relative rounded-[var(--radius-card)] border border-edge bg-surface p-4">
                {cities.length > 1 && (
                  <button onClick={() => removeCity(id)} aria-label={`移除 ${labelOf(id)}`} className="absolute right-3 top-3 text-muted transition-colors hover:text-red-500">×</button>
                )}
                <div className="text-sm text-muted">{labelOf(id)} · {offsetLabel(off)}</div>
                <div className="my-1 font-mono text-3xl tabular-nums text-ink">{c.time}</div>
                <div className="text-sm text-muted">{c.weekday} {c.date}{id !== HOME ? ` · ${diffLabel(diff)}` : ' · 本地'}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <select value="" onChange={(e) => addCity(e.target.value)} className={selectClass}>
            <option value="">＋ 新增城市…</option>
            {CITIES.filter((c) => !cities.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-edge bg-surface p-5">
        <h2 className="mb-4 font-serif text-xl text-ink">時間推算</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
          <span>當</span>
          <select value={fromZone} onChange={(e) => setFromZone(e.target.value)} className={selectClass}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <span>是</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={selectClass} />
          <span>時，</span>
          <select value={toZone} onChange={(e) => setToZone(e.target.value)} className={selectClass}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <span>是</span>
        </div>
        <p className="mt-4 font-mono text-2xl tabular-nums text-ink">{converted}</p>
        {convDiff && <p className="mt-1 text-sm text-muted">{labelOf(toZone)} 比 {labelOf(fromZone)} {convDiff}</p>}
      </section>
    </div>
  );
}
