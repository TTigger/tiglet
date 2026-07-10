// 賽段剖面圖的出圖主題（純資料，供 StageProfile 與測試共用）。
// SVG 用固定色票（非 CSS 變數），匯出的 PNG 才不會受網站深淺色主題影響。
// 出圖主題只換底/墨/點綴色，坡度色階是語意（多陡），不隨主題變。

export interface ProfileTheme {
  id: string;
  label: string;
  bg: string;
  ink: string;
  muted: string;
  grid: string;
  accent: string;
}

export const THEMES: ProfileTheme[] = [
  { id: 'tiglet', label: 'Tiglet 暖橘', bg: '#FAF9F5', ink: '#1A1A18', muted: '#6B6A63', grid: '#D6D1C4', accent: '#D97757' },
  { id: 'tour', label: '環法黃', bg: '#FFFFFF', ink: '#14141E', muted: '#5A5A66', grid: '#E2E2E8', accent: '#D4A800' },
  { id: 'giro', label: '環義粉', bg: '#FFF6FA', ink: '#2B1A22', muted: '#8A6A78', grid: '#F0D4E2', accent: '#E5518D' },
  { id: 'vuelta', label: '環西紅', bg: '#FFFAF6', ink: '#241514', muted: '#8A6A62', grid: '#F0DCD0', accent: '#DA291C' },
  // 深色主題：墨色是淺色，所以「去背匯出疊在深色背景」也讀得清楚
  { id: 'night', label: '午夜黑', bg: '#171A21', ink: '#F0EEE6', muted: '#A9A79E', grid: '#3A3E48', accent: '#E8956D' },
];

// 出圖主題名稱的英文（按鈕 UI 用；id 對映，不動 THEMES 本體）
export const THEME_EN: Record<string, string> = {
  tiglet: 'Tiglet warm',
  tour: 'Tour yellow',
  giro: 'Giro pink',
  vuelta: 'Vuelta red',
  night: 'Midnight black',
};
