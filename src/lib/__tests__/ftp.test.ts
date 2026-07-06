import { describe, it, expect } from 'vitest';
import { powerZones, sweetSpot, wPerKg, wkgLevel, hrZonesFromLthr, hrZonesFromMax, POWER_ZONES } from '../ftp';

describe('powerZones (Coggan 七區)', () => {
  const zones = powerZones(250);

  it('returns 7 zones', () => {
    expect(zones).toHaveLength(7);
  });

  it('Z2 耐力區 = 56–75% → 140–188 W', () => {
    const z2 = zones[1];
    expect(z2.zone).toBe(2);
    expect(z2.minW).toBe(140);
    expect(z2.maxW).toBe(188);
  });

  it('Z4 乳酸閾值 = 91–105% → 228–263 W', () => {
    const z4 = zones[3];
    expect(z4.minW).toBe(228);
    expect(z4.maxW).toBe(263);
  });

  it('Z7 has no upper bound', () => {
    const z7 = zones[6];
    expect(z7.minPct).toBe(151);
    expect(z7.maxW).toBeNull();
  });

  it('zone metadata has names', () => {
    expect(POWER_ZONES.map((z) => z.name)).toContain('乳酸閾值');
  });
});

describe('sweetSpot', () => {
  it('FTP 250 → 220–235 W (88–94%)', () => {
    expect(sweetSpot(250)).toEqual({ minW: 220, maxW: 235 });
  });
});

describe('wPerKg', () => {
  it('250 W / 70 kg ≈ 3.57', () => {
    expect(wPerKg(250, 70)).toBeCloseTo(3.571, 3);
  });

  it('0 kg → NaN', () => {
    expect(wPerKg(250, 0)).toBeNaN();
  });
});

describe('wkgLevel (參考帶)', () => {
  it('maps sample values to bands', () => {
    expect(wkgLevel(1.5).label).toBe('入門');
    expect(wkgLevel(2.5).label).toBe('休閒');
    expect(wkgLevel(3.5).label).toBe('進階');
    expect(wkgLevel(4.5).label).toBe('業餘強者');
    expect(wkgLevel(5.5).label).toBe('精英');
  });

  it('band edges: 3.0 belongs to 進階', () => {
    expect(wkgLevel(3.0).label).toBe('進階');
  });
});

describe('hrZonesFromLthr (Coggan LTHR 五區)', () => {
  const zones = hrZonesFromLthr(170);

  it('returns 5 zones', () => {
    expect(zones).toHaveLength(5);
  });

  it('Z2 = 69–83% → 117–141 bpm', () => {
    expect(zones[1].minBpm).toBe(117);
    expect(zones[1].maxBpm).toBe(141);
  });

  it('Z5 has no upper bound', () => {
    expect(zones[4].maxBpm).toBeNull();
  });
});

describe('hrZonesFromMax (最大心率法五區)', () => {
  const zones = hrZonesFromMax(190);

  it('Z1 = 50–60% → 95–114 bpm', () => {
    expect(zones[0].minBpm).toBe(95);
    expect(zones[0].maxBpm).toBe(114);
  });

  it('Z5 = 90–100% → 171–190 bpm', () => {
    expect(zones[4].minBpm).toBe(171);
    expect(zones[4].maxBpm).toBe(190);
  });
});
