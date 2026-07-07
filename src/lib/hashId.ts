// 雜湊與 UUID：全部走 Web Crypto 原生實作。
// 刻意不提供 MD5——它早已不該用於任何新用途，站上提供反而誤導。

export type HashAlgo = 'SHA-256' | 'SHA-1';

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashBufferHex(buf: ArrayBuffer, algo: HashAlgo): Promise<string> {
  return toHex(await crypto.subtle.digest(algo, buf));
}

export async function sha256Hex(text: string): Promise<string> {
  return hashBufferHex(new TextEncoder().encode(text).buffer as ArrayBuffer, 'SHA-256');
}

export async function sha1Hex(text: string): Promise<string> {
  return hashBufferHex(new TextEncoder().encode(text).buffer as ArrayBuffer, 'SHA-1');
}

export function uuidv4(): string {
  return crypto.randomUUID();
}

export function uuidBatch(count: number): string[] {
  const n = Math.min(1000, Math.max(1, Math.floor(count) || 1));
  return Array.from({ length: n }, () => uuidv4());
}
