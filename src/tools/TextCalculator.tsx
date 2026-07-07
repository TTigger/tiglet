import { evaluate } from '../lib/expression';
import { useUrlState } from '../lib/urlState';
import CopyButton from '../components/CopyButton';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    placeholder: '輸入算式，例如 12*3+(4/2)',
    ariaInput: '算式',
    fillExample: '填入範例',
    invalid: '無效的算式',
  },
  en: {
    placeholder: 'Enter an expression, e.g. 12*3+(4/2)',
    ariaInput: 'Expression',
    fillExample: 'Fill example',
    invalid: 'Invalid expression',
  },
} as const;

export default function TextCalculator({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [input, setInput] = useUrlState('q', '');
  let result = '';
  let error = '';
  if (input.trim()) {
    try { result = String(evaluate(input)); }
    catch (e) { error = e instanceof Error ? e.message : t.invalid; }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          aria-label={t.ariaInput}
          className="w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-lg text-ink outline-none focus:border-accent"
        />
        {!input && (
          <button
            onClick={() => setInput('(180*4.5+250)/3')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-accent"
          >
            {t.fillExample}
          </button>
        )}
      </div>
      <div className="relative mt-4 rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-right font-mono text-3xl tabular-nums">
        {!error && result && <div className="absolute left-3 top-3"><CopyButton value={result} /></div>}
        {error ? <span className="text-base text-accent">{error}</span> : <span className="text-ink">{result || '0'}</span>}
      </div>
    </div>
  );
}
