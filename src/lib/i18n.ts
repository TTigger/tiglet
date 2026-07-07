// i18n 基礎設施：語系判定、路徑對映與工具註冊表的雙語存取。
// 原則：中文網址不變（無前綴），英文一律掛在 /en/ 之下。

import type { Tool, ToolCategory } from '../data/tools';

export type Locale = 'zh' | 'en';

export function localeFromPath(path: string): Locale {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'zh';
}

export function switchLocalePath(path: string, to: Locale): string {
  const cur = localeFromPath(path);
  if (cur === to) return path;
  if (to === 'en') return path === '/' ? '/en/' : `/en${path}`;
  const stripped = path.replace(/^\/en\/?/, '/');
  return stripped === '' ? '/' : stripped;
}

/** 工具頁在指定語系下的路徑 */
export function toolPath(tool: Tool, locale: Locale): string {
  return locale === 'en' ? `/en${tool.path}` : tool.path;
}

export const CATEGORY_EN: Record<ToolCategory, string> = {
  計算: 'Calculators',
  遊戲: 'Games',
  隨機決定: 'Random',
  實用工具: 'Utilities',
  單車: 'Cycling',
  文字: 'Text',
};

export function categoryLabel(cat: ToolCategory, locale: Locale): string {
  return locale === 'en' ? CATEGORY_EN[cat] : cat;
}

export function toolTitle(tool: Tool, locale: Locale): string {
  return locale === 'en' ? tool.titleEn : tool.title;
}

export function toolDescription(tool: Tool, locale: Locale): string {
  return locale === 'en' ? tool.descriptionEn : tool.description;
}
