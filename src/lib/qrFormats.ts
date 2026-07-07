// QR 標準 payload 產生器：WiFi（WIFI: scheme）與名片（vCard 3.0）。

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export interface WifiInput {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden?: boolean;
}

// WIFI: 規格的特殊字元 \ ; , " : 要用反斜線跳脫
function escapeWifi(s: string): string {
  return s.replace(/([\\;,":])/g, '\\$1');
}

export function wifiQr({ ssid, password, security, hidden = false }: WifiInput): string {
  const parts = [`T:${security}`, `S:${escapeWifi(ssid)}`];
  if (security !== 'nopass' && password) parts.push(`P:${escapeWifi(password)}`);
  if (hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

export interface VcardInput {
  name: string;
  phone?: string;
  email?: string;
  org?: string;
  title?: string;
  url?: string;
}

// vCard 的值要跳脫 \ ; , 與換行
function escapeVcard(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function vcardQr(input: VcardInput): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const push = (key: string, value?: string) => {
    if (value?.trim()) lines.push(`${key}:${escapeVcard(value.trim())}`);
  };
  push('FN', input.name);
  push('TEL', input.phone);
  push('EMAIL', input.email);
  push('ORG', input.org);
  push('TITLE', input.title);
  push('URL', input.url);
  lines.push('END:VCARD');
  return lines.join('\n');
}
