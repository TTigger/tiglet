export type ToolCategory = '計算' | '遊戲' | '隨機決定' | '實用工具' | '單車' | '文字';
export type ToolStatus = 'available' | 'soon';

export interface Tool {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: ToolCategory;
  path: string;
  icon: string; // emoji for v1
  status: ToolStatus;
  keywords?: string[];
}

export const CATEGORY_ORDER: ToolCategory[] = ['計算', '遊戲', '隨機決定', '實用工具', '單車', '文字'];

export const tools: Tool[] = [
  { id: 'calculator', title: '計算機', titleEn: 'Calculator', description: '四則運算與鍵盤輸入的基本計算機。', descriptionEn: 'Four-function calculator with keyboard input.', category: '計算', path: '/tools/calculator', icon: '🧮', status: 'available', keywords: ['calculator', '加減乘除'] },
  { id: 'text-calculator', title: '文字計算機', titleEn: 'Text Calculator', description: '輸入一段算式文字，立即算出結果。', descriptionEn: 'Type an expression, get the result instantly.', category: '計算', path: '/tools/text-calculator', icon: '✍️', status: 'available', keywords: ['expression', '算式'] },
  { id: 'converter', title: '換算器', titleEn: 'Converter', description: '單位換算與即時匯率換算。', descriptionEn: 'Unit conversion plus live currency rates.', category: '計算', path: '/tools/converter', icon: '📐', status: 'available', keywords: ['converter', 'unit', '單位', '匯率', 'currency', '溫度', '長度'] },
  { id: 'everyday-calc', title: '生活計算', titleEn: 'Everyday Calc', description: 'BMI、百分比、折扣、小費、大寫金額。', descriptionEn: 'BMI, percentages, discounts, tips and Chinese uppercase amounts.', category: '計算', path: '/tools/everyday-calc', icon: '🧾', status: 'available', keywords: ['bmi', '百分比', '折扣', '小費', 'tip', 'discount', 'percent', '大寫', '金額', '支票'] },
  { id: 'world-clock', title: '世界時鐘', titleEn: 'World Clock', description: '各地即時時間、時差與時間推算。', descriptionEn: 'Live city clocks, offsets and time projection.', category: '計算', path: '/tools/world-clock', icon: '🌐', status: 'available', keywords: ['timezone', '時差', '時區', 'world clock', '世界時鐘'] },
  { id: 'date-calc', title: '日期計算器', titleEn: 'Date Calculator', description: '日期差、推算、可分享的倒數日與工作天。', descriptionEn: 'Date differences, projections, shareable countdowns and workdays.', category: '計算', path: '/tools/date-calc', icon: '📅', status: 'available', keywords: ['date', '日期', '倒數', 'countdown', '工作天', 'workday', '天數'] },
  { id: 'tic-tac-toe', title: '井字遊戲', titleEn: 'Tic-Tac-Toe', description: '雙人對戰或挑戰電腦的經典井字棋。', descriptionEn: 'Two players, or challenge an unbeatable computer.', category: '遊戲', path: '/tools/tic-tac-toe', icon: '⭕', status: 'available', keywords: ['tic tac toe', 'OX'] },
  { id: 'bingo', title: '賓果遊戲', titleEn: 'Bingo', description: '經典 5×5 賓果叫號機，自動偵測連線、四角與全滿。', descriptionEn: 'Classic 5×5 caller with automatic line, corners and blackout detection.', category: '遊戲', path: '/tools/bingo', icon: '🎱', status: 'available', keywords: ['bingo', '賓果', '叫號'] },
  { id: '2048', title: '2048', titleEn: '2048', description: '滑動合併相同數字，挑戰 2048 方塊。', descriptionEn: 'Slide and merge tiles to reach 2048.', category: '遊戲', path: '/tools/2048', icon: '🔢', status: 'available', keywords: ['2048', 'puzzle', '數字'] },
  { id: 'snake', title: '貪食蛇', titleEn: 'Snake', description: '吃食物變長，別撞牆或咬到自己。', descriptionEn: 'Eat to grow — avoid the walls and yourself.', category: '遊戲', path: '/tools/snake', icon: '🐍', status: 'available', keywords: ['snake', '貪食蛇', '經典'] },
  { id: 'wheel', title: '決定輪盤', titleEn: 'Decision Wheel', description: '輸入選項，轉一下讓命運決定。', descriptionEn: 'Spin a wheel of options; share them via the URL.', category: '隨機決定', path: '/tools/wheel', icon: '🎡', status: 'available', keywords: ['抽籤', 'spin'] },
  { id: 'raffle', title: '名單抽獎', titleEn: 'Name Raffle', description: '匯入 Excel 名單，隨機抽出中獎者。', descriptionEn: 'Draw winners from a list or an imported Excel/CSV file.', category: '隨機決定', path: '/tools/raffle', icon: '🎁', status: 'available', keywords: ['lottery', 'excel'] },
  { id: 'timer', title: '計時器', titleEn: 'Timer', description: '倒數、碼錶與間歇訓練。', descriptionEn: 'Countdown, stopwatch and interval training.', category: '實用工具', path: '/tools/timer', icon: '⏱️', status: 'available', keywords: ['timer', 'stopwatch', '間歇', 'interval'] },
  { id: 'dice', title: '擲骰子', titleEn: 'Dice', description: '可調數量與面數的擲骰工具。', descriptionEn: 'Roll 3D d4–d20 dice with totals and history.', category: '實用工具', path: '/tools/dice', icon: '🎲', status: 'available', keywords: ['dice', 'roll'] },
  { id: 'qrcode', title: 'QR 產生器', titleEn: 'QR Generator', description: '文字、網址、WiFi 與名片 QR 碼。', descriptionEn: 'Text, URL, WiFi and vCard QR codes.', category: '實用工具', path: '/tools/qrcode', icon: '🔳', status: 'available', keywords: ['qr', 'qrcode', 'wifi', 'vcard', '名片'] },
  { id: 'password', title: '密碼產生器', titleEn: 'Password Generator', description: '自訂規則產生高強度隨機密碼。', descriptionEn: 'Strong random passwords with customizable rules.', category: '實用工具', path: '/tools/password', icon: '🔑', status: 'available', keywords: ['password', '密碼'] },
  { id: 'color-converter', title: '色彩轉換器', titleEn: 'Color Converter', description: '在 HEX、RGB、HSL 之間即時轉換色碼。', descriptionEn: 'Convert between HEX, RGB and HSL live.', category: '實用工具', path: '/tools/color-converter', icon: '🎨', status: 'available', keywords: ['color', 'hex', 'rgb', 'hsl', '色碼', '顏色'] },
  { id: 'color-extractor', title: '圖片取色', titleEn: 'Color Extractor', description: '上傳圖片，自動列出主要色號並複製。', descriptionEn: 'Pull the dominant colors out of any image.', category: '實用工具', path: '/tools/color-extractor', icon: '🌈', status: 'available', keywords: ['color', 'palette', '取色', '色票', '調色盤'] },
  { id: 'image-studio', title: '圖片工具', titleEn: 'Image Studio', description: '壓縮、縮放、轉檔與 EXIF 清除。', descriptionEn: 'Compress, resize, convert and strip EXIF metadata.', category: '實用工具', path: '/tools/image-studio', icon: '🖼️', status: 'available', keywords: ['image', '壓縮', '縮放', '轉檔', 'compress', 'resize', 'convert', 'webp', 'exif'] },
  { id: 'gear-calculator', title: '齒比計算器', titleEn: 'Gear Calculator', description: '齒比表、速度對照、A/B 傳動比較與容量檢查。', descriptionEn: 'Ratio tables, speed charts, A/B comparison and derailleur capacity.', category: '單車', path: '/tools/gear-calculator', icon: '⚙️', status: 'available', keywords: ['gear', 'ratio', '齒比', '公路車', 'bike', '飛輪', '大盤', 'cassette', 'cadence', '迴轉速'] },
  { id: 'ride-fuel', title: '騎乘熱量', titleEn: 'Ride Fuel', description: '碼錶 kJ 換算大卡與食物，附補給與補水建議。', descriptionEn: 'kJ to kcal with food equivalents and fueling guidance.', category: '單車', path: '/tools/ride-fuel', icon: '🍌', status: 'available', keywords: ['kj', 'kcal', '大卡', '熱量', '補給', 'fuel', 'calories', '公路車', 'bike', '排汗'] },
  { id: 'ftp-zones', title: 'FTP 訓練區間', titleEn: 'FTP Zones', description: 'Coggan 功率七區、W/kg 等級與心率區間。', descriptionEn: 'Coggan power zones, W/kg reference and heart-rate zones.', category: '單車', path: '/tools/ftp-zones', icon: '⚡', status: 'available', keywords: ['ftp', 'zone', '功率', '訓練', 'watt', 'w/kg', '心率', 'lthr', '公路車', 'bike'] },
  { id: 'tire-pressure', title: '胎壓建議', titleEn: 'Tire Pressure', description: '依體重胎寬與路面，算前後輪建議胎壓。', descriptionEn: 'Front/rear pressure suggestions from weight, width and surface.', category: '單車', path: '/tools/tire-pressure', icon: '🛞', status: 'available', keywords: ['tire', 'pressure', '胎壓', 'psi', 'bar', 'tubeless', '無內胎', '公路車', 'bike'] },
  { id: 'stage-profile', title: '賽段剖面圖', titleEn: 'Stage Profile', description: '上傳 GPX 生成環法風剖面圖，爬坡自動分級。', descriptionEn: 'Tour-style profile from your GPX with auto-categorized climbs.', category: '單車', path: '/tools/stage-profile', icon: '⛰️', status: 'available', keywords: ['gpx', 'profile', '剖面圖', '爬坡', 'climb', 'hc', '海拔', 'strava', '路線', '公路車', 'bike'] },
  { id: 'word-count', title: '字數統計', titleEn: 'Word Count', description: '字元、中英文字數、行數與閱讀時間即時統計。', descriptionEn: 'Characters, CJK, words, lines and reading time — live.', category: '文字', path: '/tools/word-count', icon: '🔢', status: 'available', keywords: ['word', 'count', '字數', '統計', 'character', '閱讀時間'] },
  { id: 'encoder', title: '編解碼工具', titleEn: 'Encoder', description: 'Base64、URL、HTML entities 雙向轉換。', descriptionEn: 'Two-way Base64, URL and HTML entity conversion.', category: '文字', path: '/tools/encoder', icon: '🔐', status: 'available', keywords: ['base64', 'url', 'encode', 'decode', '編碼', '解碼', 'html', 'entities'] },
  { id: 'text-diff', title: '文字比對', titleEn: 'Text Diff', description: '兩段文字的差異高亮，行級加字元級。', descriptionEn: 'Line-level diff with inline character highlighting.', category: '文字', path: '/tools/text-diff', icon: '🔍', status: 'available', keywords: ['diff', 'compare', '比對', '差異', '比較'] },
  { id: 'json-formatter', title: 'JSON 工具', titleEn: 'JSON Tool', description: '格式化、壓縮、驗證與樹狀視圖。', descriptionEn: 'Format, minify, validate and a tree view.', category: '文字', path: '/tools/json-formatter', icon: '🧩', status: 'available', keywords: ['json', 'format', 'formatter', '格式化', 'validate', 'tree', 'path'] },
  { id: 'markdown-studio', title: 'Markdown 工具', titleEn: 'Markdown Studio', description: '即時預覽、標題結構樹與文件統計。', descriptionEn: 'Live preview, heading outline tree and document stats.', category: '文字', path: '/tools/markdown-studio', icon: '📝', status: 'available', keywords: ['markdown', 'md', 'preview', '預覽', 'outline', '大綱', '結構'] },
];
