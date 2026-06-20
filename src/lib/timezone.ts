export interface CityDef {
  id: string; // IANA time-zone name
  label: string;
}

export const CITIES: CityDef[] = [
  { id: 'Asia/Taipei', label: '台北' },
  { id: 'Asia/Tokyo', label: '東京' },
  { id: 'Asia/Shanghai', label: '上海' },
  { id: 'Asia/Hong_Kong', label: '香港' },
  { id: 'Asia/Singapore', label: '新加坡' },
  { id: 'Asia/Seoul', label: '首爾' },
  { id: 'Asia/Bangkok', label: '曼谷' },
  { id: 'Asia/Dubai', label: '杜拜' },
  { id: 'Europe/London', label: '倫敦' },
  { id: 'Europe/Paris', label: '巴黎' },
  { id: 'Europe/Berlin', label: '柏林' },
  { id: 'America/New_York', label: '紐約' },
  { id: 'America/Chicago', label: '芝加哥' },
  { id: 'America/Los_Angeles', label: '洛杉磯' },
  { id: 'America/Sao_Paulo', label: '聖保羅' },
  { id: 'Australia/Sydney', label: '雪梨' },
  { id: 'Pacific/Auckland', label: '奧克蘭' },
  { id: 'UTC', label: 'UTC' },
];

/** UTC offset (minutes east of UTC) for a zone at a given instant, DST-aware. */
export function offsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Render an offset as "UTC+8" / "UTC-5:30". */
export function offsetLabel(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

/** Difference in minutes of zoneB relative to zoneA at a given instant. */
export function diffMinutes(date: Date, zoneA: string, zoneB: string): number {
  return offsetMinutes(date, zoneB) - offsetMinutes(date, zoneA);
}

/** Human-readable "快 8 小時 / 慢 3 小時 / 同時區". */
export function diffLabel(minutes: number): string {
  if (minutes === 0) return '同時區';
  const ahead = minutes > 0;
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [h ? `${h} 小時` : '', m ? `${m} 分` : ''].filter(Boolean).join(' ');
  return `${ahead ? '快' : '慢'} ${parts}`;
}

export interface ZoneClock {
  time: string;
  date: string;
  weekday: string;
}

/** Format an instant as wall-clock time/date/weekday in a zone. */
export function formatInZone(date: Date, timeZone: string, locale = 'zh-TW'): ZoneClock {
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  const dateStr = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: 'long',
    day: 'numeric',
  }).format(date);
  const weekday = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short' }).format(date);
  return { time, date: dateStr, weekday };
}
