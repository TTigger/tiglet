import { useState } from 'react';
import Tabs from '../components/Tabs';
import CopyButton from '../components/CopyButton';
import { isValidTwId, isValidGui, generateTwId, generateGui, LETTER_AREA } from '../lib/twId';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    tabId: '身分證字號',
    tabGui: '統一編號',
    idLabel: '身分證字號',
    idPlaceholder: '例如 A123456789',
    guiLabel: '統一編號（8 碼）',
    guiPlaceholder: '例如 22099131',
    valid: '✓ 格式與檢查碼正確',
    invalid: '✗ 檢查碼或格式不正確',
    area: (a: string) => `首字母對應戶籍地：${a}`,
    genderOf: (d: string) => (d === '1' || d === '8' ? '性別碼：男性' : '性別碼：女性'),
    foreign: '（新式外來人口統一證號）',
    generate: '產生測試號碼',
    genMale: '男性',
    genFemale: '女性',
    guiNote: '統編驗證採 112 年 4 月起的新制（加權和可被 5 整除，第 7 碼為 7 時有容錯）。',
    testOnly: '⚠️ 產生的號碼僅供系統開發測試，為隨機組合、不對應任何真實個人或企業。',
    privacy: '所有驗證只在你的瀏覽器進行，輸入的號碼不會送出。',
  },
  en: {
    tabId: 'National ID',
    tabGui: 'Business ID (GUI)',
    idLabel: 'Taiwan national ID number',
    idPlaceholder: 'e.g. A123456789',
    guiLabel: 'Uniform business number (8 digits)',
    guiPlaceholder: 'e.g. 22099131',
    valid: '✓ Format and checksum are valid',
    invalid: '✗ Invalid checksum or format',
    area: (a: string) => `First letter maps to household region: ${a}`,
    genderOf: (d: string) => (d === '1' || d === '8' ? 'Gender digit: male' : 'Gender digit: female'),
    foreign: ' (new-style resident certificate)',
    generate: 'Generate test number',
    genMale: 'Male',
    genFemale: 'Female',
    guiNote: 'Validation follows the April 2023 rule (weighted sum divisible by 5, with the 7th-digit-7 tolerance).',
    testOnly: '⚠️ Generated numbers are random combinations for development testing only — they do not correspond to any real person or business.',
    privacy: 'All validation happens in your browser; nothing you type is sent anywhere.',
  },
} as const;
type Dict = (typeof L)[Locale];

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';
const genBtn = 'rounded-lg border border-edge px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent';

function Verdict({ input, valid, t }: { input: string; valid: boolean; t: Dict }) {
  if (!input.trim()) return null;
  return <p className={`text-sm ${valid ? 'text-green-600' : 'text-red-500'}`}>{valid ? t.valid : t.invalid}</p>;
}

function IdPanel({ t }: { t: Dict }) {
  const [value, setValue] = useState('');
  const id = value.trim().toUpperCase();
  const valid = isValidTwId(id);
  const area = valid ? LETTER_AREA[id[0]] : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.idLabel}</span>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t.idPlaceholder} maxLength={12} className={inputClass} />
      </label>
      <Verdict input={value} valid={valid} t={t} />
      {valid && (
        <div className="space-y-1 rounded-lg border border-edge bg-surface px-4 py-3 text-sm text-muted">
          <p>{t.area(area!)}</p>
          <p>
            {t.genderOf(id[1])}
            {(id[1] === '8' || id[1] === '9') && t.foreign}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{t.generate}：</span>
        <button onClick={() => setValue(generateTwId('male'))} className={genBtn}>{t.genMale}</button>
        <button onClick={() => setValue(generateTwId('female'))} className={genBtn}>{t.genFemale}</button>
        {valid && <CopyButton value={id} />}
      </div>
      <p className="text-xs text-muted">{t.testOnly}</p>
    </div>
  );
}

function GuiPanel({ t }: { t: Dict }) {
  const [value, setValue] = useState('');
  const valid = isValidGui(value);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{t.guiLabel}</span>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t.guiPlaceholder} maxLength={10} inputMode="numeric" className={inputClass} />
      </label>
      <Verdict input={value} valid={valid} t={t} />
      <div className="flex items-center gap-2">
        <button onClick={() => setValue(generateGui())} className={genBtn}>{t.generate}</button>
        {valid && <CopyButton value={value.trim()} />}
      </div>
      <p className="text-xs text-muted">{t.guiNote}</p>
      <p className="text-xs text-muted">{t.testOnly}</p>
    </div>
  );
}

export default function TwId({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [tab, setTab] = useState('id');
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <Tabs tabs={[{ id: 'id', label: t.tabId }, { id: 'gui', label: t.tabGui }]} active={tab} onChange={setTab} />
      </div>
      {tab === 'id' && <IdPanel t={t} />}
      {tab === 'gui' && <GuiPanel t={t} />}
      <p className="mt-6 text-center text-xs text-muted">{t.privacy}</p>
    </div>
  );
}
