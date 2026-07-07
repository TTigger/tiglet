import { useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { isFavorite, toggleFavorite, FAV_CHANGE_EVENT } from '../lib/storage';

export default function FavoriteButton({ id, onChange }: { id: string; onChange?: (fav: boolean) => void }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const sync = () => setFav(isFavorite(id));
    sync();
    window.addEventListener(FAV_CHANGE_EVENT, sync);
    return () => window.removeEventListener(FAV_CHANGE_EVENT, sync);
  }, [id]);

  function onClick(e: ReactMouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(id).includes(id);
    setFav(next);
    onChange?.(next);
    window.dispatchEvent(new Event(FAV_CHANGE_EVENT));
  }

  return (
    <button onClick={onClick} aria-label="釘選工具" aria-pressed={fav} className="text-base leading-none transition-transform hover:scale-110">
      {fav ? '⭐' : '☆'}
    </button>
  );
}
