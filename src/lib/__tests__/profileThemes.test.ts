import { describe, expect, it } from 'vitest';
import { THEMES, THEME_EN } from '../profileThemes';
import { contrastRatio, relativeLuminance } from '../contrast';

// 出圖主題的可讀性守門：新主題（尤其深色）不能比現有主題最低水準更差。
// 門檻取自現況實測的下限（環義粉 muted 4.49、環法黃 accent 2.23），
// 不是理想值 —— 收緊門檻前要先動既有主題。

describe('profile themes', () => {
  it('每個主題都有完整色票與英文名', () => {
    for (const th of THEMES) {
      expect(th.id).toMatch(/^[a-z]+$/);
      expect(th.label.length).toBeGreaterThan(0);
      expect(THEME_EN[th.id], `THEME_EN 缺 ${th.id}`).toBeTruthy();
      for (const c of [th.bg, th.ink, th.muted, th.grid, th.accent]) {
        expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('id 不重複', () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('標題與座標文字在底色上讀得清楚', () => {
    for (const th of THEMES) {
      expect(contrastRatio(th.ink, th.bg), `${th.id} ink`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(th.muted, th.bg), `${th.id} muted`).toBeGreaterThanOrEqual(4.4);
      expect(contrastRatio(th.accent, th.bg), `${th.id} accent`).toBeGreaterThanOrEqual(2.2);
    }
  });

  it('格線壓得住但看得見（比底色明顯、比正文淡）', () => {
    for (const th of THEMES) {
      const grid = contrastRatio(th.grid, th.bg);
      expect(grid, `${th.id} grid too faint`).toBeGreaterThanOrEqual(1.2);
      expect(grid, `${th.id} grid too loud`).toBeLessThan(contrastRatio(th.muted, th.bg));
    }
  });

  it('至少有一個深色主題（透明匯出疊深色背景時字才看得見）', () => {
    const dark = THEMES.filter((t) => relativeLuminance(t.bg) < 0.2);
    expect(dark.length).toBeGreaterThanOrEqual(1);
    for (const th of dark) {
      // 深色主題的墨色必須是淺色，去背 PNG 疊在深色簡報／限動上才可讀
      expect(relativeLuminance(th.ink), `${th.id} ink 應為淺色`).toBeGreaterThan(0.7);
    }
  });
});
