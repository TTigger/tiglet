import { useEffect, useRef, useState } from 'react';
import { rollDice, sum, pipsFor } from '../lib/dice';

const SIDES = [4, 6, 8, 10, 12, 20];
const ROLL_MS = 950;
const HISTORY_MAX = 5;
const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

interface HistoryEntry {
  results: number[];
  total: number;
  sides: number;
}

function Pips({ value }: { value: number }) {
  const on = pipsFor(value);
  return (
    <span className="grid h-8 w-8 grid-cols-3 grid-rows-3 gap-0.5">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto h-1.5 w-1.5 rounded-full ${on.includes(i) ? 'bg-ink' : 'bg-transparent'}`} />
      ))}
    </span>
  );
}

// Assign the six cube faces so the front shows `value` and the visible
// adjacent faces (top/right) read like a real die. Opposite faces sum to 7.
function d6Faces(value: number): Record<string, number> {
  const others = [1, 2, 3, 4, 5, 6].filter((x) => x !== value && x !== 7 - value);
  const top = others[0];
  const right = others[2];
  return { front: value, back: 7 - value, top, bottom: 7 - top, right, left: 7 - right };
}

function Die3D({ value, sides, rolling, delay, highlight }: {
  value: number;
  sides: number;
  rolling: boolean;
  delay: number;
  highlight: boolean;
}) {
  const faces = sides === 6 ? d6Faces(value) : null;
  return (
    <span className="dice-scene">
      <span className={`dice-cube ${rolling ? 'rolling' : ''}`} style={rolling ? { animationDelay: `${delay}s` } : undefined}>
        {FACES.map((cls) => (
          <span key={cls} className={`dice-face ${cls} ${highlight && !rolling ? 'ring-2 ring-accent/50' : ''}`}>
            {sides === 6 ? (
              <Pips value={faces![cls]} />
            ) : (
              <span className="font-mono text-lg font-semibold text-ink">{value}</span>
            )}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function Dice() {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const stop = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(stop.current), []);

  function changeCount(n: number) {
    setCount(Math.min(20, Math.max(1, n)));
    setResults([]); // settings changed → back to preview
  }
  function changeSides(n: number) {
    setSides(n);
    setResults([]);
  }

  function roll() {
    if (rolling) return;
    clearTimeout(stop.current);
    setRolling(true);
    stop.current = setTimeout(() => {
      const final = rollDice(count, sides);
      setResults(final);
      setRolling(false);
      setHistory((h) => [{ results: final, total: sum(final), sides }, ...h].slice(0, HISTORY_MAX));
    }, ROLL_MS);
  }

  const rolled = results.length > 0;
  // Before a roll, every die previews the chosen type (max face) so you can
  // see at a glance how many dice and which kind you've set up.
  const dice = rolled ? results : Array.from({ length: count }, () => sides);
  const max = rolled && results.length > 1 ? Math.max(...results) : -1;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm text-ink">數量
          <input type="number" min={1} max={20} value={count} disabled={rolling} onChange={(e) => changeCount(Number(e.target.value))} className="mx-2 w-16 rounded border border-edge bg-surface px-2 py-1 text-center disabled:opacity-50" />
        </label>
        <label className="text-sm text-ink">面數
          <select value={sides} disabled={rolling} onChange={(e) => changeSides(Number(e.target.value))} className="mx-2 rounded border border-edge bg-surface px-2 py-1 disabled:opacity-50">
            {SIDES.map((s) => <option key={s} value={s}>d{s}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-[var(--radius-card)] border border-edge bg-bg p-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-8">
          {dice.map((v, i) => (
            <Die3D key={i} value={v} sides={sides} rolling={rolling} delay={(i % 6) * 0.05} highlight={v === max} />
          ))}
        </div>
        {rolled ? (
          results.length > 1 && <p className="mt-6 text-muted">總和：<span className="font-semibold text-ink">{sum(results)}</span></p>
        ) : (
          <p className="mt-6 text-sm text-muted">預覽：{count} 顆 d{sides} · 按下擲骰子開始</p>
        )}
      </div>

      <button onClick={roll} disabled={rolling} className="mt-6 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        {rolling ? '擲骰中…' : '擲骰子'}
      </button>

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
