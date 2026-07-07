import { useState } from 'react';
import { diffLines, diffChars, diffStats, type DiffPart } from '../lib/diff';
import CopyButton from '../components/CopyButton';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    labelA: '原始文字 A',
    labelB: '比較文字 B',
    phA: '貼上舊版文字…',
    phB: '貼上新版文字…',
    fillExample: '填入範例',
    sampleA: '週六團騎路線\n清晨六點出發\n風櫃嘴集合\n下滑到金山吃鴨肉',
    sampleB: '週日團騎路線\n清晨五點半出發\n風櫃嘴集合\n加碼陽金P字道\n下滑到金山吃鴨肉',
    diffResult: '差異結果',
    identical: '兩段文字完全相同 ✓',
    footnote: '行級比對（LCS），相鄰的刪除／新增行會再做字元級高亮。文字只在你的瀏覽器處理。',
  },
  en: {
    labelA: 'Original text A',
    labelB: 'Compare text B',
    phA: 'Paste the old version…',
    phB: 'Paste the new version…',
    fillExample: 'Fill example',
    sampleA: 'Saturday group ride\nRoll out at 6:00 am\nMeet at Fengguizui\nDescend to Jinshan for duck noodles',
    sampleB: 'Sunday group ride\nRoll out at 5:30 am\nMeet at Fengguizui\nBonus loop up Yangjin P-road\nDescend to Jinshan for duck noodles',
    diffResult: 'Diff result',
    identical: 'The two texts are identical ✓',
    footnote: 'Line-level diff (LCS); adjacent deleted/added lines get extra character-level highlighting. Text is processed entirely in your browser.',
  },
} as const;

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

export default function TextDiff({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const parts = diffLines(a, b);
  const stats = diffStats(parts);
  const hasInput = a !== '' || b !== '';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="relative grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.labelA}</span>
          <textarea value={a} onChange={(e) => setA(e.target.value)} rows={8} placeholder={t.phA} className={areaClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.labelB}</span>
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={8} placeholder={t.phB} className={areaClass} />
        </label>
        {!hasInput && (
          <button
            onClick={() => { setA(t.sampleA); setB(t.sampleB); }}
            className="absolute right-0 -top-1 text-xs text-muted hover:text-accent"
          >
            {t.fillExample}
          </button>
        )}
      </div>

      {hasInput && (
        <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
          <div className="flex items-center gap-4 border-b border-edge px-4 py-2 text-sm">
            <span className="text-muted">{t.diffResult}</span>
            <span className="text-green-600">＋{stats.added}</span>
            <span className="text-red-500">−{stats.deleted}</span>
            {(stats.added > 0 || stats.deleted > 0) && <CopyButton value={diffText(parts)} className="ml-auto" />}
          </div>
          <div className="max-h-[32rem] overflow-y-auto py-2">
            {stats.added === 0 && stats.deleted === 0 ? (
              <p className="px-4 py-2 text-sm text-muted">{t.identical}</p>
            ) : (
              <DiffView parts={parts} />
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">{t.footnote}</p>
    </div>
  );
}
