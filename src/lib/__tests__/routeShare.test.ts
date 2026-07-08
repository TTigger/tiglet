import { describe, it, expect } from 'vitest';
import { simplifyProfile, encodeRouteShare, decodeRouteShare } from '../routeShare';
import { buildProfile, checkpointsToTrackPoints, detectClimbs } from '../gpx';
import type { ProfileSample } from '../gpx';

function rampProfile(): ProfileSample[] {
  // 0–2km 平路(100m) → 2–10km 5% 爬升 → 10–12km 平路
  const samples: ProfileSample[] = [];
  for (let m = 0; m <= 12000; m += 50) {
    const ele = m <= 2000 ? 100 : m <= 10000 ? 100 + (m - 2000) * 0.05 : 500;
    samples.push({ distanceM: m, ele });
  }
  return samples;
}

describe('simplifyProfile', () => {
  it('直線段收斂成極少點、保留轉折', () => {
    const cps = simplifyProfile(rampProfile());
    expect(cps.length).toBeLessThan(10); // 三段直線 → 約 4 個轉折點
    expect(cps[0]).toEqual({ km: 0, ele: 100 });
    expect(cps[cps.length - 1]).toEqual({ km: 12, ele: 500 });
    // 轉折點（2km、10km）必須留下
    expect(cps.some((c) => Math.abs(c.km - 2) < 0.1)).toBe(true);
    expect(cps.some((c) => Math.abs(c.km - 10) < 0.1)).toBe(true);
  });

  it('點數超過上限時放寬容差', () => {
    // 鋸齒剖面：每 100m 上下 20m → 大量轉折
    const samples: ProfileSample[] = [];
    for (let m = 0; m <= 50000; m += 50) {
      samples.push({ distanceM: m, ele: 100 + (Math.floor(m / 100) % 2) * 20 });
    }
    expect(simplifyProfile(samples).length).toBeLessThanOrEqual(80);
  });

  it('簡化後重建仍偵測到同一段爬坡分級', () => {
    const cps = simplifyProfile(rampProfile());
    const rebuilt = buildProfile(checkpointsToTrackPoints(cps));
    const climbs = detectClimbs(rebuilt.samples);
    expect(climbs).toHaveLength(1);
    expect(climbs[0].category).toBe('2'); // 8km@5% → 二級坡
  });
});

describe('encodeRouteShare / decodeRouteShare', () => {
  const state = {
    title: '2026 西進武嶺｜測試',
    checkpoints: [
      { km: 0, ele: 100 },
      { km: 2, ele: 100 },
      { km: 10, ele: 500 },
    ],
    waypoints: [
      { km: '6.0', name: '西寶補給站' },
      { km: '', name: '沒填公里數會被略過' },
    ],
  };

  it('roundtrip：中文標題與地標名完整還原', () => {
    const decoded = decodeRouteShare(encodeRouteShare(state));
    expect(decoded).not.toBeNull();
    expect(decoded!.title).toBe(state.title);
    expect(decoded!.checkpoints).toEqual(state.checkpoints);
    expect(decoded!.waypoints).toEqual([{ km: '6.0', name: '西寶補給站' }]);
  });

  it('空地標與空標題也能 roundtrip', () => {
    const decoded = decodeRouteShare(encodeRouteShare({ ...state, title: '', waypoints: [] }));
    expect(decoded!.title).toBe('');
    expect(decoded!.waypoints).toEqual([]);
  });

  it('編碼長度在網址安全範圍', () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ km: i * 1.25, ele: 1000 + i }));
    expect(encodeRouteShare({ ...state, checkpoints: many }).length).toBeLessThan(1500);
  });

  it('壞資料回 null 而不是拋錯', () => {
    expect(decodeRouteShare('')).toBeNull();
    expect(decodeRouteShare('garbage')).toBeNull();
    expect(decodeRouteShare('2|x|0,1;1,2|')).toBeNull(); // 未知版本
    expect(decodeRouteShare('1|x|0,abc|')).toBeNull(); // 壞海拔
    expect(decodeRouteShare('1|x|0,100|')).toBeNull(); // 檢查點不足
    expect(decodeRouteShare('1|%E0%A4%A|0,1;1,2|')).toBeNull(); // 壞 percent-encoding
  });
});
