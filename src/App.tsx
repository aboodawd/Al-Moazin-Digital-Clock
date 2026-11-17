import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdjustmentMode,
  AppRootState,
  CityDef,
  CityProfile,
  CountryDef,
  ObligatoryPrayerId,
  PrayerId,
  ThemeColors,
} from './types/prayer';
import {
  createDefaultCityProfile,
  estimateTimeZoneForLocation,
  findCityById,
  findCountryById,
  findCountryByName,
  getCitiesForCountry,
} from './data/worldCities';
import { AUTHENTIC_AZKAR } from './data/azkarData';
import {
  computeCitySchedule,
  getCityWallClock,
  getGregorianArabicForClock,
  getHijriArabicForClock,
} from './engine/prayerCalculator';
import {
  AudioStore,
  ImageStore,
  StateMirrorDB,
  THEME_PRESETS,
  exportBackupJson,
  getOrCreateCityProfile,
  loadAppState,
  parseBackupJson,
  recordCityChange,
  restoreSingleCityFromBackup,
  saveAppState,
  validateAndHydrateAppState,
  type AudioSlotKey,
  type ImageSlotKey,
} from './storage/persistence';
import { syncCityCalculatedTimes } from './engine/onlineSync';
import {
  playAudioSlot,
  setLiveAudioVolume,
  stopAllSounds,
  unlockAudioContext,
} from './engine/audioEngine';
import { releaseScreenWakeLock, requestScreenWakeLock } from './engine/wakeLockManager';
import { StageOverlays, type ActiveStageType } from './components/StageOverlays';
import { SettingsDrawer } from './components/SettingsDrawer';

const DEFAULT_BG_URL =
  'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=80';

const BRIGHTNESS_PRESETS = {
  super: { brightness: 150, overlay: 8, name: 'ساطع جداً ☀️' },
  bright: { brightness: 125, overlay: 22, name: 'ساطع 🌤️' },
  normal: { brightness: 100, overlay: 45, name: 'متوازن ⛅' },
  dim: { brightness: 80, overlay: 70, name: 'ليلي هادئ 🌙' },
};

function formatHHMMSS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export default function App() {
  const [appState, setAppState] = useState<AppRootState>(() => loadAppState());
  const [now, setNow] = useState<Date>(() => new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [saveStatusText, setSaveStatusText] = useState<string>('محفوظ تلقائياً');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [images, setImages] = useState<Record<ImageSlotKey, string | null>>({
    main_bg: null,
    stage_adhan: null,
    stage_iqama: null,
    stage_silence: null,
    stage_azkar: null,
  });

  const [audioNames, setAudioNames] = useState<Record<AudioSlotKey, string | null>>({
    adhan_fajr: null,
    adhan: null,
    iqama: null,
  });
  const [playingAudioSlot, setPlayingAudioSlot] = useState<AudioSlotKey | null>(null);

  // Stage Pipeline State
  const [activeStage, setActiveStage] = useState<ActiveStageType>(null);
  const [stagePrayerName, setStagePrayerName] = useState<string>('المغرب');
  const [stageRemainingSec, setStageRemainingSec] = useState<number>(0);
  const [azkarIndex, setAzkarIndex] = useState<number>(0);
  const [screenDimmed, setScreenDimmed] = useState<boolean>(false);

  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenDimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const azkarDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredPrayersRef = useRef<Record<string, boolean>>({});
  const lastAutoSyncKeyRef = useRef<string>('');
  const appStateRef = useRef<AppRootState>(appState);
  appStateRef.current = appState;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  }, []);

  // Persist helper with verification
  const commitState = useCallback(
    (updater: (prev: AppRootState) => AppRootState, toastOnSave?: string) => {
      setAppState((prev) => {
        const next = updater(prev);
        const res = saveAppState(next);
        if (res.ok) {
          setSaveStatusText('تم الحفظ بنجاح');
          if (toastOnSave) showToast(toastOnSave);
        } else {
          setSaveStatusText('خطأ في الحفظ!');
          showToast(res.error || 'تعذر حفظ الإعدادات');
        }
        return next;
      });
    },
    [showToast]
  );

  // Hydrate IndexedDB media & state mirror on mount
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const loadedImgs = await ImageStore.loadAll();
      if (mounted) setImages(loadedImgs);

      const [fajrA, adhanA, iqamaA] = await Promise.all([
        AudioStore.get('adhan_fajr'),
        AudioStore.get('adhan'),
        AudioStore.get('iqama'),
      ]);
      if (mounted) {
        setAudioNames({
          adhan_fajr: fajrA?.name || null,
          adhan: adhanA?.name || null,
          iqama: iqamaA?.name || null,
        });
      }

      // If localStorage was cleared externally, check IndexedDB mirror
      let hasLocalV4 = false;
      try {
        hasLocalV4 =
          typeof window !== 'undefined' &&
          Boolean(window.localStorage.getItem('almoazin_world_state_v4'));
      } catch {
        hasLocalV4 = false;
      }
      if (!hasLocalV4) {
        const snap = await StateMirrorDB.loadSnapshot();
        if (snap && mounted) {
          try {
            const hydrated = validateAndHydrateAppState(JSON.parse(snap));
            setAppState(hydrated);
            saveAppState(hydrated);
          } catch {
            // ignore
          }
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Active city profile & lookup
  const activeCity = useMemo(
    () => getOrCreateCityProfile(appState, appState.activeCityId),
    [appState]
  );
  const activeCityLookup = useMemo(
    () => findCityById(appState.activeCityId, appState.customCities, appState.customCountries),
    [appState.activeCityId, appState.customCities, appState.customCountries]
  );
  const activeCountryDef =
    activeCityLookup.country ||
    findCountryById(appState.activeCountryId, appState.customCountries);
  const activeCityDef = activeCityLookup.city;

  // City local wall clock & astronomical schedule
  const wallClock = useMemo(
    () => getCityWallClock(now, activeCity.timeZoneId, activeCity.calculationSettings.dstMode),
    [now, activeCity.timeZoneId, activeCity.calculationSettings.dstMode]
  );

  const schedule = useMemo(
    () => computeCitySchedule(activeCity, now),
    [activeCity, now]
  );

  // Apply dynamic CSS theme variables whenever UI settings change
  useEffect(() => {
    const r = document.documentElement.style;
    const tc = appState.ui.themeColors;
    r.setProperty('--mosque-name-color', tc.mosqueNameColor);
    r.setProperty('--clock-box-bg', tc.clockBoxBg);
    r.setProperty('--clock-box-border', tc.clockBoxBorder);
    r.setProperty('--clock-digits-color', tc.clockDigitsColor);
    r.setProperty('--clock-sec-color', tc.clockSecColor);
    r.setProperty('--clock-date-color', tc.clockDateColor);
    r.setProperty('--next-title-color', tc.nextTitleColor);
    r.setProperty('--next-name-color', tc.nextNameColor);
    r.setProperty('--next-timer-color', tc.nextTimerColor);
    r.setProperty('--fajr-num-color', tc.fajrTimeColor);
    r.setProperty('--shuruq-num-color', tc.shuruqTimeColor);
    r.setProperty('--dhuhr-num-color', tc.dhuhrTimeColor);
    r.setProperty('--asr-num-color', tc.asrTimeColor);
    r.setProperty('--maghrib-num-color', tc.maghribTimeColor);
    r.setProperty('--isha-num-color', tc.ishaTimeColor);
    r.setProperty('--cards-bg', tc.cardsBg);
    r.setProperty('--cards-border', tc.cardsBorder);
    r.setProperty('--cards-name-color', tc.cardsNameColor);
    r.setProperty('--jummah-box-bg', tc.jummahBg);
    r.setProperty('--jummah-box-border', tc.jummahBorder);
    r.setProperty('--jummah-text-color', tc.jummahTextColor);
    r.setProperty('--cards-iqama-color', tc.iqamaTextColor);
    r.setProperty('--iqama-font-size', `${appState.ui.iqamaFontSize || 17}px`);
    r.setProperty('--azkar-text-color', tc.azkarTextColor);
    r.setProperty('--azkar-timer-color', tc.azkarTimerColor);
    r.setProperty('--adhan-title-color', tc.adhanTextColor);
    r.setProperty('--adhan-timer-color', tc.adhanTimerColor);
    r.setProperty('--iqama-timer-color', tc.iqamaTimerColor);
    r.setProperty('--silence-timer-color', tc.silenceTimerColor);
  }, [appState.ui.themeColors, appState.ui.iqamaFontSize]);

  // Apply live audio volume
  useEffect(() => {
    setLiveAudioVolume(appState.ui.audioVolume);
  }, [appState.ui.audioVolume]);

  // Online/Offline listener + automatic background sync on date change or reconnect
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      lastAutoSyncKeyRef.current = '';
      showToast('🌐 عاد الاتصال بالإنترنت — جاري مزامنة المواقيت مع الحفاظ على تعديلاتك');
    };
    const onOffline = () => {
      setIsOnline(false);
      showToast('📡 انقطع الإنترنت — يستمر الحساب الفلكي المحلي والتعديلات المحفوظة');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [showToast]);

  const nowRef = useRef<Date>(now);
  nowRef.current = now;

  // Automatic daily sync/cache per cityId + dateStr (never overwrites manualAdjustments)
  useEffect(() => {
    const calc = activeCity.calculationSettings;
    const syncKey = `${activeCity.cityId}_${wallClock.dateStr}_${calc.method}_${calc.madhab}_${calc.fajrAngle}_${calc.ishaAngle}_${calc.ishaInterval}_${calc.highLatitudeRule}_${calc.dstMode}_${isOnline}`;
    if (lastAutoSyncKeyRef.current === syncKey) return;
    lastAutoSyncKeyRef.current = syncKey;

    const targetCityId = activeCity.cityId;
    const targetCountryId = activeCity.countryId;
    void syncCityCalculatedTimes(activeCity, nowRef.current).then((res) => {
      commitState((prev) => {
        const curr = prev.cityProfiles[targetCityId];
        if (!curr || curr.countryId !== targetCountryId || curr.cityId !== targetCityId) {
          return prev;
        }
        return {
          ...prev,
          cityProfiles: {
            ...prev.cityProfiles,
            [targetCityId]: {
              ...curr,
              calculatedPrayerTimes: res.calculated,
              lastUpdated: res.calculated.dateStr,
            },
          },
        };
      });
    });
  }, [activeCity, wallClock.dateStr, isOnline, commitState]);

  // WakeLock Management based on activeCity.screenSettings
  useEffect(() => {
    if (activeCity.screenSettings.mode === 'always_on' || activeStage !== null) {
      void requestScreenWakeLock();
    }
    return () => {
      // keep managed cleanly
    };
  }, [activeCity.screenSettings.mode, activeStage]);

  const scheduleScreenDimAfterEvent = useCallback(
    (eventType: 'after_adhan' | 'after_iqama') => {
      if (screenDimTimerRef.current) {
        clearTimeout(screenDimTimerRef.current);
        screenDimTimerRef.current = null;
      }
      const scr = activeCity.screenSettings;
      if (scr.mode !== eventType) return;
      const delayMs = Math.max(1, scr.timeoutMinutes || 15) * 60 * 1000;
      screenDimTimerRef.current = setTimeout(() => {
        void releaseScreenWakeLock();
        setScreenDimmed(true);
      }, delayMs);
    },
    [activeCity.screenSettings]
  );

  // Clear all stage timers & audio
  const dismissCurrentStage = useCallback(() => {
    stopAllSounds(setPlayingAudioSlot);
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    if (azkarDelayTimerRef.current) {
      clearTimeout(azkarDelayTimerRef.current);
      azkarDelayTimerRef.current = null;
    }
    setActiveStage(null);
  }, []);

  // 4-Stage Pipeline Runner (Adhan -> Iqama Countdown -> Silence Phone -> Azkar)
  const runAzkarStage = useCallback(
    (prayerId: ObligatoryPrayerId, isDemo: boolean) => {
      const citySnapshot = getOrCreateCityProfile(
        appStateRef.current,
        appStateRef.current.activeCityId
      );
      if (!citySnapshot.azkarSettings.enabled && !isDemo) {
        setActiveStage(null);
        return;
      }

      const startAzkarNow = () => {
        setActiveStage('azkar');
        setAzkarIndex(0);
        let stepSec = Math.min(60, Math.max(1, citySnapshot.azkarSettings.stepSec || 5));
        if (isDemo && stepSec > 4) stepSec = 4;

        let idx = 0;
        let rem = stepSec;
        if (stageTimerRef.current) clearInterval(stageTimerRef.current);
        stageTimerRef.current = setInterval(() => {
          rem -= 1;
          if (rem <= 0) {
            idx += 1;
            if (idx >= AUTHENTIC_AZKAR.length || !citySnapshot.azkarSettings.autoSequence) {
              if (stageTimerRef.current) clearInterval(stageTimerRef.current);
              stageTimerRef.current = null;
              setActiveStage(null);
              return;
            }
            rem = stepSec;
            setAzkarIndex(idx);
          }
        }, 1000);
      };

      const baseDelay = citySnapshot.azkarSettings.startDelaySec || 0;
      const prayerDelay = citySnapshot.azkarSettings.perPrayerDelaySec?.[prayerId] || 0;
      const totalDelaySec = isDemo ? 0 : baseDelay + prayerDelay;

      if (totalDelaySec > 0) {
        setActiveStage(null);
        azkarDelayTimerRef.current = setTimeout(startAzkarNow, totalDelaySec * 1000);
      } else {
        startAzkarNow();
      }
    },
    []
  );

  const runSilenceStage = useCallback(
    (prayerId: ObligatoryPrayerId, isDemo: boolean) => {
      const uiSnap = appStateRef.current.ui;
      setActiveStage('silence');
      let rem = isDemo ? 8 : uiSnap.stages.silence.min * 60 + uiSnap.stages.silence.sec;
      if (rem <= 0) rem = 10;
      setStageRemainingSec(rem);

      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      stageTimerRef.current = setInterval(() => {
        rem -= 1;
        setStageRemainingSec(Math.max(0, rem));
        if (rem <= 0) {
          if (stageTimerRef.current) clearInterval(stageTimerRef.current);
          stageTimerRef.current = null;
          runAzkarStage(prayerId, isDemo);
        }
      }, 1000);
    },
    [runAzkarStage]
  );

  const runIqamaStage = useCallback(
    (prayerId: ObligatoryPrayerId, iqamaMin: number, prayerInstantMs: number | null, isDemo: boolean) => {
      setActiveStage('iqama');
      let rem = isDemo ? 10 : Math.max(1, iqamaMin) * 60;
      if (!isDemo && prayerInstantMs !== null) {
        const targetMs = prayerInstantMs + Math.max(1, iqamaMin) * 60 * 1000;
        const calcRem = Math.round((targetMs - Date.now()) / 1000);
        if (calcRem > 0) rem = calcRem;
      }
      if (rem <= 0) rem = 30;
      setStageRemainingSec(rem);

      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      stageTimerRef.current = setInterval(() => {
        rem -= 1;
        setStageRemainingSec(Math.max(0, rem));
        if (rem <= 0) {
          if (stageTimerRef.current) clearInterval(stageTimerRef.current);
          stageTimerRef.current = null;
          void playAudioSlot('iqama', appStateRef.current.ui, setPlayingAudioSlot);
          scheduleScreenDimAfterEvent('after_iqama');
          runSilenceStage(prayerId, isDemo);
        }
      }, 1000);
    },
    [runSilenceStage, scheduleScreenDimAfterEvent]
  );

  const startPrayerSequence = useCallback(
    (
      prayerId: ObligatoryPrayerId,
      prayerName: string,
      iqamaMin: number,
      prayerInstantMs: number | null,
      isDemo: boolean
    ) => {
      dismissCurrentStage();
      setScreenDimmed(false);
      setStagePrayerName(prayerName);
      setActiveStage('adhan');
      scheduleScreenDimAfterEvent('after_adhan');

      const audioKey: AudioSlotKey = prayerId === 'fajr' ? 'adhan_fajr' : 'adhan';
      void playAudioSlot(audioKey, appStateRef.current.ui, setPlayingAudioSlot);

      const uiSnap = appStateRef.current.ui;
      let rem = isDemo ? 10 : uiSnap.stages.adhan.min * 60 + uiSnap.stages.adhan.sec;
      if (rem <= 0) rem = 10;
      setStageRemainingSec(rem);

      stageTimerRef.current = setInterval(() => {
        rem -= 1;
        setStageRemainingSec(Math.max(0, rem));
        if (rem <= 0) {
          if (stageTimerRef.current) clearInterval(stageTimerRef.current);
          stageTimerRef.current = null;
          runIqamaStage(prayerId, iqamaMin, prayerInstantMs, isDemo);
        }
      }, 1000);
    },
    [dismissCurrentStage, runIqamaStage, scheduleScreenDimAfterEvent]
  );

  // 1-Second Master Tick + Automatic Prayer Trigger
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = new Date();
      setNow(currentNow);

      const stateSnap = appStateRef.current;
      const citySnap = getOrCreateCityProfile(stateSnap, stateSnap.activeCityId);
      const clock = getCityWallClock(
        currentNow,
        citySnap.timeZoneId,
        citySnap.calculationSettings.dstMode
      );
      const sched = computeCitySchedule(citySnap, currentNow);
      const nowMin = clock.hour * 60 + clock.minute;

      for (const p of sched.prayers) {
        if (!p.isPrayer) continue;
        if (p.finalMinutes === nowMin && clock.second <= 5) {
          const triggerKey = `${citySnap.cityId}_${clock.dateStr}_${p.id}_${p.finalMinutes}`;
          if (!triggeredPrayersRef.current[triggerKey]) {
            triggeredPrayersRef.current[triggerKey] = true;
            startPrayerSequence(
              p.id as ObligatoryPrayerId,
              p.name,
              p.iqamaMinutesAfter,
              p.instantMs,
              false
            );
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startPrayerSequence]);

  // Audio unlock + keyboard shortcuts + auto-hide mouse on TV
  useEffect(() => {
    const onUnlock = () => unlockAudioContext();
    window.addEventListener('click', onUnlock, { passive: true });
    window.addEventListener('touchstart', onUnlock, { passive: true });

    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudioContext();
      setScreenDimmed(false);
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA');
      if (isTyping && e.key !== 'Escape') return;

      if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'b' || e.key === 'B') {
        handleCycleBrightness();
      } else if (e.key === 's' || e.key === 'S') {
        setIsDrawerOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        dismissCurrentStage();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    let mouseTimer: ReturnType<typeof setTimeout>;
    const onMouseMove = () => {
      document.body.style.cursor = 'default';
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        document.body.style.cursor = 'none';
      }, 6000);
    };
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('click', onUnlock);
      window.removeEventListener('touchstart', onUnlock);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousemove', onMouseMove);
      clearTimeout(mouseTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissCurrentStage]);

  // Handlers for Country / City Switching (strictly isolated!)
  const handleSelectCountry = useCallback(
    (countryId: string) => {
      const country = findCountryById(countryId, appStateRef.current.customCountries);
      if (!country) return;
      const cities = getCitiesForCountry(countryId, appStateRef.current.customCities);
      const firstCity = cities[0];
      if (!firstCity) return;

      dismissCurrentStage();
      commitState(
        (prev) => {
          const existingProfile = prev.cityProfiles[firstCity.cityId];
          const nextProfiles = existingProfile
            ? prev.cityProfiles
            : {
                ...prev.cityProfiles,
                [firstCity.cityId]: createDefaultCityProfile(firstCity, country),
              };
          return {
            ...prev,
            activeCountryId: countryId,
            activeCityId: firstCity.cityId,
            cityProfiles: nextProfiles,
          };
        },
        `تم الانتقال إلى ${country.nameAr} — ${firstCity.nameAr}`
      );
    },
    [commitState, dismissCurrentStage]
  );

  const handleSelectCity = useCallback(
    (cityId: string) => {
      const lookup = findCityById(
        cityId,
        appStateRef.current.customCities,
        appStateRef.current.customCountries
      );
      if (!lookup.city) return;
      const targetCity = lookup.city;
      const targetCountry = lookup.country;

      dismissCurrentStage();
      commitState(
        (prev) => {
          const existingProfile = prev.cityProfiles[targetCity.cityId];
          const nextProfiles = existingProfile
            ? prev.cityProfiles
            : {
                ...prev.cityProfiles,
                [targetCity.cityId]: createDefaultCityProfile(targetCity, targetCountry),
              };
          return {
            ...prev,
            activeCountryId: targetCity.countryId,
            activeCityId: targetCity.cityId,
            cityProfiles: nextProfiles,
          };
        },
        `تم تفعيل مدينة ${targetCity.nameAr}`
      );
    },
    [commitState, dismissCurrentStage]
  );

  const handleAddCustomCity = useCallback(
    (cityInput: {
      countryNameAr: string;
      cityNameAr: string;
      cityNameEn?: string;
      lat: number;
      lng: number;
      timeZoneId?: string;
    }) => {
      const countryLabel = cityInput.countryNameAr.trim();
      const cityLabel = cityInput.cityNameAr.trim();
      if (!countryLabel || !cityLabel) return;

      dismissCurrentStage();
      commitState(
        (prev) => {
          const existingCountry = findCountryByName(countryLabel, prev.customCountries);
          let targetCountry: CountryDef;
          let nextCustomCountries = prev.customCountries || [];

          if (existingCountry) {
            targetCountry = existingCountry;
          } else {
            const customCountryId = `CUSTOM_${Date.now()}`;
            targetCountry = {
              countryId: customCountryId,
              nameAr: countryLabel,
              nameEn: countryLabel,
              region: 'arab',
              defaultMethod: 'MuslimWorldLeague',
              defaultMadhab: 'shafi',
              defaultHighLatitudeRule:
                Math.abs(cityInput.lat) >= 48 ? 'SeventhOfTheNight' : 'MiddleOfTheNight',
              cities: [],
            };
            nextCustomCountries = [...nextCustomCountries, targetCountry];
          }

          const resolvedTz =
            cityInput.timeZoneId && cityInput.timeZoneId.trim()
              ? cityInput.timeZoneId.trim()
              : estimateTimeZoneForLocation(
                  countryLabel,
                  cityInput.lat,
                  cityInput.lng,
                  nextCustomCountries
                );

          const slug = `${targetCountry.countryId.toLowerCase()}_custom_${Date.now()}`;
          const newCity: CityDef = {
            cityId: slug,
            countryId: targetCountry.countryId,
            nameAr: cityLabel,
            nameEn: cityInput.cityNameEn?.trim() || cityLabel,
            lat: cityInput.lat,
            lng: cityInput.lng,
            timeZoneId: resolvedTz,
            isCustom: true,
          };
          const profile = createDefaultCityProfile(newCity, targetCountry);

          return {
            ...prev,
            activeCountryId: targetCountry.countryId,
            activeCityId: newCity.cityId,
            customCountries: nextCustomCountries,
            customCities: [...prev.customCities, newCity],
            cityProfiles: {
              ...prev.cityProfiles,
              [newCity.cityId]: profile,
            },
          };
        },
        `تمت إضافة وتفعيل ${cityLabel} (${countryLabel})`
      );
    },
    [commitState, dismissCurrentStage]
  );

  const handleUpdateCity = useCallback(
    (
      updater: (prev: CityProfile) => CityProfile,
      historyNote?: { field: string; oldVal: string; newVal: string; note: string }
    ) => {
      const targetCityId = appStateRef.current.activeCityId;
      const targetCountryId = appStateRef.current.activeCountryId;

      commitState((prev) => {
        if (prev.activeCityId !== targetCityId || prev.activeCountryId !== targetCountryId) {
          return prev;
        }
        const curr = getOrCreateCityProfile(prev, targetCityId);
        if (curr.cityId !== targetCityId || curr.countryId !== targetCountryId) {
          return prev;
        }
        let updated = updater(curr);
        if (historyNote) {
          updated = recordCityChange(
            updated,
            historyNote.field,
            historyNote.oldVal,
            historyNote.newVal,
            historyNote.note
          );
        }
        return {
          ...prev,
          cityProfiles: {
            ...prev.cityProfiles,
            [targetCityId]: updated,
          },
        };
      });
    },
    [commitState]
  );

  const handleUpdateUI = useCallback(
    (updater: (prev: AppRootState['ui']) => AppRootState['ui']) => {
      commitState((prev) => ({
        ...prev,
        ui: updater(prev.ui),
      }));
    },
    [commitState]
  );

  const handleAdjustPrayerOffset = useCallback(
    (prayerId: PrayerId, delta: number) => {
      const currAdj = activeCity.manualAdjustments[prayerId] || {
        offsetMinutes: 0,
        mode: 'permanent' as AdjustmentMode,
      };
      const nextVal = (currAdj.offsetMinutes || 0) + delta;
      handleUpdateCity(
        (prev) => ({
          ...prev,
          manualAdjustments: {
            ...prev.manualAdjustments,
            [prayerId]: {
              ...currAdj,
              offsetMinutes: nextVal,
            },
          },
        }),
        {
          field: `offset_${prayerId}`,
          oldVal: `${currAdj.offsetMinutes}د`,
          newVal: `${nextVal}د`,
          note: `تعديل يدوي لصلاة ${prayerId}`,
        }
      );
    },
    [activeCity.manualAdjustments, handleUpdateCity]
  );

  const handleChangeAdjustmentMode = useCallback(
    (prayerId: PrayerId, mode: AdjustmentMode, tempDate?: string) => {
      const currAdj = activeCity.manualAdjustments[prayerId] || {
        offsetMinutes: 0,
        mode: 'permanent' as AdjustmentMode,
      };
      handleUpdateCity(
        (prev) => ({
          ...prev,
          manualAdjustments: {
            ...prev.manualAdjustments,
            [prayerId]: {
              ...currAdj,
              mode,
              temporaryDate: mode === 'temporary' ? tempDate || wallClock.dateStr : undefined,
            },
          },
        }),
        {
          field: `mode_${prayerId}`,
          oldVal: currAdj.mode,
          newVal: mode,
          note: mode === 'permanent' ? 'تثبيت التعديل دائماً' : `تحديد التعديل ليوم ${tempDate}`,
        }
      );
    },
    [activeCity.manualAdjustments, handleUpdateCity, wallClock.dateStr]
  );

  const handleResetSingleOffset = useCallback(
    (prayerId: PrayerId) => {
      const prevOff = activeCity.manualAdjustments[prayerId]?.offsetMinutes || 0;
      handleUpdateCity(
        (prev) => ({
          ...prev,
          manualAdjustments: {
            ...prev.manualAdjustments,
            [prayerId]: { offsetMinutes: 0, mode: 'permanent' },
          },
        }),
        {
          field: `reset_${prayerId}`,
          oldVal: `${prevOff}د`,
          newVal: '0د',
          note: `إعادة صلاة ${prayerId} إلى الوقت الأصلي`,
        }
      );
      showToast('تمت إعادة الصلاة إلى التوقيت الأصلي');
    },
    [activeCity.manualAdjustments, handleUpdateCity, showToast]
  );

  const handleResetAllOffsets = useCallback(() => {
    handleUpdateCity(
      (prev) => ({
        ...prev,
        manualAdjustments: {
          fajr: { offsetMinutes: 0, mode: 'permanent' },
          shuruq: { offsetMinutes: 0, mode: 'permanent' },
          dhuhr: { offsetMinutes: 0, mode: 'permanent' },
          asr: { offsetMinutes: 0, mode: 'permanent' },
          maghrib: { offsetMinutes: 0, mode: 'permanent' },
          isha: { offsetMinutes: 0, mode: 'permanent' },
        },
      }),
      {
        field: 'reset_all_offsets',
        oldVal: 'custom',
        newVal: '0د',
        note: 'إلغاء جميع التعديلات اليدوية لهذه المدينة فقط',
      }
    );
    showToast('تمت إعادة ضبط جميع تعديلات هذه المدينة إلى (0 دقيقة)');
  }, [handleUpdateCity, showToast]);

  // Image & Audio Handlers
  const handleUploadImage = useCallback(
    (slot: ImageSlotKey, file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl !== 'string') return;
        const ok = await ImageStore.save(slot, dataUrl);
        setImages((prev) => ({ ...prev, [slot]: dataUrl }));
        if (slot === 'main_bg') {
          handleUpdateUI((prev) => ({ ...prev, presetBgUrl: null }));
        }
        showToast(ok ? 'تم حفظ الصورة بنجاح 🖼️' : 'تم تحميل الصورة مؤقتاً');
      };
      reader.readAsDataURL(file);
    },
    [handleUpdateUI, showToast]
  );

  const handleClearImage = useCallback(
    async (slot: ImageSlotKey) => {
      await ImageStore.remove(slot);
      setImages((prev) => ({ ...prev, [slot]: null }));
      if (slot === 'main_bg') {
        handleUpdateUI((prev) => ({ ...prev, presetBgUrl: null }));
        showToast('تمت استعادة الخلفية الأصلية للمسجد');
      } else {
        showToast('تم مسح الصورة');
      }
    },
    [handleUpdateUI, showToast]
  );

  const handleSelectPresetBg = useCallback(
    async (url: string) => {
      await ImageStore.remove('main_bg');
      setImages((prev) => ({ ...prev, main_bg: null }));
      handleUpdateUI((prev) => ({ ...prev, presetBgUrl: url }));
      showToast('تم تغيير خلفية الشاشة بنجاح 🖼️');
    },
    [handleUpdateUI, showToast]
  );

  const handleApplyBrightnessPreset = useCallback(
    (mode: 'super' | 'bright' | 'normal' | 'dim') => {
      const p = BRIGHTNESS_PRESETS[mode];
      handleUpdateUI((prev) => ({
        ...prev,
        bgBrightness: p.brightness,
        bgOverlayOpacity: p.overlay,
        bgMode: mode,
      }));
      showToast(`تم تفعيل وضع السطوع: ${p.name}`);
    },
    [handleUpdateUI, showToast]
  );

  const handleCycleBrightness = useCallback(() => {
    const order: ('super' | 'bright' | 'normal' | 'dim')[] = ['super', 'bright', 'normal', 'dim'];
    const idx = order.indexOf(appStateRef.current.ui.bgMode as 'super' | 'bright' | 'normal' | 'dim');
    const nextMode = order[(idx === -1 ? 1 : idx + 1) % order.length];
    handleApplyBrightnessPreset(nextMode);
  }, [handleApplyBrightnessPreset]);

  const handleApplyThemePreset = useCallback(
    (preset: 'gold' | 'blue' | 'green' | 'silver') => {
      handleUpdateUI((prev) => ({
        ...prev,
        themeColors: { ...THEME_PRESETS[preset] },
      }));
    },
    [handleUpdateUI]
  );

  const handleChangeThemeColor = useCallback(
    (key: keyof ThemeColors, value: string) => {
      handleUpdateUI((prev) => ({
        ...prev,
        themeColors: {
          ...prev.themeColors,
          [key]: value,
        },
      }));
    },
    [handleUpdateUI]
  );

  const handleSetAllTimersColor = useCallback(
    (hex: string) => {
      handleUpdateUI((prev) => ({
        ...prev,
        themeColors: {
          ...prev.themeColors,
          nextTimerColor: hex,
          adhanTimerColor: hex,
          iqamaTimerColor: hex,
          azkarTimerColor: hex,
          silenceTimerColor: hex,
        },
      }));
      showToast(`تم توحيد لون جميع العدادات إلى ${hex}`);
    },
    [handleUpdateUI, showToast]
  );

  const handleResetThemeColors = useCallback(() => {
    handleApplyThemePreset('gold');
    showToast('تمت استعادة الألوان الافتراضية');
  }, [handleApplyThemePreset, showToast]);

  const handleUploadAudio = useCallback(
    (slot: AudioSlotKey, file: File) => {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const label = `${file.name} (${sizeStr})`;
      showToast(`جاري تحميل ملف الصوت: ${file.name} ...`);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl !== 'string') return;
        await AudioStore.save(slot, dataUrl, label, file.size);
        setAudioNames((prev) => ({ ...prev, [slot]: label }));
        if (slot === 'adhan_fajr') {
          handleUpdateUI((prev) => ({ ...prev, fajrAudioSource: 'custom' }));
        } else if (slot === 'adhan') {
          handleUpdateUI((prev) => ({ ...prev, adhanAudioSource: 'custom' }));
        }
        showToast('✔ تم رفع وحفظ ملف الصوت بنجاح!');
      };
      reader.readAsDataURL(file);
    },
    [handleUpdateUI, showToast]
  );

  const handleRemoveAudio = useCallback(
    async (slot: AudioSlotKey) => {
      stopAllSounds(setPlayingAudioSlot);
      await AudioStore.remove(slot);
      setAudioNames((prev) => ({ ...prev, [slot]: null }));
      showToast('تم حذف ملف الصوت');
    },
    [showToast]
  );

  const handleTestAudio = useCallback(
    (slot: AudioSlotKey) => {
      void playAudioSlot(slot, appStateRef.current.ui, setPlayingAudioSlot, showToast);
    },
    [showToast]
  );

  const handleRefreshAndSync = useCallback(async () => {
    const res = await syncCityCalculatedTimes(activeCity, new Date());
    handleUpdateCity((prev) => ({
      ...prev,
      calculatedPrayerTimes: res.calculated,
      lastUpdated: res.calculated.dateStr,
    }));
    showToast(res.message);
  }, [activeCity, handleUpdateCity, showToast]);

  // Backup & Restore Handlers
  const handleExportBackup = useCallback(() => {
    const json = exportBackupJson(appStateRef.current);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `almoazin_backup_${wallClock.dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✔ تم تنزيل ملف النسخة الاحتياطية بنجاح');
  }, [showToast, wallClock.dateStr]);

  const handleImportFullBackup = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        const restored = parseBackupJson(text);
        if (!restored) {
          showToast('❌ ملف النسخة الاحتياطية غير صالح');
          return;
        }
        commitState(() => restored, '✔ تمت استعادة النسخة الاحتياطية الكاملة بنجاح');
      };
      reader.readAsText(file);
    },
    [commitState, showToast]
  );

  const handleRestoreSingleCityBackup = useCallback(
    (file: File) => {
      const targetCityId = activeCity.cityId;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        const result = restoreSingleCityFromBackup(appStateRef.current, text, targetCityId);
        if (!result.restored) {
          showToast(result.reason || 'تعذر استعادة هذه المدينة');
          return;
        }
        commitState(
          () => result.nextState,
          `✔ تمت استعادة إعدادات ${activeCityDef?.nameAr || targetCityId} فقط دون المساس بالمدن الأخرى`
        );
      };
      reader.readAsText(file);
    },
    [activeCity.cityId, activeCityDef?.nameAr, commitState, showToast]
  );

  // Clock digits for the active city
  const h12 = wallClock.hour % 12 || 12;
  const clkHM = `${h12}:${String(wallClock.minute).padStart(2, '0')}`;
  const clkSec = String(wallClock.second).padStart(2, '0');
  const clkAmPm = wallClock.hour >= 12 ? 'PM' : 'AM';
  const hijriDateStr = getHijriArabicForClock(wallClock);
  const gregDateStr = getGregorianArabicForClock(wallClock);

  const shuruqItem = schedule.prayers.find((p) => p.id === 'shuruq');
  const cardPrayers = schedule.prayers.filter((p) => p.isPrayer);

  const activeMainBgUrl = images.main_bg || appState.ui.presetBgUrl || DEFAULT_BG_URL;

  // Next Prayer OR Active Post-Adhan Iqama Countdown
  const iqamaCd = schedule.activeIqamaCountdown;
  const nextTitleLabel = iqamaCd ? 'الوقت المتبقي لإقامة الصلاة' : 'باقي للصلاة القادمة';
  const nextNameLabel = iqamaCd ? iqamaCd.prayerName : schedule.nextPrayer.name;
  const nextTimeLabel = iqamaCd
    ? iqamaCd.remainingSeconds <= 3
      ? 'حان موعد الإقامة'
      : `إقامة ${activeCity.iqamaTimes[iqamaCd.prayerId]} د`
    : schedule.nextPrayer.timeFormatted12WithPeriod;
  const nextTimerDisplay = iqamaCd
    ? formatHHMMSS(iqamaCd.remainingSeconds)
    : formatHHMMSS(schedule.nextPrayer.remainingSeconds);

  return (
    <>
      <div
        className="bg-layer"
        id="main-bg-layer"
        style={{
          backgroundImage: `url('${activeMainBgUrl}')`,
          filter: `brightness(${appState.ui.bgBrightness}%) contrast(105%)`,
        }}
      />
      <div
        className="bg-overlay"
        style={{
          background: `rgba(6, 11, 8, ${appState.ui.bgOverlayOpacity / 100})`,
          backdropFilter: appState.ui.bgOverlayOpacity < 15 ? 'none' : 'blur(1.5px)',
        }}
      />

      {/* Top Left Action Icons */}
      <div className="top-icons-bar">
        <button
          className="icon-btn"
          id="btn-toggle-settings"
          title="إعدادات الساعة والمواقيت (S)"
          onClick={() => setIsDrawerOpen(true)}
        >
          ⚙️
        </button>
        <button
          className="icon-btn"
          id="btn-fs"
          title="ملء الشاشة (F / F11)"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
        >
          ⛶
        </button>
      </div>

      {/* Top Center Mosque Name */}
      <div className="mosque-title-container">
        <h1 className="mosque-name-text" id="disp-mosque-name">
          {activeCity.mosqueName}
        </h1>
      </div>

      {/* Main Viewport Content */}
      <div className="main-display-area">
        {/* Center Clock Row */}
        <div className="center-clock-row">
          {/* Jummah Box (Always follows Dhuhr!) */}
          <div className="side-box-card" id="box-jummah">
            <h3>الجمعة</h3>
            <div className="time-val" id="disp-jummah-val">
              {schedule.jummahFormatted12}
            </div>
          </div>

          {/* Central Giant Clock Box */}
          <div className="giant-clock-card">
            <div className="clock-digits-row">
              <div className="seconds-ampm-col">
                <span className="sec-num" id="clk-sec">
                  {clkSec}
                </span>
                <span className="ampm-lbl" id="clk-ampm">
                  {clkAmPm}
                </span>
              </div>
              <div className="main-hours-minutes" id="clk-hm">
                {clkHM}
              </div>
            </div>

            <div className="clock-dates-sub">
              <div id="disp-hijri-date">{hijriDateStr}</div>
              <div id="disp-greg-date">{gregDateStr}</div>
              <div
                id="disp-active-location"
                style={{ fontSize: '0.8em', opacity: 0.9, marginTop: '2px' }}
              >
                {activeCountryDef?.nameAr || ''} — {activeCityDef?.nameAr || ''}
              </div>
            </div>
          </div>

          {/* Shuruq Box */}
          <div className="side-box-card" id="box-shuruq">
            <h3>الشروق</h3>
            <div className="time-val" id="disp-shuruq-val">
              {shuruqItem?.finalFormatted12 || '05:52'}
            </div>
          </div>
        </div>

        {/* Next Prayer / Post-Adhan Iqama Countdown Section */}
        <div className="next-prayer-center">
          <div className="next-prayer-title">{nextTitleLabel}</div>
          <div className="next-prayer-info-row">
            <span className="next-prayer-name" id="disp-next-prayer-title">
              {nextNameLabel}
            </span>
            <span className="next-prayer-time-val" id="disp-next-prayer-time">
              {nextTimeLabel}
            </span>
          </div>
          <div className="next-prayer-timer" id="disp-remaining-time">
            {nextTimerDisplay}
          </div>
        </div>

        {/* Bottom 5 Prayer Cards */}
        <div className="prayer-cards-bar">
          {cardPrayers.map((p) => {
            const isHighlighted =
              iqamaCd ? iqamaCd.prayerId === p.id : schedule.nextPrayer.id === p.id;
            return (
              <div
                key={p.id}
                className={`prayer-card-item${isHighlighted ? ' active-highlight' : ''}`}
                id={`card-${p.id}`}
              >
                <div className="card-name">{p.name}</div>
                <div className="card-time" id={`time-${p.id}`}>
                  {p.finalFormatted12}
                </div>
                <div className="card-iqama" id={`iqama-lbl-${p.id}`}>
                  إقامة {p.iqamaMinutesAfter} د
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Fullscreen Prayer Stages + Graceful Screen Dimmer */}
      <StageOverlays
        activeStage={activeStage}
        adhanPrayerName={stagePrayerName}
        adhanPos={appState.ui.stages.adhan.pos}
        stageRemainingSec={stageRemainingSec}
        azkarIndex={azkarIndex}
        adhanImg={images.stage_adhan}
        iqamaImg={images.stage_iqama}
        silenceImg={images.stage_silence}
        azkarImg={images.stage_azkar}
        mainBgImg={images.main_bg || appState.ui.presetBgUrl}
        onDismiss={dismissCurrentStage}
        screenDimmed={screenDimmed}
        keepClockVisibleWhenDimmed={activeCity.screenSettings.keepClockVisible}
        dimmedClockHM={clkHM}
        dimmedClockAmPm={clkAmPm}
        onWakeScreen={() => {
          setScreenDimmed(false);
          if (activeCity.screenSettings.mode === 'always_on') {
            void requestScreenWakeLock();
          }
        }}
      />

      {/* Settings Side Drawer */}
      <SettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        appState={appState}
        activeCity={activeCity}
        wallClock={wallClock}
        schedule={schedule}
        isOnline={isOnline}
        saveStatusText={saveStatusText}
        images={images}
        audioNames={audioNames}
        playingAudioSlot={playingAudioSlot}
        onSelectCountry={handleSelectCountry}
        onSelectCity={handleSelectCity}
        onAddCustomCity={handleAddCustomCity}
        onUpdateCity={handleUpdateCity}
        onUpdateUI={handleUpdateUI}
        onAdjustPrayerOffset={handleAdjustPrayerOffset}
        onChangeAdjustmentMode={handleChangeAdjustmentMode}
        onResetSingleOffset={handleResetSingleOffset}
        onResetAllOffsets={handleResetAllOffsets}
        onUploadImage={handleUploadImage}
        onClearImage={handleClearImage}
        onSelectPresetBg={handleSelectPresetBg}
        onApplyBrightnessPreset={handleApplyBrightnessPreset}
        onCycleBrightnessMode={handleCycleBrightness}
        onApplyThemePreset={handleApplyThemePreset}
        onChangeThemeColor={handleChangeThemeColor}
        onSetAllTimersColor={handleSetAllTimersColor}
        onResetThemeColors={handleResetThemeColors}
        onUploadAudio={handleUploadAudio}
        onRemoveAudio={handleRemoveAudio}
        onTestAudio={handleTestAudio}
        onStopSounds={() => stopAllSounds(setPlayingAudioSlot)}
        onToggleSoundQuick={() =>
          handleUpdateUI((prev) => {
            const nextVal = !prev.soundEnabled;
            showToast(nextVal ? '🔊 تم تفعيل الصوت' : '🔇 تم كتم الصوت');
            return { ...prev, soundEnabled: nextVal };
          })
        }
        onRefreshAndSync={handleRefreshAndSync}
        onRunDemoSequence={() => {
          setIsDrawerOpen(false);
          showToast('بدء تجربة المراحل الأربعة بالتسلسل...');
          startPrayerSequence('maghrib', 'المغرب', 1, null, true);
        }}
        onTestScreenSaver={() => {
          setIsDrawerOpen(false);
          setScreenDimmed(true);
        }}
        onExportBackup={handleExportBackup}
        onImportFullBackup={handleImportFullBackup}
        onRestoreSingleCityBackup={handleRestoreSingleCityBackup}
      />

      {/* Toast Notification */}
      <div id="app-toast" className={`app-toast-message${toastMsg ? ' show' : ''}`}>
        {toastMsg || ''}
      </div>
    </>
  );
}
