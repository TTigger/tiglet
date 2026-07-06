// Markdown 結構分析：ATX 標題大綱樹與文件統計。
// 純文字解析、零依賴——渲染交給 UI 層動態載入的 marked + DOMPurify。

export interface OutlineNode {
  level: number; // 1–6
  text: string;
  index: number; // 全文第幾個標題（0 起算），供預覽捲動定位
  children: OutlineNode[];
}

interface FlatHeading {
  level: number;
  text: string;
  index: number;
}

function flatHeadings(md: string): FlatHeading[] {
  const out: FlatHeading[] = [];
  let inFence = false;
  let index = 0;
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), index: index++ });
  }
  return out;
}

export function extractOutline(md: string): OutlineNode[] {
  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  for (const h of flatHeadings(md)) {
    const node: OutlineNode = { ...h, children: [] };
    while (stack.length && stack[stack.length - 1].level >= h.level) stack.pop();
    if (stack.length === 0) roots.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return roots;
}

export interface MdStats {
  headings: number;
  links: number;
  images: number;
  codeBlocks: number;
}

export function mdStats(md: string): MdStats {
  const headings = flatHeadings(md).length;
  const images = (md.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length;
  // 連結要先扣掉圖片語法（![...](...) 也符合 [...](...)）
  const linksIncludingImages = (md.match(/\[[^\]]*\]\([^)]*\)/g) ?? []).length;
  const codeBlocks = Math.floor((md.match(/^\s*(```|~~~)/gm) ?? []).length / 2);
  return { headings, links: linksIncludingImages - images, images, codeBlocks };
}
