import assert from 'node:assert/strict';
import {
  WORLD_COUNTRIES,
  createDefaultCityProfile,
  estimateTimeZoneForLocation,
  findCityById,
  findCountryById,
  findCountryByName,
  searchCities,
  searchCountries,
} from '../src/data/worldCities';
import {
  calculatePrayersForDateYMD,
  computeCitySchedule,
  getCityWallClock,
  getGregorianArabicForClock,
  getHijriArabicForClock,
} from '../src/engine/prayerCalculator';
import {
  BACKUP_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  STATE_STORAGE_KEY,
  createDefaultAppState,
  exportBackupJson,
  getOrCreateCityProfile,
  loadAppState,
  parseBackupJson,
  recordCityChange,
  restoreSingleCityFromBackup,
  saveAppState,
  type StorageAdapter,
} from '../src/storage/persistence';
import { syncCityCalculatedTimes } from '../src/engine/onlineSync';
import type { AppRootState, CityProfile } from '../src/types/prayer';

class MockStorage implements StorageAdapter {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

async function runTests() {
  let passed = 0;
  const test = (name: string, fn: () => void | Promise<void>) => {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        passed += 1;
        console.log(`✔ PASS: ${name}`);
      });
  };

  // 1. Database integrity & Arabic/English search
  await test('1. World Countries & Cities DB integrity + Germany cities + search', () => {
    const countryIds = new Set<string>();
    const cityIds = new Set<string>();
    for (const co of WORLD_COUNTRIES) {
      assert.ok(!countryIds.has(co.countryId), `Duplicate countryId: ${co.countryId}`);
      countryIds.add(co.countryId);
      assert.ok(co.cities.length > 0, `Country ${co.countryId} has no cities`);
      for (const ci of co.cities) {
        assert.ok(!cityIds.has(ci.cityId), `Duplicate cityId: ${ci.cityId}`);
        assert.equal(ci.countryId, co.countryId, `Mismatched countryId on ${ci.cityId}`);
        cityIds.add(ci.cityId);
      }
    }

    // Required German cities
    const requiredDeCities = [
      'de_hameln',
      'de_kassel',
      'de_berlin',
      'de_frankfurt',
      'de_hannover',
      'de_munich',
      'de_hamburg',
      'de_stuttgart',
      'de_dusseldorf',
      'de_cologne',
    ];
    for (const cid of requiredDeCities) {
      const found = findCityById(cid);
      assert.ok(found.city, `Missing German city: ${cid}`);
      assert.equal(found.city!.timeZoneId, 'Europe/Berlin');
    }

    // Search Arabic & English
    assert.ok(searchCountries('ألمانيا').some((c) => c.countryId === 'DE'));
    assert.ok(searchCountries('germany').some((c) => c.countryId === 'DE'));
    assert.ok(searchCities('DE', 'Hameln').some((c) => c.cityId === 'de_hameln'));
    assert.ok(searchCities('DE', 'كاسل').some((c) => c.cityId === 'de_kassel'));
  });

  // 2. Complete Country Independence
  await test('2. Complete Country Independence (US / SA / DZ)', () => {
    let state: AppRootState = createDefaultAppState();

    // Switch to US (New York) & modify
    const us = findCountryById('US')!;
    const nyDef = findCityById('us_newyork').city!;
    let nyProf = createDefaultCityProfile(nyDef, us);
    nyProf = {
      ...nyProf,
      manualAdjustments: {
        ...nyProf.manualAdjustments,
        fajr: { offsetMinutes: 7, mode: 'permanent' },
      },
      iqamaTimes: { ...nyProf.iqamaTimes, fajr: 25 },
      azkarSettings: { ...nyProf.azkarSettings, stepSec: 12 },
      screenSettings: { mode: 'after_adhan', timeoutMinutes: 20, keepClockVisible: false },
    };
    state = {
      ...state,
      activeCountryId: 'US',
      activeCityId: 'us_newyork',
      cityProfiles: { ...state.cityProfiles, us_newyork: nyProf },
    };

    // Switch to Saudi Arabia (Riyadh) -> must remain default, zero leakage from US
    const saRiyadh = getOrCreateCityProfile(state, 'sa_riyadh');
    assert.equal(saRiyadh.manualAdjustments.fajr.offsetMinutes, 0);
    assert.equal(saRiyadh.iqamaTimes.fajr, 20);
    assert.equal(saRiyadh.azkarSettings.stepSec, 5);
    assert.equal(saRiyadh.screenSettings.mode, 'always_on');

    // Edit Riyadh Maghrib -3 & Iqama Maghrib 8
    const saRiyadhEdited: CityProfile = {
      ...saRiyadh,
      manualAdjustments: {
        ...saRiyadh.manualAdjustments,
        maghrib: { offsetMinutes: -3, mode: 'permanent' },
      },
      iqamaTimes: { ...saRiyadh.iqamaTimes, maghrib: 8 },
    };
    state = {
      ...state,
      activeCountryId: 'SA',
      activeCityId: 'sa_riyadh',
      cityProfiles: { ...state.cityProfiles, sa_riyadh: saRiyadhEdited },
    };

    // Switch to Algeria (Algiers) -> untouched defaults
    const dzAlgiers = getOrCreateCityProfile(state, 'dz_algiers');
    assert.equal(dzAlgiers.manualAdjustments.fajr.offsetMinutes, 0);
    assert.equal(dzAlgiers.manualAdjustments.maghrib.offsetMinutes, 0);
    assert.equal(dzAlgiers.iqamaTimes.maghrib, 10);

    // Return to US & SA -> each retains exact edits
    const restoredNy = getOrCreateCityProfile(state, 'us_newyork');
    assert.equal(restoredNy.manualAdjustments.fajr.offsetMinutes, 7);
    assert.equal(restoredNy.iqamaTimes.fajr, 25);
    assert.equal(restoredNy.azkarSettings.stepSec, 12);
    assert.equal(restoredNy.screenSettings.mode, 'after_adhan');
    assert.equal(restoredNy.screenSettings.timeoutMinutes, 20);

    const restoredRiyadh = getOrCreateCityProfile(state, 'sa_riyadh');
    assert.equal(restoredRiyadh.manualAdjustments.maghrib.offsetMinutes, -3);
    assert.equal(restoredRiyadh.iqamaTimes.maghrib, 8);
    assert.equal(restoredRiyadh.manualAdjustments.fajr.offsetMinutes, 0);
  });

  // 3. Complete City Independence inside the same country (Berlin / Kassel / Hameln)
  await test('3. Complete City Independence within Germany (Berlin / Kassel / Hameln)', () => {
    let state = createDefaultAppState();
    const berlinBase = getOrCreateCityProfile(state, 'de_berlin');
    const berlinEdited: CityProfile = {
      ...berlinBase,
      manualAdjustments: {
        ...berlinBase.manualAdjustments,
        fajr: { offsetMinutes: 10, mode: 'permanent' },
      },
      azkarSettings: { ...berlinBase.azkarSettings, enabled: false },
    };
    state = {
      ...state,
      activeCountryId: 'DE',
      activeCityId: 'de_berlin',
      cityProfiles: { ...state.cityProfiles, de_berlin: berlinEdited },
    };

    // Switch to Kassel -> must NOT inherit Berlin's +10 Fajr or disabled Azkar
    const kasselBase = getOrCreateCityProfile(state, 'de_kassel');
    assert.equal(kasselBase.manualAdjustments.fajr.offsetMinutes, 0);
    assert.equal(kasselBase.azkarSettings.enabled, true);

    const kasselEdited: CityProfile = {
      ...kasselBase,
      manualAdjustments: {
        ...kasselBase.manualAdjustments,
        asr: { offsetMinutes: 5, mode: 'permanent' },
      },
      calculationSettings: { ...kasselBase.calculationSettings, madhab: 'hanafi' },
    };
    state = {
      ...state,
      activeCityId: 'de_kassel',
      cityProfiles: { ...state.cityProfiles, de_kassel: kasselEdited },
    };

    // Switch to Hameln -> untouched defaults
    const hameln = getOrCreateCityProfile(state, 'de_hameln');
    assert.equal(hameln.manualAdjustments.fajr.offsetMinutes, 0);
    assert.equal(hameln.manualAdjustments.asr.offsetMinutes, 0);
    assert.equal(hameln.calculationSettings.madhab, 'shafi');

    // Return to Berlin & Kassel -> exact saved values preserved
    assert.equal(getOrCreateCityProfile(state, 'de_berlin').manualAdjustments.fajr.offsetMinutes, 10);
    assert.equal(getOrCreateCityProfile(state, 'de_berlin').azkarSettings.enabled, false);
    assert.equal(getOrCreateCityProfile(state, 'de_kassel').manualAdjustments.asr.offsetMinutes, 5);
    assert.equal(getOrCreateCityProfile(state, 'de_kassel').calculationSettings.madhab, 'hanafi');
  });

  // 4. Daily Auto-Recalculation + Permanent vs Temporary Manual Offset Retention
  await test('4. Daily Astronomical Recalculation + Permanent/Temporary Manual Offsets', () => {
    const state = createDefaultAppState();
    const berlinBase = getOrCreateCityProfile(state, 'de_berlin');
    const berlin: CityProfile = {
      ...berlinBase,
      manualAdjustments: {
        ...berlinBase.manualAdjustments,
        fajr: { offsetMinutes: 10, mode: 'permanent' },
        maghrib: { offsetMinutes: -4, mode: 'temporary', temporaryDate: '2026-06-21' },
      },
    };

    const summerPrayers = calculatePrayersForDateYMD(berlin, 2026, 6, 21, Date.UTC(2026, 5, 21, 10, 0, 0));
    const nextDayPrayers = calculatePrayersForDateYMD(berlin, 2026, 6, 22, Date.UTC(2026, 5, 22, 10, 0, 0));
    const winterPrayers = calculatePrayersForDateYMD(berlin, 2026, 12, 21, Date.UTC(2026, 11, 21, 10, 0, 0));

    const sFajr = summerPrayers.find((p) => p.id === 'fajr')!;
    const wFajr = winterPrayers.find((p) => p.id === 'fajr')!;
    const sMaghrib = summerPrayers.find((p) => p.id === 'maghrib')!;
    const nMaghrib = nextDayPrayers.find((p) => p.id === 'maghrib')!;

    // Astronomical original time naturally differs between June 21 and Dec 21
    assert.notEqual(sFajr.originalMinutes, wFajr.originalMinutes);
    // Permanent +10 applies to EVERY day
    assert.equal(sFajr.appliedOffsetMinutes, 10);
    assert.equal(sFajr.finalMinutes, (sFajr.originalMinutes + 10) % 1440);
    assert.equal(wFajr.appliedOffsetMinutes, 10);
    assert.equal(wFajr.finalMinutes, (wFajr.originalMinutes + 10) % 1440);

    // Temporary -4 applies ONLY on 2026-06-21 and resets to 0 on 2026-06-22
    assert.equal(sMaghrib.appliedOffsetMinutes, -4);
    assert.equal(sMaghrib.finalMinutes, (sMaghrib.originalMinutes - 4 + 1440) % 1440);
    assert.equal(nMaghrib.appliedOffsetMinutes, 0);
    assert.equal(nMaghrib.finalMinutes, nMaghrib.originalMinutes);
  });

  // 5. Jummah MUST always follow Dhuhr
  await test('5. Jummah Always Follows Dhuhr (default and with manual Dhuhr offset)', () => {
    const state = createDefaultAppState();
    for (const cid of ['jo_amman', 'de_hameln', 'us_newyork', 'sa_makkah']) {
      const prof = getOrCreateCityProfile(state, cid);
      const now = new Date('2026-05-15T10:00:00Z');
      const sched = computeCitySchedule(prof, now);
      const dhuhr = sched.prayers.find((p) => p.id === 'dhuhr')!;
      assert.equal(sched.jummahFormatted12, dhuhr.finalFormatted12);
      assert.equal(sched.jummahFormatted24, dhuhr.finalFormatted24);

      const edited: CityProfile = {
        ...prof,
        manualAdjustments: {
          ...prof.manualAdjustments,
          dhuhr: { offsetMinutes: 5, mode: 'permanent' },
        },
      };
      const schedEdited = computeCitySchedule(edited, now);
      const dhuhrEdited = schedEdited.prayers.find((p) => p.id === 'dhuhr')!;
      assert.equal(dhuhrEdited.finalMinutes, (dhuhr.originalMinutes + 5) % 1440);
      assert.equal(schedEdited.jummahFormatted12, dhuhrEdited.finalFormatted12);
      assert.equal(schedEdited.jummahFormatted24, dhuhrEdited.finalFormatted24);
    }
  });

  // 6. Timezone & DST Transitions
  await test('6. Timezone & Automatic DST + Cross-Midnight Dates', () => {
    const winterInstant = new Date('2026-01-15T12:00:00Z');
    const summerInstant = new Date('2026-07-15T12:00:00Z');

    const berlinWinter = getCityWallClock(winterInstant, 'Europe/Berlin', 'auto');
    const berlinSummer = getCityWallClock(summerInstant, 'Europe/Berlin', 'auto');
    assert.equal(berlinWinter.utcOffsetMinutes, 60);
    assert.equal(berlinWinter.isDstActive, false);
    assert.equal(berlinWinter.hour, 13);
    assert.equal(berlinSummer.utcOffsetMinutes, 120);
    assert.equal(berlinSummer.isDstActive, true);
    assert.equal(berlinSummer.hour, 14);

    // Saudi Arabia has no DST
    const riyadhWinter = getCityWallClock(winterInstant, 'Asia/Riyadh', 'auto');
    const riyadhSummer = getCityWallClock(summerInstant, 'Asia/Riyadh', 'auto');
    assert.equal(riyadhWinter.utcOffsetMinutes, 180);
    assert.equal(riyadhSummer.utcOffsetMinutes, 180);
    assert.equal(riyadhWinter.isDstActive, false);
    assert.equal(riyadhSummer.isDstActive, false);

    // Cross-midnight instant: 2026-06-15T02:00:00Z -> NYC is 2026-06-14 22:00, Tokyo is 2026-06-15 11:00
    const crossMidnight = new Date('2026-06-15T02:00:00Z');
    const nyClock = getCityWallClock(crossMidnight, 'America/New_York', 'auto');
    const tokyoClock = getCityWallClock(crossMidnight, 'Asia/Tokyo', 'auto');
    assert.equal(nyClock.dateStr, '2026-06-14');
    assert.equal(nyClock.hour, 22);
    assert.equal(tokyoClock.dateStr, '2026-06-15');
    assert.equal(tokyoClock.hour, 11);
    assert.notEqual(getGregorianArabicForClock(nyClock), getGregorianArabicForClock(tokyoClock));
    assert.notEqual(getHijriArabicForClock(nyClock), getHijriArabicForClock(tokyoClock));
  });

  // 7. Iqama & Active Countdown Engine
  await test('7. Active Post-Adhan Iqama Countdown Verification', () => {
    const state = createDefaultAppState();
    const amman = getOrCreateCityProfile(state, 'jo_amman');
    const noonBase = new Date('2026-05-15T09:00:00Z'); // 12:00 in Amman (UTC+3)
    const schedBase = computeCitySchedule(amman, noonBase);
    const dhuhr = schedBase.prayers.find((p) => p.id === 'dhuhr')!;

    // Build an instant strictly 5 minutes after Dhuhr adhan in Amman
    const after5MinMs = dhuhr.instantMs + 5 * 60 * 1000;
    const schedDuringIqama = computeCitySchedule(amman, new Date(after5MinMs));
    assert.ok(schedDuringIqama.activeIqamaCountdown, 'Expected active Iqama countdown 5 min after Dhuhr');
    assert.equal(schedDuringIqama.activeIqamaCountdown!.prayerId, 'dhuhr');
    assert.equal(schedDuringIqama.activeIqamaCountdown!.totalSeconds, amman.iqamaTimes.dhuhr * 60);
    assert.ok(
      schedDuringIqama.activeIqamaCountdown!.remainingSeconds > 0 &&
        schedDuringIqama.activeIqamaCountdown!.remainingSeconds <= amman.iqamaTimes.dhuhr * 60
    );

    // After Iqama ends
    const afterIqamaMs = dhuhr.instantMs + (amman.iqamaTimes.dhuhr + 2) * 60 * 1000;
    const schedAfterIqama = computeCitySchedule(amman, new Date(afterIqamaMs));
    assert.equal(schedAfterIqama.activeIqamaCountdown, null);
  });

  // 8. Offline Calculation & Non-Destructive Sync
  await test('8. Offline Calculation & Sync Never Overwrites Manual Settings', async () => {
    const state = createDefaultAppState();
    const hamelnBase = getOrCreateCityProfile(state, 'de_hameln');
    const hameln: CityProfile = {
      ...hamelnBase,
      manualAdjustments: {
        ...hamelnBase.manualAdjustments,
        fajr: { offsetMinutes: 6, mode: 'permanent' },
      },
      iqamaTimes: { ...hamelnBase.iqamaTimes, fajr: 30 },
    };

    const syncRes = await syncCityCalculatedTimes(hameln, new Date('2026-05-15T10:00:00Z'));
    assert.equal(syncRes.ok, true);
    assert.match(syncRes.calculated.times.fajr, /^\d{2}:\d{2}$/);
    // Sync only computes original times, leaving profile edits completely untouched
    assert.equal(hameln.manualAdjustments.fajr.offsetMinutes, 6);
    assert.equal(hameln.iqamaTimes.fajr, 30);
  });

  // 9. Atomic Persistence, Reload, Corrupted Primary Fallback, Legacy Migration & Backup/Restore
  await test('9. Persistence Survival + Corrupted Primary Recovery + Backup & Single-City Restore', () => {
    const storage = new MockStorage();
    let state = createDefaultAppState();

    const deCountry = findCountryById('DE')!;
    const hamelnCity = findCityById('de_hameln').city!;
    let hameln = createDefaultCityProfile(hamelnCity, deCountry);
    hameln = {
      ...hameln,
      mosqueName: 'مسجد الهدى - هاملن',
      manualAdjustments: {
        ...hameln.manualAdjustments,
        isha: { offsetMinutes: 8, mode: 'permanent' },
      },
      iqamaTimes: { ...hameln.iqamaTimes, isha: 12 },
      azkarSettings: { ...hameln.azkarSettings, stepSec: 15, startDelaySec: 20 },
      screenSettings: { mode: 'after_iqama', timeoutMinutes: 25, keepClockVisible: true },
    };
    hameln = recordCityChange(hameln, 'offset_isha', '0د', '8د', 'تعديل العشاء');

    const berlin = {
      ...getOrCreateCityProfile(state, 'de_berlin'),
      mosqueName: 'مسجد برلين المركزي',
    };

    state = {
      ...state,
      activeCountryId: 'DE',
      activeCityId: 'de_hameln',
      cityProfiles: {
        ...state.cityProfiles,
        de_hameln: hameln,
        de_berlin: berlin,
      },
    };

    const saveRes = saveAppState(state, storage);
    assert.equal(saveRes.ok, true);

    // Export full backup before changing Hameln again
    const backupJson = exportBackupJson(state);
    assert.ok(parseBackupJson(backupJson));

    // Simulate reload
    const reloaded = loadAppState(storage);
    assert.equal(reloaded.activeCountryId, 'DE');
    assert.equal(reloaded.activeCityId, 'de_hameln');
    assert.equal(reloaded.cityProfiles.de_hameln.mosqueName, 'مسجد الهدى - هاملن');
    assert.equal(reloaded.cityProfiles.de_hameln.manualAdjustments.isha.offsetMinutes, 8);
    assert.equal(reloaded.cityProfiles.de_hameln.iqamaTimes.isha, 12);
    assert.equal(reloaded.cityProfiles.de_hameln.azkarSettings.stepSec, 15);
    assert.equal(reloaded.cityProfiles.de_hameln.screenSettings.mode, 'after_iqama');
    assert.equal(reloaded.cityProfiles.de_hameln.changeHistory.length, 1);

    // Simulate corrupted primary localStorage -> backup recovery
    storage.setItem(STATE_STORAGE_KEY, '{corrupted_json!!!');
    assert.ok(storage.getItem(BACKUP_STORAGE_KEY));
    const recovered = loadAppState(storage);
    assert.equal(recovered.activeCityId, 'de_hameln');
    assert.equal(recovered.cityProfiles.de_hameln.manualAdjustments.isha.offsetMinutes, 8);

    // Mutate Hameln & Berlin, then restore ONLY Hameln from backupJson -> Berlin stays modified!
    const mutated: AppRootState = {
      ...recovered,
      cityProfiles: {
        ...recovered.cityProfiles,
        de_hameln: { ...recovered.cityProfiles.de_hameln, mosqueName: 'اسم مؤقت خاطئ' },
        de_berlin: { ...recovered.cityProfiles.de_berlin, mosqueName: 'مسجد برلين المحدّث' },
      },
    };
    const restoreSingle = restoreSingleCityFromBackup(mutated, backupJson, 'de_hameln');
    assert.equal(restoreSingle.restored, true);
    assert.equal(restoreSingle.nextState.cityProfiles.de_hameln.mosqueName, 'مسجد الهدى - هاملن');
    assert.equal(restoreSingle.nextState.cityProfiles.de_berlin.mosqueName, 'مسجد برلين المحدّث');

    // Verify legacy v3 migration
    const legacyStorage = new MockStorage();
    legacyStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        country: 'الأردن',
        city: 'عمّان',
        mosqueName: 'مسجد التراث',
        prayerOffsets: { fajr: 4 },
        iqamaTimes: { fajr: 22 },
      })
    );
    const migrated = loadAppState(legacyStorage);
    assert.equal(migrated.activeCountryId, 'JO');
    assert.equal(migrated.activeCityId, 'jo_amman');
    assert.equal(migrated.cityProfiles.jo_amman.mosqueName, 'مسجد التراث');
    assert.equal(migrated.cityProfiles.jo_amman.manualAdjustments.fajr.offsetMinutes, 4);
    assert.equal(migrated.cityProfiles.jo_amman.iqamaTimes.fajr, 22);
  });

  // 10. Custom Country & City by Name + Latitude + Longitude + Auto Timezone + Reload Survival
  await test('10. Custom Country & City Addition (New Country + Existing Country + Persistence)', () => {
    const storage = new MockStorage();
    let state = createDefaultAppState();

    // 10a. Brand-new country not in built-in WORLD_COUNTRIES
    const fijiMatch = findCountryByName('فيجي', state.customCountries);
    assert.equal(fijiMatch, undefined);
    const estFijiTz = estimateTimeZoneForLocation('فيجي', -18.1416, 178.4419, state.customCountries);
    assert.equal(estFijiTz, 'Etc/GMT-12');
    assert.equal(
      estimateTimeZoneForLocation('سريلانكا', 6.9271, 79.8612, state.customCountries),
      'Asia/Colombo'
    );

    const customCountry = {
      countryId: 'CUSTOM_FIJI',
      nameAr: 'فيجي',
      nameEn: 'فيجي',
      region: 'arab' as const,
      defaultMethod: 'MuslimWorldLeague' as const,
      defaultMadhab: 'shafi' as const,
      defaultHighLatitudeRule: 'MiddleOfTheNight' as const,
      cities: [],
    };
    const suvaCity = {
      cityId: 'custom_suva',
      countryId: customCountry.countryId,
      nameAr: 'سوفا',
      nameEn: 'Suva',
      lat: -18.1416,
      lng: 178.4419,
      timeZoneId: estFijiTz,
      isCustom: true,
    };
    const suvaProfile = createDefaultCityProfile(suvaCity, customCountry);
    state = {
      ...state,
      activeCountryId: customCountry.countryId,
      activeCityId: suvaCity.cityId,
      customCountries: [customCountry],
      customCities: [suvaCity],
      cityProfiles: {
        ...state.cityProfiles,
        [suvaCity.cityId]: suvaProfile,
      },
    };

    const suvaSchedule = computeCitySchedule(suvaProfile, new Date('2026-05-15T12:00:00Z'));
    assert.equal(suvaSchedule.prayers.length, 6);
    for (const p of suvaSchedule.prayers) {
      assert.match(p.finalFormatted24, /^\d{2}:\d{2}$/);
    }

    // 10b. Adding a city into an existing built-in country ("ألمانيا")
    const matchedGermany = findCountryByName('ألمانيا', state.customCountries);
    assert.ok(matchedGermany);
    assert.equal(matchedGermany!.countryId, 'DE');
    const estGermanyTz = estimateTimeZoneForLocation('ألمانيا', 50.7374, 7.0982, state.customCountries);
    assert.equal(estGermanyTz, 'Europe/Berlin');

    const bonnCity = {
      cityId: 'de_custom_bonn',
      countryId: matchedGermany!.countryId,
      nameAr: 'بون',
      nameEn: 'Bonn',
      lat: 50.7374,
      lng: 7.0982,
      timeZoneId: estGermanyTz,
      isCustom: true,
    };
    const bonnProfile = createDefaultCityProfile(bonnCity, matchedGermany!);
    state = {
      ...state,
      customCities: [...state.customCities, bonnCity],
      cityProfiles: {
        ...state.cityProfiles,
        [bonnCity.cityId]: bonnProfile,
      },
    };

    // Save and reload -> active custom country + city & Germany custom city both survive
    saveAppState(state, storage);
    const reloaded = loadAppState(storage);
    assert.equal(reloaded.activeCountryId, 'CUSTOM_FIJI');
    assert.equal(reloaded.activeCityId, 'custom_suva');
    assert.equal(reloaded.customCountries.length, 1);
    assert.equal(reloaded.customCountries[0].nameAr, 'فيجي');
    assert.equal(reloaded.customCities.length, 2);
    assert.ok(searchCountries('فيجي', reloaded.customCountries).some((c) => c.countryId === 'CUSTOM_FIJI'));
    assert.ok(searchCities('DE', 'بون', reloaded.customCities).some((c) => c.cityId === 'de_custom_bonn'));
    assert.ok(searchCities('CUSTOM_FIJI', '', reloaded.customCities).some((c) => c.cityId === 'custom_suva'));
  });

  console.log(`\nALL ${passed} VERIFICATION SUITES PASSED SUCCESSFULLY.`);
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
