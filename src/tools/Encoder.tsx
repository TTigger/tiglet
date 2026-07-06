import { useState } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { base64Encode, base64Decode, urlEncode, urlDecode, htmlEscape, htmlUnescape } from '../lib/encode';

const areaClass =
  'w-full rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-sm text-ink outline-none focus:border-accent';

interface Codec {
  encodeLabel: string;
  decodeLabel: string;
  encode: (s: string) => string;
  decode: (s: string) => string;
}

const CODECS: Record<string, Codec> = {
  base64: { encodeLabel: '文字 → Base64', decodeLabel: 'Base64 → 文字', encode: base64Encode, decode: base64Decode },
  url: { encodeLabel: '文字 → URL 編碼', decodeLabel: 'URL 編碼 → 文字', encode: urlEncode, decode: urlDecode },
  html: { encodeLabel: '文字 → HTML entities', decodeLabel: 'HTML entities → 文字', encode: htmlEscape, decode: htmlUnescape },
};

function CodecPanel({ codec }: { codec: Codec }) {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');

  let output = '';
  let error = '';
  if (input) {
    try {
      output = mode === 'encode' ? codec.encode(input) : codec.decode(input);
    } catch {
      error = '無法解碼：輸入格式不正確';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-1">
        {([['encode', codec.encodeLabel], ['decode', codec.decodeLabel]] as const).map(([id, label]) => (
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
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        placeholder={mode === 'encode' ? '輸入原始文字…' : '貼上要解碼的內容…'}
        className={areaClass}
      />
      <div className="rounded-[var(--radius-card)] border border-edge bg-surface">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2">
          <span className="text-sm text-muted">結果</span>
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

export default function Encoder() {
  const [tab, setTab] = useState('base64');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <CodecPanel key={tab} codec={CODECS[tab]} />
      <p className="mt-4 text-xs text-muted">Base64 走 UTF-8，中文與 emoji 都安全。所有轉換只在你的瀏覽器進行。</p>
    </div>
  );
}
