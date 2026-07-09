import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ogImagePath } from '../og';
import { tools } from '../../data/tools';
import { CARD_BG, CATEGORY_COLORS } from '../../data/categories';
import { contrastRatio, darkenUntilReadable } from '../contrast';
import type { Locale } from '../i18n';

const LOCALES: Locale[] = ['zh', 'en'];

describe('ogImagePath', () => {
  it('namespaces a tool card by locale', () => {
    expect(ogImagePath('url-audit', 'zh')).toBe('/og/zh/url-audit.png');
    expect(ogImagePath('url-audit', 'en')).toBe('/og/en/url-audit.png');
  });

  it('falls back to the home card when there is no tool', () => {
    expect(ogImagePath(undefined, 'zh')).toBe('/og/zh/home.png');
    expect(ogImagePath(undefined, 'en')).toBe('/og/en/home.png');
  });
});

describe('category colours', () => {
  it('covers every category a tool actually uses', () => {
    for (const tool of tools) {
      expect(CATEGORY_COLORS[tool.category], tool.category).toBeDefined();
    }
  });

  it('keeps every eyebrow readable on the cream card background', () => {
    for (const [cat, { eyebrow }] of Object.entries(CATEGORY_COLORS)) {
      expect(contrastRatio(eyebrow, CARD_BG), `${cat} ${eyebrow}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  // eyebrow 是字面值，這裡把它鎖回 darkenUntilReadable() 的輸出，避免有人手改後偷偷偏離
  it('derives every eyebrow from its spine colour', () => {
    for (const [cat, { spine, eyebrow }] of Object.entries(CATEGORY_COLORS)) {
      expect(darkenUntilReadable(spine, CARD_BG), cat).toBe(eyebrow);
    }
  });
});

// 生圖是手動步驟（npm run og）。新增工具卻忘了重生圖時，這裡要紅，
// 而不是等到分享出去才發現卡片是 404。
describe('generated OG images', () => {
  const publicDir = resolve(import.meta.dirname, '../../../public');

  it('has a card for every tool in every locale', () => {
    const missing: string[] = [];
    for (const tool of tools) {
      for (const locale of LOCALES) {
        const rel = ogImagePath(tool.id, locale);
        if (!existsSync(resolve(publicDir, `.${rel}`))) missing.push(rel);
      }
    }
    expect(missing, `run \`npm run og\` to generate: ${missing.join(', ')}`).toEqual([]);
  });

  it('has a home card in every locale', () => {
    for (const locale of LOCALES) {
      expect(existsSync(resolve(publicDir, `.${ogImagePath(undefined, locale)}`)), locale).toBe(true);
    }
  });
});
