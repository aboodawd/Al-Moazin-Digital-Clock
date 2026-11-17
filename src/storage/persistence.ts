import type {
  AppRootState,
  ChangeHistoryEntry,
  CityDef,
  CityProfile,
  CountryDef,
  ThemeColors,
  UISettings,
} from '../types/prayer';
import {
  WORLD_COUNTRIES,
  createDefaultCityProfile,
  findCityById,
  findCountryById,
} from '../data/worldCities';

export const STATE_STORAGE_KEY = 'almoazin_world_state_v4';
export const BACKUP_STORAGE_KEY = 'almoazin_world_state_v4_backup';
export const LEGACY_STORAGE_KEY = 'almoazin_app_state_v3';

export const THEME_PRESETS: Record<'gold' | 'blue' | 'green' | 'silver', ThemeColors> = {
  gold: {
    mosqueNameColor: '#c5a038',
    clockBoxBg: '#0e150f',
    clockBoxBorder: '#8e7428',
    clockDigitsColor: '#c5a038',
    clockSecColor: '#dfb743',
    clockDateColor: '#c5a038',
    nextTitleColor: '#c5a038',
    nextNameColor: '#dfb743',
    nextTimerColor: '#c5a038',
    fajrTimeColor: '#c5a038',
    shuruqTimeColor: '#c5a038',
    dhuhrTimeColor: '#c5a038',
    asrTimeColor: '#c5a038',
    maghribTimeColor: '#c5a038',
    ishaTimeColor: '#c5a038',
    cardsBg: '#0e150f',
    cardsBorder: '#8e7428',
    cardsNameColor: '#c5a038',
    jummahBg: '#0e150f',
    jummahBorder: '#8e7428',
    jummahTextColor: '#c5a038',
    iqamaTextColor: '#fbbf24',
    azkarTextColor: '#fef08a',
    azkarTimerColor: '#f59e0b',
    adhanTextColor: '#fbbf24',
    adhanTimerColor: '#f59e0b',
    iqamaTimerColor: '#f59e0b',
    silenceTimerColor: '#f87171',
  },
  blue: {
    mosqueNameColor: '#38bdf8',
    clockBoxBg: '#0b1528',
    clockBoxBorder: '#1e3a8a',
    clockDigitsColor: '#38bdf8',
    clockSecColor: '#7dd3fc',
    clockDateColor: '#93c5fd',
    nextTitleColor: '#38bdf8',
    nextNameColor: '#67e8f9',
    nextTimerColor: '#38bdf8',
    fajrTimeColor: '#38bdf8',
    shuruqTimeColor: '#38bdf8',
    dhuhrTimeColor: '#38bdf8',
    asrTimeColor: '#38bdf8',
    maghribTimeColor: '#38bdf8',
    ishaTimeColor: '#38bdf8',
    cardsBg: '#0b1528',
    cardsBorder: '#1e3a8a',
    cardsNameColor: '#38bdf8',
    jummahBg: '#0b1528',
    jummahBorder: '#1e3a8a',
    jummahTextColor: '#38bdf8',
    iqamaTextColor: '#38bdf8',
    azkarTextColor: '#bae6fd',
    azkarTimerColor: '#38bdf8',
    adhanTextColor: '#67e8f9',
    adhanTimerColor: '#38bdf8',
    iqamaTimerColor: '#38bdf8',
    silenceTimerColor: '#f87171',
  },
  green: {
    mosqueNameColor: '#34d399',
    clockBoxBg: '#051f12',
    clockBoxBorder: '#047857',
    clockDigitsColor: '#34d399',
    clockSecColor: '#6ee7b7',
    clockDateColor: '#a7f3d0',
    nextTitleColor: '#34d399',
    nextNameColor: '#10b981',
    nextTimerColor: '#34d399',
    fajrTimeColor: '#34d399',
    shuruqTimeColor: '#34d399',
    dhuhrTimeColor: '#34d399',
    asrTimeColor: '#34d399',
    maghribTimeColor: '#34d399',
    ishaTimeColor: '#34d399',
    cardsBg: '#051f12',
    cardsBorder: '#047857',
    cardsNameColor: '#34d399',
    jummahBg: '#051f12',
    jummahBorder: '#047857',
    jummahTextColor: '#34d399',
    iqamaTextColor: '#34d399',
    azkarTextColor: '#a7f3d0',
    azkarTimerColor: '#34d399',
    adhanTextColor: '#6ee7b7',
    adhanTimerColor: '#34d399',
    iqamaTimerColor: '#34d399',
    silenceTimerColor: '#f87171',
  },
  silver: {
    mosqueNameColor: '#ffffff',
    clockBoxBg: '#18181b',
    clockBoxBorder: '#52525b',
    clockDigitsColor: '#f4f4f5',
    clockSecColor: '#e4e4e7',
    clockDateColor: '#d4d4d8',
    nextTitleColor: '#e4e4e7',
    nextNameColor: '#ffffff',
    nextTimerColor: '#e4e4e7',
    fajrTimeColor: '#f4f4f5',
    shuruqTimeColor: '#f4f4f5',
    dhuhrTimeColor: '#f4f4f5',
    asrTimeColor: '#f4f4f5',
    maghribTimeColor: '#f4f4f5',
    ishaTimeColor: '#f4f4f5',
    cardsBg: '#18181b',
    cardsBorder: '#52525b',
    cardsNameColor: '#e4e4e7',
    jummahBg: '#18181b',
    jummahBorder: '#52525b',
    jummahTextColor: '#f4f4f5',
    iqamaTextColor: '#f4f4f5',
    azkarTextColor: '#f4f4f5',
    azkarTimerColor: '#e4e4e7',
    adhanTextColor: '#ffffff',
    adhanTimerColor: '#e4e4e7',
    iqamaTimerColor: '#e4e4e7',
    silenceTimerColor: '#f87171',
  },
};

export function createDefaultUISettings(): UISettings {
  return {
    themeColors: { ...THEME_PRESETS.gold },
    iqamaFontSize: 17,
    stages: {
      adhan: { min: 3, sec: 14, pos: 'top' },
      silence: { min: 1, sec: 0 },
    },
    bgBrightness: 120,
    bgOverlayOpacity: 25,
    bgMode: 'bright',
    presetBgUrl: null,
    soundEnabled: true,
    audioVolume: 100,
    adhanAudioSource: 'custom',
    fajrAudioSource: 'custom',
  };
}

export function createDefaultAppState(): AppRootState {
  const defaultCountry = findCountryById('JO')!;
  const defaultCity = defaultCountry.cities[0]; // jo_amman
  const ammanProfile = createDefaultCityProfile(defaultCity, defaultCountry);

  return {
    version: 4,
    activeCountryId: defaultCountry.countryId,
    activeCityId: defaultCity.cityId,
    cityProfiles: {
      [defaultCity.cityId]: ammanProfile,
    },
    customCities: [],
    customCountries: [],
    ui: createDefaultUISettings(),
  };
}

// Storage backend interface (works in browser localStorage AND Node tests)
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getDefaultStorageAdapter(): StorageAdapter | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

// =========================================================================
// IndexedDB Stores for Heavy Media (Images & Audio) + State Mirror
// =========================================================================
function openIndexedDB(dbName: string, storeName: string): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }
      const req = window.indexedDB.open(dbName, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export type ImageSlotKey =
  | 'main_bg'
  | 'stage_adhan'
  | 'stage_iqama'
  | 'stage_silence'
  | 'stage_azkar';

export const ImageStore = {
  dbPromise: null as Promise<IDBDatabase | null> | null,
  getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openIndexedDB('AlMoazinImageDB', 'images');
    }
    return this.dbPromise;
  },
  async save(key: ImageSlotKey, dataUrl: string): Promise<boolean> {
    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('images', 'readwrite');
          tx.objectStore('images').put({ data: dataUrl, updatedAt: Date.now() }, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
  async get(key: ImageSlotKey): Promise<string | null> {
    const db = await this.getDB();
    if (db) {
      try {
        const item = await new Promise<{ data?: string } | null>((resolve) => {
          const tx = db.transaction('images', 'readonly');
          const req = tx.objectStore('images').get(key);
          req.onsuccess = () => resolve((req.result as { data?: string }) || null);
          req.onerror = () => resolve(null);
        });
        if (item?.data) return item.data;
      } catch {
        return null;
      }
    }
    return null;
  },
  async remove(key: ImageSlotKey): Promise<void> {
    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve) => {
          const tx = db.transaction('images', 'readwrite');
          tx.objectStore('images').delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch {
        // ignore
      }
    }
  },
  async loadAll(): Promise<Record<ImageSlotKey, string | null>> {
    const [main_bg, stage_adhan, stage_iqama, stage_silence, stage_azkar] = await Promise.all([
      this.get('main_bg'),
      this.get('stage_adhan'),
      this.get('stage_iqama'),
      this.get('stage_silence'),
      this.get('stage_azkar'),
    ]);
    return { main_bg, stage_adhan, stage_iqama, stage_silence, stage_azkar };
  },
};

export type AudioSlotKey = 'adhan_fajr' | 'adhan' | 'iqama';

export const AudioStore = {
  dbPromise: null as Promise<IDBDatabase | null> | null,
  getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openIndexedDB('AlMoazinAudioDB', 'audio_files');
    }
    return this.dbPromise;
  },
  async save(key: AudioSlotKey, dataUrl: string, fileName: string, fileSize: number): Promise<boolean> {
    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('audio_files', 'readwrite');
          tx.objectStore('audio_files').put(
            { data: dataUrl, name: fileName, size: fileSize, time: Date.now() },
            key
          );
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
  async get(key: AudioSlotKey): Promise<{ data: string; name: string } | null> {
    const db = await this.getDB();
    if (db) {
      try {
        const item = await new Promise<{ data?: string; name?: string } | null>((resolve) => {
          const tx = db.transaction('audio_files', 'readonly');
          const req = tx.objectStore('audio_files').get(key);
          req.onsuccess = () => resolve((req.result as { data?: string; name?: string }) || null);
          req.onerror = () => resolve(null);
        });
        if (item?.data) {
          return { data: item.data, name: item.name || 'ملف صوت محفوظ' };
        }
      } catch {
        // ignore
      }
    }
    return null;
  },
  async remove(key: AudioSlotKey): Promise<void> {
    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve) => {
          const tx = db.transaction('audio_files', 'readwrite');
          tx.objectStore('audio_files').delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch {
        // ignore
      }
    }
  },
};

export const StateMirrorDB = {
  dbPromise: null as Promise<IDBDatabase | null> | null,
  getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openIndexedDB('AlMoazinStateDB', 'state_snapshots');
    }
    return this.dbPromise;
  },
  async saveSnapshot(stateJson: string): Promise<void> {
    const db = await this.getDB();
    if (!db) return;
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction('state_snapshots', 'readwrite');
        tx.objectStore('state_snapshots').put(
          { json: stateJson, savedAt: Date.now() },
          'latest_v4'
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  },
  async loadSnapshot(): Promise<string | null> {
    const db = await this.getDB();
    if (!db) return null;
    try {
      const item = await new Promise<{ json?: string } | null>((resolve) => {
        const tx = db.transaction('state_snapshots', 'readonly');
        const req = tx.objectStore('state_snapshots').get('latest_v4');
        req.onsuccess = () => resolve((req.result as { json?: string }) || null);
        req.onerror = () => resolve(null);
      });
      return item?.json || null;
    } catch {
      return null;
    }
  },
};

// =========================================================================
// Atomic State Persistence (Zero Data Loss, Zero Cross-City Contamination)
// =========================================================================
export interface SaveResult {
  ok: boolean;
  error?: string;
}

export function validateAndHydrateAppState(raw: unknown): AppRootState {
  const fallback = createDefaultAppState();
  if (!raw || typeof raw !== 'object') return fallback;

  const obj = raw as Partial<AppRootState>;
  const customCities: CityDef[] = Array.isArray(obj.customCities)
    ? obj.customCities.filter(
        (ci): ci is CityDef =>
          Boolean(ci) &&
          typeof ci === 'object' &&
          typeof ci.cityId === 'string' &&
          typeof ci.countryId === 'string' &&
          typeof ci.timeZoneId === 'string' &&
          Number.isFinite(Number(ci.lat)) &&
          Number.isFinite(Number(ci.lng))
      )
    : [];

  const customCountries: CountryDef[] = Array.isArray(obj.customCountries)
    ? obj.customCountries.filter(
        (co): co is CountryDef =>
          Boolean(co) &&
          typeof co === 'object' &&
          typeof co.countryId === 'string' &&
          typeof co.nameAr === 'string'
      )
    : [];

  const activeCountryId =
    typeof obj.activeCountryId === 'string' && findCountryById(obj.activeCountryId, customCountries)
      ? obj.activeCountryId
      : fallback.activeCountryId;

  const cityLookup =
    typeof obj.activeCityId === 'string'
      ? findCityById(obj.activeCityId, customCities, customCountries)
      : {};

  const activeCityId =
    cityLookup.city && cityLookup.city.countryId === activeCountryId
      ? cityLookup.city.cityId
      : (findCountryById(activeCountryId, customCountries)?.cities[0]?.cityId ||
          customCities.find((ci) => ci.countryId === activeCountryId)?.cityId ||
          fallback.activeCityId);

  const hydratedProfiles: Record<string, CityProfile> = {};
  if (obj.cityProfiles && typeof obj.cityProfiles === 'object') {
    for (const [key, prof] of Object.entries(obj.cityProfiles)) {
      if (!prof || typeof prof !== 'object') continue;
      const lookup = findCityById(key, customCities, customCountries);
      const base = lookup.city
        ? createDefaultCityProfile(lookup.city, lookup.country)
        : null;
      if (!base) continue;

      hydratedProfiles[key] = {
        ...base,
        ...prof,
        countryId: base.countryId,
        cityId: base.cityId,
        coordinates: {
          lat: Number.isFinite(Number(prof.coordinates?.lat))
            ? Number(prof.coordinates?.lat)
            : base.coordinates.lat,
          lng: Number.isFinite(Number(prof.coordinates?.lng))
            ? Number(prof.coordinates?.lng)
            : base.coordinates.lng,
          elevation: Number.isFinite(Number(prof.coordinates?.elevation))
            ? Number(prof.coordinates?.elevation)
            : base.coordinates.elevation,
        },
        calculationSettings: {
          ...base.calculationSettings,
          ...(prof.calculationSettings || {}),
        },
        manualAdjustments: {
          ...base.manualAdjustments,
          ...Object.fromEntries(
            Object.entries(prof.manualAdjustments || {}).filter(
              ([, v]) => Boolean(v) && typeof v === 'object'
            )
          ),
        },
        iqamaTimes: {
          ...base.iqamaTimes,
          ...(prof.iqamaTimes || {}),
        },
        azkarSettings: {
          ...base.azkarSettings,
          ...(prof.azkarSettings || {}),
          perPrayerDelaySec: {
            ...base.azkarSettings.perPrayerDelaySec,
            ...(prof.azkarSettings?.perPrayerDelaySec || {}),
          },
        },
        screenSettings: {
          ...base.screenSettings,
          ...(prof.screenSettings || {}),
        },
        changeHistory: Array.isArray(prof.changeHistory)
          ? prof.changeHistory
              .filter(
                (entry): entry is ChangeHistoryEntry =>
                  Boolean(entry) &&
                  typeof entry === 'object' &&
                  typeof entry.id === 'string' &&
                  typeof entry.timestamp === 'string'
              )
              .slice(0, 100)
          : [],
      };
    }
  }

  // Ensure active city profile exists without overwriting any saved profiles
  if (!hydratedProfiles[activeCityId]) {
    const activeLookup = findCityById(activeCityId, customCities, customCountries);
    if (activeLookup.city) {
      hydratedProfiles[activeCityId] = createDefaultCityProfile(
        activeLookup.city,
        activeLookup.country
      );
    }
  }

  const defaultUi = createDefaultUISettings();
  const rawUi = (obj.ui || {}) as Partial<UISettings>;

  const safeThemeColors: ThemeColors = { ...THEME_PRESETS.gold };
  if (rawUi.themeColors && typeof rawUi.themeColors === 'object') {
    for (const k of Object.keys(THEME_PRESETS.gold) as (keyof ThemeColors)[]) {
      const val = rawUi.themeColors[k];
      if (typeof val === 'string' && val.trim().length > 0) {
        safeThemeColors[k] = val;
      }
    }
  }

  return {
    version: 4,
    activeCountryId,
    activeCityId,
    cityProfiles: hydratedProfiles,
    customCities,
    customCountries,
    ui: {
      ...defaultUi,
      ...rawUi,
      themeColors: safeThemeColors,
      stages: {
        adhan: {
          ...defaultUi.stages.adhan,
          ...(rawUi.stages?.adhan || {}),
        },
        silence: {
          ...defaultUi.stages.silence,
          ...(rawUi.stages?.silence || {}),
        },
      },
    },
  };
}

export function migrateLegacyV3State(
  adapter: StorageAdapter | null = getDefaultStorageAdapter()
): AppRootState | null {
  if (!adapter) return null;
  try {
    const legacyRaw = adapter.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw);
    if (!legacy || typeof legacy !== 'object') return null;

    // Move any large base64 images out of localStorage into IndexedDB asynchronously
    if (typeof legacy.mainBgImg === 'string' && legacy.mainBgImg.startsWith('data:')) {
      void ImageStore.save('main_bg', legacy.mainBgImg);
    }
    if (legacy.stages?.adhan?.img) void ImageStore.save('stage_adhan', legacy.stages.adhan.img);
    if (legacy.stages?.iqama?.img) void ImageStore.save('stage_iqama', legacy.stages.iqama.img);
    if (legacy.stages?.silence?.img) void ImageStore.save('stage_silence', legacy.stages.silence.img);
    if (legacy.stages?.azkar?.img) void ImageStore.save('stage_azkar', legacy.stages.azkar.img);

    const matchedCountry =
      WORLD_COUNTRIES.find((c) => c.nameAr === legacy.country) || findCountryById('JO')!;
    const matchedCity =
      matchedCountry.cities.find((ci) => ci.nameAr === legacy.city) || matchedCountry.cities[0];

    const profile = createDefaultCityProfile(matchedCity, matchedCountry);
    if (legacy.mosqueName) profile.mosqueName = legacy.mosqueName;
    if (legacy.neighborhood) profile.neighborhood = legacy.neighborhood;
    if (legacy.street) profile.street = legacy.street;
    if (legacy.dst === 1 || legacy.dst === -1) {
      profile.calculationSettings.dstMode = String(legacy.dst) as '1' | '-1';
    }
    if (legacy.iqamaTimes) {
      profile.iqamaTimes = { ...profile.iqamaTimes, ...legacy.iqamaTimes };
    }
    if (legacy.prayerOffsets) {
      for (const k of ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
        if (typeof legacy.prayerOffsets[k] === 'number') {
          profile.manualAdjustments[k] = {
            offsetMinutes: legacy.prayerOffsets[k],
            mode: 'permanent',
          };
        }
      }
    }
    if (legacy.stages?.azkar?.stepSec) {
      profile.azkarSettings.stepSec = legacy.stages.azkar.stepSec;
    }

    const defaultUi = createDefaultUISettings();
    const migrated: AppRootState = {
      version: 4,
      activeCountryId: matchedCountry.countryId,
      activeCityId: matchedCity.cityId,
      cityProfiles: { [matchedCity.cityId]: profile },
      customCities: [],
      customCountries: [],
      ui: {
        ...defaultUi,
        themeColors: { ...THEME_PRESETS.gold, ...(legacy.themeColors || {}) },
        iqamaFontSize: legacy.iqamaFontSize || 17,
        stages: {
          adhan: {
            min: legacy.stages?.adhan?.min ?? 3,
            sec: legacy.stages?.adhan?.sec ?? 14,
            pos: legacy.stages?.adhan?.pos || 'top',
          },
          silence: {
            min: legacy.stages?.silence?.min ?? 1,
            sec: legacy.stages?.silence?.sec ?? 0,
          },
        },
        bgBrightness: legacy.bgBrightness ?? 120,
        bgOverlayOpacity: legacy.bgOverlayOpacity ?? 25,
        bgMode: legacy.bgMode || 'bright',
        presetBgUrl:
          typeof legacy.mainBgImg === 'string' && !legacy.mainBgImg.startsWith('data:')
            ? legacy.mainBgImg
            : null,
        soundEnabled: legacy.soundEnabled !== undefined ? legacy.soundEnabled : true,
        audioVolume: legacy.audioVolume ?? 100,
        adhanAudioSource: legacy.adhanAudioSource || 'custom',
        fajrAudioSource: legacy.fajrAudioSource || 'custom',
      },
    };
    return validateAndHydrateAppState(migrated);
  } catch {
    return null;
  }
}

export function loadAppState(
  adapter: StorageAdapter | null = getDefaultStorageAdapter()
): AppRootState {
  if (!adapter) return createDefaultAppState();

  // 1. Try primary v4 storage
  try {
    const raw = adapter.getItem(STATE_STORAGE_KEY);
    if (raw) {
      return validateAndHydrateAppState(JSON.parse(raw));
    }
  } catch {
    // Primary corrupted; try backup below
  }

  // 2. Try verified backup v4 storage
  try {
    const backupRaw = adapter.getItem(BACKUP_STORAGE_KEY);
    if (backupRaw) {
      const recovered = validateAndHydrateAppState(JSON.parse(backupRaw));
      saveAppState(recovered, adapter);
      return recovered;
    }
  } catch {
    // ignore
  }

  // 3. Try legacy v3 migration
  const migrated = migrateLegacyV3State(adapter);
  if (migrated) {
    saveAppState(migrated, adapter);
    return migrated;
  }

  return createDefaultAppState();
}

export function saveAppState(
  state: AppRootState,
  adapter: StorageAdapter | null = getDefaultStorageAdapter()
): SaveResult {
  try {
    const payload = JSON.stringify(state);
    // Validate parseability before writing
    JSON.parse(payload);

    if (adapter) {
      // Write primary first; do NOT overwrite backup until primary write succeeds & verifies!
      adapter.setItem(STATE_STORAGE_KEY, payload);
      const readBack = adapter.getItem(STATE_STORAGE_KEY);
      if (readBack !== payload) {
        return { ok: false, error: 'فشل التحقق من تطابق البيانات بعد الحفظ' };
      }
      // Now safely update backup copy
      try {
        adapter.setItem(BACKUP_STORAGE_KEY, payload);
      } catch {
        // Primary succeeded even if backup quota was tight
      }
    }

    // Async mirror to IndexedDB
    void StateMirrorDB.saveSnapshot(payload);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير معروف أثناء الحفظ';
    return { ok: false, error: `تعذر حفظ الإعدادات: ${message}` };
  }
}

export function getOrCreateCityProfile(
  state: AppRootState,
  cityId: string
): CityProfile {
  const existing = state.cityProfiles[cityId];
  if (existing) return existing;

  const lookup = findCityById(cityId, state.customCities, state.customCountries);
  if (lookup.city) {
    return createDefaultCityProfile(lookup.city, lookup.country);
  }
  const fallbackCountry = findCountryById('JO')!;
  return createDefaultCityProfile(fallbackCountry.cities[0], fallbackCountry);
}

export function recordCityChange(
  profile: CityProfile,
  field: string,
  oldValue: string,
  newValue: string,
  note: string
): CityProfile {
  if (oldValue === newValue) return profile;
  const entry: ChangeHistoryEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    countryId: profile.countryId,
    cityId: profile.cityId,
    field,
    oldValue,
    newValue,
    note,
  };
  return {
    ...profile,
    lastUpdated: new Date().toISOString().slice(0, 10),
    changeHistory: [entry, ...profile.changeHistory].slice(0, 100),
  };
}

export function exportBackupJson(state: AppRootState): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'Al-Moazin Digital Clock',
      version: state.version,
      state,
    },
    null,
    2
  );
}

export function parseBackupJson(jsonStr: string): AppRootState | null {
  try {
    const parsed = JSON.parse(jsonStr);
    const candidate = parsed?.state ? parsed.state : parsed;
    if (!candidate || typeof candidate !== 'object' || !candidate.cityProfiles) {
      return null;
    }
    return validateAndHydrateAppState(candidate);
  } catch {
    return null;
  }
}

export function restoreSingleCityFromBackup(
  currentState: AppRootState,
  backupJsonStr: string,
  targetCityId: string
): { nextState: AppRootState; restored: boolean; reason?: string } {
  const backupState = parseBackupJson(backupJsonStr);
  if (!backupState) {
    return { nextState: currentState, restored: false, reason: 'ملف النسخة الاحتياطية غير صالح' };
  }
  const cityProfile = backupState.cityProfiles[targetCityId];
  if (!cityProfile) {
    return {
      nextState: currentState,
      restored: false,
      reason: 'لم يتم العثور على بيانات هذه المدينة داخل النسخة الاحتياطية',
    };
  }
  if (cityProfile.cityId !== targetCityId) {
    return {
      nextState: currentState,
      restored: false,
      reason: 'عدم تطابق معرف المدينة داخل النسخة الاحتياطية',
    };
  }
  const nextState: AppRootState = {
    ...currentState,
    cityProfiles: {
      ...currentState.cityProfiles,
      [targetCityId]: {
        ...cityProfile,
        changeHistory: [
          {
            id: `${Date.now()}_restore`,
            timestamp: new Date().toISOString(),
            countryId: cityProfile.countryId,
            cityId: cityProfile.cityId,
            field: 'restore_city',
            oldValue: '-',
            newValue: 'restored_from_backup',
            note: 'استعادة إعدادات هذه المدينة من النسخة الاحتياطية دون التأثير على المدن الأخرى',
          },
          ...(cityProfile.changeHistory || []),
        ].slice(0, 100),
      },
    },
  };
  return { nextState, restored: true };
}
