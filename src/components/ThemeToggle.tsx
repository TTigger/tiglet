import { useState } from 'react';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined'
      ? ((document.documentElement.dataset.theme as Theme) || 'light')
      : 'light'
  );

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('tiglet:theme', next); } catch { /* ignore */ }
    setTheme(next);
  }

  return (
    <button onClick={toggle} aria-label="切換深色模式" className="text-lg leading-none transition-colors hover:text-accent">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
