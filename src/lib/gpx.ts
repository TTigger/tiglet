// GPX 賽段剖面圖核心：解析 → 距離重採樣 → 海拔平滑 → 爬坡偵測與分級。
// 分級採通用「爬坡分數 = 長度(m) × 平均坡度(%)」門檻
// （≥8000 四級、≥16000 三級、≥32000 二級、≥64000 一級、≥80000 HC）。

export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
}

export interface ProfileSample {
  distanceM: number;
  ele: number;
}

export interface Profile {
  samples: ProfileSample[];
  totalDistanceM: number;
}

export type ClimbCategory = 'HC' | '1' | '2' | '3' | '4';

export interface Climb {
  startM: number;
  endM: number;
  lengthM: number;
  gainM: number;
  avgGradientPct: number;
  topEle: number;
  score: number;
  category: ClimbCategory | null;
}

export const STEP_M = 50; // 重採樣步距
const SMOOTH_WINDOW = 5; // 移動平均視窗（≈250m）——GPS 高度雜訊的主要解法

export function parseGpx(xml: string): TrackPoint[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('GPX 解析失敗：不是有效的 XML');
  const nodes = Array.from(doc.querySelectorAll('trkpt'));
  const points: TrackPoint[] = [];
  for (const n of nodes) {
    const lat = Number(n.getAttribute('lat'));
    const lon = Number(n.getAttribute('lon'));
    const ele = Number(n.querySelector('ele')?.textContent ?? NaN);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(ele)) points.push({ lat, lon, ele });
  }
  if (points.length < 2) throw new Error('GPX 裡找不到含海拔的軌跡點（trkpt/ele）');
  return points;
}

export function parseGpxName(xml: string): string | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) return null;
  const name = doc.querySelector('trk > name, metadata > name, name')?.textContent?.trim();
  return name || null;
}

// 手動建路線：距離＋海拔檢查點 → 合成軌跡點（免檔案出圖，賽事規劃用）。
// 檢查點之間海拔線性內插；地理座標為合成直線（僅供剖面計算，不代表實際路徑）。
export interface RouteCheckpoint {
  km: number;
  ele: number;
}

export function checkpointsToTrackPoints(checkpoints: RouteCheckpoint[]): TrackPoint[] {
  const valid = checkpoints
    .filter((c) => Number.isFinite(c.km) && Number.isFinite(c.ele) && c.km >= 0)
    .sort((a, b) => a.km - b.km)
    // 相同距離只留最後一筆
    .filter((c, i, arr) => i === arr.length - 1 || arr[i + 1].km !== c.km);
  if (valid.length < 2) throw new Error('至少需要兩個有效的檢查點（距離＋海拔）');
  const totalM = (valid[valid.length - 1].km - valid[0].km) * 1000;
  if (totalM < 100) throw new Error('路線總長至少要 0.1 公里');

  const M_PER_DEG_LAT = 111_320;
  const startKm = valid[0].km;
  const points: TrackPoint[] = [];
  const eleAtKm = (km: number): number => {
    let i = 0;
    while (i < valid.length - 2 && valid[i + 1].km < km) i++;
    const a = valid[i];
    const b = valid[i + 1];
    const t = b.km === a.km ? 0 : (km - a.km) / (b.km - a.km);
    return a.ele + t * (b.ele - a.ele);
  };
  for (let m = 0; m <= totalM; m += STEP_M) {
    points.push({ lat: 25.0 + m / M_PER_DEG_LAT, lon: 121.5, ele: eleAtKm(startKm + m / 1000) });
  }
  const last = points[points.length - 1];
  if (last.lat !== 25.0 + totalM / M_PER_DEG_LAT) {
    points.push({ lat: 25.0 + totalM / M_PER_DEG_LAT, lon: 121.5, ele: valid[valid.length - 1].ele });
  }
  return points;
}

// TCX（Training Center XML）軌跡點解析——Garmin 生態常見的另一種匯出格式
export function parseTcx(xml: string): TrackPoint[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('TCX 解析失敗：不是有效的 XML');
  const points: TrackPoint[] = [];
  for (const n of Array.from(doc.querySelectorAll('Trackpoint'))) {
    const lat = Number(n.querySelector('Position > LatitudeDegrees')?.textContent);
    const lon = Number(n.querySelector('Position > LongitudeDegrees')?.textContent);
    const ele = Number(n.querySelector('AltitudeMeters')?.textContent);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(ele)) points.push({ lat, lon, ele });
  }
  if (points.length < 2) throw new Error('TCX 裡找不到含海拔的軌跡點');
  return points;
}

// FIT 紀錄 → 軌跡點：容忍度數或半圓（semicircle）兩種座標單位
const SEMI_TO_DEG = 180 / 2 ** 31;

export interface FitRecordLike {
  position_lat?: number;
  position_long?: number;
  altitude?: number;
  enhanced_altitude?: number;
}

export function fitRecordsToTrackPoints(records: FitRecordLike[]): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (const r of records) {
    let lat = r.position_lat;
    let lon = r.position_long;
    const ele = r.enhanced_altitude ?? r.altitude;
    if (lat === undefined || lon === undefined || ele === undefined) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(ele)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      lat *= SEMI_TO_DEG;
      lon *= SEMI_TO_DEG;
    }
    points.push({ lat, lon, ele });
  }
  if (points.length < 2) throw new Error('FIT 裡找不到含座標與海拔的紀錄');
  return points;
}

export interface GpxWaypoint {
  name: string;
  lat: number;
  lon: number;
}

// GPX 規格的 <wpt> 航點（Komoot/RWGPS 等匯出常自帶補給站與地標）；沒名字的略過
export function parseGpxWaypoints(xml: string): GpxWaypoint[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) return [];
  const out: GpxWaypoint[] = [];
  for (const n of Array.from(doc.querySelectorAll('wpt'))) {
    const lat = Number(n.getAttribute('lat'));
    const lon = Number(n.getAttribute('lon'));
    const name = n.querySelector('name')?.textContent?.trim();
    if (name && Number.isFinite(lat) && Number.isFinite(lon)) out.push({ name, lat, lon });
  }
  return out;
}

const OFF_ROUTE_MAX_M = 500;

// 把一個座標定位到軌跡上：回傳最近軌跡點的累積距離；離線超過 500m 視為不在路線上
export function locateOnTrack(points: TrackPoint[], lat: number, lon: number): { distanceM: number; offTrackM: number } | null {
  let cum = 0;
  let best = { distanceM: 0, offTrackM: Infinity };
  for (let i = 0; i < points.length; i++) {
    if (i > 0) cum += haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
    const d = haversineM(points[i].lat, points[i].lon, lat, lon);
    if (d < best.offTrackM) best = { distanceM: cum, offTrackM: d };
  }
  return best.offTrackM <= OFF_ROUTE_MAX_M ? best : null;
}

// 裁切路線：依「累積距離」取出 startM–endM 的區段（實騎檔常帶市區暖身/回程）
export function trimTrack(points: TrackPoint[], startM: number, endM: number): TrackPoint[] {
  if (!Number.isFinite(startM) || !Number.isFinite(endM) || startM >= endM) {
    throw new Error('裁切範圍無效：起點必須小於終點');
  }
  const out: TrackPoint[] = [];
  let cum = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) cum += haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
    if (cum >= startM && cum <= endM) out.push(points[i]);
    if (cum > endM) break;
  }
  if (out.length < 2) throw new Error('裁切後的路段太短，請調整範圍');
  return out;
}

// 反轉方向：終點變起點（管線會依座標重算距離與坡度）
export function reverseTrack(points: TrackPoint[]): TrackPoint[] {
  return [...points].reverse();
}

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function buildProfile(points: TrackPoint[]): Profile {
  // 累積距離
  const dist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    dist.push(dist[i - 1] + haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon));
  }
  const total = dist[dist.length - 1];

  // 距離重採樣（線性內插）
  const raw: ProfileSample[] = [];
  let j = 0;
  const sampleAt = (d: number) => {
    while (j < points.length - 2 && dist[j + 1] < d) j++;
    const span = dist[j + 1] - dist[j];
    const t = span > 0 ? (d - dist[j]) / span : 0;
    raw.push({ distanceM: d, ele: points[j].ele + t * (points[j + 1].ele - points[j].ele) });
  };
  for (let d = 0; d < total; d += STEP_M) sampleAt(d);
  sampleAt(total); // 終點一定要有樣本，剖面圖才會畫到底

  // 移動平均平滑
  const samples: ProfileSample[] = raw.map((s, i) => {
    const from = Math.max(0, i - Math.floor(SMOOTH_WINDOW / 2));
    const to = Math.min(raw.length - 1, i + Math.floor(SMOOTH_WINDOW / 2));
    let sum = 0;
    for (let k = from; k <= to; k++) sum += raw[k].ele;
    return { distanceM: s.distanceM, ele: sum / (to - from + 1) };
  });

  return { samples, totalDistanceM: total };
}

export function totalAscentM(samples: ProfileSample[]): number {
  let ascent = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = samples[i].ele - samples[i - 1].ele;
    if (d > 0) ascent += d;
  }
  return ascent;
}

export interface CategoryDef {
  id: ClimbCategory;
  label: string;
  minScore: number;
  color: string;
}

export const CLIMB_CATEGORIES: CategoryDef[] = [
  { id: 'HC', label: 'HC 超級坡', minScore: 80000, color: '#7C3AED' },
  { id: '1', label: '一級坡', minScore: 64000, color: '#DC2626' },
  { id: '2', label: '二級坡', minScore: 32000, color: '#EA580C' },
  { id: '3', label: '三級坡', minScore: 16000, color: '#D97706' },
  { id: '4', label: '四級坡', minScore: 8000, color: '#65A30D' },
];

export function categorize(score: number): ClimbCategory | null {
  return CLIMB_CATEGORIES.find((c) => score >= c.minScore)?.id ?? null;
}

const CLIMB_GRAD_PCT = 2; // 視為爬坡中的最低步進坡度
const MERGE_GAP_M = 300; // 中途緩坡/短下坡的容忍長度
const MIN_LENGTH_M = 500;
const MIN_AVG_GRAD = 3;
const MIN_GAIN_M = 20;

export function detectClimbs(samples: ProfileSample[]): Climb[] {
  // 步進坡度 ≥ 門檻的區段 → 合併近距離區段 → 過濾出真正的爬坡
  const runs: Array<[number, number]> = []; // [startIdx, endIdx]
  let start = -1;
  for (let i = 1; i < samples.length; i++) {
    const grad = ((samples[i].ele - samples[i - 1].ele) / STEP_M) * 100;
    if (grad >= CLIMB_GRAD_PCT) {
      if (start < 0) start = i - 1;
    } else if (start >= 0) {
      runs.push([start, i - 1]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, samples.length - 1]);

  const merged: Array<[number, number]> = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && (run[0] - last[1]) * STEP_M <= MERGE_GAP_M) last[1] = run[1];
    else merged.push([...run] as [number, number]);
  }

  const climbs: Climb[] = [];
  for (const [s, e] of merged) {
    const lengthM = (e - s) * STEP_M;
    const gainM = samples[e].ele - samples[s].ele;
    if (lengthM < MIN_LENGTH_M || gainM < MIN_GAIN_M) continue;
    const avgGradientPct = (gainM / lengthM) * 100;
    if (avgGradientPct < MIN_AVG_GRAD) continue;
    const score = lengthM * avgGradientPct;
    climbs.push({
      startM: samples[s].distanceM,
      endM: samples[e].distanceM,
      lengthM,
      gainM,
      avgGradientPct,
      topEle: samples[e].ele,
      score,
      category: categorize(score),
    });
  }
  return climbs;
}

// 業界通用的坡度色階（cyclingcols / cycle.travel 慣例）：
// 灰＝下坡、綠 0–4、藍 4–6、黃 6–8、橘 8–10、紅 10–15、黑 >15
export interface GradientBand {
  id: string;
  label: string;
  maxPct: number; // 不含上界；前一帶的上界即本帶下界
  color: string;
}

export const GRADIENT_BANDS: GradientBand[] = [
  { id: 'down', label: '下坡', maxPct: 0, color: '#A8A29E' },
  { id: 'g0', label: '0–4%', maxPct: 4, color: '#5FA85A' },
  { id: 'g4', label: '4–6%', maxPct: 6, color: '#3B82C4' },
  { id: 'g6', label: '6–8%', maxPct: 8, color: '#E3B341' },
  { id: 'g8', label: '8–10%', maxPct: 10, color: '#E8833A' },
  { id: 'g10', label: '10–15%', maxPct: 15, color: '#D64545' },
  { id: 'g15', label: '>15%', maxPct: Infinity, color: '#3A3A38' },
];

export function bandFor(gradientPct: number): GradientBand {
  return GRADIENT_BANDS.find((b) => gradientPct < b.maxPct) ?? GRADIENT_BANDS[GRADIENT_BANDS.length - 1];
}

export interface GradientSegment {
  startM: number;
  endM: number;
  gradientPct: number;
  band: GradientBand;
}

// 以 windowM 為窗計算坡度並依色帶合併相鄰同色段——著色用的分段
export function gradientSegments(samples: ProfileSample[], windowM = 200): GradientSegment[] {
  if (samples.length < 2) return [];
  const step = Math.max(1, Math.round(windowM / STEP_M));
  const segs: GradientSegment[] = [];
  for (let i = 0; i < samples.length - 1; i += step) {
    const j = Math.min(i + step, samples.length - 1);
    const span = samples[j].distanceM - samples[i].distanceM;
    const grad = span > 0 ? ((samples[j].ele - samples[i].ele) / span) * 100 : 0;
    const band = bandFor(grad);
    const last = segs[segs.length - 1];
    if (last && last.band.id === band.id) {
      last.endM = samples[j].distanceM;
    } else {
      segs.push({ startM: samples[i].distanceM, endM: samples[j].distanceM, gradientPct: grad, band });
    }
  }
  // 合併後的段重算整段平均坡度
  for (const s of segs) {
    const a = samples.find((p) => p.distanceM >= s.startM)!;
    const b = [...samples].reverse().find((p) => p.distanceM <= s.endM)!;
    const span = b.distanceM - a.distanceM;
    s.gradientPct = span > 0 ? ((b.ele - a.ele) / span) * 100 : 0;
  }
  return segs;
}

export interface GradientBucket {
  label: string;
  maxPct: number;
  distanceM: number;
}

export function gradientBuckets(samples: ProfileSample[]): GradientBucket[] {
  const buckets: GradientBucket[] = [
    { label: '< 3%', maxPct: 3, distanceM: 0 },
    { label: '3–6%', maxPct: 6, distanceM: 0 },
    { label: '6–9%', maxPct: 9, distanceM: 0 },
    { label: '> 9%', maxPct: Infinity, distanceM: 0 },
  ];
  for (let i = 1; i < samples.length; i++) {
    const grad = Math.abs(((samples[i].ele - samples[i - 1].ele) / STEP_M) * 100);
    const bucket = buckets.find((b) => grad < b.maxPct) ?? buckets[buckets.length - 1];
    bucket.distanceM += STEP_M;
  }
  return buckets;
}

// 任意距離處的海拔（線性內插，越界夾住）——地標標注用
export function eleAtM(samples: ProfileSample[], distanceM: number): number {
  if (distanceM <= samples[0].distanceM) return samples[0].ele;
  const last = samples[samples.length - 1];
  if (distanceM >= last.distanceM) return last.ele;
  const i = samples.findIndex((s) => s.distanceM >= distanceM);
  const a = samples[i - 1];
  const b = samples[i];
  const t = (distanceM - a.distanceM) / (b.distanceM - a.distanceM);
  return a.ele + t * (b.ele - a.ele);
}

// 單一爬坡的每公里方塊（Alpe d'Huez 式細部圖）：
// 整公里切塊、尾塊補滿到坡頂，每塊帶平均坡度、色帶與頭尾海拔
export interface KmBlock {
  startM: number;
  endM: number;
  startEle: number;
  endEle: number;
  gradientPct: number;
  band: GradientBand;
}

export function climbKmBlocks(samples: ProfileSample[], climb: Climb): KmBlock[] {
  const blocks: KmBlock[] = [];
  for (let m = climb.startM; m < climb.endM; m += 1000) {
    const end = Math.min(m + 1000, climb.endM);
    const startEle = eleAtM(samples, m);
    const endEle = eleAtM(samples, end);
    const span = end - m;
    blocks.push({
      startM: m,
      endM: end,
      startEle,
      endEle,
      gradientPct: span > 0 ? ((endEle - startEle) / span) * 100 : 0,
      band: bandFor(span > 0 ? ((endEle - startEle) / span) * 100 : 0),
    });
  }
  return blocks;
}

export function steepestKm(samples: ProfileSample[]): { startM: number; gradientPct: number } {
  const window = Math.round(1000 / STEP_M);
  let best = { startM: 0, gradientPct: 0 };
  for (let i = 0; i + window < samples.length; i++) {
    const grad = ((samples[i + window].ele - samples[i].ele) / 1000) * 100;
    if (grad > best.gradientPct) best = { startM: samples[i].distanceM, gradientPct: grad };
  }
  return best;
}
