import { useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { isFavorite, toggleFavorite } from '../lib/storage';

export default function FavoriteButton({ id, onChange }: { id: string; onChange?: (fav: boolean) => void }) {
  const [fav, setFav] = useState(false);

  useEffect(() => { setFav(isFavorite(id)); }, [id]);

  function onClick(e: ReactMouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(id).includes(id);
    setFav(next);
    onChange?.(next);
  }

  return (
    <button onClick={onClick} aria-label="釘選工具" className="text-base leading-none transition-transform hover:scale-110">
      {fav ? '⭐' : '☆'}
    </button>
  );
}
