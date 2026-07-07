import { useState } from 'react';
import { powerZones, sweetSpot, wPerKg, wkgLevel, hrZonesFromLthr, hrZonesFromMax, type HrZone } from '../lib/ftp';
import ShareLinkButton from '../components/ShareLinkButton';
import type { Locale } from '../lib/i18n';

const L = {
  zh: {
    ftpLabel: 'FTP（功能性閾值功率）',
    weightLabel: '體重（選填，算 W/kg）',
    wkgTitle: '你的 FTP 推力比',
    wkgLevelPrefix: 'W/kg — 參考等級：',
    powerZonesTitle: '功率七區（Coggan）',
    thZone: '區間',
    thName: '名稱',
    thPower: '功率（W）',
    thHr: '心率（bpm）',
    sweetSpotPrefix: '🎯 Sweet Spot（88–94%）：',
    sweetSpotSuffix: '——訓練效益與疲勞的甜蜜點，適合累積訓練量。',
    hrTitle: '心率區間',
    lthrLabel: 'LTHR（乳酸閾值心率，優先）',
    maxHrLabel: '最大心率（無 LTHR 時用）',
    lthrNote: '採 Coggan LTHR 百分比法。LTHR 可用 30 分鐘全力騎的後 20 分鐘平均心率估得。',
    maxHrNote: '採最大心率百分比法（較粗略）；若有 LTHR 建議優先使用。',
    hrEmpty: '輸入 LTHR 或最大心率即可產生心率五區。',
    shareLabel: '複製分享連結',
    shareNote: '數值只在你按下按鈕時才組進連結。',
    footnote: 'W/kg 等級僅為概略參考帶。所有數據只在你的瀏覽器計算，不會上傳。',
  },
  en: {
    ftpLabel: 'FTP (Functional Threshold Power)',
    weightLabel: 'Weight (optional, for W/kg)',
    wkgTitle: 'Your FTP power-to-weight',
    wkgLevelPrefix: 'W/kg — reference level: ',
    powerZonesTitle: 'Seven power zones (Coggan)',
    thZone: 'Zone',
    thName: 'Name',
    thPower: 'Power (W)',
    thHr: 'Heart rate (bpm)',
    sweetSpotPrefix: '🎯 Sweet Spot (88–94%): ',
    sweetSpotSuffix: ' — the sweet spot between training benefit and fatigue, great for building volume.',
    hrTitle: 'Heart rate zones',
    lthrLabel: 'LTHR (lactate threshold HR, preferred)',
    maxHrLabel: 'Max heart rate (used without LTHR)',
    lthrNote: 'Uses Coggan LTHR percentages. Estimate LTHR as the average HR of the final 20 minutes of a 30-minute all-out effort.',
    maxHrNote: 'Uses max-HR percentages (rougher); prefer LTHR when available.',
    hrEmpty: 'Enter LTHR or max heart rate to generate five heart rate zones.',
    shareLabel: 'Copy share link',
    shareNote: 'Values are only put into the link when you press the button.',
    footnote: 'W/kg levels are rough reference bands only. Everything is computed in your browser — nothing is uploaded.',
  },
} as const;

type Dict = (typeof L)[Locale];

// lib 內建區間／等級的中文名稱 → 英文（以中文名對映，不動 lib）
const ZONE_NAME_EN: Record<string, string> = {
  動態恢復: 'Active recovery',
  耐力: 'Endurance',
  節奏: 'Tempo',
  乳酸閾值: 'Lactate threshold',
  最大攝氧: 'VO2max',
  無氧耐受: 'Anaerobic capacity',
  神經肌肉: 'Neuromuscular',
  恢復: 'Recovery',
  閾值: 'Threshold',
  無氧: 'Anaerobic',
  暖身: 'Warm-up',
  燃脂: 'Fat burn',
  有氧: 'Aerobic',
  極限: 'Maximal',
};
const WKG_EN: Record<string, string> = {
  精英: 'Elite',
  業餘強者: 'Strong amateur',
  進階: 'Advanced',
  休閒: 'Recreational',
  入門: 'Beginner',
};

// 個人訓練數據不隨打字寫入網址；分享靠底部按鈕主動產生連結，
// 開啟帶參數的連結時會自動帶入數值。
const initParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2.5 font-mono tabular-nums text-ink outline-none transition-colors focus:border-accent';

const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

const ZONE_COLORS = ['bg-slate-400', 'bg-sky-500', 'bg-green-600', 'bg-amber-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-600'];

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

function ZoneChip({ zone, color }: { zone: number; color: string }) {
  return <span className={`inline-block w-9 rounded px-1.5 py-0.5 text-center text-xs font-semibold text-white ${color}`}>Z{zone}</span>;
}

function HrTable({ zones, t, zoneName }: { zones: HrZone[]; t: Dict; zoneName: (name: string) => string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge">
            <th className="px-3 py-2 text-left font-normal text-muted">{t.thZone}</th>
            <th className="px-3 py-2 text-left font-normal text-muted">{t.thName}</th>
            <th className="px-3 py-2 text-right font-normal text-muted">{t.thHr}</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z, i) => (
            <tr key={z.zone} className="border-b border-edge last:border-0">
              <td className="px-3 py-2"><ZoneChip zone={z.zone} color={ZONE_COLORS[i + 1]} /></td>
              <td className="px-3 py-2 text-ink">{zoneName(z.name)}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
                {z.maxBpm === null ? `> ${z.minBpm}` : `${z.minBpm}–${z.maxBpm}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FtpZones({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const zoneName = (name: string) => (locale === 'en' ? ZONE_NAME_EN[name] ?? name : name);
  const [ftpStr, setFtpStr] = useState(initParams.get('ftp') ?? '200');
  const [weightStr, setWeightStr] = useState(initParams.get('w') ?? '');
  const [lthrStr, setLthrStr] = useState(initParams.get('lthr') ?? '');
  const [maxHrStr, setMaxHrStr] = useState(initParams.get('mhr') ?? '');

  const ftp = num(ftpStr);
  const ftpValid = Number.isFinite(ftp) && ftp > 0;
  const weight = num(weightStr);
  const wkg = wPerKg(ftp, weight);
  const lthr = num(lthrStr);
  const maxHr = num(maxHrStr);
  const ss = ftpValid ? sweetSpot(ftp) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.ftpLabel} value={ftpStr} onChange={setFtpStr} suffix="W" placeholder="200" />
        <Field label={t.weightLabel} value={weightStr} onChange={setWeightStr} suffix="kg" placeholder="70" />
      </div>

      {ftpValid && Number.isFinite(wkg) && (
        <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
          <div className="text-sm text-muted">{t.wkgTitle}</div>
          <div className="my-1 font-mono text-4xl tabular-nums text-ink">{wkg.toFixed(2)}</div>
          <div className="text-sm text-muted">{t.wkgLevelPrefix}<span className="text-accent">{locale === 'en' ? WKG_EN[wkgLevel(wkg).label] ?? wkgLevel(wkg).label : wkgLevel(wkg).label}</span></div>
        </div>
      )}

      {ftpValid && (
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">{t.powerZonesTitle}</h2>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge">
                  <th className="px-3 py-2 text-left font-normal text-muted">{t.thZone}</th>
                  <th className="px-3 py-2 text-left font-normal text-muted">{t.thName}</th>
                  <th className="px-3 py-2 text-right font-normal text-muted">% FTP</th>
                  <th className="px-3 py-2 text-right font-normal text-muted">{t.thPower}</th>
                </tr>
              </thead>
              <tbody>
                {powerZones(ftp).map((z, i) => (
                  <tr key={z.zone} className="border-b border-edge last:border-0">
                    <td className="px-3 py-2"><ZoneChip zone={z.zone} color={ZONE_COLORS[i]} /></td>
                    <td className="px-3 py-2 text-ink">{zoneName(z.name)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
                      {z.maxPct === null ? `> ${z.minPct}%` : `${z.minPct}–${z.maxPct}%`}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
                      {z.maxW === null ? `> ${z.minW}` : `${z.minW}–${z.maxW}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ss && (
            <p className="mt-2 text-sm text-muted">
              {t.sweetSpotPrefix}<span className="font-mono tabular-nums text-ink">{ss.minW}–{ss.maxW} W</span>
              {t.sweetSpotSuffix}
            </p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 font-serif text-xl text-ink">{t.hrTitle}</h2>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label={t.lthrLabel} value={lthrStr} onChange={setLthrStr} suffix="bpm" placeholder="170" />
          <Field label={t.maxHrLabel} value={maxHrStr} onChange={setMaxHrStr} suffix="bpm" placeholder="190" />
        </div>
        {Number.isFinite(lthr) && lthr > 0 ? (
          <>
            <HrTable zones={hrZonesFromLthr(lthr)} t={t} zoneName={zoneName} />
            <p className="mt-2 text-xs text-muted">{t.lthrNote}</p>
          </>
        ) : Number.isFinite(maxHr) && maxHr > 0 ? (
          <>
            <HrTable zones={hrZonesFromMax(maxHr)} t={t} zoneName={zoneName} />
            <p className="mt-2 text-xs text-muted">{t.maxHrNote}</p>
          </>
        ) : (
          <p className="text-sm text-muted">{t.hrEmpty}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ShareLinkButton label={t.shareLabel} params={{ ftp: ftpStr, w: weightStr, lthr: lthrStr, mhr: maxHrStr }} />
        <span className="text-xs text-muted">{t.shareNote}</span>
      </div>

      <p className="text-xs text-muted">{t.footnote}</p>
    </div>
  );
}
