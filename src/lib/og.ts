import type { Locale } from './i18n';

/**
 * 分享卡圖的公開路徑。每個工具、每個語系一張，首頁用 `home`。
 * 圖由 `npm run og` 產生並 commit 進 public/；src/lib/__tests__/og.test.ts 守住覆蓋率。
 */
export function ogImagePath(toolId: string | undefined, locale: Locale): string {
  return `/og/${locale}/${toolId ?? 'home'}.png`;
}
