import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { tools } from '../data/tools';
import { filterTools } from '../lib/search';
import { localeFromPath, toolTitle, toolPath } from '../lib/i18n';

const L = {
  zh: { placeholder: '跳到工具…', search: '搜尋工具', list: '工具清單', dialog: '快速跳到工具', notFound: '找不到工具', results: (n: number) => `${n} 個結果` },
  en: { placeholder: 'Jump to a tool…', search: 'Search tools', list: 'Tools', dialog: 'Quick tool switcher', notFound: 'No tools found', results: (n: number) => `${n} results` },
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const locale = typeof window !== 'undefined' ? localeFromPath(window.location.pathname) : 'zh';
  const t = L[locale];
  const available = tools.filter((x) => x.status === 'available');
  const results = filterTools(available, query);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => { setIndex(0); }, [query]);

  if (!open) return null;

  function onInputKey(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      const target = results[index];
      if (target) window.location.href = toolPath(target, locale);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // focus trap：面板內唯一可聚焦的是輸入框，用方向鍵選取
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.dialog}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-edge bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
          placeholder={t.placeholder}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-listbox"
          aria-activedescendant={results[index] ? `palette-opt-${results[index].id}` : undefined}
          aria-label={t.search}
          className="w-full rounded-t-[var(--radius-card)] bg-transparent px-4 py-3 text-ink outline-none placeholder:text-muted"
        />
        <span role="status" className="sr-only">{t.results(results.length)}</span>
        <ul id="palette-listbox" role="listbox" aria-label={t.list} className="max-h-72 overflow-y-auto border-t border-edge p-2">
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted">{t.notFound}</li>
          ) : (
            results.map((item, i) => (
              <li key={item.id} id={`palette-opt-${item.id}`} role="option" aria-selected={i === index}>
                <a
                  href={toolPath(item, locale)}
                  tabIndex={-1}
                  onMouseEnter={() => setIndex(i)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === index ? 'bg-accent text-white' : 'text-ink'}`}
                >
                  <span>{item.icon}</span><span>{toolTitle(item, locale)}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
