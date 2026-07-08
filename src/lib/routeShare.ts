// 剖面圖分享連結：把路線輪廓（簡化後的檢查點）＋標題＋地標編進網址，
// 收到連結的人零檔案重建同一張剖面圖。純前端、無伺服器。
import type { ProfileSample, RouteCheckpoint } from './gpx';
import type { Waypoint } from '../tools/StageProfile';

export interface RouteShareState {
  title: string;
  checkpoints: RouteCheckpoint[];
  waypoints: Waypoint[];
}

// Douglas-Peucker：把 50m 取樣的剖面簡化成少數關鍵點（垂直誤差 toleranceM 內）
export function simplifyProfile(samples: ProfileSample[], toleranceM = 3, maxPoints = 80): RouteCheckpoint[] {
  if (samples.length < 2) return samples.map((s) => ({ km: s.distanceM / 1000, ele: s.ele }));
  const keep = new Set<number>([0, samples.length - 1]);

  function dp(startIdx: number, endIdx: number, tol: number) {
    const a = samples[startIdx];
    const b = samples[endIdx];
    let worst = -1;
    let worstDev = tol;
    for (let i = startIdx + 1; i < endIdx; i++) {
      const t = (samples[i].distanceM - a.distanceM) / (b.distanceM - a.distanceM || 1);
      const dev = Math.abs(samples[i].ele - (a.ele + t * (b.ele - a.ele)));
      if (dev > worstDev) {
        worstDev = dev;
        worst = i;
      }
    }
    if (worst >= 0) {
      keep.add(worst);
      dp(startIdx, worst, tol);
      dp(worst, endIdx, tol);
    }
  }

  dp(0, samples.length - 1, toleranceM);
  // 超過點數上限就放寬容差重跑（連結長度優先於保真度）
  if (keep.size > maxPoints) return simplifyProfile(samples, toleranceM * 2, maxPoints);
  return [...keep]
    .sort((x, y) => x - y)
    .map((i) => ({ km: Math.round((samples[i].distanceM / 1000) * 100) / 100, ele: Math.round(samples[i].ele) }));
}

// 編碼：v1|<title>|km,ele;km,ele;…|km,name;km,name;…（title/name 各自 encodeURIComponent）
export function encodeRouteShare(state: RouteShareState): string {
  const cps = state.checkpoints.map((c) => `${c.km},${Math.round(c.ele)}`).join(';');
  const wps = state.waypoints
    .filter((w) => w.km.trim() !== '' && w.name.trim() !== '')
    .map((w) => `${w.km},${encodeURIComponent(w.name)}`)
    .join(';');
  return ['1', encodeURIComponent(state.title), cps, wps].join('|');
}

export function decodeRouteShare(raw: string): RouteShareState | null {
  const parts = raw.split('|');
  if (parts.length !== 4 || parts[0] !== '1') return null;
  try {
    const title = decodeURIComponent(parts[1]);
    const checkpoints: RouteCheckpoint[] = parts[2]
      .split(';')
      .filter(Boolean)
      .map((s) => {
        const [km, ele] = s.split(',');
        return { km: Number(km), ele: Number(ele) };
      });
    if (checkpoints.length < 2 || checkpoints.some((c) => !Number.isFinite(c.km) || !Number.isFinite(c.ele))) return null;
    const waypoints: Waypoint[] = parts[3]
      .split(';')
      .filter(Boolean)
      .map((s) => {
        const i = s.indexOf(',');
        return { km: s.slice(0, i), name: decodeURIComponent(s.slice(i + 1)) };
      })
      .filter((w) => w.km !== '' && Number.isFinite(Number(w.km)) && w.name !== '');
    return { title, checkpoints, waypoints };
  } catch {
    return null; // decodeURIComponent 對壞資料會拋 URIError
  }
}
