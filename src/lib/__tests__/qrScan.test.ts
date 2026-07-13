import { describe, expect, it } from 'vitest';
import { classifyQrContent } from '../qrScan';
import { wifiQr, vcardQr } from '../qrFormats';

describe('classifyQrContent', () => {
  it('http/https 連結 → url', () => {
    expect(classifyQrContent('https://tiglet.vercel.app/tools')).toEqual({ type: 'url', url: 'https://tiglet.vercel.app/tools' });
    expect(classifyQrContent('HTTP://EXAMPLE.COM')).toMatchObject({ type: 'url' });
    // javascript: 之類的不當連結一律當純文字，不要給可點的 <a>
    expect(classifyQrContent('javascript:alert(1)')).toEqual({ type: 'text' });
    expect(classifyQrContent('ftp://example.com')).toEqual({ type: 'text' });
  });

  it('WIFI: payload → 解析 ssid / 密碼 / 加密 / 隱藏', () => {
    expect(classifyQrContent('WIFI:T:WPA;S:MyHome;P:secret123;;')).toEqual({
      type: 'wifi',
      ssid: 'MyHome',
      password: 'secret123',
      security: 'WPA',
      hidden: false,
    });
    expect(classifyQrContent('WIFI:T:nopass;S:Cafe;H:true;;')).toMatchObject({ type: 'wifi', ssid: 'Cafe', password: '', hidden: true });
  });

  it('WiFi 與產生器互為往返：跳脫字元要正確解回來', () => {
    const payload = wifiQr({ ssid: 'A;B,C:D"E\\F', password: 'p;w,d', security: 'WPA' });
    const parsed = classifyQrContent(payload);
    expect(parsed).toEqual({ type: 'wifi', ssid: 'A;B,C:D"E\\F', password: 'p;w,d', security: 'WPA', hidden: false });
  });

  it('vCard payload → 解析常用欄位', () => {
    const payload = vcardQr({ name: '王小明', phone: '0912345678', email: 'ming@example.com', org: 'Tiglet', title: '工程師', url: 'https://example.com' });
    expect(classifyQrContent(payload)).toEqual({
      type: 'vcard',
      name: '王小明',
      phone: '0912345678',
      email: 'ming@example.com',
      org: 'Tiglet',
      title: '工程師',
      url: 'https://example.com',
    });
  });

  it('vCard 與產生器互為往返：跳脫的逗號分號換行解得回來', () => {
    const payload = vcardQr({ name: 'Wang, Xiao;Ming', org: 'A\nB' });
    expect(classifyQrContent(payload)).toMatchObject({ type: 'vcard', name: 'Wang, Xiao;Ming', org: 'A\nB' });
  });

  it('vCard 缺欄位就略過，CRLF 與大小寫容忍', () => {
    const raw = 'begin:vcard\r\nversion:3.0\r\nfn:Amy\r\ntel:123\r\nend:vcard';
    expect(classifyQrContent(raw)).toEqual({ type: 'vcard', name: 'Amy', phone: '123', email: '', org: '', title: '', url: '' });
  });

  it('其他內容 → text', () => {
    expect(classifyQrContent('hello world')).toEqual({ type: 'text' });
    expect(classifyQrContent('')).toEqual({ type: 'text' });
    expect(classifyQrContent('WIFI:')).toEqual({ type: 'text' }); // 缺 SSID 的殘缺 payload
  });
});
