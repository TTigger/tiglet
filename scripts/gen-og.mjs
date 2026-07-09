// 產生分享卡（Open Graph）圖：每個工具、每個語系一張，加上首頁兩張。
//
// 手動執行：`npm run og`。刻意不掛在 build 上 —— 卡片只在新增或改名工具時才變，
// 而 build 時抓字型／生圖多一層會在部署時才爆。產物 commit 進 public/og/，
// src/lib/__tests__/og.test.ts 守住「每個工具都有卡」。
//
// 字型（CJK 全字集，十幾 MB）與 emoji 快取放在 scripts/.cache/，已 gitignore。
// satori 只吃 TTF/OTF，不吃 woff2；Google Fonts 要用舊版 UA 才會回 TTF。

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tools } from '../src/data/tools.ts';
import { CATEGORY_EN } from '../src/lib/i18n.ts';
import { CATEGORY_COLORS, CARD_BG } from '../src/data/categories.ts';
import { ogImagePath } from '../src/lib/og.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(ROOT, 'scripts/.cache');
const PUBLIC = resolve(ROOT, 'public');

const W = 1200;
const H = 630;
const INK = '#1A1A18';
const MUTED = '#6B6B66';
const EDGE = '#E8E4D9';
const BRAND = '#D97757';
const SLOT = 300;

const TWEMOJI = '15.1.0'; // 釘住版本，避免上游改圖讓輸出漂移

const FONTS = [
  { name: 'Newsreader', family: 'Newsreader', weight: 600 },
  { name: 'NotoSerifTC', family: 'Noto Serif TC', weight: 600 },
  { name: 'Inter', family: 'Inter', weight: 500 },
  { name: 'NotoSansTC', family: 'Noto Sans TC', weight: 500 },
];

const DISPLAY = 'Newsreader, Noto Serif TC';
const UTILITY = 'Inter, Noto Sans TC';

async function cached(key, fetchIt) {
  const file = resolve(CACHE, key);
  if (existsSync(file)) return readFile(file);
  await mkdir(dirname(file), { recursive: true });
  const data = await fetchIt();
  await writeFile(file, data);
  return data;
}

/** Google Fonts 的 CSS API 對舊 UA 才回 TTF；先取 CSS 再抓裡面的直連。 */
async function loadFont({ name, family, weight }) {
  return cached(`fonts/${name}-${weight}.ttf`, async () => {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}`;
    const css = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/4.0' } }).then((r) => r.text());
    const ttf = css.match(/https:\/\/[^)]+\.(?:ttf|otf)/)?.[0];
    if (!ttf) throw new Error(`no TTF for ${family} ${weight} — Google Fonts may have changed its UA sniffing`);
    const buf = Buffer.from(await fetch(ttf).then((r) => r.arrayBuffer()));
    // TTF/OTF magic：00 01 00 00（TrueType）或 "OTTO"（CFF）
    const magic = buf.subarray(0, 4).toString('hex');
    if (magic !== '00010000' && buf.subarray(0, 4).toString() !== 'OTTO') {
      throw new Error(`${family} ${weight} is not a TTF/OTF (magic ${magic}) — satori cannot read woff2`);
    }
    console.log(`  font ${family} ${weight}  ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
    return buf;
  });
}

/** twemoji 檔名是 codepoint，要去掉變體選擇符（U+FE0F）與 ZWJ。 */
const codepoints = (emoji) =>
  [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((c) => c !== 'fe0f' && c !== '200d')
    .join('-');

async function emojiDataUri(emoji) {
  const cp = codepoints(emoji);
  const svg = await cached(`emoji/${cp}.svg`, async () => {
    const url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI}/assets/svg/${cp}.svg`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`no twemoji for ${emoji} (U+${cp}): ${res.status} ${url}`);
    return Buffer.from(await res.text());
  });
  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
}

const h = (type, props = {}, ...children) => ({ type, props: { ...props, children: children.flat().filter(Boolean) } });

/** 標記直接畫，不嵌 public/icon.svg —— 那支 SVG 的 T 是 <text>，resvg 沒有 Georgia，字會消失。 */
const logoMark = (size) =>
  h(
    'div',
    { style: { width: size, height: size, borderRadius: size * 0.24, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    h('div', { style: { display: 'flex', fontFamily: 'Newsreader', fontSize: size * 0.72, fontWeight: 600, color: CARD_BG, marginTop: -size * 0.06 } }, 'T')
  );

/** 卡片上的描述取到第一個句號為止 —— 首頁格子需要完整句子，分享卡不需要。 */
const firstSentence = (text) => {
  const end = text.search(/[。.]/);
  return end === -1 ? text : text.slice(0, end + 1);
};

function card({ spine, eyebrow, eyebrowColor, title, desc, hero, locale }) {
  return h(
    'div',
    { style: { width: W, height: H, display: 'flex', background: CARD_BG } },
    // 書脊：分類色，像工具箱抽屜裡的檔案側標
    h('div', { style: { width: 20, height: H, background: spine, display: 'flex' } }),
    h(
      'div',
      { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '70px 72px 56px 76px' } },
      h(
        'div',
        { style: { flex: 1, display: 'flex', alignItems: 'center' } },
        h(
          'div',
          { style: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 660 } },
          h('div', { style: { display: 'flex', fontFamily: UTILITY, fontSize: 26, fontWeight: 500, letterSpacing: locale === 'en' ? 4 : 6, color: eyebrowColor, textTransform: locale === 'en' ? 'uppercase' : 'none' } }, eyebrow),
          h('div', { style: { display: 'flex', marginTop: 24, fontFamily: DISPLAY, fontSize: locale === 'en' ? 74 : 86, fontWeight: 600, color: INK, lineHeight: 1.14, letterSpacing: locale === 'en' ? -1 : 1 } }, title),
          h('div', { style: { display: 'flex', marginTop: 26, fontFamily: UTILITY, fontSize: 30, fontWeight: 500, color: MUTED, lineHeight: 1.5 } }, desc)
        ),
        // emoji 自帶的配色不歸我們管；淡染的圓角凹槽把它收成「插在插槽裡的工具」
        h(
          'div',
          { style: { width: SLOT, height: SLOT, marginLeft: 40, flexShrink: 0, borderRadius: SLOT * 0.24, background: `${spine}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          hero
        )
      ),
      h('div', { style: { display: 'flex', height: 1, background: EDGE, marginBottom: 30 } }),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center' } },
        logoMark(38),
        h('div', { style: { display: 'flex', marginLeft: 16, fontFamily: DISPLAY, fontSize: 30, fontWeight: 600, color: INK } }, 'Tiglet'),
        h('div', { style: { flex: 1, display: 'flex' } }),
        h('div', { style: { display: 'flex', fontFamily: UTILITY, fontSize: 24, fontWeight: 500, color: MUTED } }, 'tiglet.vercel.app')
      )
    )
  );
}

async function render(element, fonts, outPath) {
  const svg = await satori(element, { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, png);
  return png.length;
}

const HOME = {
  zh: { title: 'Tiglet', desc: '一組乾淨、免登入的瀏覽器小工具。', eyebrow: '小工具站' },
  en: { title: 'Tiglet', desc: 'A clean, no-login collection of small browser tools.', eyebrow: 'Browser tools' },
};

console.log('loading fonts (cached in scripts/.cache)…');
const fonts = await Promise.all(
  FONTS.map(async (f) => ({ name: f.family, data: await loadFont(f), weight: f.weight, style: 'normal' }))
);

let count = 0;
let bytes = 0;

for (const locale of ['zh', 'en']) {
  for (const tool of tools) {
    const { spine, eyebrow } = CATEGORY_COLORS[tool.category];
    const element = card({
      locale,
      spine,
      eyebrowColor: eyebrow,
      eyebrow: locale === 'en' ? CATEGORY_EN[tool.category] : tool.category,
      title: locale === 'en' ? tool.titleEn : tool.title,
      desc: firstSentence(locale === 'en' ? tool.descriptionEn : tool.description),
      hero: h('img', { src: await emojiDataUri(tool.icon), width: 176, height: 176 }),
    });
    bytes += await render(element, fonts, resolve(PUBLIC, `.${ogImagePath(tool.id, locale)}`));
    count++;
  }

  const home = HOME[locale];
  bytes += await render(
    card({
      locale,
      spine: BRAND,
      eyebrowColor: CATEGORY_COLORS['實用工具'].eyebrow,
      eyebrow: home.eyebrow,
      title: home.title,
      desc: home.desc,
      hero: logoMark(176),
    }),
    fonts,
    resolve(PUBLIC, `.${ogImagePath(undefined, locale)}`)
  );
  count++;
}

console.log(`generated ${count} cards, ${(bytes / 1024 / 1024).toFixed(2)} MB total`);
