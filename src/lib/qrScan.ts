// QR 掃描結果的內容分類與解析：qrFormats.ts 產生器的反向操作。
// 純函式；解碼本身（影像 → 字串）由 jsQR 在元件層處理。

export type QrContent =
  | { type: 'url'; url: string }
  | { type: 'wifi'; ssid: string; password: string; security: string; hidden: boolean }
  | { type: 'vcard'; name: string; phone: string; email: string; org: string; title: string; url: string }
  | { type: 'text' };

// WIFI: 規格：欄位以未跳脫的 ; 分隔，值內的 \ ; , " : 以反斜線跳脫
function splitWifiFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  let key = '';
  let buf = '';
  let readingKey = true;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && i + 1 < body.length) {
      buf += body[i + 1];
      i++;
    } else if (readingKey && ch === ':') {
      key = buf;
      buf = '';
      readingKey = false;
    } else if (!readingKey && ch === ';') {
      fields.set(key, buf);
      buf = '';
      key = '';
      readingKey = true;
    } else {
      buf += ch;
    }
  }
  if (key) fields.set(key, buf);
  return fields;
}

function unescapeVcard(s: string): string {
  return s.replace(/\\(.)/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));
}

export function classifyQrContent(text: string): QrContent {
  if (/^https?:\/\/\S+$/i.test(text.trim())) return { type: 'url', url: text.trim() };

  if (/^WIFI:/i.test(text)) {
    const fields = splitWifiFields(text.slice(5));
    const ssid = fields.get('S') ?? '';
    if (ssid) {
      return {
        type: 'wifi',
        ssid,
        password: fields.get('P') ?? '',
        security: fields.get('T') ?? '',
        hidden: (fields.get('H') ?? '').toLowerCase() === 'true',
      };
    }
  }

  if (/^BEGIN:VCARD/i.test(text.trim())) {
    // 展開 RFC 摺行（換行後接空白 = 前行延續），再逐行取欄位
    const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
    const field = (key: string) => {
      const m = unfolded.match(new RegExp(`^${key}(?:;[^:\\n]*)?:(.*)$`, 'im'));
      return m ? unescapeVcard(m[1].trim()) : '';
    };
    return {
      type: 'vcard',
      name: field('FN'),
      phone: field('TEL'),
      email: field('EMAIL'),
      org: field('ORG'),
      title: field('TITLE'),
      url: field('URL'),
    };
  }

  return { type: 'text' };
}
