import type { CalculatedDayTimes, CityProfile, PrayerId } from '../types/prayer';
import { METHOD_LABELS } from '../data/worldCities';
import { calculatePrayersForDateYMD, getCityWallClock } from './prayerCalculator';

const ALADHAN_METHOD_MAP: Record<string, number> = {
  MuslimWorldLeague: 3,
  UmmAlQura: 4,
  Egyptian: 5,
  Karachi: 1,
  NorthAmerica: 2,
  Tehran: 7,
  Kuwait: 9,
  Qatar: 10,
  Singapore: 11,
  Turkey: 13,
  Dubai: 16,
  MoonsightingCommittee: 15,
};

export interface SyncResult {
  ok: boolean;
  source: 'aladhan_api' | 'adhan_local' | 'cached_offline';
  calculated: CalculatedDayTimes;
  message: string;
}

/**
 * Syncs/verifies astronomical prayer times for a single city WITHOUT ever touching
 * manualAdjustments, iqamaTimes, azkarSettings, or screenSettings.
 */
export async function syncCityCalculatedTimes(
  city: CityProfile,
  now: Date = new Date()
): Promise<SyncResult> {
  const wallClock = getCityWallClock(now, city.timeZoneId, city.calculationSettings.dstMode);
  const localPrayers = calculatePrayersForDateYMD(
    city,
    wallClock.year,
    wallClock.month,
    wallClock.day,
    now.getTime()
  );

  const localTimesMap = {} as Record<PrayerId, string>;
  for (const p of localPrayers) {
    localTimesMap[p.id] = p.originalFormatted24;
  }

  const methodLabel =
    METHOD_LABELS[city.calculationSettings.method]?.ar || 'حساب فلكي مخصص';

  const localResult: CalculatedDayTimes = {
    dateStr: wallClock.dateStr,
    calculatedAt: new Date().toISOString(),
    source: typeof navigator !== 'undefined' && !navigator.onLine ? 'cached_offline' : 'adhan_local',
    methodLabel,
    times: localTimesMap,
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: true,
      source: 'cached_offline',
      calculated: localResult,
      message: 'وضع بدون إنترنت: تم الحساب محلياً عبر مكتبة Adhan مع الحفاظ على جميع التعديلات اليدوية',
    };
  }

  // Try online verification via Aladhan API (with short timeout so UI never blocks)
  const methodCode = ALADHAN_METHOD_MAP[city.calculationSettings.method];
  if (methodCode !== undefined && typeof fetch !== 'undefined') {
    try {
      const dd = String(wallClock.day).padStart(2, '0');
      const mm = String(wallClock.month).padStart(2, '0');
      const yyyy = wallClock.year;
      const school = city.calculationSettings.madhab === 'hanafi' ? 1 : 0;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${city.coordinates.lat}&longitude=${city.coordinates.lng}&method=${methodCode}&school=${school}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json = (await res.json()) as {
          data?: { timings?: Record<string, string> };
        };
        const t = json?.data?.timings;
        if (t && t.Fajr && t.Sunrise && t.Dhuhr && t.Asr && t.Maghrib && t.Isha) {
          const clean = (val: string) => val.split(' ')[0].slice(0, 5);
          return {
            ok: true,
            source: 'aladhan_api',
            calculated: {
              dateStr: wallClock.dateStr,
              calculatedAt: new Date().toISOString(),
              source: 'aladhan_api',
              methodLabel,
              times: {
                fajr: clean(t.Fajr),
                shuruq: clean(t.Sunrise),
                dhuhr: clean(t.Dhuhr),
                asr: clean(t.Asr),
                maghrib: clean(t.Maghrib),
                isha: clean(t.Isha),
              },
            },
            message: 'تمت المزامنة والتحقق عبر الإنترنت مع الحفاظ التام على التعديلات اليدوية والإقامة والأذكار',
          };
        }
      }
    } catch {
      // Network error or CORS or offline; seamlessly rely on local astronomical calculation
    }
  }

  return {
    ok: true,
    source: 'adhan_local',
    calculated: localResult,
    message: 'تم تحديث الحساب الفلكي اليومي للمدينة بنجاح مع بقاء التعديلات اليدوية',
  };
}
