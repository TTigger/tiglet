// JSON 工具核心：解析（含錯誤行列定位）、格式化/壓縮、樹狀模型。
// 行列定位不依賴引擎錯誤訊息（各版 V8 格式不一，甚至不給位置），
// 而是用自製的微型掃描器重新走一遍找出出錯處。

export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string; line: number | null; column: number | null };

// ---- 微型 JSON 掃描器：只求「第一個錯誤的位置」，不建值 ----
function scanErrorPos(text: string): number | null {
  let i = 0;
  const n = text.length;
  const fail = (pos: number): never => { throw pos; };
  const ws = () => { while (i < n && ' \t\n\r'.includes(text[i])) i++; };
  const lit = (s: string) => { if (text.startsWith(s, i)) i += s.length; else fail(i); };
  const str = () => {
    if (text[i] !== '"') fail(i);
    i++;
    while (i < n && text[i] !== '"') {
      if (text[i] === '\\') {
        i++;
        if ('"\\/bfnrt'.includes(text[i])) i++;
        else if (text[i] === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(i + 1, i + 5))) i += 5;
        else fail(i);
      } else if (text.charCodeAt(i) < 0x20) fail(i);
      else i++;
    }
    if (i >= n) fail(i);
    i++;
  };
  const num = () => {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m || m[0] === '') fail(i);
    i += m![0].length;
  };
  const value = (): void => {
    ws();
    if (i >= n) fail(i);
    const c = text[i];
    if (c === '{') {
      i++;
      ws();
      if (text[i] === '}') { i++; return; }
      for (;;) {
        ws();
        str();
        ws();
        if (text[i] !== ':') fail(i);
        i++;
        value();
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === '}') { i++; return; }
        fail(i);
      }
    } else if (c === '[') {
      i++;
      ws();
      if (text[i] === ']') { i++; return; }
      for (;;) {
        value();
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === ']') { i++; return; }
        fail(i);
      }
    } else if (c === '"') str();
    else if (c === 't') lit('true');
    else if (c === 'f') lit('false');
    else if (c === 'n') lit('null');
    else num();
  };
  try {
    value();
    ws();
    if (i < n) return i; // 值之後還有多餘內容
    return null;
  } catch (pos) {
    return typeof pos === 'number' ? pos : null;
  }
}

export function parseJson(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const pos = scanErrorPos(text);
    if (pos === null) return { ok: false, message, line: null, column: null };
    const before = text.slice(0, pos);
    const line = before.split('\n').length;
    const column = pos - before.lastIndexOf('\n');
    return { ok: false, message, line, column };
  }
}

export function formatJson(text: string, indent = 2): string {
  return JSON.stringify(JSON.parse(text), null, indent);
}

export function minifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

export type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonTreeNode {
  key: string; // 顯示用的鍵名（根為 '$'）
  path: string; // 完整 JSON path，如 $.a.b[2]
  type: JsonNodeType;
  preview: string; // 葉節點的值預覽（截斷）
  size?: number; // object 鍵數 / array 長度
  children?: JsonTreeNode[];
}

const PREVIEW_MAX = 40;

function previewOf(value: unknown): string {
  const raw = JSON.stringify(value) ?? 'null';
  return raw.length > PREVIEW_MAX ? `${raw.slice(0, PREVIEW_MAX)}…` : raw;
}

export function buildJsonTree(value: unknown, key = '$', path = '$'): JsonTreeNode {
  if (Array.isArray(value)) {
    return {
      key,
      path,
      type: 'array',
      preview: `[${value.length}]`,
      size: value.length,
      children: value.map((v, i) => buildJsonTree(v, `[${i}]`, `${path}[${i}]`)),
    };
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return {
      key,
      path,
      type: 'object',
      preview: `{${entries.length}}`,
      size: entries.length,
      children: entries.map(([k, v]) => buildJsonTree(v, k, `${path}.${k}`)),
    };
  }
  const type: JsonNodeType = value === null ? 'null' : (typeof value as 'string' | 'number' | 'boolean');
  return { key, path, type, preview: previewOf(value) };
}
