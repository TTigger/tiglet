import { useState } from 'react';
import { generatePassword, estimateStrength, type PasswordOptions } from '../lib/password';
import CopyButton from '../components/CopyButton';

const STRENGTH_LABEL = { weak: '弱', medium: '中', strong: '強' } as const;
const STRENGTH_COLOR = { weak: 'text-red-500', medium: 'text-amber-500', strong: 'text-green-600' } as const;

export default function Password() {
  const [opts, setOpts] = useState<PasswordOptions>({ length: 16, upper: true, lower: true, digits: true, symbols: false });
  const [result, setResult] = useState<{ pw: string; opts: PasswordOptions } | null>(null);

  function generate() { setResult({ pw: generatePassword(opts), opts }); }
  type BoolKey = 'upper' | 'lower' | 'digits' | 'symbols';
  function toggle(key: BoolKey) { setOpts((o) => ({ ...o, [key]: !o[key] })); }

  const password = result?.pw ?? '';
  const strength = estimateStrength(result ? result.opts : opts);
  const noSet = !opts.upper && !opts.lower && !opts.digits && !opts.symbols;

  const toggles: { key: BoolKey; label: string }[] = [
    { key: 'upper', label: '大寫 A-Z' },
    { key: 'lower', label: '小寫 a-z' },
    { key: 'digits', label: '數字 0-9' },
    { key: 'symbols', label: '符號 !@#' },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative mb-4 flex min-h-[4rem] items-center rounded-[var(--radius-card)] border border-edge bg-surface p-6 pr-20 font-mono text-xl tabular-nums text-ink break-all">
        {password || <span className="text-muted">按「產生」開始</span>}
        {password && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CopyButton value={password} /></div>}
      </div>

      <div className="mb-4">
        <label className="flex items-center justify-between text-sm text-ink">
          <span>長度：{opts.length}</span>
          <span className={STRENGTH_COLOR[strength]}>強度：{STRENGTH_LABEL[strength]}</span>
        </label>
        <input type="range" min={6} max={64} value={opts.length} onChange={(e) => setOpts((o) => ({ ...o, length: Number(e.target.value) }))} className="mt-2 w-full accent-[var(--color-accent)]" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        {toggles.map((t) => (
          <label key={t.key} className="flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink">
            <input type="checkbox" checked={opts[t.key] as boolean} onChange={() => toggle(t.key)} />
            {t.label}
          </label>
        ))}
      </div>

      <button onClick={generate} disabled={noSet} className="w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        產生密碼
      </button>
      {noSet && <p className="mt-2 text-center text-sm text-accent">請至少選一種字元類型。</p>}
    </div>
  );
}
