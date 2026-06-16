import { useEffect, useRef, useState } from 'react';
import { rollDice, sum, pipsFor } from '../lib/dice';

const SIDES = [4, 6, 8, 10, 12, 20];
const TUMBLE_MS = 700;
const HISTORY_MAX = 5;

interface HistoryEntry {
  results: number[];
  total: number;
  sides: number;
}

function DieFace({ value, sides, rolling, highlight, rollKey }: {
  value: number;
  sides: number;
  rolling: boolean;
  highlight: boolean;
  rollKey: number;
}) {
  const base =
    'flex h-14 w-14 items-center justify-center rounded-xl border bg-surface shadow-sm';
  const ring = highlight && !rolling ? 'border-accent ring-2 ring-accent/40' : 'border-edge';
  const anim = rolling ? 'die-tumble' : 'die-pop';

  return (
    <span key={rollKey} className={`${base} ${ring} ${anim}`}>
      {sides === 6 ? (
        <span className="grid h-9 w-9 grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className={`m-auto h-1.5 w-1.5 rounded-full ${
                pipsFor(value).includes(i) ? 'bg-ink' : 'bg-transparent'
              }`}
            />
          ))}
        </span>
      ) : (
        <span className="font-mono text-2xl text-ink">{value}</span>
      )}
    </span>
  );
}

export default function Dice() {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [display, setDisplay] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [rollKey, setRollKey] = useState(0);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => () => {
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
  }, []);

  function roll() {
    if (rolling) return;
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
    setRolling(true);

    // Rapidly cycle random faces so the dice look like they're tumbling.
    timers.current.tick = setInterval(() => setDisplay(rollDice(count, sides)), 70);

    timers.current.stop = setTimeout(() => {
      clearInterval(timers.current.tick);
      const final = rollDice(count, sides);
      setResults(final);
      setDisplay(final);
      setRolling(false);
      setRollKey((k) => k + 1);
      setHistory((h) => [{ results: final, total: sum(final), sides }, ...h].slice(0, HISTORY_MAX));
    }, TUMBLE_MS);
  }

  const shown = rolling ? display : results;
  const max = shown.length > 1 ? Math.max(...shown) : -1;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm text-ink">數量
          <input type="number" min={1} max={20} value={count} disabled={rolling} onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value))))} className="mx-2 w-16 rounded border border-edge bg-surface px-2 py-1 text-center disabled:opacity-50" />
        </label>
        <label className="text-sm text-ink">面數
          <select value={sides} disabled={rolling} onChange={(e) => setSides(Number(e.target.value))} className="mx-2 rounded border border-edge bg-surface px-2 py-1 disabled:opacity-50">
            {SIDES.map((s) => <option key={s} value={s}>d{s}</option>)}
          </select>
        </label>
      </div>

      <button onClick={roll} disabled={rolling} className="mb-6 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        {rolling ? '擲骰中…' : '擲骰子'}
      </button>

      {shown.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {shown.map((r, i) => (
              <DieFace key={i} value={r} sides={sides} rolling={rolling} highlight={r === max} rollKey={rollKey} />
            ))}
          </div>
          {shown.length > 1 && (
            <p className="mt-4 text-muted">總和：<span className="font-semibold text-ink">{sum(shown)}</span></p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-muted">最近紀錄</h2>
          <ul className="space-y-1 text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between rounded border border-edge bg-surface px-3 py-1.5 text-muted">
                <span className="font-mono">{h.results.length}d{h.sides} · {h.results.join(' + ')}</span>
                <span className="font-semibold text-ink">= {h.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
