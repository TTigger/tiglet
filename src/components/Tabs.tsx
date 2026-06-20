export interface TabItem {
  id: string;
  label: string;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-6 inline-flex flex-wrap gap-1 rounded-lg border border-edge bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          aria-pressed={active === t.id}
          className={`rounded-md px-4 py-1.5 text-sm transition-colors ${active === t.id ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
