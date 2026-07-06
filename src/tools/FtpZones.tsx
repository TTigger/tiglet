import { useState } from 'react';
import { powerZones, sweetSpot, wPerKg, wkgLevel, hrZonesFromLthr, hrZonesFromMax, type HrZone } from '../lib/ftp';

// 個人訓練數據，刻意不寫入網址。

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

function HrTable({ zones }: { zones: HrZone[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge">
            <th className="px-3 py-2 text-left font-normal text-muted">區間</th>
            <th className="px-3 py-2 text-left font-normal text-muted">名稱</th>
            <th className="px-3 py-2 text-right font-normal text-muted">心率（bpm）</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z, i) => (
            <tr key={z.zone} className="border-b border-edge last:border-0">
              <td className="px-3 py-2"><ZoneChip zone={z.zone} color={ZONE_COLORS[i + 1]} /></td>
              <td className="px-3 py-2 text-ink">{z.name}</td>
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

export default function FtpZones() {
  const [ftpStr, setFtpStr] = useState('200');
  const [weightStr, setWeightStr] = useState('');
  const [lthrStr, setLthrStr] = useState('');
  const [maxHrStr, setMaxHrStr] = useState('');

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
        <Field label="FTP（功能性閾值功率）" value={ftpStr} onChange={setFtpStr} suffix="W" placeholder="200" />
        <Field label="體重（選填，算 W/kg）" value={weightStr} onChange={setWeightStr} suffix="kg" placeholder="70" />
      </div>

      {ftpValid && Number.isFinite(wkg) && (
        <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-6 text-center">
          <div className="text-sm text-muted">你的 FTP 推力比</div>
          <div className="my-1 font-mono text-4xl tabular-nums text-ink">{wkg.toFixed(2)}</div>
          <div className="text-sm text-muted">W/kg — 參考等級：<span className="text-accent">{wkgLevel(wkg).label}</span></div>
        </div>
      )}

      {ftpValid && (
        <div>
          <h2 className="mb-2 font-serif text-xl text-ink">功率七區（Coggan）</h2>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge">
                  <th className="px-3 py-2 text-left font-normal text-muted">區間</th>
                  <th className="px-3 py-2 text-left font-normal text-muted">名稱</th>
                  <th className="px-3 py-2 text-right font-normal text-muted">% FTP</th>
                  <th className="px-3 py-2 text-right font-normal text-muted">功率（W）</th>
                </tr>
              </thead>
              <tbody>
                {powerZones(ftp).map((z, i) => (
                  <tr key={z.zone} className="border-b border-edge last:border-0">
                    <td className="px-3 py-2"><ZoneChip zone={z.zone} color={ZONE_COLORS[i]} /></td>
                    <td className="px-3 py-2 text-ink">{z.name}</td>
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
              🎯 Sweet Spot（88–94%）：<span className="font-mono tabular-nums text-ink">{ss.minW}–{ss.maxW} W</span>
              ——訓練效益與疲勞的甜蜜點，適合累積訓練量。
            </p>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 font-serif text-xl text-ink">心率區間</h2>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="LTHR（乳酸閾值心率，優先）" value={lthrStr} onChange={setLthrStr} suffix="bpm" placeholder="170" />
          <Field label="最大心率（無 LTHR 時用）" value={maxHrStr} onChange={setMaxHrStr} suffix="bpm" placeholder="190" />
        </div>
        {Number.isFinite(lthr) && lthr > 0 ? (
          <>
            <HrTable zones={hrZonesFromLthr(lthr)} />
            <p className="mt-2 text-xs text-muted">採 Coggan LTHR 百分比法。LTHR 可用 30 分鐘全力騎的後 20 分鐘平均心率估得。</p>
          </>
        ) : Number.isFinite(maxHr) && maxHr > 0 ? (
          <>
            <HrTable zones={hrZonesFromMax(maxHr)} />
            <p className="mt-2 text-xs text-muted">採最大心率百分比法（較粗略）；若有 LTHR 建議優先使用。</p>
          </>
        ) : (
          <p className="text-sm text-muted">輸入 LTHR 或最大心率即可產生心率五區。</p>
        )}
      </div>

      <p className="text-xs text-muted">
        W/kg 等級僅為概略參考帶。所有數據只在你的瀏覽器計算，不會上傳。
      </p>
    </div>
  );
}
