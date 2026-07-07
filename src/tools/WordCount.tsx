import { useState } from 'react';
import { textStats } from '../lib/textStats';
import CopyButton from '../components/CopyButton';

function fmtMinutes(min: number): string {
  if (min === 0) return '—';
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} 秒`;
  return `${min.toFixed(1)} 分鐘`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-3 py-3 text-center">
      <div className="font-mono text-2xl tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

export default function WordCount() {
  const [text, setText] = useState('');
  const s = textStats(text);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="貼上或輸入文字，統計即時更新…"
        className="w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="字元（含空白）" value={String(s.chars)} />
        <Stat label="字元（不含空白）" value={String(s.charsNoSpace)} />
        <Stat label="中文字數" value={String(s.cjkChars)} />
        <Stat label="英文單字" value={String(s.latinWords)} />
        <Stat label="行數" value={String(s.lines)} />
        <Stat label="段落" value={String(s.paragraphs)} />
        <Stat label="預估閱讀" value={fmtMinutes(s.readingMinutes)} />
        <Stat label="中英合計" value={String(s.cjkChars + s.latinWords)} />
      </div>
      {text && (
        <div className="flex justify-end">
          <CopyButton
            value={`字元 ${s.chars}（不含空白 ${s.charsNoSpace}）・中文 ${s.cjkChars} 字・英文 ${s.latinWords} 詞・${s.lines} 行 ${s.paragraphs} 段`}
          />
        </div>
      )}
      <p className="text-xs text-muted">閱讀時間以中文約 350 字／分、英文約 220 詞／分估算。文字只在你的瀏覽器處理。</p>
    </div>
  );
}
