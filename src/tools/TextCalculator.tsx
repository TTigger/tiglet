import { useState } from 'react';
import { evaluate } from '../lib/expression';

export default function TextCalculator() {
  const [input, setInput] = useState('');
  let result = '';
  let error = '';
  if (input.trim()) {
    try { result = String(evaluate(input)); }
    catch (e) { error = e instanceof Error ? e.message : '無效的算式'; }
  }

  return (
    <div className="mx-auto max-w-lg">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="輸入算式，例如 12*3+(4/2)"
        className="w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-lg text-ink outline-none focus:border-accent"
      />
      <div className="mt-4 rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-right font-mono text-3xl tabular-nums">
        {error ? <span className="text-base text-accent">{error}</span> : <span className="text-ink">{result || '0'}</span>}
      </div>
    </div>
  );
}
