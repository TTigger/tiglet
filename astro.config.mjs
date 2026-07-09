import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://tiglet.vercel.app',
  integrations: [
    react(),
    sitemap({
      // 雙語 hreflang：sitemap 內為 / 與 /en/ 互相標注 alternate
      i18n: {
        defaultLocale: 'zh',
        locales: { zh: 'zh-Hant', en: 'en' },
      },
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      // share_target 收檔案需要攔 POST → 自訂 SW（src/sw.ts）；
      // 原 generateSW 的 runtimeCaching 已 1:1 搬進去
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Tiglet',
        short_name: 'Tiglet',
        description: '一組乾淨、免登入的瀏覽器小工具。',
        theme_color: '#D97757',
        background_color: '#FAF9F5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        // 系統分享選單：其他 app 的 GPX/FIT/TCX 可直接「分享到 Tiglet」
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'file',
                accept: ['.gpx', '.fit', '.tcx', 'application/gpx+xml', 'application/xml', 'application/octet-stream'],
              },
            ],
          },
        },
        // 檔案關聯：作業系統可用 Tiglet 直接開啟軌跡檔
        file_handlers: [
          {
            action: '/tools/stage-profile',
            accept: {
              'application/gpx+xml': ['.gpx'],
              'application/xml': ['.tcx'],
              'application/octet-stream': ['.fit'],
            },
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // 分享卡只有 FB／X／LINE 的 crawler 會抓，使用者永遠不會開。
        // 不排除的話這 66 張（約 2.3MB）會被塞進 service worker 預快取。
        globIgnores: ['og/**'],
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
