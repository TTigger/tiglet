import { useState } from 'react';
import { generatePassword, estimateStrength, strengthScore, type PasswordOptions } from '../lib/password';
import CopyButton from '../components/CopyButton';
import { useUrlState } from '../lib/urlState';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    empty: '按「產生」開始',
    length: (n: number) => `長度：${n}`,
    strength: (label: string) => `強度：${label}`,
    strengthLabel: { weak: '弱', medium: '中', strong: '強' },
    lengthAria: '密碼長度',
    upper: '大寫 A-Z',
    lower: '小寫 a-z',
    digits: '數字 0-9',
    symbols: '符號 !@#',
    generate: '產生密碼',
    noSet: '請至少選一種字元類型。',
  },
  en: {
    empty: 'Press "Generate" to start',
    length: (n: number) => `Length: ${n}`,
    strength: (label: string) => `Strength: ${label}`,
    strengthLabel: { weak: 'Weak', medium: 'Medium', strong: 'Strong' },
    lengthAria: 'Password length',
    upper: 'Uppercase A-Z',
    lower: 'Lowercase a-z',
    digits: 'Digits 0-9',
    symbols: 'Symbols !@#',
    generate: 'Generate password',
    noSet: 'Pick at least one character type.',
  },
} as const;

const STRENGTH_COLOR = { weak: 'text-red-500', medium: 'text-amber-500', strong: 'text-green-600' } as const;
const STRENGTH_BAR = { weak: 'bg-red-500', medium: 'bg-amber-500', strong: 'bg-green-600' } as const;

export default function Password({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  // 產生規則活在網址（len=16&set=uld）——密碼本身永遠不進網址
  const [lenStr, setLenStr] = useUrlState('len', '16');
  const [setStr, setSetStr] = useUrlState('set', 'uld');
  const [result, setResult] = useState<{ pw: string; opts: PasswordOptions } | null>(null);

  const length = Math.min(64, Math.max(6, Number(lenStr) || 16));
  const opts: PasswordOptions = {
    length,
    upper: setStr.includes('u'),
    lower: setStr.includes('l'),
    digits: setStr.includes('d'),
    symbols: setStr.includes('s'),
  };

  function generate() { setResult({ pw: generatePassword(opts), opts }); }
  type BoolKey = 'upper' | 'lower' | 'digits' | 'symbols';
  const CODE: Record<BoolKey, string> = { upper: 'u', lower: 'l', digits: 'd', symbols: 's' };
  function toggle(key: BoolKey) {
    const c = CODE[key];
    setSetStr(opts[key] ? setStr.replace(c, '') : setStr + c);
  }

  const password = result?.pw ?? '';
  const strength = estimateStrength(opts);
  const score = strengthScore(opts);
  const noSet = !opts.upper && !opts.lower && !opts.digits && !opts.symbols;

  const toggles: { key: BoolKey; label: string }[] = [
    { key: 'upper', label: t.upper },
    { key: 'lower', label: t.lower },
    { key: 'digits', label: t.digits },
    { key: 'symbols', label: t.symbols },
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative mb-4 flex min-h-[4rem] items-center rounded-[var(--radius-card)] border border-edge bg-surface p-6 pr-20 font-mono text-xl tabular-nums text-ink break-all">
        {password || <span className="text-muted">{t.empty}</span>}
        {password && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CopyButton value={password} /></div>}
      </div>

      <div className="mb-4">
        <label className="flex items-center justify-between text-sm text-ink">
          <span>{t.length(opts.length)}</span>
          <span className={STRENGTH_COLOR[strength]}>{t.strength(t.strengthLabel[strength])}</span>
        </label>
        <input type="range" min={6} max={64} value={opts.length} onChange={(e) => setLenStr(e.target.value)} aria-label={t.lengthAria} className="mt-2 w-full accent-[var(--color-accent)]" />
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-edge">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${STRENGTH_BAR[strength]}`}
            style={{ width: `${Math.round(score * 100)}%` }}
          />
        </div>
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
        {t.generate}
      </button>
      {noSet && <p className="mt-2 text-center text-sm text-accent">{t.noSet}</p>}
    </div>
  );
}
