import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { tools } from '../data/tools';
import { filterTools } from '../lib/search';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = tools.filter((t) => t.status === 'available');
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      const t = results[index];
      if (t) window.location.href = t.path;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-edge bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
          placeholder="跳到工具…"
          className="w-full rounded-t-[var(--radius-card)] bg-transparent px-4 py-3 text-ink outline-none placeholder:text-muted"
        />
        <ul className="max-h-72 overflow-y-auto border-t border-edge p-2">
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted">找不到工具</li>
          ) : (
            results.map((t, i) => (
              <li key={t.id}>
                <a
                  href={t.path}
                  onMouseEnter={() => setIndex(i)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === index ? 'bg-accent text-white' : 'text-ink'}`}
                >
                  <span>{t.icon}</span><span>{t.title}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
