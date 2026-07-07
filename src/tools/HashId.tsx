import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { sha256Hex, sha1Hex, hashBufferHex, uuidBatch } from '../lib/hashId';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabHash: '雜湊',
    tabUuid: 'UUID',
    inputLabel: '要雜湊的文字',
    inputPlaceholder: '輸入文字，即時計算 SHA-256 與 SHA-1…',
    orFile: '或上傳檔案',
    fileInfo: (name: string) => `檔案：${name}`,
    hashing: '計算中…',
    noMd5: '不提供 MD5——它已不適用於任何新用途。',
    count: '數量',
    generate: '產生 UUID',
    copyAll: '複製全部',
    privacy: '文字與檔案都只在你的瀏覽器計算，不會上傳。',
  },
  en: {
    tabHash: 'Hash',
    tabUuid: 'UUID',
    inputLabel: 'Text to hash',
    inputPlaceholder: 'Type text to compute SHA-256 and SHA-1 live…',
    orFile: 'or upload a file',
    fileInfo: (name: string) => `File: ${name}`,
    hashing: 'Hashing…',
    noMd5: 'MD5 is deliberately not offered — it is unfit for any new use.',
    count: 'Count',
    generate: 'Generate UUIDs',
    copyAll: 'Copy all',
    privacy: 'Text and files are hashed entirely in your browser — nothing is uploaded.',
  },
} as const;
type Dict = (typeof L)[Locale];

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-accent';

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-4 py-3">
      <span className="w-20 shrink-0 text-sm text-muted">{label}</span>
      <span className="flex-1 break-all font-mono text-xs tabular-nums text-ink">{value || '—'}</span>
      {value && <CopyButton value={value} />}
    </div>
  );
}

function HashPanel({ t }: { t: Dict }) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [sha256, setSha256] = useState('');
  const [sha1, setSha1] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (fileName) return; // 檔案模式下不跟文字連動
    if (!text) { setSha256(''); setSha1(''); return; }
    (async () => {
      const [h256, h1] = await Promise.all([sha256Hex(text), sha1Hex(text)]);
      if (!cancelled) { setSha256(h256); setSha1(h1); }
    })();
    return () => { cancelled = true; };
  }, [text, fileName]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setFileName(file.name);
    setText('');
    try {
      const buf = await file.arrayBuffer();
      const [h256, h1] = await Promise.all([hashBufferHex(buf, 'SHA-256'), hashBufferHex(buf, 'SHA-1')]);
      setSha256(h256);
      setSha1(h1);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.inputLabel}</span>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setFileName(''); }}
          rows={4}
          placeholder={t.inputPlaceholder}
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-3 text-sm">
        <label className="cursor-pointer text-accent hover:underline">
          {t.orFile}
          <input type="file" onChange={onFile} className="hidden" />
        </label>
        {fileName && <span className="text-muted">{t.fileInfo(fileName)}</span>}
        {busy && <span className="text-muted">{t.hashing}</span>}
      </div>
      <HashRow label="SHA-256" value={sha256} />
      <HashRow label="SHA-1" value={sha1} />
      <p className="text-xs text-muted">{t.noMd5}</p>
    </div>
  );
}

function UuidPanel({ t }: { t: Dict }) {
  const [countStr, setCountStr] = useState('5');
  const [list, setList] = useState<string[]>(() => uuidBatch(5));

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.count}</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={countStr}
            onChange={(e) => setCountStr(e.target.value)}
            className={`${inputClass} w-24 text-center`}
          />
        </label>
        <button
          onClick={() => setList(uuidBatch(Number(countStr)))}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          {t.generate}
        </button>
        <CopyButton value={list.join('\n')} className="ml-auto" />
      </div>
      <pre className="max-h-80 overflow-y-auto rounded-[var(--radius-card)] border border-edge bg-surface px-4 py-3 font-mono text-xs leading-relaxed text-ink">
        {list.join('\n')}
      </pre>
    </div>
  );
}

export default function HashId({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [tab, setTab] = useState('hash');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={[{ id: 'hash', label: t.tabHash }, { id: 'uuid', label: t.tabUuid }]} active={tab} onChange={setTab} />
      </div>
      {tab === 'hash' && <HashPanel t={t} />}
      {tab === 'uuid' && <UuidPanel t={t} />}
      <p className="mt-6 text-center text-xs text-muted">{t.privacy}</p>
    </div>
  );
}
