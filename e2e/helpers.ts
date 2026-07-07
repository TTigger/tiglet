import type { Page } from '@playwright/test';

// Astro 的島嶼 hydrate 完成後會移除 <astro-island> 上的 ssr 屬性。
// 互動（fill / click / 快捷鍵）前先等所有島嶼就緒，
// 否則 hydration 前發出的事件會被 React 靜默吃掉。
// 注意：client:visible 島嶼在滾進視窗前不會 hydrate——視窗外的不等，
// 否則含折疊下方島嶼的頁面會永遠等不完。
export async function waitForIslands(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('astro-island')).every((el) => {
      if (!el.hasAttribute('ssr')) return true;
      const probe = el.firstElementChild ?? el;
      const r = probe.getBoundingClientRect();
      const inView = r.bottom > 0 && r.top < window.innerHeight && r.height > 0;
      return !inView;
    })
  );
}
