import { useState } from 'react';
import { diffLines, diffChars, diffStats, type DiffPart } from '../lib/diff';
import CopyButton from '../components/CopyButton';

const SAMPLE_A = '週六團騎路線\n清晨六點出發\n風櫃嘴集合\n下滑到金山吃鴨肉';
const SAMPLE_B = '週日團騎路線\n清晨五點半出發\n風櫃嘴集合\n加碼陽金P字道\n下滑到金山吃鴨肉';

// 差異結果轉成可貼上的統一格式文字
function diffText(parts: DiffPart[]): string {
  return parts.map((p) => `${p.type === 'add' ? '+' : p.type === 'del' ? '-' : ' '} ${p.text}`).join('\n');
}

const areaClass =
  'w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-sm text-ink outline-none focus:border-accent';

// 相鄰的 del/add 行視為「修改」，行內做字元級高亮
function InlineDiff({ del, add }: { del: string; add: string }) {
  const parts = diffChars(del, add);
  return (
    <>
      <div className="bg-red-500/10 px-3 py-0.5">
        <span className="mr-2 select-none text-red-500">−</span>
        {parts.filter((p) => p.type !== 'add').map((p, i) => (
          <span key={i} className={p.type === 'del' ? 'rounded bg-red-500/30' : ''}>{p.text}</span>
        ))}
      </div>
      <div className="bg-green-600/10 px-3 py-0.5">
        <span className="mr-2 select-none text-green-600">＋</span>
        {parts.filter((p) => p.type !== 'del').map((p, i) => (
          <span key={i} className={p.type === 'add' ? 'rounded bg-green-600/30' : ''}>{p.text}</span>
        ))}
      </div>
    </>
  );
}

function DiffView({ parts }: { parts: DiffPart[] }) {
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const next = parts[i + 1];
    if (p.type === 'del' && next?.type === 'add') {
      rows.push(<InlineDiff key={i} del={p.text} add={next.text} />);
      i++;
    } else if (p.type === 'del') {
      rows.push(
        <div key={i} className="bg-red-500/10 px-3 py-0.5">
          <span className="mr-2 select-none text-red-500">−</span>{p.text}
        </div>
      );
    } else if (p.type === 'add') {
      rows.push(
        <div key={i} className="bg-green-600/10 px-3 py-0.5">
          <span className="mr-2 select-none text-green-600">＋</span>{p.text}
        </div>
      );
    } else {
      rows.push(
        <div key={i} className="px-3 py-0.5 text-muted">
          <span className="mr-2 select-none opacity-0">＝</span>{p.text}
        </div>
      );
    }
  }
  return <div className="whitespace-pre-wrap break-all font-mono text-sm">{rows}</div>;
}

export default function TextDiff() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const parts = diffLines(a, b);
  const stats = diffStats(parts);
  const hasInput = a !== '' || b !== '';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="relative grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">原始文字 A</span>
          <textarea value={a} onChange={(e) => setA(e.target.value)} rows={8} placeholder="貼上舊版文字…" className={areaClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">比較文字 B</span>
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={8} placeholder="貼上新版文字…" className={areaClass} />
        </label>
        {!hasInput && (
          <button
            onClick={() => { setA(SAMPLE_A); setB(SAMPLE_B); }}
            className="absolute right-0 -top-1 text-xs text-muted hover:text-accent"
          >
            填入範例
          </button>
        )}
      </div>

      {hasInput && (
        <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
          <div className="flex items-center gap-4 border-b border-edge px-4 py-2 text-sm">
            <span className="text-muted">差異結果</span>
            <span className="text-green-600">＋{stats.added}</span>
            <span className="text-red-500">−{stats.deleted}</span>
            {(stats.added > 0 || stats.deleted > 0) && <CopyButton value={diffText(parts)} className="ml-auto" />}
          </div>
          <div className="max-h-[32rem] overflow-y-auto py-2">
            {stats.added === 0 && stats.deleted === 0 ? (
              <p className="px-4 py-2 text-sm text-muted">兩段文字完全相同 ✓</p>
            ) : (
              <DiffView parts={parts} />
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">行級比對（LCS），相鄰的刪除／新增行會再做字元級高亮。文字只在你的瀏覽器處理。</p>
    </div>
  );
}
