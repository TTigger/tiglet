import { useEffect, useMemo, useState } from 'react';
import { tools, CATEGORY_ORDER, type Tool } from '../data/tools';
import { filterTools } from '../lib/search';
import { getFavorites, getRecent } from '../lib/storage';
import FavoriteButton from './FavoriteButton';

function Card({ tool, onFavChange }: { tool: Tool; onFavChange: () => void }) {
  const isAvailable = tool.status === 'available';
  const base =
    'group relative block rounded-[var(--radius-card)] border border-edge bg-surface p-5 transition-all';
  const cls = isAvailable
    ? `${base} hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]`
    : `${base} cursor-default opacity-60`;
  const inner = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl">{tool.icon}</span>
        <span className="flex items-center gap-2">
          {!isAvailable && <span className="rounded-full bg-edge px-2 py-0.5 text-xs text-muted">即將推出</span>}
          <FavoriteButton id={tool.id} onChange={onFavChange} />
        </span>
      </div>
      <h3 className="font-serif text-lg text-ink">{tool.title}</h3>
      <p className="mt-1 text-sm text-muted">{tool.description}</p>
    </>
  );
  return isAvailable ? (
    <a href={tool.path} className={cls}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Grid({ items, onFavChange }: { items: Tool[]; onFavChange: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => <Card key={t.id} tool={t} onFavChange={onFavChange} />)}
    </div>
  );
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [favIds, setFavIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const refreshPersonal = () => {
    setFavIds(getFavorites());
    setRecentIds(getRecent());
  };
  useEffect(() => { refreshPersonal(); }, []);

  const filtered = useMemo(() => filterTools(tools, query), [query]);
  const searching = query.trim().length > 0;

  const byId = (id: string) => tools.find((t) => t.id === id);
  const favTools = favIds.map(byId).filter((t): t is Tool => Boolean(t));
  const recentTools = recentIds.map(byId).filter((t): t is Tool => Boolean(t));

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜尋工具…"
        className="mb-10 w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-accent"
      />

      {!searching && favTools.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-ink">⭐ 我的最愛</h2>
          <Grid items={favTools} onFavChange={refreshPersonal} />
        </section>
      )}

      {!searching && recentTools.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-ink">🕘 最近使用</h2>
          <Grid items={recentTools} onFavChange={refreshPersonal} />
        </section>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">找不到符合「{query}」的工具。</p>
      ) : (
        CATEGORY_ORDER.map((cat) => {
          const inCat = filtered.filter((t) => t.category === cat);
          if (inCat.length === 0) return null;
          return (
            <section key={cat} className="mb-10">
              <h2 className="mb-4 font-serif text-xl text-ink">{cat}</h2>
              <Grid items={inCat} onFavChange={refreshPersonal} />
            </section>
          );
        })
      )}
    </div>
  );
}
