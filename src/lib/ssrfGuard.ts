// SSRF 防護：判斷一個主機名／IP 是否指向內網或保留位址，
// 給抓取代理函式在對外連線前擋掉。純函式，可單元測試。

// 私有／保留 IPv4 網段
function isPrivateIpv4(ip: string): boolean {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const p = m.slice(1).map(Number);
  if (p.some((n) => n > 255)) return false;
  const [a, b] = p;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local 169.254.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast / reserved 224+
  return false;
}

// 私有／保留 IPv6（含 IPv4-mapped）
function isPrivateIpv6(ip: string): boolean {
  const s = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (s === '::1' || s === '::') return true; // loopback / unspecified
  if (s.startsWith('fe80')) return true; // link-local
  if (s.startsWith('fc') || s.startsWith('fd')) return true; // unique local fc00::/7
  // IPv4-mapped ::ffff:a.b.c.d
  const mapped = s.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

export function isPrivateIp(ip: string): boolean {
  return isPrivateIpv4(ip) || isPrivateIpv6(ip);
}

// 主機名層級的阻擋（在 DNS 解析前的第一道；解析後仍要用 isPrivateIp 複查）
export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.endsWith('.local') || h.endsWith('.internal')) return true;
  // 直接是 IP 字面值就用 IP 規則判斷
  if (/^[\d.]+$/.test(h) || h.includes(':')) return isPrivateIp(h);
  return false;
}

// 對外抓取前的 URL 總體檢查：協定＋主機名。回傳 null 表示通過，否則回傳拒絕原因鍵。
export function validateFetchUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: 'invalid' | 'scheme' | 'blocked' } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, reason: 'scheme' };
  if (isBlockedHostname(url.hostname)) return { ok: false, reason: 'blocked' };
  return { ok: true, url };
}
