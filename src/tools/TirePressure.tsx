import { useState } from 'react';
import { recommendPressure, WEIGHT_SPLITS, SURFACES, type Surface } from '../lib/tirePressure';
import ShareLinkButton from '../components/ShareLinkButton';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    riderWeight: '騎士體重（含穿著）',
    bikeWeight: '車重（含水壺配件）',
    tireWidth: '胎寬',
    surface: '路面',
    position: '騎乘姿勢（前後配重）',
    tubeless: '無內胎（tubeless）',
    front: '前輪',
    rear: '後輪',
    invalidTotal: '請輸入 40–200 kg 之間的總重（騎士＋車）。',
    hooklessWarn: '⚠️ 建議值超過 72.5 psi（5 bar）——多數無勾框（hookless）輪組的上限。若你的輪組是 hookless，請以輪組原廠上限為準。',
    shareLabel: '複製分享連結',
    shareNote: '數值只在你按下按鈕時才組進連結。',
    footnote: '以主流計算器公開參考值校準的簡化模型，做為起點後依路感微調 ±5 psi。絕不可超過輪框與外胎標示的上限；所有數據只在你的瀏覽器計算。',
  },
  en: {
    riderWeight: 'Rider weight (with kit)',
    bikeWeight: 'Bike weight (with bottles & accessories)',
    tireWidth: 'Tire width',
    surface: 'Surface',
    position: 'Riding position (front/rear weight split)',
    tubeless: 'Tubeless',
    front: 'Front',
    rear: 'Rear',
    invalidTotal: 'Enter a total weight (rider + bike) between 40–200 kg.',
    hooklessWarn: '⚠️ Recommendation exceeds 72.5 psi (5 bar) — the limit of most hookless rims. If your rims are hookless, follow the rim manufacturer limit.',
    shareLabel: 'Copy share link',
    shareNote: 'Values are only put into the link when you press the button.',
    footnote: 'A simplified model calibrated against public reference values from mainstream calculators — use it as a starting point, then fine-tune ±5 psi by feel. Never exceed the limits printed on rim and tire; everything is computed in your browser.',
  },
} as const;

// lib 內建選項的中文標籤 → 英文（路面以 id、配重以索引對映，不動 lib）
const SURFACE_EN: Record<Surface, string> = {
  smooth: 'Smooth tarmac',
  rough: 'Rough road',
  gravel: 'Gravel / forest road',
};
const SPLIT_EN: string[] = [
  'More upright (recreational / endurance) 45/55',
  'Typical road position 48/52',
  'Aggressive (TT / sprint oriented) 50/50',
];

// 體重屬個人資料，不隨打字寫入網址；分享靠底部按鈕主動產生連結。
const initParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const isSurface = (s: string | null): s is Surface => s === 'smooth' || s === 'rough' || s === 'gravel';

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';
const selectClass = 'w-full rounded-lg border border-edge bg-surface px-2 py-2.5 text-sm text-ink outline-none focus:border-accent';

const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

const TIRE_WIDTHS = [23, 25, 28, 30, 32, 35, 38, 40, 45];

function Field({ label, value, onChange, suffix, placeholder }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="relative">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function WheelCard({ title, psi, bar }: { title: string; psi: number; bar: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
      <div className="text-sm text-muted">{title}</div>
      <div className="my-1 font-mono text-4xl tabular-nums text-ink">{psi.toFixed(0)}</div>
      <div className="text-sm text-muted">psi ≈ <span className="font-mono tabular-nums">{bar.toFixed(1)}</span> bar</div>
    </div>
  );
}

export default function TirePressure({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [riderStr, setRiderStr] = useState(initParams.get('rider') ?? '70');
  const [bikeStr, setBikeStr] = useState(initParams.get('bike') ?? '9');
  const [width, setWidth] = useState(Number(initParams.get('tw')) || 28);
  const [tubeless, setTubeless] = useState(initParams.get('tl') === '1');
  const [surface, setSurface] = useState<Surface>(isSurface(initParams.get('sf')) ? (initParams.get('sf') as Surface) : 'smooth');
  const [splitIdx, setSplitIdx] = useState(() => {
    const i = Number(initParams.get('sp'));
    return Number.isInteger(i) && i >= 0 && i < WEIGHT_SPLITS.length ? i : 1;
  });

  const total = num(riderStr) + num(bikeStr);
  const valid = Number.isFinite(total) && total >= 40 && total <= 200;
  const result = valid
    ? recommendPressure({ totalWeightKg: total, tireWidthMm: width, tubeless, surface, frontShare: WEIGHT_SPLITS[splitIdx].frontShare })
    : null;
  const hooklessWarn = tubeless && result !== null && Math.max(result.frontPsi, result.rearPsi) > 72;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.riderWeight} value={riderStr} onChange={setRiderStr} suffix="kg" placeholder="70" />
        <Field label={t.bikeWeight} value={bikeStr} onChange={setBikeStr} suffix="kg" placeholder="9" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.tireWidth}</span>
          <select value={width} onChange={(e) => setWidth(Number(e.target.value))} className={selectClass}>
            {TIRE_WIDTHS.map((w) => <option key={w} value={w}>{w} mm</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.surface}</span>
          <select value={surface} onChange={(e) => setSurface(e.target.value as Surface)} className={selectClass}>
            {SURFACES.map((s) => <option key={s.id} value={s.id}>{locale === 'en' ? SURFACE_EN[s.id] : s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{t.position}</span>
          <select value={splitIdx} onChange={(e) => setSplitIdx(Number(e.target.value))} className={selectClass}>
            {WEIGHT_SPLITS.map((s, i) => <option key={s.label} value={i}>{locale === 'en' ? SPLIT_EN[i] ?? s.label : s.label}</option>)}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm text-ink">
          <input type="checkbox" checked={tubeless} onChange={(e) => setTubeless(e.target.checked)} />
          {t.tubeless}
        </label>
      </div>

      {result ? (
        <div className="grid grid-cols-2 gap-3">
          <WheelCard title={t.front} psi={result.frontPsi} bar={result.frontBar} />
          <WheelCard title={t.rear} psi={result.rearPsi} bar={result.rearBar} />
        </div>
      ) : (
        <p className="text-center text-sm text-muted">{t.invalidTotal}</p>
      )}

      {hooklessWarn && (
        <p className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-transparent">
          {t.hooklessWarn}
        </p>
      )}

      <div className="flex items-center gap-3">
        <ShareLinkButton label={t.shareLabel} params={{ rider: riderStr, bike: bikeStr, tw: width, tl: tubeless, sf: surface, sp: splitIdx }} />
        <span className="text-xs text-muted">{t.shareNote}</span>
      </div>

      <p className="text-xs text-muted">{t.footnote}</p>
    </div>
  );
}
