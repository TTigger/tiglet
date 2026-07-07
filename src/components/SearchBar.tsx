import { useEffect, useMemo, useState } from 'react';
import { tools, CATEGORY_ORDER, type Tool } from '../data/tools';
import { filterTools } from '../lib/search';
import { getFavorites, getRecent, FAV_CHANGE_EVENT } from '../lib/storage';
import { toolTitle, toolDescription, toolPath, categoryLabel, type Locale } from '../lib/i18n';
import FavoriteButton from './FavoriteButton';

// 全部工具的卡片格由 index.astro 伺服器端輸出（#all-tools）；
// 這個 island 只負責：搜尋過濾（隱藏靜態格、渲染結果）＋最愛/最近個人化區塊。

const L = {
  zh: { placeholder: '搜尋工具…', search: '搜尋工具', favorites: '⭐ 我的最愛', recent: '🕘 最近使用', notFound: (q: string) => `找不到符合「${q}」的工具。` },
  en: { placeholder: 'Search tools…', search: 'Search tools', favorites: '⭐ Favorites', recent: '🕘 Recently used', notFound: (q: string) => `No tools match “${q}”.` },
};

function Card({ tool, locale }: { tool: Tool; locale: Locale }) {
  return (
    <a
      href={toolPath(tool, locale)}
      className="group relative block rounded-[var(--radius-card)] border border-edge bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl">{tool.icon}</span>
        <FavoriteButton id={tool.id} />
      </div>
      <h3 className="font-serif text-lg text-ink">{toolTitle(tool, locale)}</h3>
      <p className="mt-1 text-sm text-muted">{toolDescription(tool, locale)}</p>
    </a>
  );
}

function Grid({ items, locale }: { items: Tool[]; locale: Locale }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => <Card key={t.id} tool={t} locale={locale} />)}
    </div>
  );
}

export default function SearchBar({ locale = 'zh' }: { locale?: Locale }) {
  const [query, setQuery] = useState('');
  const [favIds, setFavIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const t = L[locale];

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

  const byId = (id: string) => tools.find((t2) => t2.id === id);
  const favTools = favIds.map(byId).filter((x): x is Tool => Boolean(x));
  const recentTools = recentIds.map(byId).filter((x): x is Tool => Boolean(x) && !favIds.includes(x!.id));

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.placeholder}
        aria-label={t.search}
        className="mb-10 w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-accent"
      />

      {!searching && favTools.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-ink">{t.favorites}</h2>
          <Grid items={favTools} locale={locale} />
        </section>
      )}

      {!searching && recentTools.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-ink">{t.recent}</h2>
          <Grid items={recentTools} locale={locale} />
        </section>
      )}

      {searching &&
        (filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">{t.notFound(query)}</p>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const inCat = filtered.filter((t2) => t2.category === cat);
            if (inCat.length === 0) return null;
            return (
              <section key={cat} className="mb-10">
                <h2 className="mb-4 font-serif text-xl text-ink">{categoryLabel(cat, locale)}</h2>
                <Grid items={inCat} locale={locale} />
              </section>
            );
          })
        ))}
    </div>
  );
}
