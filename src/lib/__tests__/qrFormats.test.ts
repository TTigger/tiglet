import { describe, it, expect } from 'vitest';
import { wifiQr, vcardQr } from '../qrFormats';

describe('wifiQr', () => {
  it('builds a standard WPA payload', () => {
    expect(wifiQr({ ssid: 'HomeWiFi', password: 'secret123', security: 'WPA' })).toBe(
      'WIFI:T:WPA;S:HomeWiFi;P:secret123;;'
    );
  });

  it('escapes the five special characters in SSID and password', () => {
    expect(wifiQr({ ssid: 'a;b', password: 'p:w,d"x\\y', security: 'WPA' })).toBe(
      'WIFI:T:WPA;S:a\\;b;P:p\\:w\\,d\\"x\\\\y;;'
    );
  });

  it('open network omits the password field', () => {
    expect(wifiQr({ ssid: 'Cafe', password: '', security: 'nopass' })).toBe('WIFI:T:nopass;S:Cafe;;');
  });

  it('hidden network adds H:true', () => {
    expect(wifiQr({ ssid: 'X', password: 'y', security: 'WEP', hidden: true })).toBe('WIFI:T:WEP;S:X;P:y;H:true;;');
  });
});

describe('vcardQr', () => {
  it('builds vCard 3.0 with only the provided fields', () => {
    const v = vcardQr({ name: '王小明', phone: '0912345678', email: 'ming@example.com' });
    expect(v).toBe('BEGIN:VCARD\nVERSION:3.0\nFN:王小明\nTEL:0912345678\nEMAIL:ming@example.com\nEND:VCARD');
  });

  it('includes org / title / url when given', () => {
    const v = vcardQr({ name: 'A', org: 'Tiglet', title: '工程師', url: 'https://tiglet.vercel.app' });
    expect(v).toContain('ORG:Tiglet');
    expect(v).toContain('TITLE:工程師');
    expect(v).toContain('URL:https://tiglet.vercel.app');
  });

  it('escapes commas, semicolons, backslashes and newlines', () => {
    const v = vcardQr({ name: 'a;b,c\\d\ne' });
    expect(v).toContain('FN:a\\;b\\,c\\\\d\\ne');
  });

  it('empty name still yields a valid shell', () => {
    expect(vcardQr({ name: '' })).toBe('BEGIN:VCARD\nVERSION:3.0\nEND:VCARD');
  });
});
