/// <reference lib="webworker" />
// 自訂 Service Worker（injectManifest 模式）。
// 換掉 generateSW 的唯一原因：share_target 收檔案需要攔截 POST——
// 其餘快取策略 1:1 複刻原本 astro.config 裡的 workbox 設定。
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// registerType: 'autoUpdate' 的對應行為
self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 匯率 API：正常走網路、失敗退快取（配合工具內的三層備援）
registerRoute(
  ({ url }) => url.origin === 'https://open.er-api.com',
  new NetworkFirst({
    cacheName: 'exchange-rates',
    plugins: [new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

// Google Fonts：離線時退快取，避免字型跳動
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  })
);

// share_target：其他 app「分享到 Tiglet」的檔案由這裡接——
// 存進 Cache 後 303 轉向剖面圖頁，頁面端讀出檔案即開始解析
const SHARED_CACHE = 'tiglet-shared';
const SHARED_KEY = '/shared-file';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        try {
          const form = await event.request.formData();
          const file = form.get('file');
          if (file instanceof File) {
            const cache = await caches.open(SHARED_CACHE);
            await cache.put(
              SHARED_KEY,
              new Response(file, { headers: { 'x-file-name': encodeURIComponent(file.name) } })
            );
          }
        } catch {
          /* 表單壞掉照樣導頁，頁面端顯示一般錯誤 */
        }
        return Response.redirect('/tools/stage-profile?shared=1', 303);
      })()
    );
  }
});
