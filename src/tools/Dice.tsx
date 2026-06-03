import { useState } from 'react';
import { rollDice, sum } from '../lib/dice';

const SIDES = [4, 6, 8, 10, 12, 20];

export default function Dice() {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);

  function roll() {
    setRolling(true);
    setTimeout(() => {
      setResults(rollDice(count, sides));
      setRolling(false);
    }, 300);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm text-ink">數量
          <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value))))} className="mx-2 w-16 rounded border border-edge bg-surface px-2 py-1 text-center" />
        </label>
        <label className="text-sm text-ink">面數
          <select value={sides} onChange={(e) => setSides(Number(e.target.value))} className="mx-2 rounded border border-edge bg-surface px-2 py-1">
            {SIDES.map((s) => <option key={s} value={s}>d{s}</option>)}
          </select>
        </label>
      </div>

      <button onClick={roll} disabled={rolling} className="mb-6 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        {rolling ? '擲骰中…' : '擲骰子'}
      </button>

      {results.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            {results.map((r, i) => (
              <span key={i} className="flex h-14 w-14 items-center justify-center rounded-lg border border-edge font-mono text-2xl text-ink">{r}</span>
            ))}
          </div>
          {results.length > 1 && <p className="mt-4 text-muted">總和：<span className="font-semibold text-ink">{sum(results)}</span></p>}
        </div>
      )}
    </div>
  );
}
