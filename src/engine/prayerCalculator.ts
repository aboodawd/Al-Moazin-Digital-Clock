import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
} from 'adhan';
import type {
  CityProfile,
  CityWallClock,
  ComputedCitySchedule,
  ComputedPrayerItem,
  DstModeType,
  ObligatoryPrayerId,
  PrayerId,
} from '../types/prayer';
import { METHOD_LABELS } from '../data/worldCities';

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parseFormatterParts(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekdayIndex: number;
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '0';
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;
  const weekdayStr = get('weekday');
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour,
    minute: parseInt(get('minute'), 10),
    second: parseInt(get('second'), 10),
    weekdayIndex: WEEKDAY_MAP[weekdayStr] ?? 0,
  };
}

export function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  try {
    const p = parseFormatterParts(date, timeZone);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch {
    return -date.getTimezoneOffset();
  }
}

export function isTimezoneDstActive(date: Date, timeZone: string): boolean {
  try {
    const y = date.getUTCFullYear();
    const jan = getTimezoneOffsetMinutes(new Date(Date.UTC(y, 0, 1, 12, 0, 0)), timeZone);
    const jul = getTimezoneOffsetMinutes(new Date(Date.UTC(y, 6, 1, 12, 0, 0)), timeZone);
    const curr = getTimezoneOffsetMinutes(date, timeZone);
    if (jan === jul) return false;
    return curr === Math.max(jan, jul);
  } catch {
    return false;
  }
}

export function getCityWallClock(
  now: Date,
  timeZoneId: string,
  dstMode: DstModeType = 'auto'
): CityWallClock {
  const manualShiftHours = dstMode === '1' ? 1 : dstMode === '-1' ? -1 : 0;
  const shiftedInstant = new Date(now.getTime() + manualShiftHours * 3600000);

  let safeTz = timeZoneId;
  let parts;
  try {
    parts = parseFormatterParts(shiftedInstant, safeTz);
  } catch {
    safeTz = 'UTC';
    parts = parseFormatterParts(shiftedInstant, safeTz);
  }

  const baseOffsetMin = getTimezoneOffsetMinutes(now, safeTz);
  const totalOffsetMin = baseOffsetMin + manualShiftHours * 60;
  const sign = totalOffsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(totalOffsetMin);
  const offH = Math.floor(absMin / 60);
  const offM = absMin % 60;
  const utcOffsetLabel = `UTC${sign}${offH}${offM > 0 ? ':' + String(offM).padStart(2, '0') : ''}`;

  const dateStr = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    weekdayIndex: parts.weekdayIndex,
    dateStr,
    utcOffsetMinutes: totalOffsetMin,
    utcOffsetLabel,
    isDstActive: isTimezoneDstActive(now, safeTz),
  };
}

export function formatMinutes12(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}`;
}

export function formatMinutes12WithPeriod(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const period = h24 >= 12 ? 'م' : 'ص';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatMinutes24(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getHijriArabicForClock(clock: CityWallClock): string {
  let y = clock.year;
  let m = clock.month;
  const day = clock.day;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  const l = Math.floor(jd) - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lRem = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - lRem) / 5316) * Math.floor((50 * lRem) / 17719) +
    Math.floor(lRem / 5670) * Math.floor((43 * lRem) / 15238);
  const lFinal =
    lRem -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hm = Math.floor((24 * lFinal) / 709);
  const hd = lFinal - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const hijriMonths = [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ];
  return `${days[clock.weekdayIndex]}، ${hd} ${hijriMonths[hm - 1] || hijriMonths[0]} ${hy} هـ`;
}

export function getGregorianArabicForClock(clock: CityWallClock): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  return `${days[clock.weekdayIndex]}، ${clock.day} ${months[clock.month - 1]} ${clock.year}`;
}

function buildAdhanParams(city: CityProfile): CalculationParameters {
  const cfg = city.calculationSettings;
  let params: CalculationParameters;

  switch (cfg.method) {
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Turkey':
      params = CalculationMethod.Turkey();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Singapore':
      params = CalculationMethod.Singapore();
      break;
    case 'MoonsightingCommittee':
      params = CalculationMethod.MoonsightingCommittee();
      break;
    case 'Tehran':
      params = CalculationMethod.Tehran();
      break;
    case 'JordanAwqaf':
      params = new CalculationParameters('Other', 18.0, 18.0);
      break;
    case 'Custom':
    default:
      params = CalculationMethod.Other();
      break;
  }

  // Always respect city-specific independent overrides for angles, interval, madhab, and high-latitude rule
  if (typeof cfg.fajrAngle === 'number' && cfg.fajrAngle > 0) {
    params.fajrAngle = cfg.fajrAngle;
  }
  if (typeof cfg.ishaInterval === 'number' && cfg.ishaInterval > 0) {
    params.ishaInterval = cfg.ishaInterval;
    params.ishaAngle = 0;
  } else if (typeof cfg.ishaAngle === 'number' && cfg.ishaAngle > 0) {
    params.ishaAngle = cfg.ishaAngle;
    params.ishaInterval = 0;
  }

  params.madhab = cfg.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  if (cfg.highLatitudeRule === 'SeventhOfTheNight') {
    params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  } else if (cfg.highLatitudeRule === 'TwilightAngle') {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  } else {
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  }

  params.polarCircleResolution = PolarCircleResolution.AqrabYaum;

  return params;
}

function instantToCityMinutes(instant: Date, timeZoneId: string, dstMode: DstModeType): number {
  const manualShiftHours = dstMode === '1' ? 1 : dstMode === '-1' ? -1 : 0;
  const shifted = new Date(instant.getTime() + manualShiftHours * 3600000);
  try {
    const p = parseFormatterParts(shifted, timeZoneId);
    return p.hour * 60 + p.minute;
  } catch {
    const p = parseFormatterParts(shifted, 'UTC');
    return p.hour * 60 + p.minute;
  }
}

export function calculatePrayersForDateYMD(
  city: CityProfile,
  year: number,
  month: number,
  day: number,
  referenceNowMs: number
): ComputedPrayerItem[] {
  const coords = new Coordinates(city.coordinates.lat, city.coordinates.lng);
  const params = buildAdhanParams(city);

  // IMPORTANT: adhan PrayerTimes reads date.getFullYear(), getMonth(), getDate() in runtime local TZ.
  // Passing new Date(year, month - 1, day) guarantees adhan computes for the city's exact calendar Y-M-D.
  const solarDate = new Date(year, month - 1, day);
  const adhanTimes = new PrayerTimes(coords, solarDate, params);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dstMode = city.calculationSettings.dstMode;

  const rawEntries: { id: PrayerId; name: string; instant: Date; isPrayer: boolean }[] = [
    { id: 'fajr', name: 'الفجر', instant: adhanTimes.fajr, isPrayer: true },
    { id: 'shuruq', name: 'الشروق', instant: adhanTimes.sunrise, isPrayer: false },
    { id: 'dhuhr', name: 'الظهر', instant: adhanTimes.dhuhr, isPrayer: true },
    { id: 'asr', name: 'العصر', instant: adhanTimes.asr, isPrayer: true },
    { id: 'maghrib', name: 'المغرب', instant: adhanTimes.maghrib, isPrayer: true },
    { id: 'isha', name: 'العشاء', instant: adhanTimes.isha, isPrayer: true },
  ];

  // Compute current city wall clock at referenceNowMs to derive exact instantMs for today's adjusted prayers
  const refClock = getCityWallClock(new Date(referenceNowMs), city.timeZoneId, dstMode);
  const refCityMidnightMs =
    referenceNowMs - ((refClock.hour * 3600 + refClock.minute * 60 + refClock.second) * 1000);
  const dayOffsetDays = Math.round(
    (Date.UTC(year, month - 1, day) - Date.UTC(refClock.year, refClock.month - 1, refClock.day)) /
      86400000
  );
  const targetMidnightMs = refCityMidnightMs + dayOffsetDays * 86400000;

  return rawEntries.map((entry) => {
    const origMin = instantToCityMinutes(entry.instant, city.timeZoneId, dstMode);
    const adj = city.manualAdjustments[entry.id] || { offsetMinutes: 0, mode: 'permanent' };

    let appliedOffset = 0;
    if (adj.mode === 'temporary') {
      appliedOffset = adj.temporaryDate === dateStr ? adj.offsetMinutes || 0 : 0;
    } else {
      appliedOffset = adj.offsetMinutes || 0;
    }

    const finalMin = ((origMin + appliedOffset) % 1440 + 1440) % 1440;
    const iqamaMin = entry.isPrayer
      ? city.iqamaTimes[entry.id as ObligatoryPrayerId] ?? 15
      : 0;
    const iqamaTargetMin = (finalMin + iqamaMin) % 1440;

    return {
      id: entry.id,
      name: entry.name,
      isPrayer: entry.isPrayer,
      originalMinutes: origMin,
      appliedOffsetMinutes: appliedOffset,
      adjustmentMode: adj.mode,
      finalMinutes: finalMin,
      originalFormatted12: formatMinutes12(origMin),
      originalFormatted24: formatMinutes24(origMin),
      finalFormatted12: formatMinutes12(finalMin),
      finalFormatted24: formatMinutes24(finalMin),
      iqamaMinutesAfter: iqamaMin,
      iqamaTimeFormatted12: formatMinutes12(iqamaTargetMin),
      iqamaTimeFormatted24: formatMinutes24(iqamaTargetMin),
      instantMs: targetMidnightMs + finalMin * 60000,
    };
  });
}

export function computeCitySchedule(city: CityProfile, now: Date): ComputedCitySchedule {
  const wallClock = getCityWallClock(now, city.timeZoneId, city.calculationSettings.dstMode);
  const prayers = calculatePrayersForDateYMD(
    city,
    wallClock.year,
    wallClock.month,
    wallClock.day,
    now.getTime()
  );

  const nowSecondsToday = wallClock.hour * 3600 + wallClock.minute * 60 + wallClock.second;
  const obligatory = prayers.filter((p) => p.isPrayer);

  // Jummah MUST always follow Dhuhr time!
  const dhuhrItem = prayers.find((p) => p.id === 'dhuhr')!;
  const jummahFormatted12 = dhuhrItem.finalFormatted12;
  const jummahFormatted24 = dhuhrItem.finalFormatted24;

  // Next obligatory prayer
  let nextPrayerItem: ComputedPrayerItem | null = null;
  let remainingSeconds = 0;
  let isTomorrow = false;

  for (const p of obligatory) {
    const pSec = p.finalMinutes * 60;
    if (pSec > nowSecondsToday) {
      nextPrayerItem = p;
      remainingSeconds = pSec - nowSecondsToday;
      break;
    }
  }

  if (!nextPrayerItem) {
    isTomorrow = true;
    const tomorrowUtc = new Date(Date.UTC(wallClock.year, wallClock.month - 1, wallClock.day + 1, 12, 0, 0));
    const tY = tomorrowUtc.getUTCFullYear();
    const tM = tomorrowUtc.getUTCMonth() + 1;
    const tD = tomorrowUtc.getUTCDate();
    const tomorrowPrayers = calculatePrayersForDateYMD(city, tY, tM, tD, now.getTime());
    const tomorrowFajr = tomorrowPrayers.find((p) => p.id === 'fajr')!;
    nextPrayerItem = tomorrowFajr;
    remainingSeconds = 86400 - nowSecondsToday + tomorrowFajr.finalMinutes * 60;
  }

  // Active post-Adhan Iqama countdown (between adhan time and adhan + iqamaMinutesAfter)
  let activeIqamaCountdown: ComputedCitySchedule['activeIqamaCountdown'] = null;
  for (const p of obligatory) {
    const startSec = p.finalMinutes * 60;
    const totalIqamaSec = (p.iqamaMinutesAfter || 0) * 60;
    const endSec = startSec + totalIqamaSec;
    if (totalIqamaSec > 0 && nowSecondsToday >= startSec && nowSecondsToday < endSec) {
      activeIqamaCountdown = {
        prayerId: p.id as ObligatoryPrayerId,
        prayerName: p.name,
        remainingSeconds: endSec - nowSecondsToday,
        totalSeconds: totalIqamaSec,
      };
      break;
    }
  }

  const methodInfo = METHOD_LABELS[city.calculationSettings.method] || METHOD_LABELS.MuslimWorldLeague;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return {
    cityId: city.cityId,
    countryId: city.countryId,
    dateStr: wallClock.dateStr,
    methodLabel: methodInfo.ar,
    sourceLabel: isOnline
      ? 'حساب فلكي فوري (Adhan) + جاهز للمزامنة'
      : 'حساب فلكي محلي (بدون إنترنت)',
    prayers,
    jummahFormatted12,
    jummahFormatted24,
    nextPrayer: {
      id: nextPrayerItem.id as ObligatoryPrayerId,
      name: nextPrayerItem.name,
      timeFormatted12WithPeriod: formatMinutes12WithPeriod(nextPrayerItem.finalMinutes),
      remainingSeconds: Math.max(0, remainingSeconds),
      isTomorrow,
    },
    activeIqamaCountdown,
  };
}
