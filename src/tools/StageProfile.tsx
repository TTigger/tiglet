import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import ShareLinkButton from '../components/ShareLinkButton';
import Toggle from '../components/Toggle';
import { simplifyProfile, encodeRouteShare, decodeRouteShare } from '../lib/routeShare';
import type { Locale } from '../lib/i18n';
import {
  parseGpx,
  parseGpxName,
  parseTcx,
  fitRecordsToTrackPoints,
  checkpointsToTrackPoints,
  trimTrack,
  reverseTrack,
  parseGpxWaypoints,
  locateOnTrack,
  buildProfile,
  type TrackPoint,
  totalAscentM,
  detectClimbs,
  gradientBuckets,
  gradientSegments,
  eleAtM,
  climbKmBlocks,
  steepestKm,
  CLIMB_CATEGORIES,
  GRADIENT_BANDS,
  type Profile,
  type Climb,
} from '../lib/gpx';

export interface Waypoint {
  km: string; // 使用者輸入的公里數（字串保留輸入狀態）
  name: string;
}

const L = {
  zh: {
    upload: '上傳 GPX / FIT / TCX 檔案',
    uploadNote: '也可以直接把檔案拖進來。檔案只在你的瀏覽器解析，不會上傳到任何伺服器。',
    loadSample: '沒有檔案？先載入範例路線試玩',
    sampleTitle: '範例路線：河濱＋二級坡 22K',
    sampleWaypoint: '山腳補給站',
    manualSummary: '或者：手動建路線（免檔案，適合賽事／揪團規劃）',
    manualHint: '輸入幾個檢查點（累積距離＋海拔），例如 0k／100m、12k／820m——檢查點之間會線性內插。',
    manualKm: '距離 (km)',
    manualEle: '海拔 (m)',
    manualAdd: '＋ 新增檢查點',
    manualBuild: '生成剖面圖',
    manualTitle: '手動路線',
    manualDeleteAria: (i: number) => `刪除檢查點 ${i}`,
    manualKmAria: (i: number) => `檢查點 ${i} 距離`,
    manualEleAria: (i: number) => `檢查點 ${i} 海拔`,
    exportSummary: '第一次用？如何取得你的騎乘檔案（GPX / FIT / TCX）',
    guideIntroTitle: '這些檔案是什麼？',
    guideIntro:
      '你每次騎車，碼錶或手機 app 都在記錄一個「軌跡檔」——GPX 與 TCX 是文字格式、FIT 是碼錶原生格式。這個工具三種都能吃，所以拿到哪種就丟哪種，不用轉檔。以下是各平台把檔案「拿出來」的方法：',
    guideMobile: '📱 手機 app',
    guideWeb: '💻 電腦／網頁',
    guides: [
      {
        app: 'Strava',
        mobile: '「你」→ 活動 → 右上「⋯」→「匯出 GPX」——手機就能直接匯出。',
        web: '活動頁 → 「⋯」→「匯出 GPX」。',
        note: '手動建立、沒有 GPS 的活動無法匯出。',
      },
      {
        app: 'Garmin',
        mobile: 'Garmin Connect 手機 app「不提供匯出」（Garmin 刻意限制）——請改用手機瀏覽器開 connect.garmin.com 登入後操作，步驟同電腦版。',
        web: 'connect.garmin.com → 活動 → 點進該筆 → 右上齒輪 →「匯出至 GPX」；選「匯出原始資料」會得到 FIT（本工具也支援）。',
      },
      {
        app: 'Bryton',
        mobile: 'Bryton Active app → 紀錄 → 點進該筆騎乘 → 分享／匯出圖示 → 選 GPX 或 FIT。',
        web: 'active.brytonsport.com → My Collection → 該筆騎乘 → 下載（可選 GPX／TCX／FIT）。',
      },
      {
        app: 'Wahoo',
        mobile: 'ELEMNT 手機 app → History → 點進該筆 → 分享圖示 → 匯出 .fit。',
        note: 'ELEMNT 通常也自動同步到你連結的 Strava——從 Strava 匯出往往更快。',
      },
      {
        app: 'igpsport',
        mobile: 'igpsport app → 運動紀錄 → 點進該筆 → 分享／匯出 → GPX 或 FIT。',
      },
      {
        app: 'Komoot（路線規劃）',
        web: '規劃好的路線頁 → 「⋯」→「匯出 GPX」——還沒騎的路線也能先出圖。',
      },
      {
        app: '任何碼錶（萬用備案）',
        web: '用 USB 線接電腦，碼錶會以隨身碟顯示——打開 Activities（或 Bryton 的 Data）資料夾，裡面的 .fit 檔直接拖進本頁即可。',
      },
    ],
    readError: '無法讀取這個 GPX 檔',
    titleLabel: '路線標題（會畫進圖裡）',
    titlePlaceholder: '例如：2026-07-06 西進武嶺',
    themeLabel: '出圖主題',
    watermarkLabel: '顯示站名浮水印',
    steepestLabel: '標注最陡 1km',
    reverse: '⇄ 反轉方向',
    trimLabel: '裁切',
    trimStartAria: '裁切起點 km',
    trimEndAria: '裁切終點 km',
    trimApply: '套用裁切',
    trimReset: '回復完整路線',
    steepestOnChart: (pct: string) => `最陡 1km ${pct}%`,
    cursorReadout: (km: string, ele: number, pct: string) => `${km} km ・ ${ele} m ・ ${pct}%`,
    svgAria: '賽段剖面圖',
    titleFallback: '我的路線',
    svgSubtitle: (km: string, ascent: number, minE: number, maxE: number) => `${km} km ・ 總爬升 ${ascent} m ・ 海拔 ${minE}–${maxE} m`,
    bandLabel: (b: { id: string; label: string }) => b.label,
    start: '起點',
    finish: '終點',
    climbNameOnChart: (name: string, ele: number) => `${name}（海拔 ${ele}m）`,
    detailAria: '爬坡細部圖',
    detailFallback: '爬坡細部圖',
    detailSub: (km: string, gain: number, avg: string, cat: string | null) =>
      `${km} km ・ 爬升 ${gain} m ・ 平均 ${avg}%${cat ? ` ・ ${cat === 'HC' ? 'HC' : `${cat} 級`}坡` : ''}`,
    detailDownload: '下載細部圖 PNG',
    statDistance: '總距離',
    statAscent: '總爬升',
    statSteepest: '最陡 1km',
    statClimbs: '偵測爬坡',
    climbsValue: (n: number) => `${n} 段`,
    thClimb: '爬坡',
    thName: '名稱（會畫進圖裡）',
    thStart: '起點',
    thLength: '長度',
    thGain: '爬升',
    thAvgGrad: '平均坡度',
    thDetail: '細部',
    catBadge: (cat: string | null) => (cat ? (cat === 'HC' ? 'HC' : `${cat} 級`) : '未分級'),
    climbNamePlaceholder: '例如：風櫃嘴',
    climbNameAria: (i: number) => `爬坡 ${i} 名稱`,
    climbDetailAria: (i: number) => `爬坡 ${i} 細部圖`,
    collapse: '收合 ▴',
    expandDetail: '細部圖 ▾',
    wpSection: '地標／補給站（會以斜排標注畫進圖裡）',
    wpAdd: '＋ 新增地標',
    wpHint: '例如：西寶 26km、大禹嶺 87km——標出補給站或途經城鎮，做出台灣 KOM 式的賽段圖。 若 GPX 檔內含航點（Komoot／RWGPS 匯出常見），上傳時會自動帶入。',
    wpKmAria: (i: number) => `地標 ${i} 公里數`,
    wpNameAria: (i: number) => `地標 ${i} 名稱`,
    wpNamePlaceholder: '例如：西寶補給站',
    wpDeleteAria: (i: number) => `刪除地標 ${i}`,
    downloadPng: '下載 PNG 圖片',
    shareLabel: '複製分享連結',
    shareHint: '分享連結帶的是簡化後的路線輪廓（標題＋海拔轉折點＋地標），對方打開即重建剖面圖；不含精確 GPS 軌跡。',
    bucketChip: (label: string, km: string) => `坡度 ${label}：${km} km`,
    footnote: '爬坡分級採「長度 × 平均坡度」通用分數制（≥8000 四級 … ≥80000 HC），與正式賽事官方分級可能不同。 海拔已做平滑處理以消除 GPS 雜訊。',
  },
  en: {
    upload: 'Upload a GPX / FIT / TCX file',
    uploadNote: 'You can also drag a file here. It is parsed entirely in your browser — never uploaded to any server.',
    loadSample: 'No file handy? Load a sample route to try it out',
    sampleTitle: 'Sample route: riverside + Cat 2 climb, 22K',
    sampleWaypoint: 'Base supply stop',
    manualSummary: 'Or: build a route manually (no file — great for race/route planning)',
    manualHint: 'Enter a few checkpoints (cumulative distance + elevation), e.g. 0k/100m, 12k/820m — elevation is interpolated between checkpoints.',
    manualKm: 'Distance (km)',
    manualEle: 'Elevation (m)',
    manualAdd: '+ Add checkpoint',
    manualBuild: 'Build profile',
    manualTitle: 'Manual route',
    manualDeleteAria: (i: number) => `Delete checkpoint ${i}`,
    manualKmAria: (i: number) => `Checkpoint ${i} distance`,
    manualEleAria: (i: number) => `Checkpoint ${i} elevation`,
    exportSummary: 'First time here? How to get your ride file (GPX / FIT / TCX)',
    guideIntroTitle: 'What are these files?',
    guideIntro:
      'Every ride you record, your bike computer or phone app writes a track file — GPX and TCX are text formats, FIT is the native device format. This tool accepts all three, so use whichever you can get without converting. Here is how each platform lets you take the file out:',
    guideMobile: '📱 Phone app',
    guideWeb: '💻 Computer / web',
    guides: [
      {
        app: 'Strava',
        mobile: 'You → Activities → top-right “⋯” → “Export GPX” — works right on the phone.',
        web: 'Activity page → “⋯” → “Export GPX”.',
        note: 'Manually created activities without GPS cannot be exported.',
      },
      {
        app: 'Garmin',
        mobile: 'The Garmin Connect phone app does NOT offer export (an intentional Garmin limitation) — open connect.garmin.com in your phone browser instead; the steps match the desktop flow.',
        web: 'connect.garmin.com → Activities → open the ride → top-right gear icon → “Export to GPX”; “Export Original” gives you FIT (also supported here).',
      },
      {
        app: 'Bryton',
        mobile: 'Bryton Active app → records → open the ride → share/export icon → GPX or FIT.',
        web: 'active.brytonsport.com → My Collection → the ride → download (GPX / TCX / FIT).',
      },
      {
        app: 'Wahoo',
        mobile: 'ELEMNT phone app → History → open the ride → share icon → export .fit.',
        note: 'ELEMNT usually auto-syncs to your linked Strava too — exporting from Strava is often quicker.',
      },
      {
        app: 'igpsport',
        mobile: 'igpsport app → activity records → open the ride → share/export → GPX or FIT.',
      },
      {
        app: 'Komoot (route planning)',
        web: 'Planned route page → “⋯” → “Export GPX” — chart a route before you have even ridden it.',
      },
      {
        app: 'Any bike computer (universal fallback)',
        web: 'Plug it into a computer over USB — it shows up as a drive. Open the Activities (or Bryton “Data”) folder and drag a .fit file straight onto this page.',
      },
    ],
    readError: 'Could not read this GPX file',
    titleLabel: 'Route title (drawn into the image)',
    titlePlaceholder: 'e.g. 2026-07-06 Wuling West',
    themeLabel: 'Theme',
    watermarkLabel: 'Show site watermark',
    steepestLabel: 'Mark steepest km',
    reverse: '⇄ Reverse direction',
    trimLabel: 'Trim',
    trimStartAria: 'Trim start km',
    trimEndAria: 'Trim end km',
    trimApply: 'Apply trim',
    trimReset: 'Restore full route',
    steepestOnChart: (pct: string) => `Steepest km ${pct}%`,
    cursorReadout: (km: string, ele: number, pct: string) => `${km} km ・ ${ele} m ・ ${pct}%`,
    svgAria: 'Stage profile chart',
    titleFallback: 'My route',
    svgSubtitle: (km: string, ascent: number, minE: number, maxE: number) => `${km} km ・ ${ascent} m total gain ・ elev. ${minE}–${maxE} m`,
    bandLabel: (b: { id: string; label: string }) => (b.id === 'down' ? 'Downhill' : b.label),
    start: 'Start',
    finish: 'Finish',
    climbNameOnChart: (name: string, ele: number) => `${name} (elev. ${ele}m)`,
    detailAria: 'Climb detail chart',
    detailFallback: 'Climb detail',
    detailSub: (km: string, gain: number, avg: string, cat: string | null) =>
      `${km} km ・ ${gain} m gain ・ ${avg}% avg${cat ? ` ・ ${cat === 'HC' ? 'HC' : `Cat ${cat}`} climb` : ''}`,
    detailDownload: 'Download detail PNG',
    statDistance: 'Distance',
    statAscent: 'Total ascent',
    statSteepest: 'Steepest 1km',
    statClimbs: 'Climbs detected',
    climbsValue: (n: number) => `${n}`,
    thClimb: 'Climb',
    thName: 'Name (drawn into image)',
    thStart: 'Start',
    thLength: 'Length',
    thGain: 'Gain',
    thAvgGrad: 'Avg gradient',
    thDetail: 'Detail',
    catBadge: (cat: string | null) => (cat ? (cat === 'HC' ? 'HC' : `Cat ${cat}`) : 'Uncat.'),
    climbNamePlaceholder: "e.g. Alpe d'Huez",
    climbNameAria: (i: number) => `Climb ${i} name`,
    climbDetailAria: (i: number) => `Climb ${i} detail chart`,
    collapse: 'Collapse ▴',
    expandDetail: 'Detail ▾',
    wpSection: 'Waypoints / feed stations (drawn into the image as angled labels)',
    wpAdd: '＋ Add waypoint',
    wpHint: 'e.g. Xibao 26km, Dayuling 87km — mark feed stations or towns along the way for a Taiwan KOM-style stage chart. If the GPX contains waypoints (common in Komoot / RWGPS exports), they are filled in automatically on upload.',
    wpKmAria: (i: number) => `Waypoint ${i} km`,
    wpNameAria: (i: number) => `Waypoint ${i} name`,
    wpNamePlaceholder: 'e.g. feed station',
    wpDeleteAria: (i: number) => `Delete waypoint ${i}`,
    downloadPng: 'Download PNG',
    shareLabel: 'Copy share link',
    shareHint: 'The share link carries a simplified route outline (title + elevation turning points + waypoints) — opening it rebuilds the profile. It does not contain your precise GPS track.',
    bucketChip: (label: string, km: string) => `Gradient ${label}: ${km} km`,
    footnote: 'Climb categories use the common "length × average gradient" score (≥8000 Cat 4 … ≥80000 HC) and may differ from official race categorization. Elevation is smoothed to remove GPS noise.',
  },
} as const;

type Dict = (typeof L)[Locale];

// 出圖主題名稱的英文（按鈕 UI 用；id 對映，不動 THEMES 本體）
const THEME_EN: Record<string, string> = {
  tiglet: 'Tiglet warm',
  tour: 'Tour yellow',
  giro: 'Giro pink',
  vuelta: 'Vuelta red',
};

// 檔案完全在本機解析；SVG 用固定色票（非 CSS 變數），
// 匯出的 PNG 才不會受深淺色主題影響。出圖主題只換底/墨/點綴色，
// 坡度色階是語意（多陡），不隨主題變。

export interface ProfileTheme {
  id: string;
  label: string;
  bg: string;
  ink: string;
  muted: string;
  grid: string;
  accent: string;
}

const THEMES: ProfileTheme[] = [
  { id: 'tiglet', label: 'Tiglet 暖橘', bg: '#FAF9F5', ink: '#1A1A18', muted: '#6B6A63', grid: '#D6D1C4', accent: '#D97757' },
  { id: 'tour', label: '環法黃', bg: '#FFFFFF', ink: '#14141E', muted: '#5A5A66', grid: '#E2E2E8', accent: '#D4A800' },
  { id: 'giro', label: '環義粉', bg: '#FFF6FA', ink: '#2B1A22', muted: '#8A6A78', grid: '#F0D4E2', accent: '#E5518D' },
  { id: 'vuelta', label: '環西紅', bg: '#FFFAF6', ink: '#241514', muted: '#8A6A62', grid: '#F0DCD0', accent: '#DA291C' },
];

const W = 840;
const H = 380;
const ML = 52;
const MR = 28;
const MT = 64;
const MB = 40;
const PW = W - ML - MR;
const PH = H - MT - MB;

function catColor(id: string | null): string {
  return CLIMB_CATEGORIES.find((c) => c.id === id)?.color ?? '#8A8A82';
}

// SVG → 2x PNG 下載（主圖與爬坡細部圖共用）
function downloadSvgAsPng(svg: SVGSVGElement, width: number, height: number, filename: string, bg: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((png) => {
      if (!png) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(png);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };
  img.src = url;
}

function tickStepKm(totalKm: number): number {
  if (totalKm <= 20) return 5;
  if (totalKm <= 60) return 10;
  if (totalKm <= 150) return 20;
  return 50;
}

function ProfileSvg({ profile, climbs, climbNames, waypoints, title, theme, svgRef, t, watermark, steepest }: { profile: Profile; climbs: Climb[]; climbNames: string[]; waypoints: Waypoint[]; title: string; theme: ProfileTheme; svgRef: React.RefObject<SVGSVGElement | null>; t: Dict; watermark: boolean; steepest: { startM: number; gradientPct: number } | null }) {
  const samples = profile.samples;
  const total = profile.totalDistanceM;
  // 游標互動：滑過顯示 km／海拔／坡度（僅螢幕上，離開即清除，不會跟著匯出）
  const [cursorM, setCursorM] = useState<number | null>(null);

  function pointerToM(clientX: number): number | null {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const px = ((clientX - rect.left) / rect.width) * W;
    const m = ((px - ML) / PW) * total;
    return m >= 0 && m <= total ? m : null;
  }
  const eles = samples.map((s) => s.ele);
  const minE = Math.min(...eles);
  const maxE = Math.max(...eles);
  const range = Math.max(maxE - minE, 50); // 平路也要有一點山形
  // 級距先以原始高低差選定（3–6 條刻度），再把繪圖域頂端「圓整」到
  // 一條高於最高點的整數格線（含 12% 徽章空間）——Y 軸永遠包住山頂
  const eleStep = [10, 20, 50, 100, 200, 250, 500, 1000].find((s) => range / s <= 5) ?? 1000;
  const niceTop = Math.ceil((maxE + range * 0.12) / eleStep) * eleStep;
  const domain = niceTop - minE;
  const x = (d: number) => ML + (d / total) * PW;
  const y = (e: number) => MT + (1 - (e - minE) / domain) * PH;
  const baseY = MT + PH;

  const linePath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.distanceM).toFixed(1)},${y(s.ele).toFixed(1)}`).join(' ');

  // 山體依坡度色帶切片上色（環賽剖面圖慣例：顏色＝多陡，分級只留在徽章）
  const segments = gradientSegments(samples);
  const sliceArea = (startM: number, endM: number) => {
    const seg = samples.filter((s) => s.distanceM >= startM && s.distanceM <= endM);
    if (seg.length < 2) return '';
    const line = seg.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.distanceM).toFixed(1)},${y(s.ele).toFixed(1)}`).join(' ');
    return `${line} L${x(endM).toFixed(1)},${baseY} L${x(startM).toFixed(1)},${baseY} Z`;
  };

  const totalKm = total / 1000;
  const step = tickStepKm(totalKm);
  const ticks: number[] = [];
  for (let km = step; km < totalKm; km += step) ticks.push(km);
  const ascent = totalAscentM(samples);

  // Y 軸海拔刻度：畫到圓整後的頂界；貼著最高點標線的刻度跳過以免標籤打架
  const eleTicks: number[] = [];
  for (let e = Math.ceil(minE / eleStep) * eleStep; e <= niceTop; e += eleStep) {
    if (Math.abs(e - maxE) >= eleStep * 0.25) eleTicks.push(e);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={t.svgAria}
      className="w-full rounded-[var(--radius-card)] border border-edge"
      style={{ background: theme.bg, touchAction: 'pan-y' }}
      onMouseMove={(e) => setCursorM(pointerToM(e.clientX))}
      onMouseLeave={() => setCursorM(null)}
      onTouchMove={(e) => setCursorM(e.touches[0] ? pointerToM(e.touches[0].clientX) : null)}
      onTouchEnd={() => setCursorM(null)}
    >
      <rect x={0} y={0} width={W} height={H} fill={theme.bg} />
      {/* 標題與總覽 */}
      <text x={ML} y={30} fill={theme.ink} fontSize={20} fontWeight={700} fontFamily="Georgia, 'Noto Serif TC', serif">{title || t.titleFallback}</text>
      <text x={ML} y={50} fill={theme.muted} fontSize={12} fontFamily="system-ui, sans-serif">
        {t.svgSubtitle(totalKm.toFixed(1), Math.round(ascent), Math.round(minE), Math.round(maxE))}
      </text>
      {/* 站名浮水印：右下角、低調灰字（可由 UI 關閉） */}
      {watermark && (
        <text x={W - MR} y={H - 8} fill={theme.muted} fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif" opacity={0.8}>
          tiglet.vercel.app
        </text>
      )}

      {/* 坡度色階圖例（右上，會一起輸出進 PNG） */}
      <g fontFamily="system-ui, sans-serif" fontSize={9}>
        {GRADIENT_BANDS.map((b, i) => {
          const bx = W - MR - (GRADIENT_BANDS.length - i) * 52;
          return (
            <g key={b.id}>
              <rect x={bx} y={42} width={9} height={9} rx={2} fill={b.color} />
              <text x={bx + 12} y={50} fill={theme.muted}>{t.bandLabel(b)}</text>
            </g>
          );
        })}
      </g>

      {/* Y 軸海拔刻度與網格線（畫在剖面下層） */}
      {eleTicks.map((e) => (
        <g key={e}>
          <line x1={ML} y1={y(e)} x2={W - MR} y2={y(e)} stroke={theme.grid} strokeWidth={1} strokeDasharray="3 4" />
          <text x={ML - 6} y={y(e) + 3} fill={theme.muted} fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif">
            {e}m
          </text>
        </g>
      ))}

      {/* 主剖面：依坡度色帶切片 */}
      {segments.map((s, i) => (
        <path key={i} d={sliceArea(s.startM, s.endM)} fill={s.band.color} opacity={0.85} />
      ))}
      <path d={linePath} fill="none" stroke={theme.ink} strokeWidth={1.5} />
      <line x1={ML} y1={baseY} x2={W - MR} y2={baseY} stroke={theme.ink} strokeWidth={1} />

      {/* 最高點標線：實際最高海拔的橫貫虛線＋左緣粗體標籤（對齊細部圖「坡頂一定標」） */}
      <line x1={ML} y1={y(maxE)} x2={W - MR} y2={y(maxE)} stroke={theme.accent} strokeWidth={1} strokeDasharray="4 4" opacity={0.55} />
      <text x={ML - 6} y={y(maxE) + 3} fill={theme.accent} fontSize={10} fontWeight={700} textAnchor="end" fontFamily="system-ui, sans-serif">
        {Math.round(maxE)}m
      </text>

      {/* 公里刻度 */}
      {ticks.map((km) => (
        <g key={km}>
          <line x1={x(km * 1000)} y1={baseY} x2={x(km * 1000)} y2={baseY + 5} stroke={theme.muted} strokeWidth={1} />
          <text x={x(km * 1000)} y={baseY + 18} fill={theme.muted} fontSize={10} textAnchor="middle" fontFamily="system-ui, sans-serif">{km}k</text>
        </g>
      ))}

      {/* 起終點旗標：起點三角旗、終點格紋旗（賽事通用圖示） */}
      <g fontFamily="system-ui, sans-serif" fontSize={11}>
        {(() => {
          const sx = x(0);
          const sy = y(samples[0].ele);
          const fx = x(total);
          const fy = y(samples[samples.length - 1].ele);
          const sq = 4; // 格紋格邊長
          const checks: React.ReactNode[] = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
              if ((r + c) % 2 === 0) {
                checks.push(
                  <rect key={`${r}-${c}`} x={fx - sq * 4 + c * sq} y={fy - 26 + r * sq} width={sq} height={sq} fill={theme.ink} />
                );
              }
            }
          }
          return (
            <>
              {/* 起點：旗桿＋三角旗 */}
              <line x1={sx} y1={sy} x2={sx} y2={sy - 24} stroke={theme.ink} strokeWidth={1.5} />
              <path d={`M${sx},${sy - 24} L${sx + 15},${sy - 19} L${sx},${sy - 14} Z`} fill={theme.accent} />
              <circle cx={sx} cy={sy} r={2.5} fill={theme.ink} />
              <text x={sx} y={baseY + 18} fill={theme.ink} textAnchor="start" fontWeight={600}>{t.start}</text>

              {/* 終點：旗桿＋格紋旗（向左展開，避免出界） */}
              <line x1={fx} y1={fy} x2={fx} y2={fy - 26} stroke={theme.ink} strokeWidth={1.5} />
              <rect x={fx - sq * 4} y={fy - 26} width={sq * 4} height={sq * 3} fill={theme.bg} stroke={theme.ink} strokeWidth={0.75} />
              {checks}
              <circle cx={fx} cy={fy} r={2.5} fill={theme.ink} />
              <text x={fx} y={baseY + 18} fill={theme.ink} textAnchor="end" fontWeight={600}>{t.finish}</text>
            </>
          );
        })()}
      </g>

      {/* 自訂地標（補給站/城鎮）：點 + 虛線落點 + 45° 斜排名稱與海拔 */}
      {waypoints
        .map((w) => ({ name: w.name.trim(), m: Number(w.km) * 1000 }))
        .filter((w) => w.name && Number.isFinite(w.m) && w.m >= 0 && w.m <= total)
        .map((w, i) => {
          const wx = x(w.m);
          const ele = eleAtM(samples, w.m);
          const wy = y(ele);
          return (
            <g key={`wp-${i}`} fontFamily="system-ui, sans-serif">
              <line x1={wx} y1={wy} x2={wx} y2={baseY} stroke={theme.muted} strokeWidth={1} strokeDasharray="2 3" />
              <circle cx={wx} cy={wy} r={3.5} fill={theme.bg} stroke={theme.ink} strokeWidth={1.5} />
              <text
                x={wx + 4}
                y={wy - 8}
                fill={theme.ink}
                fontSize={10}
                transform={`rotate(-45, ${wx + 4}, ${wy - 8})`}
              >
                {w.name} {Math.round(ele)}m
              </text>
            </g>
          );
        })}

      {/* 爬坡標注（山頂）：有分級才掛徽章；未分級的坡只有在命名時才以小標記上圖，
          避免起伏路線被一排「坡」字旗淹沒 */}
      {climbs.map((c, i) => {
        const name = climbNames[i]?.trim();
        if (!c.category && !name) return null;
        const cx = x(c.endM);
        const cy = y(c.topEle);
        const color = catColor(c.category);
        return (
          <g key={i} fontFamily="system-ui, sans-serif">
            {c.category ? (
              <>
                <line x1={cx} y1={cy} x2={cx} y2={cy - 26} stroke={color} strokeWidth={1.5} />
                <rect x={cx - 15} y={cy - 46} width={30} height={20} rx={4} fill={color} />
                <text x={cx} y={cy - 32} fill="#fff" fontSize={12} fontWeight={700} textAnchor="middle">{c.category}</text>
                <text x={cx} y={cy - 52} fill={theme.ink} fontSize={10} textAnchor="middle">
                  {(c.lengthM / 1000).toFixed(1)}km @ {c.avgGradientPct.toFixed(1)}%
                </text>
                {name && (
                  <text x={cx} y={cy - 64} fill={theme.ink} fontSize={12} fontWeight={700} textAnchor="middle">
                    {t.climbNameOnChart(name, Math.round(c.topEle))}
                  </text>
                )}
              </>
            ) : (
              <>
                <line x1={cx} y1={cy} x2={cx} y2={cy - 16} stroke={theme.muted} strokeWidth={1} />
                <circle cx={cx} cy={cy - 18} r={2.5} fill={theme.ink} />
                <text x={cx} y={cy - 26} fill={theme.ink} fontSize={11} fontWeight={700} textAnchor="middle">
                  {t.climbNameOnChart(name!, Math.round(c.topEle))}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* 最陡 1km 標注（可開關，會一起匯出）：半透明帶＋虛線邊界＋標籤 */}
      {steepest && (() => {
        const x1 = x(steepest.startM);
        const x2 = x(Math.min(steepest.startM + 1000, total));
        const bandTop = Math.max(...samples.filter((s) => s.distanceM >= steepest.startM && s.distanceM <= steepest.startM + 1000).map((s) => s.ele));
        const topY = y(bandTop);
        return (
          <g fontFamily="system-ui, sans-serif">
            <rect x={x1} y={topY} width={x2 - x1} height={baseY - topY} fill="#DC2626" opacity={0.13} />
            <line x1={x1} y1={topY} x2={x1} y2={baseY} stroke="#DC2626" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            <line x1={x2} y1={topY} x2={x2} y2={baseY} stroke="#DC2626" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            <text x={(x1 + x2) / 2} y={topY - 6} fill="#DC2626" fontSize={10} fontWeight={700} textAnchor="middle">
              {t.steepestOnChart(steepest.gradientPct.toFixed(1))}
            </text>
          </g>
        );
      })()}

      {/* 游標十字線（僅互動顯示；滑鼠/手指離開即消失，不會出現在下載的 PNG） */}
      {cursorM !== null && (() => {
        const ele = eleAtM(samples, cursorM);
        const lo = Math.max(0, cursorM - 100);
        const hi = Math.min(total, cursorM + 100);
        const grad = hi > lo ? ((eleAtM(samples, hi) - eleAtM(samples, lo)) / (hi - lo)) * 100 : 0;
        const cx = x(cursorM);
        const flip = cursorM > total / 2;
        return (
          <g pointerEvents="none" fontFamily="system-ui, sans-serif">
            <line x1={cx} y1={MT} x2={cx} y2={baseY} stroke={theme.ink} strokeWidth={1} strokeDasharray="4 3" opacity={0.55} />
            <circle cx={cx} cy={y(ele)} r={3.5} fill={theme.accent} stroke="#fff" strokeWidth={1.5} />
            <text x={flip ? cx - 8 : cx + 8} y={MT + 14} fill={theme.ink} fontSize={11} fontWeight={600} textAnchor={flip ? 'end' : 'start'}>
              {t.cursorReadout((cursorM / 1000).toFixed(1), Math.round(ele), grad.toFixed(1))}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// 單一爬坡細部圖：每公里一塊的階梯圖，塊內印坡度、邊界標海拔
const DW = 840;
const DH = 300;
const DML = 40;
const DMR = 24;
const DMT = 56;
const DMB = 34;

function ClimbDetail({ profile, climb, name, theme, t, watermark }: { profile: Profile; climb: Climb; name: string; theme: ProfileTheme; t: Dict; watermark: boolean }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const blocks = climbKmBlocks(profile.samples, climb);
  const minE = blocks[0].startEle;
  const maxE = Math.max(...blocks.map((b) => b.endEle), minE + 30);
  const pw = DW - DML - DMR;
  const ph = DH - DMT - DMB;
  const x = (m: number) => DML + ((m - climb.startM) / climb.lengthM) * pw;
  const y = (e: number) => DMT + (1 - (e - minE) / ((maxE - minE) * 1.12)) * ph;
  const baseY = DMT + ph;
  const labelEvery = blocks.length > 14 ? 2 : 1;
  const displayName = name.trim() || t.detailFallback;

  return (
    <div className="space-y-2">
      <svg ref={svgRef} viewBox={`0 0 ${DW} ${DH}`} role="img" aria-label={t.detailAria} className="w-full rounded-[var(--radius-card)] border border-edge" style={{ background: theme.bg }}>
        <rect x={0} y={0} width={DW} height={DH} fill={theme.bg} />
        <text x={DML} y={26} fill={theme.ink} fontSize={18} fontWeight={700} fontFamily="Georgia, 'Noto Serif TC', serif">{displayName}</text>
        <text x={DML} y={44} fill={theme.muted} fontSize={11} fontFamily="system-ui, sans-serif">
          {t.detailSub((climb.lengthM / 1000).toFixed(1), Math.round(climb.gainM), climb.avgGradientPct.toFixed(1), climb.category)}
        </text>
        {watermark && (
          <text x={DW - DMR} y={DH - 6} fill={theme.muted} fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif" opacity={0.8}>
            tiglet.vercel.app
          </text>
        )}

        {blocks.map((b, i) => {
          const x1 = x(b.startM);
          const x2 = x(b.endM);
          const wide = x2 - x1 > 42;
          return (
            <g key={i} fontFamily="system-ui, sans-serif">
              <polygon
                points={`${x1},${y(b.startEle)} ${x2},${y(b.endEle)} ${x2},${baseY} ${x1},${baseY}`}
                fill={b.band.color}
                stroke={theme.bg}
                strokeWidth={1.5}
              />
              {/* 塊內坡度 */}
              <text x={(x1 + x2) / 2} y={baseY - 8} fill="#FFFFFF" fontSize={wide ? 12 : 9} fontWeight={700} textAnchor="middle">
                {b.gradientPct.toFixed(1)}%
              </text>
              {/* 邊界海拔（坡頂一定標） */}
              {(i % labelEvery === 0 || i === blocks.length - 1) && (
                <text x={x2} y={y(b.endEle) - 6} fill={theme.ink} fontSize={9} textAnchor="middle">{Math.round(b.endEle)}m</text>
              )}
              {/* 底部相對公里數 */}
              <text x={x1} y={baseY + 14} fill={theme.muted} fontSize={9} textAnchor="middle">{((b.startM - climb.startM) / 1000).toFixed(0)}k</text>
            </g>
          );
        })}
        <line x1={DML} y1={baseY} x2={DW - DMR} y2={baseY} stroke={theme.ink} strokeWidth={1} />
      </svg>
      <button
        onClick={() => svgRef.current && downloadSvgAsPng(svgRef.current, DW, DH, `${displayName}.png`, theme.bg)}
        className="rounded-lg border border-edge px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
      >
        {t.detailDownload}
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface px-3 py-2 text-center">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-lg tabular-nums text-ink">{value}</div>
    </div>
  );
}

export default function StageProfile({ locale = 'zh' }: { locale?: Locale }) {
  const t = L[locale];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [climbNames, setClimbNames] = useState<string[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [themeIdx, setThemeIdx] = useState(0);
  const [watermark, setWatermark] = useState(true);
  const [showSteepest, setShowSteepest] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Array<{ km: string; ele: string }>>([
    { km: '0', ele: '' },
    { km: '', ele: '' },
  ]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const theme = THEMES[themeIdx];
  // 原始載入的完整軌跡與航點（「回復完整路線」用）；目前顯示中的軌跡
  const fullTrackRef = useRef<TrackPoint[] | null>(null);
  const fullWaypointsRef = useRef<Waypoint[]>([]);
  const currentTrackRef = useRef<TrackPoint[] | null>(null);
  const [edited, setEdited] = useState(false); // 目前視圖被裁切/反轉過
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');

  // 分享連結還原：?r= 帶簡化輪廓 → 零檔案重建剖面圖
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('r');
    if (!raw) return;
    const decoded = decodeRouteShare(raw);
    if (!decoded) return;
    try {
      applyTrack(checkpointsToTrackPoints(decoded.checkpoints), decoded.waypoints, decoded.title);
    } catch {
      /* 壞連結：維持空白狀態即可 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PWA 入口 ①：系統分享選單（share_target）——SW 把檔案放進 Cache 後導來這裡
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('shared') !== '1' || !('caches' in window)) return;
    (async () => {
      const cache = await caches.open('tiglet-shared');
      const res = await cache.match('/shared-file');
      if (!res) return;
      const name = decodeURIComponent(res.headers.get('x-file-name') ?? 'shared.gpx');
      const blob = await res.blob();
      await cache.delete('/shared-file');
      loadFile(new File([blob], name));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PWA 入口 ②：作業系統「以 Tiglet 開啟」軌跡檔（file_handlers / launchQueue）
  useEffect(() => {
    const lq = (window as unknown as { launchQueue?: { setConsumer: (cb: (p: { files?: Array<{ getFile(): Promise<File> }> }) => void) => void } }).launchQueue;
    lq?.setConsumer(async (params) => {
      const handle = params.files?.[0];
      if (handle) loadFile(await handle.getFile());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 分享碼：剖面簡化成 ≤80 個關鍵點＋標題＋地標（按下按鈕才組進網址）
  const shareCode = useMemo(
    () => (profile ? encodeRouteShare({ title, checkpoints: simplifyProfile(profile.samples), waypoints }) : ''),
    [profile, title, waypoints]
  );

  // 共同管線：軌跡點（＋可選的航點/標題）→ 剖面、爬坡、地標。
  // preserveFull=true 表示這是裁切/反轉等「視圖編輯」，不覆蓋原始完整軌跡
  function applyTrack(points: TrackPoint[], autoWaypoints: Waypoint[], newTitle: string, opts?: { preserveFull?: boolean }) {
    if (!opts?.preserveFull) {
      fullTrackRef.current = points;
      fullWaypointsRef.current = autoWaypoints;
      setEdited(false);
      setTrimStart('');
      setTrimEnd('');
    }
    currentTrackRef.current = points;
    const p = buildProfile(points);
    const cs = detectClimbs(p.samples);
    setProfile(p);
    setClimbs(cs);
    setClimbNames(Array(cs.length).fill(''));
    setWaypoints(autoWaypoints);
    setDetailIdx(null);
    setTitle(newTitle);
  }

  // 裁切目前視圖到 [起,訖] km；地標公里數平移、超出範圍者剔除
  function applyTrim() {
    const cur = currentTrackRef.current;
    if (!cur || !profile) return;
    setError('');
    try {
      const sKm = trimStart.trim() === '' ? 0 : Number(trimStart);
      const eKm = trimEnd.trim() === '' ? profile.totalDistanceM / 1000 : Number(trimEnd);
      const seg = trimTrack(cur, sKm * 1000, eKm * 1000);
      const shifted = waypoints
        .map((w) => ({ ...w, kmNum: Number(w.km) - sKm }))
        .filter((w) => Number.isFinite(w.kmNum) && w.kmNum >= 0 && w.kmNum <= eKm - sKm && w.name.trim() !== '')
        .map((w) => ({ km: w.kmNum.toFixed(1), name: w.name }));
      applyTrack(seg, shifted, title, { preserveFull: true });
      setEdited(true);
      setTrimStart('');
      setTrimEnd('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.readError);
    }
  }

  // 反轉目前視圖：終點變起點；地標公里數鏡像翻轉
  function reverseRoute() {
    const cur = currentTrackRef.current;
    if (!cur || !profile) return;
    const totalKm = profile.totalDistanceM / 1000;
    const flipped = waypoints
      .map((w) => ({ ...w, kmNum: totalKm - Number(w.km) }))
      .filter((w) => Number.isFinite(w.kmNum) && w.name.trim() !== '')
      .map((w) => ({ km: w.kmNum.toFixed(1), name: w.name }));
    applyTrack(reverseTrack(cur), flipped, title, { preserveFull: true });
    setEdited(true);
  }

  // 回復載入時的完整路線（原方向、原地標）
  function resetView() {
    if (!fullTrackRef.current) return;
    setError('');
    applyTrack(fullTrackRef.current, fullWaypointsRef.current, title, { preserveFull: true });
    setEdited(false);
  }

  async function loadFile(file: File) {
    setError('');
    try {
      const ext = file.name.toLowerCase().split('.').pop() ?? '';
      if (ext === 'fit') {
        // FIT 為二進位格式：解析器動態載入（沿用 xlsx/marked 前例）
        const { default: FitParser } = await import('fit-file-parser');
        const buf = await file.arrayBuffer();
        const records = await new Promise<import('../lib/gpx').FitRecordLike[]>((resolve, reject) => {
          new FitParser({ mode: 'list' }).parse(buf, (err: unknown, data: { records?: import('../lib/gpx').FitRecordLike[] }) => {
            if (err) reject(new Error(t.readError));
            else resolve(data?.records ?? []);
          });
        });
        applyTrack(fitRecordsToTrackPoints(records), [], file.name.replace(/\.fit$/i, ''));
        return;
      }
      const xml = await file.text();
      if (ext === 'tcx') {
        applyTrack(parseTcx(xml), [], file.name.replace(/\.tcx$/i, ''));
        return;
      }
      const points = parseGpx(xml);
      // GPX 自帶的 <wpt> 航點（補給站/地標）自動帶入地標編輯器，仍可改可刪
      const autoWaypoints: Waypoint[] = parseGpxWaypoints(xml)
        .map((w) => ({ w, loc: locateOnTrack(points, w.lat, w.lon) }))
        .filter((x): x is { w: ReturnType<typeof parseGpxWaypoints>[number]; loc: NonNullable<ReturnType<typeof locateOnTrack>> } => x.loc !== null)
        .map(({ w, loc }) => ({ km: (loc.distanceM / 1000).toFixed(1), name: w.name }));
      applyTrack(points, autoWaypoints, parseGpxName(xml) ?? file.name.replace(/\.gpx$/i, ''));
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : t.readError);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadFile(file);
    e.target.value = '';
  }

  // 手動檢查點 → 合成軌跡 → 同一條出圖管線
  function buildManualRoute() {
    setError('');
    try {
      const cps = checkpoints.map((c) => ({ km: Number(c.km), ele: Number(c.ele) }));
      applyTrack(checkpointsToTrackPoints(cps), [], t.manualTitle);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.readError);
    }
  }

  // 零檔案體驗：合成一條 12km 平路＋8km 6% 二級坡＋回程的範例路線
  function loadSample() {
    setError('');
    const M_PER_DEG_LAT = 111_320;
    const stepM = 50;
    let lat = 25.05;
    let ele = 25;
    const points: TrackPoint[] = [{ lat, lon: 121.53, ele }];
    const segments: [number, number][] = [[6000, 0.4], [8000, 6], [3000, -4], [5000, 0.3]];
    for (const [lengthM, gradPct] of segments) {
      for (let i = 0; i < Math.round(lengthM / stepM); i++) {
        lat += stepM / M_PER_DEG_LAT;
        ele += (stepM * gradPct) / 100;
        points.push({ lat, lon: 121.53, ele });
      }
    }
    applyTrack(points, [{ km: '10.0', name: t.sampleWaypoint }], t.sampleTitle);
  }

  function downloadPng() {
    if (svgRef.current) downloadSvgAsPng(svgRef.current, W, H, `${title.trim() || 'stage-profile'}.png`, theme.bg);
  }

  const steepestSpot = useMemo(
    () => (profile ? steepestKm(profile.samples) : { startM: 0, gradientPct: 0 }),
    [profile]
  );
  const stats = profile
    ? {
        km: (profile.totalDistanceM / 1000).toFixed(1),
        ascent: Math.round(totalAscentM(profile.samples)).toString(),
        steep: steepestSpot.gradientPct.toFixed(1),
        climbs: climbs.length,
      }
    : null;
  const buckets = profile ? gradientBuckets(profile.samples) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        className={`rounded-[var(--radius-card)] border border-dashed p-5 text-center transition-colors ${dragging ? 'border-accent bg-accent/5' : 'border-edge bg-surface'}`}
      >
        {/* 雲朵上傳 icon：呼應「拖進來就能上傳」，拖曳中變主色 */}
        <svg
          viewBox="0 0 24 24"
          width="34"
          height="34"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`mx-auto mb-2 transition-colors ${dragging ? 'text-accent' : 'text-muted'}`}
        >
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.3" />
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
        </svg>
        <label className="cursor-pointer text-accent hover:underline">
          {t.upload}
          <input type="file" accept=".gpx,.fit,.tcx" onChange={onFile} className="hidden" />
        </label>
        <p className="mt-1 text-xs text-muted">{t.uploadNote}</p>
        <button onClick={loadSample} className="mt-2 text-xs text-muted underline hover:text-accent">
          {t.loadSample}
        </button>
      </div>

      <details className="rounded-[var(--radius-card)] border border-edge bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-accent">{t.exportSummary}</summary>
        <div className="mt-3 space-y-3">
          <div>
            <p className="font-semibold text-ink">{t.guideIntroTitle}</p>
            <p className="mt-1 text-muted">{t.guideIntro}</p>
          </div>
          <div className="space-y-2">
            {t.guides.map((g) => (
              <details key={g.app} className="rounded-lg border border-edge bg-bg px-3 py-2">
                <summary className="cursor-pointer font-semibold text-ink">{g.app}</summary>
                <div className="mt-2 space-y-1.5 text-muted">
                  {'mobile' in g && g.mobile && (
                    <p><span className="mr-1 font-semibold text-ink">{t.guideMobile}</span>{g.mobile}</p>
                  )}
                  {'web' in g && g.web && (
                    <p><span className="mr-1 font-semibold text-ink">{t.guideWeb}</span>{g.web}</p>
                  )}
                  {'note' in g && g.note && <p className="text-xs">💡 {g.note}</p>}
                </div>
              </details>
            ))}
          </div>
        </div>
      </details>

      <details className="rounded-[var(--radius-card)] border border-edge bg-surface p-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-accent">{t.manualSummary}</summary>
        <div className="mt-3 space-y-3">
          <p className="text-muted">{t.manualHint}</p>
          <div className="space-y-2">
            {checkpoints.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  value={c.km}
                  onChange={(e) => setCheckpoints((prev) => prev.map((p, j) => (j === i ? { ...p, km: e.target.value } : p)))}
                  placeholder="0"
                  aria-label={t.manualKmAria(i + 1)}
                  className="w-24 rounded border border-edge bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">{t.manualKm}</span>
                <input
                  type="number"
                  value={c.ele}
                  onChange={(e) => setCheckpoints((prev) => prev.map((p, j) => (j === i ? { ...p, ele: e.target.value } : p)))}
                  placeholder="100"
                  aria-label={t.manualEleAria(i + 1)}
                  className="w-24 rounded border border-edge bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                />
                <span className="text-xs text-muted">{t.manualEle}</span>
                {checkpoints.length > 2 && (
                  <button
                    onClick={() => setCheckpoints((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={t.manualDeleteAria(i + 1)}
                    className="text-sm text-muted hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCheckpoints((prev) => [...prev, { km: '', ele: '' }])}
              className="text-sm text-accent hover:underline"
            >
              {t.manualAdd}
            </button>
            <button
              onClick={buildManualRoute}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              {t.manualBuild}
            </button>
          </div>
        </div>
      </details>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {profile && stats && buckets && (
        <>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t.titleLabel}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
          </label>

          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-2 text-sm text-muted">{t.themeLabel}</span>
            {THEMES.map((th, i) => (
              <button
                key={th.id}
                onClick={() => setThemeIdx(i)}
                aria-pressed={themeIdx === i}
                className={`flex items-center gap-1.5 rounded-md border border-edge px-3 py-1 text-sm ${themeIdx === i ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
              >
                <span className="inline-block h-3 w-3 rounded-full border border-black/10" style={{ background: th.accent }} />
                {locale === 'en' ? THEME_EN[th.id] ?? th.label : th.label}
              </button>
            ))}
            <span className="ml-4 flex flex-wrap items-center gap-4">
              <Toggle label={t.watermarkLabel} checked={watermark} onChange={setWatermark} />
              <Toggle label={t.steepestLabel} checked={showSteepest} onChange={setShowSteepest} />
            </span>
          </div>

          {/* 視圖編輯：裁切區段（實騎檔常帶市區暖身/回程）與方向反轉 */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={reverseRoute}
              className="rounded-md border border-edge px-3 py-1 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {t.reverse}
            </button>
            <span className="ml-2 text-muted">{t.trimLabel}</span>
            <input
              type="number"
              value={trimStart}
              onChange={(e) => setTrimStart(e.target.value)}
              placeholder="0"
              aria-label={t.trimStartAria}
              className="w-20 rounded border border-edge bg-bg px-2 py-1 font-mono text-sm text-ink outline-none focus:border-accent"
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              value={trimEnd}
              onChange={(e) => setTrimEnd(e.target.value)}
              placeholder={stats ? stats.km : ''}
              aria-label={t.trimEndAria}
              className="w-20 rounded border border-edge bg-bg px-2 py-1 font-mono text-sm text-ink outline-none focus:border-accent"
            />
            <span className="text-muted">km</span>
            <button
              onClick={applyTrim}
              className="rounded-md border border-edge px-3 py-1 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {t.trimApply}
            </button>
            {edited && (
              <button onClick={resetView} className="text-accent hover:underline">
                {t.trimReset}
              </button>
            )}
          </div>

          <ProfileSvg
            profile={profile}
            climbs={climbs}
            climbNames={climbNames}
            waypoints={waypoints}
            title={title}
            theme={theme}
            svgRef={svgRef}
            t={t}
            watermark={watermark}
            steepest={showSteepest && steepestSpot.gradientPct >= 1 ? steepestSpot : null}
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label={t.statDistance} value={`${stats.km} km`} />
            <StatCard label={t.statAscent} value={`${stats.ascent} m`} />
            <StatCard label={t.statSteepest} value={`${stats.steep}%`} />
            <StatCard label={t.statClimbs} value={t.climbsValue(stats.climbs)} />
          </div>

          {climbs.length > 0 && (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-edge bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge">
                    <th className="px-3 py-2 text-left font-normal text-muted">{t.thClimb}</th>
                    <th className="px-3 py-2 text-left font-normal text-muted">{t.thName}</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">{t.thStart}</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">{t.thLength}</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">{t.thGain}</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">{t.thAvgGrad}</th>
                    <th className="px-3 py-2 text-right font-normal text-muted">{t.thDetail}</th>
                  </tr>
                </thead>
                <tbody>
                  {climbs.map((c, i) => (
                    <Fragment key={i}>
                    <tr className="border-b border-edge last:border-0">
                      <td className="px-3 py-2">
                        <span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: catColor(c.category) }}>
                          {t.catBadge(c.category)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={climbNames[i] ?? ''}
                          onChange={(e) => setClimbNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                          placeholder={t.climbNamePlaceholder}
                          aria-label={t.climbNameAria(i + 1)}
                          className="w-28 rounded border border-edge bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{(c.startM / 1000).toFixed(1)} km</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{(c.lengthM / 1000).toFixed(1)} km</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{Math.round(c.gainM)} m</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">{c.avgGradientPct.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setDetailIdx(detailIdx === i ? null : i)}
                          aria-label={t.climbDetailAria(i + 1)}
                          className={`text-sm ${detailIdx === i ? 'text-accent' : 'text-muted hover:text-accent'}`}
                        >
                          {detailIdx === i ? t.collapse : t.expandDetail}
                        </button>
                      </td>
                    </tr>
                    {detailIdx === i && (
                      // 細部圖直接展開在該列正下方，不用滑到頁面底部
                      <tr className="border-b border-edge last:border-0">
                        <td colSpan={7} className="bg-bg px-3 py-4">
                          <ClimbDetail profile={profile} climb={c} name={climbNames[i] ?? ''} theme={theme} t={t} watermark={watermark} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-[var(--radius-card)] border border-edge bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink">{t.wpSection}</span>
              <button
                onClick={() => setWaypoints((prev) => [...prev, { km: '', name: '' }])}
                className="text-sm text-accent hover:underline"
              >
                {t.wpAdd}
              </button>
            </div>
            {waypoints.length === 0 ? (
              <p className="text-xs text-muted">{t.wpHint}</p>
            ) : (
              <div className="space-y-2">
                {waypoints.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="number"
                      value={w.km}
                      onChange={(e) => setWaypoints((prev) => prev.map((p, j) => (j === i ? { ...p, km: e.target.value } : p)))}
                      placeholder="26"
                      aria-label={t.wpKmAria(i + 1)}
                      className="w-20 rounded border border-edge bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">km</span>
                    <input
                      value={w.name}
                      onChange={(e) => setWaypoints((prev) => prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))}
                      placeholder={t.wpNamePlaceholder}
                      aria-label={t.wpNameAria(i + 1)}
                      className="flex-1 rounded border border-edge bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => setWaypoints((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={t.wpDeleteAria(i + 1)}
                      className="text-sm text-muted hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={downloadPng} className="rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-[var(--color-accent-hover)]">
              {t.downloadPng}
            </button>
            <ShareLinkButton label={t.shareLabel} params={{ r: shareCode }} />
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {buckets.map((b) => (
                <span key={b.label} className="rounded border border-edge px-2 py-1">
                  {t.bucketChip(b.label, (b.distanceM / 1000).toFixed(1))}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted">{t.shareHint}</p>
          <p className="text-xs text-muted">{t.footnote}</p>
        </>
      )}
    </div>
  );
}
