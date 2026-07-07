import { useEffect, useMemo, useState } from 'react';
import { tools, CATEGORY_ORDER, type Tool } from '../data/tools';
import { filterTools } from '../lib/search';
import { getFavorites, getRecent, FAV_CHANGE_EVENT } from '../lib/storage';
import FavoriteButton from './FavoriteButton';

// 全部工具的卡片格由 index.astro 伺服器端輸出（#all-tools）；
// 這個 island 只負責：搜尋過濾（隱藏靜態格、渲染結果）＋最愛/最近個人化區塊。

function Card({ tool }: { tool: Tool }) {
  return (
    <a
      href={tool.path}
      className="group relative block rounded-[var(--radius-card)] border border-edge bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl">{tool.icon}</span>
        <FavoriteButton id={tool.id} />
      </div>
      <h3 className="font-serif text-lg text-ink">{tool.title}</h3>
      <p className="mt-1 text-sm text-muted">{tool.description}</p>
    </a>
  );
}

function Grid({ items }: { items: Tool[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => <Card key={t.id} tool={t} />)}
    </div>
  );
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [favIds, setFavIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // 初始載入＋監聽釘選事件（含靜態卡片上的星星）→ 個人化區塊即時更新
  useEffect(() => {
    const refresh = () => {
      setFavIds(getFavorites());
      setRecentIds(getRecent());
    };
    refresh();
    window.addEventListener(FAV_CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh); // 跨分頁同步
    return () => {
      window.removeEventListener(FAV_CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const filtered = useMemo(() => filterTools(tools, query), [query]);
  const searching = query.trim().length > 0;

  // 搜尋時隱藏伺服器端輸出的完整工具格
  useEffect(() => {
    const el = document.getElementById('all-tools');
    if (el) el.hidden = searching;
  }, [searching]);

  const byId = (id: string) => tools.find((t) => t.id === id);
  const favTools = favIds.map(byId).filter((t): t is Tool => Boolean(t));
  const recentTools = recentIds.map(byId).filter((t): t is Tool => Boolean(t) && !favIds.includes(t!.id));

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜尋工具…"
        aria-label="搜尋工具"
        className="mb-10 w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-accent"
      />

      {!searching && favTools.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-ink">⭐ 我的最愛</h2>
          <Grid items={favTools} />
        </section>
      )}

      {!searching && recentTools.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-ink">🕘 最近使用</h2>
          <Grid items={recentTools} />
        </section>
      )}

      {searching &&
        (filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">找不到符合「{query}」的工具。</p>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const inCat = filtered.filter((t) => t.category === cat);
            if (inCat.length === 0) return null;
            return (
              <section key={cat} className="mb-10">
                <h2 className="mb-4 font-serif text-xl text-ink">{cat}</h2>
                <Grid items={inCat} />
              </section>
            );
          })
        ))}
    </div>
  );
}
