import { useState } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { base64Encode, base64Decode, urlEncode, urlDecode, htmlEscape, htmlUnescape } from '../lib/encode';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    labels: {
      base64: ['文字 → Base64', 'Base64 → 文字'],
      url: ['文字 → URL 編碼', 'URL 編碼 → 文字'],
      html: ['文字 → HTML entities', 'HTML entities → 文字'],
    },
    decodeError: '無法解碼：輸入格式不正確',
    phEncode: '輸入原始文字…',
    phDecode: '貼上要解碼的內容…',
    ariaEncode: '原始文字',
    ariaDecode: '待解碼內容',
    fillExample: '填入範例',
    sampleEncode: '公路車 Tiglet 讚 🚴',
    sampleDecode: '5YWs6Lev6LuKIFRpZ2xldCDorpog8J+atA==',
    result: '結果',
    footnote: 'Base64 走 UTF-8，中文與 emoji 都安全。所有轉換只在你的瀏覽器進行。',
  },
  en: {
    labels: {
      base64: ['Text → Base64', 'Base64 → Text'],
      url: ['Text → URL encoding', 'URL encoding → Text'],
      html: ['Text → HTML entities', 'HTML entities → Text'],
    },
    decodeError: 'Cannot decode: the input is not in a valid format',
    phEncode: 'Type the original text…',
    phDecode: 'Paste the content to decode…',
    ariaEncode: 'Original text',
    ariaDecode: 'Content to decode',
    fillExample: 'Fill example',
    sampleEncode: 'Road bikes + Tiglet 🚴',
    sampleDecode: 'Um9hZCBiaWtlcyArIFRpZ2xldCDwn5q0',
    result: 'Result',
    footnote: 'Base64 uses UTF-8, so CJK text and emoji are safe. All conversions happen entirely in your browser.',
  },
} as const;

type Dict = (typeof L)[Locale];

const areaClass =
  'w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-sm text-ink outline-none focus:border-accent';

interface Codec {
  encode: (s: string) => string;
  decode: (s: string) => string;
}

const CODECS: Record<string, Codec> = {
  base64: { encode: base64Encode, decode: base64Decode },
  url: { encode: urlEncode, decode: urlDecode },
  html: { encode: htmlEscape, decode: htmlUnescape },
};

function CodecPanel({ codec, labels, t }: { codec: Codec; labels: readonly [string, string]; t: Dict }) {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');

  let output = '';
  let error = '';
  if (input) {
    try {
      output = mode === 'encode' ? codec.encode(input) : codec.decode(input);
    } catch {
      error = t.decodeError;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-1">
        {([['encode', labels[0]], ['decode', labels[1]]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={`rounded-md border border-edge px-3 py-1 text-sm ${mode === id ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder={mode === 'encode' ? t.phEncode : t.phDecode}
          aria-label={mode === 'encode' ? t.ariaEncode : t.ariaDecode}
          className={areaClass}
        />
        {!input && (
          <button
            onClick={() => setInput(mode === 'encode' ? t.sampleEncode : t.sampleDecode)}
            className="absolute right-3 top-3 text-xs text-muted hover:text-accent"
          >
            {t.fillExample}
          </button>
        )}
      </div>
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2">
          <span className="text-sm text-muted">{t.result}</span>
          {output && <CopyButton value={output} />}
        </div>
        <div className="min-h-[6rem] whitespace-pre-wrap break-all px-4 py-3 font-mono text-sm text-ink">
          {error ? <span className="text-red-500">{error}</span> : output || <span className="text-muted">—</span>}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'base64', label: 'Base64' },
  { id: 'url', label: 'URL' },
  { id: 'html', label: 'HTML' },
];

export default function Encoder({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [tab, setTab] = useState('base64');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <CodecPanel key={tab} codec={CODECS[tab]} labels={t.labels[tab as keyof Dict['labels']]} t={t} />
      <p className="mt-4 text-xs text-muted">{t.footnote}</p>
    </div>
  );
}
