import { describe, it, expect } from 'vitest';
import { extractOutline, mdStats } from '../markdown';

const SAMPLE = `# 標題一
內文 [連結](https://a.b) 與 ![圖](img.png)

## 子標題 A
\`\`\`js
# 這是程式碼註解，不是標題
console.log(1)
\`\`\`

### 更深一層

## 子標題 B

# 標題二
`;

describe('extractOutline', () => {
  const outline = extractOutline(SAMPLE);

  it('builds a nested tree by heading level', () => {
    expect(outline).toHaveLength(2); // 兩個 H1
    expect(outline[0].text).toBe('標題一');
    expect(outline[0].children).toHaveLength(2); // 子標題 A、B
    expect(outline[0].children[0].children[0].text).toBe('更深一層');
    expect(outline[1].text).toBe('標題二');
  });

  it('records level and sequential index (for scroll targeting)', () => {
    expect(outline[0].level).toBe(1);
    expect(outline[0].index).toBe(0);
    expect(outline[0].children[0].index).toBe(1);
    expect(outline[1].index).toBe(4);
  });

  it('ignores headings inside fenced code blocks', () => {
    const all = JSON.stringify(outline);
    expect(all).not.toContain('程式碼註解');
  });

  it('handles a document starting at h2 (orphan levels)', () => {
    const o = extractOutline('## 直接從 H2 開始\n### 子項');
    expect(o).toHaveLength(1);
    expect(o[0].text).toBe('直接從 H2 開始');
    expect(o[0].children[0].text).toBe('子項');
  });

  it('empty markdown → empty outline', () => {
    expect(extractOutline('')).toEqual([]);
  });
});

describe('mdStats', () => {
  const s = mdStats(SAMPLE);

  it('counts headings, links, images, code blocks', () => {
    expect(s.headings).toBe(5);
    expect(s.links).toBe(1);
    expect(s.images).toBe(1);
    expect(s.codeBlocks).toBe(1);
  });

  it('image is not double-counted as a link', () => {
    const t = mdStats('![img](a.png) [link](b)');
    expect(t.images).toBe(1);
    expect(t.links).toBe(1);
  });
});
