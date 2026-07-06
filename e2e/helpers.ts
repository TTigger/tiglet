import type { Page } from '@playwright/test';

// Astro 的島嶼 hydrate 完成後會移除 <astro-island> 上的 ssr 屬性。
// 互動（fill / click / 快捷鍵）前先等所有島嶼就緒，
// 否則 hydration 前發出的事件會被 React 靜默吃掉。
export async function waitForIslands(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('astro-island')).every((el) => !el.hasAttribute('ssr'))
  );
}
