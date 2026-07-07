import { useState } from 'react';
import { textStats } from '../lib/textStats';
import CopyButton from '../components/CopyButton';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    placeholder: '貼上或輸入文字，統計即時更新…',
    ariaInput: '要統計的文字',
    statChars: '字元（含空白）',
    statCharsNoSpace: '字元（不含空白）',
    statCjk: '中文字數',
    statWords: '英文單字',
    statLines: '行數',
    statParagraphs: '段落',
    statReading: '預估閱讀',
    statTotal: '中英合計',
    seconds: (n: number) => `${n} 秒`,
    minutes: (m: string) => `${m} 分鐘`,
    copyLine: (s: ReturnType<typeof textStats>) =>
      `字元 ${s.chars}（不含空白 ${s.charsNoSpace}）・中文 ${s.cjkChars} 字・英文 ${s.latinWords} 詞・${s.lines} 行 ${s.paragraphs} 段`,
    footnote: '閱讀時間以中文約 350 字／分、英文約 220 詞／分估算。文字只在你的瀏覽器處理。',
  },
  en: {
    placeholder: 'Paste or type text — stats update live…',
    ariaInput: 'Text to count',
    statChars: 'Characters (with spaces)',
    statCharsNoSpace: 'Characters (no spaces)',
    statCjk: 'CJK characters',
    statWords: 'English words',
    statLines: 'Lines',
    statParagraphs: 'Paragraphs',
    statReading: 'Est. reading time',
    statTotal: 'CJK + words',
    seconds: (n: number) => `${n} sec`,
    minutes: (m: string) => `${m} min`,
    copyLine: (s: ReturnType<typeof textStats>) =>
      `${s.chars} chars (${s.charsNoSpace} without spaces) · ${s.cjkChars} CJK chars · ${s.latinWords} words · ${s.lines} lines, ${s.paragraphs} paragraphs`,
    footnote: 'Reading time estimated at ~350 CJK characters/min and ~220 English words/min. Text is processed entirely in your browser.',
  },
} as const;

type Dict = (typeof L)[Locale];

function fmtMinutes(min: number, t: Dict): string {
  if (min === 0) return '—';
  if (min < 1) return t.seconds(Math.max(1, Math.round(min * 60)));
  return t.minutes(min.toFixed(1));
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-3 py-3 text-center">
      <div className="font-mono text-2xl tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

export default function WordCount({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [text, setText] = useState('');
  const s = textStats(text);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={t.placeholder}
        aria-label={t.ariaInput}
        className="w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 text-ink outline-none focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t.statChars} value={String(s.chars)} />
        <Stat label={t.statCharsNoSpace} value={String(s.charsNoSpace)} />
        <Stat label={t.statCjk} value={String(s.cjkChars)} />
        <Stat label={t.statWords} value={String(s.latinWords)} />
        <Stat label={t.statLines} value={String(s.lines)} />
        <Stat label={t.statParagraphs} value={String(s.paragraphs)} />
        <Stat label={t.statReading} value={fmtMinutes(s.readingMinutes, t)} />
        <Stat label={t.statTotal} value={String(s.cjkChars + s.latinWords)} />
      </div>
      {text && (
        <div className="flex justify-end">
          <CopyButton value={t.copyLine(s)} />
        </div>
      )}
      <p className="text-xs text-muted">{t.footnote}</p>
    </div>
  );
}
