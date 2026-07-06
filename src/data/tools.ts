export type ToolCategory = '計算' | '遊戲' | '隨機決定' | '實用工具' | '單車' | '文字';
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

export const CATEGORY_ORDER: ToolCategory[] = ['計算', '遊戲', '隨機決定', '實用工具', '單車', '文字'];

export const tools: Tool[] = [
  { id: 'calculator', title: '計算機', description: '四則運算與鍵盤輸入的基本計算機。', category: '計算', path: '/tools/calculator', icon: '🧮', status: 'available', keywords: ['calculator', '加減乘除'] },
  { id: 'text-calculator', title: '文字計算機', description: '輸入一段算式文字，立即算出結果。', category: '計算', path: '/tools/text-calculator', icon: '✍️', status: 'available', keywords: ['expression', '算式'] },
  { id: 'converter', title: '換算器', description: '單位換算與即時匯率換算。', category: '計算', path: '/tools/converter', icon: '📐', status: 'available', keywords: ['converter', 'unit', '單位', '匯率', 'currency', '溫度', '長度'] },
  { id: 'everyday-calc', title: '生活計算', description: 'BMI、百分比、折扣、小費分帳。', category: '計算', path: '/tools/everyday-calc', icon: '🧾', status: 'available', keywords: ['bmi', '百分比', '折扣', '小費', 'tip', 'discount', 'percent'] },
  { id: 'world-clock', title: '世界時鐘', description: '各地即時時間、時差與時間推算。', category: '計算', path: '/tools/world-clock', icon: '🌐', status: 'available', keywords: ['timezone', '時差', '時區', 'world clock', '世界時鐘'] },
  { id: 'date-calc', title: '日期計算器', description: '日期差、推算、可分享的倒數日與工作天。', category: '計算', path: '/tools/date-calc', icon: '📅', status: 'available', keywords: ['date', '日期', '倒數', 'countdown', '工作天', 'workday', '天數'] },
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
  { id: 'image-studio', title: '圖片工具', description: '壓縮、縮放、格式轉換，附前後對比。', category: '實用工具', path: '/tools/image-studio', icon: '🖼️', status: 'available', keywords: ['image', '壓縮', '縮放', '轉檔', 'compress', 'resize', 'convert', 'webp'] },
  { id: 'gear-calculator', title: '齒比計算器', description: '齒比表、速度對照、A/B 傳動比較與容量檢查。', category: '單車', path: '/tools/gear-calculator', icon: '⚙️', status: 'available', keywords: ['gear', 'ratio', '齒比', '公路車', 'bike', '飛輪', '大盤', 'cassette', 'cadence', '迴轉速'] },
  { id: 'ride-fuel', title: '騎乘熱量', description: '碼錶 kJ 換算大卡與食物，附補給與補水建議。', category: '單車', path: '/tools/ride-fuel', icon: '🍌', status: 'available', keywords: ['kj', 'kcal', '大卡', '熱量', '補給', 'fuel', 'calories', '公路車', 'bike', '排汗'] },
  { id: 'ftp-zones', title: 'FTP 訓練區間', description: 'Coggan 功率七區、W/kg 等級與心率區間。', category: '單車', path: '/tools/ftp-zones', icon: '⚡', status: 'available', keywords: ['ftp', 'zone', '功率', '訓練', 'watt', 'w/kg', '心率', 'lthr', '公路車', 'bike'] },
  { id: 'tire-pressure', title: '胎壓建議', description: '依體重胎寬與路面，算前後輪建議胎壓。', category: '單車', path: '/tools/tire-pressure', icon: '🛞', status: 'available', keywords: ['tire', 'pressure', '胎壓', 'psi', 'bar', 'tubeless', '無內胎', '公路車', 'bike'] },
  { id: 'stage-profile', title: '賽段剖面圖', description: '上傳 GPX 生成環法風剖面圖，爬坡自動分級。', category: '單車', path: '/tools/stage-profile', icon: '⛰️', status: 'available', keywords: ['gpx', 'profile', '剖面圖', '爬坡', 'climb', 'hc', '海拔', 'strava', '路線', '公路車', 'bike'] },
  { id: 'word-count', title: '字數統計', description: '字元、中英文字數、行數與閱讀時間即時統計。', category: '文字', path: '/tools/word-count', icon: '🔢', status: 'available', keywords: ['word', 'count', '字數', '統計', 'character', '閱讀時間'] },
  { id: 'encoder', title: '編解碼工具', description: 'Base64、URL、HTML entities 雙向轉換。', category: '文字', path: '/tools/encoder', icon: '🔐', status: 'available', keywords: ['base64', 'url', 'encode', 'decode', '編碼', '解碼', 'html', 'entities'] },
  { id: 'text-diff', title: '文字比對', description: '兩段文字的差異高亮，行級加字元級。', category: '文字', path: '/tools/text-diff', icon: '🔍', status: 'available', keywords: ['diff', 'compare', '比對', '差異', '比較'] },
];
