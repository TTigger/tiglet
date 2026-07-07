import { describe, it, expect } from 'vitest';
import {
  parseGpx,
  parseGpxName,
  parseTcx,
  fitRecordsToTrackPoints,
  parseGpxWaypoints,
  locateOnTrack,
  haversineM,
  buildProfile,
  totalAscentM,
  detectClimbs,
  categorize,
  gradientBuckets,
  gradientSegments,
  bandFor,
  eleAtM,
  climbKmBlocks,
  steepestKm,
  CLIMB_CATEGORIES,
  GRADIENT_BANDS,
} from '../gpx';

// ---- 合成 GPX：沿緯度直線前進，海拔依段落坡度爬升 ----
// segments: [lengthM, gradientPct][]
function syntheticGpx(segments: [number, number][], stepM = 50): string {
  const M_PER_DEG_LAT = 111_320;
  let lat = 25.0;
  let ele = 100;
  const pts: string[] = [`<trkpt lat="${lat}" lon="121.5"><ele>${ele}</ele></trkpt>`];
  for (const [lengthM, gradPct] of segments) {
    const steps = Math.round(lengthM / stepM);
    for (let i = 0; i < steps; i++) {
      lat += stepM / M_PER_DEG_LAT;
      ele += (stepM * gradPct) / 100;
      pts.push(`<trkpt lat="${lat.toFixed(7)}" lon="121.5"><ele>${ele.toFixed(2)}</ele></trkpt>`);
    }
  }
  return `<?xml version="1.0"?><gpx><trk><name>測試路線</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

describe('parseGpx', () => {
  it('parses trackpoints with lat/lon/ele', () => {
    const pts = parseGpx(syntheticGpx([[1000, 5]]));
    expect(pts.length).toBe(21);
    expect(pts[0]).toMatchObject({ lat: 25.0, lon: 121.5, ele: 100 });
    expect(pts[20].ele).toBeCloseTo(150, 0);
  });

  it('reads the track name when present', () => {
    expect(parseGpxName(syntheticGpx([[100, 0]]))).toBe('測試路線');
    expect(parseGpxName('<gpx><trk><trkseg></trkseg></trk></gpx>')).toBeNull();
  });

  it('throws on invalid XML / missing trackpoints', () => {
    expect(() => parseGpx('not xml at all')).toThrow();
    expect(() => parseGpx('<gpx></gpx>')).toThrow();
  });
});

describe('haversineM', () => {
  it('0.01° of latitude ≈ 1113 m', () => {
    expect(haversineM(25, 121.5, 25.01, 121.5)).toBeCloseTo(1113, -1);
  });

  it('same point → 0', () => {
    expect(haversineM(25, 121.5, 25, 121.5)).toBe(0);
  });
});

describe('buildProfile', () => {
  it('resamples to uniform steps with cumulative distance and smoothed elevation', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[5000, 5]])));
    expect(profile.totalDistanceM).toBeCloseTo(5000, -2);
    const last = profile.samples[profile.samples.length - 1];
    expect(last.distanceM).toBeCloseTo(profile.totalDistanceM, 0);
    // 5% × 5000m = 250m 爬升（平滑後仍應接近）
    expect(last.ele - profile.samples[0].ele).toBeCloseTo(250, -1);
  });
});

describe('totalAscentM', () => {
  it('counts only positive elevation change', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[3000, 6], [2000, -4], [2000, 5]])));
    // 上坡 180m + 100m；下坡不計（平滑會削掉轉折處的尖峰，允許 ~5% 誤差）
    expect(totalAscentM(profile.samples)).toBeGreaterThan(260);
    expect(totalAscentM(profile.samples)).toBeLessThanOrEqual(280);
  });
});

describe('detectClimbs + categorize', () => {
  it('finds a single climb with correct stats and category', () => {
    // 2km 平路 + 8km @5%（分數 8000×5 = 40000 → 二級坡）+ 2km 平路
    const profile = buildProfile(parseGpx(syntheticGpx([[2000, 0], [8000, 5], [2000, 0]])));
    const climbs = detectClimbs(profile.samples);
    expect(climbs).toHaveLength(1);
    const c = climbs[0];
    expect(c.lengthM).toBeCloseTo(8000, -3);
    expect(c.avgGradientPct).toBeCloseTo(5, 0);
    expect(c.gainM).toBeCloseTo(400, -1);
    expect(c.category).toBe('2');
  });

  it('finds two separate climbs', () => {
    // 分數要離分級門檻有安全邊際（平滑與距離量測會带來 ~1% 誤差）
    const profile = buildProfile(parseGpx(syntheticGpx([[3000, 6], [3000, -3], [5000, 8]])));
    const climbs = detectClimbs(profile.samples);
    expect(climbs).toHaveLength(2);
    expect(climbs[0].category).toBe('3'); // ≈3000×6=18000 → 三級
    expect(climbs[1].category).toBe('2'); // ≈5000×8=40000 → 二級
  });

  it('ignores short bumps', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[2000, 0], [200, 4], [2000, 0]])));
    expect(detectClimbs(profile.samples)).toHaveLength(0);
  });

  it('categorize thresholds follow the climb-score bands', () => {
    expect(categorize(85000)).toBe('HC');
    expect(categorize(70000)).toBe('1');
    expect(categorize(40000)).toBe('2');
    expect(categorize(20000)).toBe('3');
    expect(categorize(9000)).toBe('4');
    expect(categorize(5000)).toBeNull();
  });

  it('CLIMB_CATEGORIES metadata covers HC–4', () => {
    expect(CLIMB_CATEGORIES.map((c) => c.id)).toEqual(['HC', '1', '2', '3', '4']);
  });
});

describe('gradientBuckets', () => {
  it('distributes distance into gradient bands', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[4000, 0], [4000, 5], [2000, 10]])));
    const buckets = gradientBuckets(profile.samples);
    const total = buckets.reduce((a, b) => a + b.distanceM, 0);
    expect(total).toBeCloseTo(profile.totalDistanceM, -2);
    // 平路段應落在最低坡度帶（平滑會讓邊界略為模糊）
    expect(buckets[0].distanceM).toBeGreaterThan(3000);
    // 陡坡帶要存在
    expect(buckets[buckets.length - 1].distanceM).toBeGreaterThan(1000);
  });
});

describe('parseTcx', () => {
  function syntheticTcx(): string {
    const pts = [
      [25.0, 121.5, 100],
      [25.001, 121.5, 110],
      [25.002, 121.5, 120],
    ]
      .map(
        ([lat, lon, ele]) =>
          `<Trackpoint><Position><LatitudeDegrees>${lat}</LatitudeDegrees><LongitudeDegrees>${lon}</LongitudeDegrees></Position><AltitudeMeters>${ele}</AltitudeMeters></Trackpoint>`
      )
      .join('');
    return `<?xml version="1.0"?><TrainingCenterDatabase><Activities><Activity><Lap><Track>${pts}</Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
  }

  it('parses trackpoints with position and altitude', () => {
    const pts = parseTcx(syntheticTcx());
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ lat: 25.0, lon: 121.5, ele: 100 });
  });

  it('skips trackpoints without position (心率-only 紀錄常見)', () => {
    const xml = syntheticTcx().replace('</Track>', '<Trackpoint><AltitudeMeters>50</AltitudeMeters></Trackpoint></Track>');
    expect(parseTcx(xml)).toHaveLength(3);
  });

  it('throws on invalid or empty TCX', () => {
    expect(() => parseTcx('garbage')).toThrow();
    expect(() => parseTcx('<TrainingCenterDatabase></TrainingCenterDatabase>')).toThrow();
  });
});

describe('fitRecordsToTrackPoints', () => {
  it('accepts degree coordinates as-is', () => {
    const pts = fitRecordsToTrackPoints([
      { position_lat: 25.0, position_long: 121.5, altitude: 100 },
      { position_lat: 25.001, position_long: 121.5, altitude: 110 },
    ]);
    expect(pts[0]).toEqual({ lat: 25.0, lon: 121.5, ele: 100 });
  });

  it('converts semicircle coordinates to degrees', () => {
    const semi = (deg: number) => Math.round(deg / (180 / 2 ** 31));
    const pts = fitRecordsToTrackPoints([
      { position_lat: semi(25.0), position_long: semi(121.5), altitude: 100 },
      { position_lat: semi(25.001), position_long: semi(121.5), altitude: 110 },
    ]);
    expect(pts[0].lat).toBeCloseTo(25.0, 5);
    expect(pts[0].lon).toBeCloseTo(121.5, 5);
  });

  it('prefers enhanced_altitude and skips positionless records', () => {
    const pts = fitRecordsToTrackPoints([
      { position_lat: 25, position_long: 121.5, altitude: 100, enhanced_altitude: 105 },
      { altitude: 99 }, // 無座標（隧道/室內）→ 跳過
      { position_lat: 25.001, position_long: 121.5, altitude: 110 },
    ]);
    expect(pts).toHaveLength(2);
    expect(pts[0].ele).toBe(105);
  });

  it('throws when fewer than 2 usable records', () => {
    expect(() => fitRecordsToTrackPoints([{ altitude: 1 }])).toThrow();
  });
});

describe('parseGpxWaypoints + locateOnTrack (航點自動標注)', () => {
  // 在合成路線（沿緯度北行）中途插一個 <wpt>
  function gpxWithWpt(): string {
    const base = syntheticGpx([[4000, 5]]);
    // 2km 處的緯度 ≈ 25.0 + 2000/111320
    const midLat = (25.0 + 2000 / 111_320).toFixed(7);
    const wpts = `<wpt lat="${midLat}" lon="121.5"><name>中途補給</name></wpt>` +
      `<wpt lat="30.0" lon="100.0"><name>離線很遠的點</name></wpt>` +
      `<wpt lat="25.001" lon="121.5"></wpt>`; // 沒名字的略過
    return base.replace('<trk>', `${wpts}<trk>`);
  }

  it('reads named waypoints only', () => {
    const wpts = parseGpxWaypoints(gpxWithWpt());
    expect(wpts.map((w) => w.name)).toEqual(['中途補給', '離線很遠的點']);
  });

  it('locates an on-route waypoint at the right distance', () => {
    const points = parseGpx(gpxWithWpt());
    const wpts = parseGpxWaypoints(gpxWithWpt());
    const loc = locateOnTrack(points, wpts[0].lat, wpts[0].lon);
    expect(loc).not.toBeNull();
    expect(loc!.distanceM).toBeGreaterThan(1800);
    expect(loc!.distanceM).toBeLessThan(2200);
  });

  it('rejects waypoints far off the route', () => {
    const points = parseGpx(gpxWithWpt());
    expect(locateOnTrack(points, 30.0, 100.0)).toBeNull();
  });

  it('gpx without waypoints → empty list', () => {
    expect(parseGpxWaypoints(syntheticGpx([[500, 0]]))).toEqual([]);
  });
});

describe('bandFor (業界坡度色階)', () => {
  it('classifies gradients into the standard bands', () => {
    expect(bandFor(-3).id).toBe('down');
    expect(bandFor(0).id).toBe('g0');
    expect(bandFor(3.9).id).toBe('g0');
    expect(bandFor(4).id).toBe('g4');
    expect(bandFor(7.2).id).toBe('g6');
    expect(bandFor(9.5).id).toBe('g8');
    expect(bandFor(12).id).toBe('g10');
    expect(bandFor(18).id).toBe('g15');
  });

  it('band metadata is ordered and complete', () => {
    expect(GRADIENT_BANDS.map((b) => b.id)).toEqual(['down', 'g0', 'g4', 'g6', 'g8', 'g10', 'g15']);
    expect(GRADIENT_BANDS.every((b) => /^#[0-9A-Fa-f]{6}$/.test(b.color))).toBe(true);
  });
});

describe('gradientSegments (剖面圖著色分段)', () => {
  it('splits the profile by gradient band and merges same-band runs', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[3000, 1], [3000, 8], [2000, -4]])));
    const segs = gradientSegments(profile.samples);
    expect(segs.length).toBeGreaterThanOrEqual(3);
    // 頭尾銜接、無縫隙
    expect(segs[0].startM).toBe(0);
    for (let i = 1; i < segs.length; i++) expect(segs[i].startM).toBe(segs[i - 1].endM);
    expect(segs[segs.length - 1].endM).toBeCloseTo(profile.totalDistanceM, 0);
    // 三種帶都要出現：緩坡綠、8% 橘、下坡灰
    const ids = segs.map((s) => s.band.id);
    expect(ids).toContain('g0');
    expect(ids).toContain('g8');
    expect(ids).toContain('down');
  });

  it('a uniform climb is dominated by its band (平滑的頭尾邊界效應允許小色邊)', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[4000, 6]])));
    const segs = gradientSegments(profile.samples);
    const g6LengthM = segs.filter((s) => s.band.id === 'g6').reduce((a, s) => a + (s.endM - s.startM), 0);
    expect(g6LengthM).toBeGreaterThan(3400); // ≥85% 覆蓋
    const main = segs.find((s) => s.band.id === 'g6')!;
    expect(main.gradientPct).toBeCloseTo(6, 0);
  });
});

describe('climbKmBlocks (每公里坡度方塊)', () => {
  it('cuts a climb into 1km blocks with per-block gradient and band', () => {
    // 2km 平路 + 3.5km @7%
    const profile = buildProfile(parseGpx(syntheticGpx([[2000, 0], [3500, 7]])));
    const climb = detectClimbs(profile.samples)[0];
    const blocks = climbKmBlocks(profile.samples, climb);
    expect(blocks.length).toBe(4); // 3 個整公里 + 1 個 0.5km 尾塊
    expect(blocks[1].gradientPct).toBeCloseTo(7, 0);
    expect(blocks[1].band.id).toBe('g6');
    // 無縫銜接
    for (let i = 1; i < blocks.length; i++) expect(blocks[i].startM).toBe(blocks[i - 1].endM);
    expect(blocks[0].startM).toBeCloseTo(climb.startM, 5);
    expect(blocks[blocks.length - 1].endM).toBeCloseTo(climb.endM, 5);
    // 每塊帶頭尾海拔（畫階梯用）
    expect(blocks[1].endEle).toBeGreaterThan(blocks[1].startEle);
  });

  it('a short climb under 1km yields a single block', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[900, 6]])));
    const climbs = detectClimbs(profile.samples);
    if (climbs.length) {
      const blocks = climbKmBlocks(profile.samples, climbs[0]);
      expect(blocks).toHaveLength(1);
    }
  });
});

describe('eleAtM (地標海拔內插)', () => {
  it('interpolates elevation at any distance', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[4000, 5]])));
    // 4km @5%：起點 100m，2km 處 ≈ 200m（遠離平滑邊界，幾何值可直接對）
    expect(eleAtM(profile.samples, 2000)).toBeCloseTo(200, 0);
    // 樣本之間（1975m 與 2025m 的中點）要落在兩者之間
    const mid = eleAtM(profile.samples, 2025);
    expect(mid).toBeGreaterThan(eleAtM(profile.samples, 2000));
    expect(mid).toBeLessThan(eleAtM(profile.samples, 2050));
  });

  it('clamps out-of-range distances to the ends', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[1000, 0]])));
    expect(eleAtM(profile.samples, -50)).toBeCloseTo(profile.samples[0].ele, 5);
    expect(eleAtM(profile.samples, 99999)).toBeCloseTo(profile.samples[profile.samples.length - 1].ele, 5);
  });
});

describe('steepestKm', () => {
  it('finds the steepest 1km window', () => {
    const profile = buildProfile(parseGpx(syntheticGpx([[3000, 2], [1500, 9], [3000, 1]])));
    const s = steepestKm(profile.samples);
    expect(s.gradientPct).toBeGreaterThan(6.5);
    expect(s.gradientPct).toBeLessThanOrEqual(9.5);
    // 位置應落在陡段附近
    expect(s.startM).toBeGreaterThan(2000);
    expect(s.startM).toBeLessThan(4000);
  });
});
