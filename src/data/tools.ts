export type ToolCategory = '計算' | '遊戲' | '隨機決定' | '實用工具';
export type ToolStatus = 'available' | 'soon';

export interface Tool {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  path: string;
  icon: string; // emoji for v1
  status: ToolStatus;
  keywords?: string[];
}

export const CATEGORY_ORDER: ToolCategory[] = ['計算', '遊戲', '隨機決定', '實用工具'];

export const tools: Tool[] = [
  { id: 'calculator', title: '計算機', description: '四則運算與鍵盤輸入的基本計算機。', category: '計算', path: '/tools/calculator', icon: '🧮', status: 'available', keywords: ['calculator', '加減乘除'] },
  { id: 'text-calculator', title: '文字計算機', description: '輸入一段算式文字，立即算出結果。', category: '計算', path: '/tools/text-calculator', icon: '✍️', status: 'available', keywords: ['expression', '算式'] },
  { id: 'tic-tac-toe', title: '井字遊戲', description: '雙人對戰或挑戰電腦的經典井字棋。', category: '遊戲', path: '/tools/tic-tac-toe', icon: '⭕', status: 'available', keywords: ['tic tac toe', 'OX'] },
  { id: 'wheel', title: '決定輪盤', description: '輸入選項，轉一下讓命運決定。', category: '隨機決定', path: '/tools/wheel', icon: '🎡', status: 'soon', keywords: ['抽籤', 'spin'] },
  { id: 'raffle', title: '名單抽獎', description: '匯入 Excel 名單，隨機抽出中獎者。', category: '隨機決定', path: '/tools/raffle', icon: '🎁', status: 'soon', keywords: ['lottery', 'excel'] },
  { id: 'timer', title: '計時器', description: '倒數計時與碼錶。', category: '實用工具', path: '/tools/timer', icon: '⏱️', status: 'soon', keywords: ['timer', 'stopwatch'] },
  { id: 'dice', title: '擲骰子', description: '可調數量與面數的擲骰工具。', category: '實用工具', path: '/tools/dice', icon: '🎲', status: 'soon', keywords: ['dice', 'roll'] },
  { id: 'qrcode', title: 'QR 產生器', description: '把文字或網址轉成 QR 碼並下載。', category: '實用工具', path: '/tools/qrcode', icon: '🔳', status: 'soon', keywords: ['qr', 'qrcode'] },
  { id: 'password', title: '密碼產生器', description: '自訂規則產生高強度隨機密碼。', category: '實用工具', path: '/tools/password', icon: '🔑', status: 'soon', keywords: ['password', '密碼'] },
];
