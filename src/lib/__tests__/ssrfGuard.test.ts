import { describe, it, expect } from 'vitest';
import { isPrivateIp, isBlockedHostname, validateFetchUrl } from '../ssrfGuard';

describe('isPrivateIp', () => {
  it('flags private / reserved IPv4', () => {
    for (const ip of ['10.0.0.1', '127.0.0.1', '192.168.1.1', '172.16.5.5', '172.31.255.255', '169.254.1.1', '100.64.0.1', '0.0.0.0', '224.0.0.1']) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it('allows public IPv4', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '104.16.0.1', '172.15.0.1', '172.32.0.1']) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it('flags private / loopback IPv6 incl. IPv4-mapped', () => {
    for (const ip of ['::1', '::', 'fe80::1', 'fc00::1', 'fd12::9', '::ffff:127.0.0.1', '::ffff:10.0.0.1']) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    expect(isPrivateIp('2606:4700::1111')).toBe(false);
  });
});

describe('isBlockedHostname', () => {
  it('blocks localhost, .local/.internal, and private IP literals', () => {
    for (const h of ['localhost', 'foo.localhost', 'printer.local', 'db.internal', '127.0.0.1', '192.168.0.10', '[::1]', '']) {
      expect(isBlockedHostname(h), h).toBe(true);
    }
  });

  it('allows normal public hostnames', () => {
    for (const h of ['example.com', 'www.google.com', 'tiglet.vercel.app']) {
      expect(isBlockedHostname(h), h).toBe(false);
    }
  });
});

describe('validateFetchUrl', () => {
  it('accepts public http/https URLs', () => {
    const r = validateFetchUrl('https://example.com/page');
    expect(r.ok).toBe(true);
  });

  it('rejects non-http schemes', () => {
    expect(validateFetchUrl('file:///etc/passwd')).toEqual({ ok: false, reason: 'scheme' });
    expect(validateFetchUrl('ftp://example.com')).toEqual({ ok: false, reason: 'scheme' });
    expect(validateFetchUrl('gopher://x')).toEqual({ ok: false, reason: 'scheme' });
  });

  it('rejects internal targets', () => {
    expect(validateFetchUrl('http://localhost:8080')).toEqual({ ok: false, reason: 'blocked' });
    expect(validateFetchUrl('http://169.254.169.254/latest/meta-data/')).toEqual({ ok: false, reason: 'blocked' });
    expect(validateFetchUrl('http://192.168.1.1/admin')).toEqual({ ok: false, reason: 'blocked' });
  });

  it('rejects garbage', () => {
    expect(validateFetchUrl('not a url')).toEqual({ ok: false, reason: 'invalid' });
  });
});
