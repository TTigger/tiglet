import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseNames, drawWinners } from '../lib/raffle';
import { getHeaders, extractColumn } from '../lib/excel';

const ROLL_MS = 1900;

interface DrawResult {
  prize: string;
  winners: string[];
}

export default function Raffle() {
  const [text, setText] = useState('');
  const [prize, setPrize] = useState('');
  const [count, setCount] = useState(1);
  const [excludeWon, setExcludeWon] = useState(true);
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [rolling, setRolling] = useState(false);
  const [flash, setFlash] = useState('');
  const [rows, setRows] = useState<unknown[][]>([]);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});

  const names = parseNames(text);
  const won = draws.flatMap((d) => d.winners);
  const pool = excludeWon ? names.filter((nm) => !won.includes(nm)) : names;

  useEffect(() => () => {
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
  }, []);

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
    setDraws([]);
  }

  function draw() {
    if (rolling || pool.length === 0) return;
    const winners = drawWinners(pool, count);
    if (winners.length === 0) return;
    const label = prize.trim() || `第 ${draws.length + 1} 輪`;

    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
    setRolling(true);
    timers.current.tick = setInterval(() => {
      setFlash(names[Math.floor(Math.random() * names.length)] ?? '');
    }, 70);
    timers.current.stop = setTimeout(() => {
      clearInterval(timers.current.tick);
      setRolling(false);
      setDraws((prev) => [...prev, { prize: label, winners }]);
    }, ROLL_MS);
  }

  function reset() { setDraws([]); }

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

      {/* 抽獎選項 */}
      <div className="mt-4 grid gap-3 rounded-[var(--radius-card)] border border-edge bg-surface p-4 sm:grid-cols-2">
        <label className="text-sm text-ink sm:col-span-2">獎品名稱
          <input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="例如：頭獎 / iPhone" className="mt-1 w-full rounded border border-edge bg-bg px-3 py-1.5 text-ink outline-none focus:border-accent" />
        </label>
        <label className="text-sm text-ink">本輪抽出
          <input type="number" min={1} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} className="mx-2 w-16 rounded border border-edge bg-bg px-2 py-1 text-center" />
          位
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={excludeWon} onChange={(e) => setExcludeWon(e.target.checked)} />
          排除已中獎者
        </label>
      </div>

      {/* 跑馬燈抽獎機 */}
      <div className="mt-4 h-20 overflow-hidden rounded-[var(--radius-card)] border border-edge bg-surface">
        {rolling ? (
          <div className="flex h-full items-center justify-center">
            <span className="font-serif text-3xl text-accent">{flash || '🎰'}</span>
          </div>
        ) : (
          <div className="flex h-full items-center overflow-hidden">
            <div className="marquee-track" style={{ animationPlayState: names.length ? 'running' : 'paused' }}>
              {[...names, ...names, '🎁 準備抽獎'].map((nm, i) => (
                <span key={i} className="px-4 text-lg text-muted">{nm}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={draw} disabled={pool.length === 0 || rolling} className="mt-4 w-full rounded-lg bg-accent py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50">
        {rolling ? '抽獎中…' : `開始抽獎（剩餘 ${pool.length} 人）`}
      </button>

      {draws.length > 0 && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-edge bg-surface p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl text-ink">🎉 中獎名單</h2>
            <button onClick={reset} className="text-sm text-muted hover:text-accent">清除</button>
          </div>
          <div className="space-y-4">
            {draws.map((d, di) => (
              <div key={di} className={di === draws.length - 1 ? 'die-pop' : ''}>
                <h3 className="mb-1 text-sm font-semibold text-accent">{d.prize}</h3>
                <ul className="space-y-0.5">
                  {d.winners.map((w, i) => <li key={i} className="text-lg text-ink">{i + 1}. {w}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
