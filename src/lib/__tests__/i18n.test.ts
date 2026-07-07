import { describe, it, expect } from 'vitest';
import { localeFromPath, switchLocalePath, CATEGORY_EN, toolTitle, toolDescription } from '../i18n';
import { tools, CATEGORY_ORDER } from '../../data/tools';

describe('localeFromPath', () => {
  it('detects en under the /en prefix', () => {
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/en/')).toBe('en');
    expect(localeFromPath('/en/tools/timer')).toBe('en');
  });

  it('everything else is zh (含 /encoder 這種以 en 開頭的字)', () => {
    expect(localeFromPath('/')).toBe('zh');
    expect(localeFromPath('/tools/encoder')).toBe('zh');
    expect(localeFromPath('/english-things')).toBe('zh');
  });
});

describe('switchLocalePath', () => {
  it('zh → en adds the prefix', () => {
    expect(switchLocalePath('/', 'en')).toBe('/en/');
    expect(switchLocalePath('/tools/timer', 'en')).toBe('/en/tools/timer');
  });

  it('en → zh strips the prefix', () => {
    expect(switchLocalePath('/en/', 'zh')).toBe('/');
    expect(switchLocalePath('/en/tools/timer', 'zh')).toBe('/tools/timer');
  });

  it('is idempotent when already in the target locale', () => {
    expect(switchLocalePath('/en/tools/timer', 'en')).toBe('/en/tools/timer');
    expect(switchLocalePath('/tools/timer', 'zh')).toBe('/tools/timer');
  });
});

describe('bilingual tool registry', () => {
  it('every tool has an English title and description', () => {
    for (const t of tools) {
      expect(toolTitle(t, 'en'), t.id).toBeTruthy();
      expect(toolDescription(t, 'en'), t.id).toBeTruthy();
      // 英文描述一定要真的翻譯過（標題如 2048 可中英同名）
      expect(toolDescription(t, 'en')).not.toBe(toolDescription(t, 'zh'));
    }
  });

  it('zh accessors return the original fields', () => {
    const t = tools[0];
    expect(toolTitle(t, 'zh')).toBe(t.title);
    expect(toolDescription(t, 'zh')).toBe(t.description);
  });

  it('every category has an English name', () => {
    for (const c of CATEGORY_ORDER) {
      expect(CATEGORY_EN[c], c).toBeTruthy();
    }
  });
});
