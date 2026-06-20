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
  { id: 'converter', title: '換算器', description: '單位換算與即時匯率換算。', category: '計算', path: '/tools/converter', icon: '📐', status: 'available', keywords: ['converter', 'unit', '單位', '匯率', 'currency', '溫度', '長度'] },
  { id: 'everyday-calc', title: '生活計算', description: 'BMI、百分比、折扣、小費分帳。', category: '計算', path: '/tools/everyday-calc', icon: '🧾', status: 'available', keywords: ['bmi', '百分比', '折扣', '小費', 'tip', 'discount', 'percent'] },
  { id: 'world-clock', title: '世界時鐘', description: '各地即時時間、時差與時間推算。', category: '計算', path: '/tools/world-clock', icon: '🌐', status: 'available', keywords: ['timezone', '時差', '時區', 'world clock', '世界時鐘'] },
  { id: 'tic-tac-toe', title: '井字遊戲', description: '雙人對戰或挑戰電腦的經典井字棋。', category: '遊戲', path: '/tools/tic-tac-toe', icon: '⭕', status: 'available', keywords: ['tic tac toe', 'OX'] },
  { id: 'bingo', title: '賓果遊戲', description: '經典 5×5 賓果叫號機，自動偵測連線、四角與全滿。', category: '遊戲', path: '/tools/bingo', icon: '🎱', status: 'available', keywords: ['bingo', '賓果', '叫號'] },
  { id: '2048', title: '2048', description: '滑動合併相同數字，挑戰 2048 方塊。', category: '遊戲', path: '/tools/2048', icon: '🔢', status: 'available', keywords: ['2048', 'puzzle', '數字'] },
  { id: 'snake', title: '貪食蛇', description: '吃食物變長，別撞牆或咬到自己。', category: '遊戲', path: '/tools/snake', icon: '🐍', status: 'available', keywords: ['snake', '貪食蛇', '經典'] },
  { id: 'wheel', title: '決定輪盤', description: '輸入選項，轉一下讓命運決定。', category: '隨機決定', path: '/tools/wheel', icon: '🎡', status: 'available', keywords: ['抽籤', 'spin'] },
  { id: 'raffle', title: '名單抽獎', description: '匯入 Excel 名單，隨機抽出中獎者。', category: '隨機決定', path: '/tools/raffle', icon: '🎁', status: 'available', keywords: ['lottery', 'excel'] },
  { id: 'timer', title: '計時器', description: '倒數計時與碼錶。', category: '實用工具', path: '/tools/timer', icon: '⏱️', status: 'available', keywords: ['timer', 'stopwatch'] },
  { id: 'dice', title: '擲骰子', description: '可調數量與面數的擲骰工具。', category: '實用工具', path: '/tools/dice', icon: '🎲', status: 'available', keywords: ['dice', 'roll'] },
  { id: 'qrcode', title: 'QR 產生器', description: '把文字或網址轉成 QR 碼並下載。', category: '實用工具', path: '/tools/qrcode', icon: '🔳', status: 'available', keywords: ['qr', 'qrcode'] },
  { id: 'password', title: '密碼產生器', description: '自訂規則產生高強度隨機密碼。', category: '實用工具', path: '/tools/password', icon: '🔑', status: 'available', keywords: ['password', '密碼'] },
  { id: 'color-converter', title: '色彩轉換器', description: '在 HEX、RGB、HSL 之間即時轉換色碼。', category: '實用工具', path: '/tools/color-converter', icon: '🎨', status: 'available', keywords: ['color', 'hex', 'rgb', 'hsl', '色碼', '顏色'] },
  { id: 'color-extractor', title: '圖片取色', description: '上傳圖片，自動列出主要色號並複製。', category: '實用工具', path: '/tools/color-extractor', icon: '🌈', status: 'available', keywords: ['color', 'palette', '取色', '色票', '調色盤'] },
];
