export type PrayerId = 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type ObligatoryPrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type CalculationMethodId =
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'NorthAmerica'
  | 'Turkey'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'MoonsightingCommittee'
  | 'Tehran'
  | 'JordanAwqaf'
  | 'Custom';

export type MadhabType = 'shafi' | 'hanafi';

export type HighLatitudeRuleType =
  | 'MiddleOfTheNight'
  | 'SeventhOfTheNight'
  | 'TwilightAngle';

export type DstModeType = 'auto' | '0' | '1' | '-1';

export type AdjustmentMode = 'permanent' | 'temporary';

export interface ManualAdjustment {
  offsetMinutes: number;
  mode: AdjustmentMode;
  temporaryDate?: string; // YYYY-MM-DD in city's local date
}

export interface CityCalculationSettings {
  method: CalculationMethodId;
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval: number;
  madhab: MadhabType;
  highLatitudeRule: HighLatitudeRuleType;
  dstMode: DstModeType;
}

export interface AzkarCitySettings {
  enabled: boolean;
  startDelaySec: number; // Wait time after prayer / silence stage before Azkar starts
  stepSec: number; // 1 to 60 seconds per dhikr
  autoSequence: boolean;
  perPrayerDelaySec: Record<ObligatoryPrayerId, number>;
}

export interface ScreenCitySettings {
  mode: 'always_on' | 'after_adhan' | 'after_iqama';
  timeoutMinutes: number;
  keepClockVisible: boolean;
}

export interface ChangeHistoryEntry {
  id: string;
  timestamp: string;
  countryId: string;
  cityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  note: string;
}

export interface CalculatedDayTimes {
  dateStr: string; // YYYY-MM-DD
  calculatedAt: string;
  source: 'adhan_local' | 'aladhan_api' | 'cached_offline';
  methodLabel: string;
  times: Record<PrayerId, string>; // HH:mm 24h local city time
}

export interface CityProfile {
  countryId: string;
  cityId: string;
  mosqueName: string;
  neighborhood: string;
  street: string;
  timeZoneId: string;
  coordinates: {
    lat: number;
    lng: number;
    elevation?: number;
  };
  calculationSettings: CityCalculationSettings;
  manualAdjustments: Record<PrayerId, ManualAdjustment>;
  iqamaTimes: Record<ObligatoryPrayerId, number>;
  azkarSettings: AzkarCitySettings;
  screenSettings: ScreenCitySettings;
  calculatedPrayerTimes: CalculatedDayTimes | null;
  lastUpdated: string;
  changeHistory: ChangeHistoryEntry[];
}

export interface CityDef {
  cityId: string;
  countryId: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  elevation?: number;
  timeZoneId: string;
  defaultMethod?: CalculationMethodId;
  defaultMadhab?: MadhabType;
  isCustom?: boolean;
}

export interface CountryDef {
  countryId: string;
  nameAr: string;
  nameEn: string;
  region: 'arab' | 'europe' | 'americas' | 'asia' | 'africa' | 'oceania';
  defaultMethod: CalculationMethodId;
  defaultMadhab: MadhabType;
  defaultHighLatitudeRule: HighLatitudeRuleType;
  cities: CityDef[];
}

export interface ThemeColors {
  mosqueNameColor: string;
  clockBoxBg: string;
  clockBoxBorder: string;
  clockDigitsColor: string;
  clockSecColor: string;
  clockDateColor: string;
  nextTitleColor: string;
  nextNameColor: string;
  nextTimerColor: string;
  fajrTimeColor: string;
  shuruqTimeColor: string;
  dhuhrTimeColor: string;
  asrTimeColor: string;
  maghribTimeColor: string;
  ishaTimeColor: string;
  cardsBg: string;
  cardsBorder: string;
  cardsNameColor: string;
  jummahBg: string;
  jummahBorder: string;
  jummahTextColor: string;
  iqamaTextColor: string;
  azkarTextColor: string;
  azkarTimerColor: string;
  adhanTextColor: string;
  adhanTimerColor: string;
  iqamaTimerColor: string;
  silenceTimerColor: string;
}

export interface UISettings {
  themeColors: ThemeColors;
  iqamaFontSize: number;
  stages: {
    adhan: { min: number; sec: number; pos: 'top' | 'center' | 'bottom' };
    silence: { min: number; sec: number };
  };
  bgBrightness: number;
  bgOverlayOpacity: number;
  bgMode: 'super' | 'bright' | 'normal' | 'dim' | 'custom';
  presetBgUrl: string | null;
  soundEnabled: boolean;
  audioVolume: number;
  adhanAudioSource: 'custom' | 'preset_makkah' | 'preset_madinah' | 'chime' | 'silent';
  fajrAudioSource: 'custom' | 'preset_makkah' | 'preset_madinah' | 'same_as_adhan' | 'chime' | 'silent';
}

export interface AppRootState {
  version: number;
  activeCountryId: string;
  activeCityId: string;
  cityProfiles: Record<string, CityProfile>; // Keyed strictly by cityId
  customCities: CityDef[];
  customCountries: CountryDef[];
  ui: UISettings;
}

export interface CityWallClock {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  hour: number; // 0..23
  minute: number; // 0..59
  second: number; // 0..59
  weekdayIndex: number; // 0=Sun..6=Sat
  dateStr: string; // YYYY-MM-DD
  utcOffsetMinutes: number;
  utcOffsetLabel: string;
  isDstActive: boolean;
}

export interface ComputedPrayerItem {
  id: PrayerId;
  name: string;
  isPrayer: boolean;
  originalMinutes: number; // 0..1439 in city's wall clock
  appliedOffsetMinutes: number;
  adjustmentMode: AdjustmentMode;
  finalMinutes: number; // 0..1439 in city's wall clock
  originalFormatted12: string;
  originalFormatted24: string;
  finalFormatted12: string;
  finalFormatted24: string;
  iqamaMinutesAfter: number;
  iqamaTimeFormatted12: string;
  iqamaTimeFormatted24: string;
  instantMs: number; // Epoch ms corresponding to final prayer time today
}

export interface ComputedCitySchedule {
  cityId: string;
  countryId: string;
  dateStr: string;
  methodLabel: string;
  sourceLabel: string;
  prayers: ComputedPrayerItem[];
  jummahFormatted12: string; // Always equals Dhuhr finalFormatted12
  jummahFormatted24: string; // Always equals Dhuhr finalFormatted24
  nextPrayer: {
    id: ObligatoryPrayerId;
    name: string;
    timeFormatted12WithPeriod: string;
    remainingSeconds: number;
    isTomorrow: boolean;
  };
  activeIqamaCountdown: {
    prayerId: ObligatoryPrayerId;
    prayerName: string;
    remainingSeconds: number;
    totalSeconds: number;
  } | null;
}
