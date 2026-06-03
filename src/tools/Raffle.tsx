import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseNames, drawWinners } from '../lib/raffle';
import { getHeaders, extractColumn } from '../lib/excel';

export default function Raffle() {
  const [text, setText] = useState('');
  const [count, setCount] = useState(1);
  const [winners, setWinners] = useState<string[]>([]);
  const [excludeWon, setExcludeWon] = useState(true);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  const names = parseNames(text);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      if (parsed.length < 2) { setError('檔案資料不足（需要標題列 + 至少一筆資料）'); return; }
      setRows(parsed);
      setHeaders(getHeaders(parsed));
    } catch {
      setError('無法讀取檔案，請確認格式為 .xlsx / .xls / .csv');
    } finally {
      e.target.value = '';
    }
  }

  function pickColumn(colIndex: number) {
    const extracted = extractColumn(rows.slice(1), colIndex);
    setText(extracted.join('\n'));
    setHeaders(null);
    setRows([]);
    setWinners([]);
  }

  function draw() {
    const pool = excludeWon ? names.filter((nm) => !winners.includes(nm)) : names;
    setWinners(drawWinners(pool, count));
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 rounded-[var(--radius-card)] border border-dashed border-edge bg-surface p-4 text-center">
        <label className="cursor-pointer text-sm text-accent hover:underline">
          匯入 Excel / CSV 名單
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
        </label>
        <p className="mt-1 text-xs text-muted">檔案只在你的瀏覽器處理，不會上傳。</p>
      </div>

      {error && <p className="mb-4 text-sm text-accent">{error}</p>}

      {headers && (
        <div className="mb-4 rounded-[var(--radius-card)] border border-edge bg-surface p-4">
          <p className="mb-2 text-sm text-ink">選擇名單所在的欄位：</p>
          <div className="flex flex-wrap gap-2">
            {headers.map((h, i) => (
              <button key={i} onClick={() => pickColumn(i)} className="rounded-lg border border-edge px-3 py-1 text-sm text-ink hover:border-accent hover:text-accent">{h}</button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'每行一個名字，或從上方匯入 Excel：\n王小明\n陳大文\n林美麗'}
        className="w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
      />

      <div className="mt-4 flex items-center gap-4">
        <label className="text-sm text-ink">抽出
          <input type="number" min={1} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} className="mx-2 w-16 rounded border border-edge bg-surface px-2 py-1 text-center" />
          位
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={excludeWon} onChange={(e) => setExcludeWon(e.target.checked)} />
          排除已中獎者
        </label>
      </div>

      <button onClick={draw} disabled={names.length === 0} className="mt-4 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        抽出中獎者（共 {names.length} 人）
      </button>

      {winners.length > 0 && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-edge bg-surface p-6">
          <h2 className="mb-3 font-serif text-xl text-ink">🎉 中獎名單</h2>
          <ul className="space-y-1">
            {winners.map((w, i) => <li key={i} className="text-lg text-ink">{i + 1}. {w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
