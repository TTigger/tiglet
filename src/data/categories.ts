import type { ToolCategory } from './tools';

/** 分享卡的底色，與 global.css 的 --color-bg（亮色主題）一致 */
export const CARD_BG = '#FAF9F5';

/**
 * 每個分類一組色，用在分享卡上。
 *
 * `spine` 是左緣的大色塊，直接用品牌調色（陶土橘的同族：暖、去飽和、亮度相近；
 * 實用工具沿用房子色本身）。`eyebrow` 是小字，同一個色壓在 cream 上讀不清楚
 * （陶土橘只有 2.96:1），所以改用壓暗到 4.5:1 的版本。
 *
 * eyebrow 是字面值而非在此計算，讓 src/data 維持純資料、可被任何 runtime 直接 import；
 * src/lib/__tests__/og.test.ts 會用 darkenUntilReadable() 反推驗證，值漂掉就會紅。
 */
export const CATEGORY_COLORS: Record<ToolCategory, { spine: string; eyebrow: string }> = {
  實用工具: { spine: '#D97757', eyebrow: '#a95d44' }, // 品牌陶土橘
  計算: { spine: '#5B7C99', eyebrow: '#567590' }, // 灰藍
  文字: { spine: '#6F8B5C', eyebrow: '#627a51' }, // 鼠尾草綠
  隨機決定: { spine: '#A8853A', eyebrow: '#8a6d30' }, // 黃銅
  遊戲: { spine: '#8A6A9B', eyebrow: '#846695' }, // 灰紫
  單車: { spine: '#2F6F62', eyebrow: '#2f6f62' }, // 深松綠，本來就過門檻
};
