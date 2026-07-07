import { useState } from 'react';
import { recommendPressure, WEIGHT_SPLITS, SURFACES, type Surface } from '../lib/tirePressure';
import ShareLinkButton from '../components/ShareLinkButton';

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

export default function TirePressure() {
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
        <Field label="騎士體重（含穿著）" value={riderStr} onChange={setRiderStr} suffix="kg" placeholder="70" />
        <Field label="車重（含水壺配件）" value={bikeStr} onChange={setBikeStr} suffix="kg" placeholder="9" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">胎寬</span>
          <select value={width} onChange={(e) => setWidth(Number(e.target.value))} className={selectClass}>
            {TIRE_WIDTHS.map((w) => <option key={w} value={w}>{w} mm</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">路面</span>
          <select value={surface} onChange={(e) => setSurface(e.target.value as Surface)} className={selectClass}>
            {SURFACES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">騎乘姿勢（前後配重）</span>
          <select value={splitIdx} onChange={(e) => setSplitIdx(Number(e.target.value))} className={selectClass}>
            {WEIGHT_SPLITS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm text-ink">
          <input type="checkbox" checked={tubeless} onChange={(e) => setTubeless(e.target.checked)} />
          無內胎（tubeless）
        </label>
      </div>

      {result ? (
        <div className="grid grid-cols-2 gap-3">
          <WheelCard title="前輪" psi={result.frontPsi} bar={result.frontBar} />
          <WheelCard title="後輪" psi={result.rearPsi} bar={result.rearBar} />
        </div>
      ) : (
        <p className="text-center text-sm text-muted">請輸入 40–200 kg 之間的總重（騎士＋車）。</p>
      )}

      {hooklessWarn && (
        <p className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-transparent">
          ⚠️ 建議值超過 72.5 psi（5 bar）——多數無勾框（hookless）輪組的上限。若你的輪組是 hookless，請以輪組原廠上限為準。
        </p>
      )}

      <div className="flex items-center gap-3">
        <ShareLinkButton params={{ rider: riderStr, bike: bikeStr, tw: width, tl: tubeless, sf: surface, sp: splitIdx }} />
        <span className="text-xs text-muted">數值只在你按下按鈕時才組進連結。</span>
      </div>

      <p className="text-xs text-muted">
        以主流計算器公開參考值校準的簡化模型，做為起點後依路感微調 ±5 psi。
        絕不可超過輪框與外胎標示的上限；所有數據只在你的瀏覽器計算。
      </p>
    </div>
  );
}
