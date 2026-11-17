import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdjustmentMode,
  AppRootState,
  CalculationMethodId,
  CityProfile,
  CityWallClock,
  ComputedCitySchedule,
  DstModeType,
  HighLatitudeRuleType,
  MadhabType,
  ObligatoryPrayerId,
  PrayerId,
  ThemeColors,
} from '../types/prayer';
import {
  METHOD_LABELS,
  WORLD_COUNTRIES,
  estimateTimeZoneForLocation,
  findCountryById,
  searchCities,
  searchCountries,
} from '../data/worldCities';
import { AUTHENTIC_AZKAR } from '../data/azkarData';
import type { AudioSlotKey, ImageSlotKey } from '../storage/persistence';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppRootState;
  activeCity: CityProfile;
  wallClock: CityWallClock;
  schedule: ComputedCitySchedule;
  isOnline: boolean;
  saveStatusText: string;
  images: Record<ImageSlotKey, string | null>;
  audioNames: Record<AudioSlotKey, string | null>;
  playingAudioSlot: AudioSlotKey | null;
  onSelectCountry: (countryId: string) => void;
  onSelectCity: (cityId: string) => void;
  onAddCustomCity: (city: {
    countryNameAr: string;
    cityNameAr: string;
    cityNameEn?: string;
    lat: number;
    lng: number;
    timeZoneId?: string;
  }) => void;
  onUpdateCity: (updater: (prev: CityProfile) => CityProfile, historyNote?: { field: string; oldVal: string; newVal: string; note: string }) => void;
  onUpdateUI: (updater: (prev: AppRootState['ui']) => AppRootState['ui']) => void;
  onAdjustPrayerOffset: (prayerId: PrayerId, delta: number) => void;
  onChangeAdjustmentMode: (prayerId: PrayerId, mode: AdjustmentMode, tempDate?: string) => void;
  onResetSingleOffset: (prayerId: PrayerId) => void;
  onResetAllOffsets: () => void;
  onUploadImage: (slot: ImageSlotKey, file: File) => void;
  onClearImage: (slot: ImageSlotKey) => void;
  onSelectPresetBg: (url: string) => void;
  onApplyBrightnessPreset: (mode: 'super' | 'bright' | 'normal' | 'dim') => void;
  onCycleBrightnessMode: () => void;
  onApplyThemePreset: (preset: 'gold' | 'blue' | 'green' | 'silver') => void;
  onChangeThemeColor: (key: keyof ThemeColors, value: string) => void;
  onSetAllTimersColor: (hex: string) => void;
  onResetThemeColors: () => void;
  onUploadAudio: (slot: AudioSlotKey, file: File) => void;
  onRemoveAudio: (slot: AudioSlotKey) => void;
  onTestAudio: (slot: AudioSlotKey) => void;
  onStopSounds: () => void;
  onToggleSoundQuick: () => void;
  onRefreshAndSync: () => void;
  onRunDemoSequence: () => void;
  onTestScreenSaver: () => void;
  onExportBackup: () => void;
  onImportFullBackup: (file: File) => void;
  onRestoreSingleCityBackup: (file: File) => void;
}

const PRESET_BGS = [
  {
    name: 'المسجد النبوي',
    url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=300&q=60',
  },
  {
    name: 'المسجد الحرام',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=60',
  },
  {
    name: 'قبة الصخرة',
    url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=300&q=60',
  },
  {
    name: 'محراب إسلامي',
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=300&q=60',
  },
];

function parseCoordinateInput(raw: string): number {
  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[،,]/g, '.')
    .replace(/−/g, '-');
  if (!normalized) return NaN;
  return Number(normalized);
}

function isValidTimeZoneId(tz: string): boolean {
  if (!tz.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz.trim() }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  appState,
  activeCity,
  wallClock,
  schedule,
  isOnline,
  saveStatusText,
  images,
  audioNames,
  playingAudioSlot,
  onSelectCountry,
  onSelectCity,
  onAddCustomCity,
  onUpdateCity,
  onUpdateUI,
  onAdjustPrayerOffset,
  onChangeAdjustmentMode,
  onResetSingleOffset,
  onResetAllOffsets,
  onUploadImage,
  onClearImage,
  onSelectPresetBg,
  onApplyBrightnessPreset,
  onCycleBrightnessMode,
  onApplyThemePreset,
  onChangeThemeColor,
  onSetAllTimersColor,
  onResetThemeColors,
  onUploadAudio,
  onRemoveAudio,
  onTestAudio,
  onStopSounds,
  onToggleSoundQuick,
  onRefreshAndSync,
  onRunDemoSequence,
  onTestScreenSaver,
  onExportBackup,
  onImportFullBackup,
  onRestoreSingleCityBackup,
}) => {
  const [openAcc, setOpenAcc] = useState<Record<string, boolean>>({
    general: true,
    iqama: false,
    offsets: true,
    stages: true,
    screen: false,
    backup: false,
    bg: false,
    colors: false,
    audio: false,
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCustomCityForm, setShowCustomCityForm] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [newCityNameAr, setNewCityNameAr] = useState('');
  const [newCityNameEn, setNewCityNameEn] = useState('');
  const [newCityLat, setNewCityLat] = useState('');
  const [newCityLng, setNewCityLng] = useState('');
  const [newCityTz, setNewCityTz] = useState('');
  const [tzManuallyEdited, setTzManuallyEdited] = useState(false);
  const [customCityError, setCustomCityError] = useState<string | null>(null);
  const customCityFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showCustomCityForm && customCityFormRef.current) {
      customCityFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showCustomCityForm]);

  const toggleAcc = (key: string) => {
    setOpenAcc((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCountries = useMemo(
    () => searchCountries(countrySearch, appState.customCountries),
    [countrySearch, appState.customCountries]
  );
  const filteredCities = useMemo(
    () => searchCities(appState.activeCountryId, citySearch, appState.customCities),
    [appState.activeCountryId, citySearch, appState.customCities]
  );

  const allCountriesList = useMemo(
    () => [...WORLD_COUNTRIES, ...(appState.customCountries || [])],
    [appState.customCountries]
  );
  const activeCountryDef = findCountryById(appState.activeCountryId, appState.customCountries);
  const ui = appState.ui;
  const tc = ui.themeColors;

  const brightnessModeLabel =
    ui.bgMode === 'super'
      ? 'ساطع جداً'
      : ui.bgMode === 'bright'
      ? 'ساطع'
      : ui.bgMode === 'normal'
      ? 'متوازن'
      : ui.bgMode === 'dim'
      ? 'ليلي هادئ'
      : 'مخصص';

  const overlayLabel =
    ui.bgOverlayOpacity <= 10
      ? `أقصى تفتيح (${ui.bgOverlayOpacity}%)`
      : ui.bgOverlayOpacity <= 30
      ? `ساطع (${ui.bgOverlayOpacity}%)`
      : ui.bgOverlayOpacity <= 55
      ? `متوسط (${ui.bgOverlayOpacity}%)`
      : `معتم (${ui.bgOverlayOpacity}%)`;

  const azkarStep = Math.min(60, Math.max(1, activeCity.azkarSettings.stepSec || 5));
  const azkarTotalSec = azkarStep * AUTHENTIC_AZKAR.length;

  const handleMethodChange = (method: CalculationMethodId) => {
    const preset = METHOD_LABELS[method] || METHOD_LABELS.MuslimWorldLeague;
    onUpdateCity(
      (prev) => ({
        ...prev,
        calculationSettings: {
          ...prev.calculationSettings,
          method,
          fajrAngle: method === 'Custom' ? prev.calculationSettings.fajrAngle : preset.fajrAngle,
          ishaAngle: method === 'Custom' ? prev.calculationSettings.ishaAngle : preset.ishaAngle,
          ishaInterval:
            method === 'Custom' ? prev.calculationSettings.ishaInterval : preset.ishaInterval,
        },
      }),
      {
        field: 'calculation_method',
        oldVal: activeCity.calculationSettings.method,
        newVal: method,
        note: `تغيير طريقة الحساب إلى ${preset.ar}`,
      }
    );
  };

  const refreshEstimatedTz = (country: string, latRaw: string, lngRaw: string) => {
    if (tzManuallyEdited) return;
    const latNum = parseCoordinateInput(latRaw);
    const lngNum = parseCoordinateInput(lngRaw);
    if (!country.trim() && (Number.isNaN(latNum) || Number.isNaN(lngNum))) {
      setNewCityTz('');
      return;
    }
    const est = estimateTimeZoneForLocation(
      country,
      latNum,
      lngNum,
      appState.customCountries
    );
    setNewCityTz(est);
  };

  const handleCreateCustomCity = () => {
    const countryClean = newCountryName.trim();
    const cityClean = newCityNameAr.trim();
    const latNum = parseCoordinateInput(newCityLat);
    const lngNum = parseCoordinateInput(newCityLng);

    if (!countryClean) {
      setCustomCityError('يرجى كتابة اسم الدولة.');
      return;
    }
    if (!cityClean) {
      setCustomCityError('يرجى كتابة اسم المدينة.');
      return;
    }
    if (Number.isNaN(latNum) || latNum < -90 || latNum > 90) {
      setCustomCityError('يرجى إدخال خط عرض صحيح بين 90- و 90 (مثال: 24.7136).');
      return;
    }
    if (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setCustomCityError('يرجى إدخال خط طول صحيح بين 180- و 180 (مثال: 46.6753).');
      return;
    }

    const manualTz = newCityTz.trim();
    const resolvedTz =
      manualTz && isValidTimeZoneId(manualTz)
        ? manualTz
        : estimateTimeZoneForLocation(countryClean, latNum, lngNum, appState.customCountries);

    if (tzManuallyEdited && manualTz && !isValidTimeZoneId(manualTz)) {
      setCustomCityError('صيغة المنطقة الزمنية غير صحيحة (مثال: Asia/Riyadh أو Europe/Berlin). اتركها فارغة للتحديد التلقائي.');
      return;
    }

    setCustomCityError(null);
    onAddCustomCity({
      countryNameAr: countryClean,
      cityNameAr: cityClean,
      cityNameEn: newCityNameEn.trim() || cityClean,
      lat: latNum,
      lng: lngNum,
      timeZoneId: resolvedTz,
    });
    setNewCountryName('');
    setNewCityNameAr('');
    setNewCityNameEn('');
    setNewCityLat('');
    setNewCityLng('');
    setNewCityTz('');
    setTzManuallyEdited(false);
    setCountrySearch('');
    setCitySearch('');
    setShowCustomCityForm(false);
  };

  return (
    <>
      <div
        className={`drawer-scrim${isOpen ? ' open' : ''}`}
        id="drawer-scrim"
        onClick={onClose}
      />
      <div className={`settings-side-drawer${isOpen ? ' open' : ''}`} id="settings-drawer">
        <div className="drawer-top-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>إعدادات الساعة</h2>
            <span className="save-status-pill" id="disp-save-status">
              ✓ {saveStatusText}
            </span>
          </div>
          <p>قم بتخصيص مظهر ومعلومات شاشة الساعة وإعدادات كل مدينة بشكل مستقل.</p>
        </div>

        <div className="drawer-scroll-body">
          {/* أدوات التحكم السريع */}
          <div className="drawer-quick-actions-box">
            <div
              style={{
                fontWeight: 700,
                color: '#F59E0B',
                fontSize: '13px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚡ أدوات التحكم السريع:
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>
                ({isOnline ? 'متصل بالإنترنت 🌐' : 'عمل محلي بدون إنترنت 📡'})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn-quick-drawer-action"
                onClick={onRefreshAndSync}
                style={{
                  background: '#064e3b',
                  border: '1px solid #10b981',
                  color: '#a7f3d0',
                }}
              >
                <span style={{ fontSize: '16px' }}>🔄</span>
                <span>تحديث ومزامنة مواقيت الصلاة الآن</span>
              </button>

              <button
                type="button"
                id="btn-drawer-toggle-sound"
                className="btn-quick-drawer-action"
                onClick={onToggleSoundQuick}
                style={{
                  background: ui.soundEnabled ? '#064e3b' : '#450a0a',
                  border: `1px solid ${ui.soundEnabled ? '#10b981' : '#ef4444'}`,
                  color: ui.soundEnabled ? '#a7f3d0' : '#fca5a5',
                }}
              >
                <span id="disp-drawer-sound-icon" style={{ fontSize: '16px' }}>
                  {ui.soundEnabled ? '🔊' : '🔇'}
                </span>
                <span id="disp-drawer-sound-text">
                  {ui.soundEnabled ? 'الصوت مفعل (اضغط للكتم)' : 'الصوت مكتوم (اضغط للتفعيل)'}
                </span>
              </button>

              <button
                type="button"
                id="btn-drawer-brightness"
                className="btn-quick-drawer-action"
                onClick={onCycleBrightnessMode}
                style={{
                  background: '#451a03',
                  border: '1px solid #f59e0b',
                  color: '#fde68a',
                }}
              >
                <span style={{ fontSize: '16px' }}>☀️</span>
                <span id="disp-drawer-brightness-text">
                  وضع السطوع: {brightnessModeLabel} (اضغط للتبديل)
                </span>
              </button>
            </div>
          </div>

          {/* 1. معلومات عامة + الدول والمدن + إعدادات الحساب المستقلة */}
          <div className="drawer-accordion">
            <div className="drawer-acc-header" onClick={() => toggleAcc('general')}>
              <span>🌍 معلومات عامة والدول والمدن ({activeCountryDef?.nameAr})</span>
              <span>{openAcc.general ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.general ? ' expanded' : ''}`}>
              {/* Add Custom City & Country (Prominent & Immediately Visible) */}
              <div style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  id="btn-toggle-custom-city-form"
                  className="btn-quick-drawer-action"
                  style={{
                    background: showCustomCityForm ? '#1E293B' : 'rgba(14, 165, 233, 0.16)',
                    border: '1px solid #38BDF8',
                    color: '#7DD3FC',
                    padding: '9px 12px',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setCustomCityError(null);
                    setShowCustomCityForm((v) => !v);
                  }}
                >
                  {showCustomCityForm
                    ? '✕ إغلاق نموذج إضافة مدينة ودولة'
                    : '📍 + إضافة أي مدينة ودولة أخرى (خط العرض والطول)'}
                </button>
                {showCustomCityForm && (
                  <div
                    id="custom-city-form"
                    ref={customCityFormRef}
                    style={{
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid #38BDF8',
                      borderRadius: '10px',
                      padding: '12px',
                      marginTop: '8px',
                    }}
                  >
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label htmlFor="new-city-country">اسم الدولة *</label>
                      <select
                        id="new-city-country-select"
                        className="form-select"
                        style={{ marginBottom: '6px', fontSize: '13px', padding: '7px 10px' }}
                        value=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) return;
                          setNewCountryName(v);
                          setCustomCityError(null);
                          refreshEstimatedTz(v, newCityLat, newCityLng);
                        }}
                      >
                        <option value="">— اختر دولة من القائمة أو اكتب دولة جديدة بالأسفل —</option>
                        {allCountriesList.map((co) => (
                          <option key={co.countryId} value={co.nameAr}>
                            {co.nameAr} — {co.nameEn}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        id="new-city-country"
                        list="custom-country-suggestions"
                        className="form-input-text"
                        value={newCountryName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewCountryName(v);
                          setCustomCityError(null);
                          refreshEstimatedTz(v, newCityLat, newCityLng);
                        }}
                        placeholder="اكتب اسم أي دولة (مثال: فيجي، إيسلندا، السعودية، ألمانيا...)"
                      />
                      <datalist id="custom-country-suggestions">
                        {allCountriesList.map((co) => (
                          <option key={co.countryId} value={co.nameAr} />
                        ))}
                      </datalist>
                    </div>

                    <div className="input-row-2 form-group" style={{ marginBottom: '8px' }}>
                      <div>
                        <label htmlFor="new-city-name-ar">اسم المدينة *</label>
                        <input
                          type="text"
                          id="new-city-name-ar"
                          className="form-input-text"
                          value={newCityNameAr}
                          onChange={(e) => {
                            setNewCityNameAr(e.target.value);
                            setCustomCityError(null);
                          }}
                          placeholder="مثال: ريكيافيك أو بون"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-city-name-en">الاسم بالإنجليزية (اختياري)</label>
                        <input
                          type="text"
                          id="new-city-name-en"
                          className="form-input-text"
                          value={newCityNameEn}
                          onChange={(e) => setNewCityNameEn(e.target.value)}
                          placeholder="Reykjavik / Bonn"
                        />
                      </div>
                    </div>

                    <div className="input-row-2 form-group" style={{ marginBottom: '8px' }}>
                      <div>
                        <label htmlFor="new-city-lat">خط العرض (Latitude) *</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          id="new-city-lat"
                          className="form-input-text"
                          value={newCityLat}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNewCityLat(v);
                            setCustomCityError(null);
                            refreshEstimatedTz(newCountryName, v, newCityLng);
                          }}
                          placeholder="مثال: 64.1466"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-city-lng">خط الطول (Longitude) *</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          id="new-city-lng"
                          className="form-input-text"
                          value={newCityLng}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNewCityLng(v);
                            setCustomCityError(null);
                            refreshEstimatedTz(newCountryName, newCityLat, v);
                          }}
                          placeholder="مثال: -21.9426"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label htmlFor="new-city-tz">
                        المنطقة الزمنية (تُحدَّد تلقائياً — يمكنك تعديلها)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        id="new-city-tz"
                        className="form-input-text"
                        value={newCityTz}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewCityTz(v);
                          setTzManuallyEdited(v.trim().length > 0);
                          setCustomCityError(null);
                        }}
                        placeholder="تلقائي حسب الدولة والإحداثيات"
                      />
                    </div>

                    {customCityError && (
                      <div
                        id="custom-city-error"
                        style={{
                          color: '#FCA5A5',
                          background: 'rgba(127, 29, 29, 0.45)',
                          border: '1px solid #EF4444',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        {customCityError}
                      </div>
                    )}

                    <button
                      type="button"
                      id="btn-save-custom-city"
                      className="btn-save-close"
                      style={{ padding: '8px', fontSize: '13px' }}
                      onClick={handleCreateCustomCity}
                    >
                      حفظ المدينة والدولة وتفعيلها
                    </button>
                  </div>
                )}
              </div>

              {/* Country Search & Select */}
              <div className="form-group">
                <label>البحث عن الدولة (بالعربية أو الإنجليزية)</label>
                <input
                  type="text"
                  id="search-country-input"
                  className="form-input-text"
                  placeholder="مثال: ألمانيا، Germany، السعودية، الأردن..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  style={{ marginBottom: '6px', fontSize: '13px', padding: '7px 10px' }}
                />
                <label>الدولة ({WORLD_COUNTRIES.length + (appState.customCountries?.length || 0)} دولة)</label>
                <select
                  id="cfg-country"
                  className="form-select"
                  value={appState.activeCountryId}
                  onChange={(e) => {
                    onSelectCountry(e.target.value);
                    setCitySearch('');
                  }}
                >
                  {filteredCountries.map((co) => (
                    <option key={co.countryId} value={co.countryId}>
                      {co.nameAr} — {co.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Search & Select */}
              <div className="form-group">
                <label>البحث عن المدينة (بالعربية أو الإنجليزية)</label>
                <input
                  type="text"
                  id="search-city-input"
                  className="form-input-text"
                  placeholder="مثال: برلين، Hameln، Kassel، عمّان..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  style={{ marginBottom: '6px', fontSize: '13px', padding: '7px 10px' }}
                />
                <label>المدينة التابعة للدولة</label>
                <select
                  id="cfg-city"
                  className="form-select"
                  value={appState.activeCityId}
                  onChange={(e) => onSelectCity(e.target.value)}
                >
                  {filteredCities.map((ci) => (
                    <option key={ci.cityId} value={ci.cityId}>
                      {ci.nameAr} — {ci.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Independent City Identity & Timezone Box */}
              <div className="city-meta-badge-box">
                <div style={{ color: '#F59E0B', fontWeight: 700, marginBottom: '4px' }}>
                  🆔 هوية المدينة المستقلة والمنطقة الزمنية:
                </div>
                <div>
                  • معرف الدولة/المدينة: <b dir="ltr">{activeCity.countryId} / {activeCity.cityId}</b>
                </div>
                <div>
                  • الإحداثيات: <b dir="ltr">{activeCity.coordinates.lat.toFixed(4)}, {activeCity.coordinates.lng.toFixed(4)}</b>
                </div>
                <div>
                  • المنطقة الزمنية: <b dir="ltr">{activeCity.timeZoneId}</b> ({wallClock.utcOffsetLabel}{' '}
                  {wallClock.isDstActive ? '— التوقيت الصيفي نشط DST' : '— قياسي/شتوي'})
                </div>
                <div>
                  • مصدر الحساب: <b>{schedule.sourceLabel}</b>
                </div>
              </div>

              {/* Mosque Name & Color */}
              <div className="form-group">
                <label>اسم المسجد (مستقل لهذه المدينة)</label>
                <input
                  type="text"
                  id="cfg-mosque"
                  className="form-input-text"
                  value={activeCity.mosqueName}
                  onChange={(e) =>
                    onUpdateCity((prev) => ({ ...prev, mosqueName: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label style={{ color: '#F59E0B', fontWeight: 'bold' }}>لون خط اسم المسجد</label>
                <div
                  className="color-picker-control"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: '12px',
                    marginTop: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  }}
                >
                  <input
                    type="color"
                    className="color-input-bubble"
                    id="col-mosqueNameColor-general"
                    value={tc.mosqueNameColor}
                    onChange={(e) => onChangeThemeColor('mosqueNameColor', e.target.value)}
                  />
                  <span className="color-hex-tag" id="tag-mosqueNameColor-general">
                    {tc.mosqueNameColor}
                  </span>
                  <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                    اضغط لاختيار لون اسم المسجد المعروض بالأعلى
                  </span>
                </div>
              </div>

              <div className="input-row-2 form-group">
                <div>
                  <label>الحي</label>
                  <input
                    type="text"
                    id="cfg-neighborhood"
                    className="form-input-text"
                    value={activeCity.neighborhood}
                    onChange={(e) =>
                      onUpdateCity((prev) => ({ ...prev, neighborhood: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>الشارع</label>
                  <input
                    type="text"
                    id="cfg-street"
                    className="form-input-text"
                    value={activeCity.street}
                    onChange={(e) =>
                      onUpdateCity((prev) => ({ ...prev, street: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Independent City Calculation Method & Angles */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.28)',
                  border: '1px solid #3B4B61',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '8px',
                }}
              >
                <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '13.5px', marginBottom: '10px' }}>
                  📐 إعدادات الحساب الفلكي المستقلة لهذه المدينة فقط:
                </div>

                <div className="form-group">
                  <label>طريقة الحساب المعتمدة</label>
                  <select
                    id="cfg-calc-method"
                    className="form-select"
                    value={activeCity.calculationSettings.method}
                    onChange={(e) => handleMethodChange(e.target.value as CalculationMethodId)}
                  >
                    {Object.entries(METHOD_LABELS).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-row-2 form-group">
                  <div>
                    <label>زاوية الفجر (°)</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-input-text"
                      value={activeCity.calculationSettings.fajrAngle}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 18;
                        onUpdateCity((prev) => ({
                          ...prev,
                          calculationSettings: { ...prev.calculationSettings, fajrAngle: val },
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label>زاوية العشاء (°) أو مدة (د)</label>
                    {activeCity.calculationSettings.ishaInterval > 0 ? (
                      <input
                        type="number"
                        className="form-input-text"
                        value={activeCity.calculationSettings.ishaInterval}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 90;
                          onUpdateCity((prev) => ({
                            ...prev,
                            calculationSettings: {
                              ...prev.calculationSettings,
                              ishaInterval: val,
                            },
                          }));
                        }}
                      />
                    ) : (
                      <input
                        type="number"
                        step="0.5"
                        className="form-input-text"
                        value={activeCity.calculationSettings.ishaAngle}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 17;
                          onUpdateCity((prev) => ({
                            ...prev,
                            calculationSettings: { ...prev.calculationSettings, ishaAngle: val },
                          }));
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="input-row-2 form-group">
                  <div>
                    <label>حساب العصر (المذهب)</label>
                    <select
                      id="cfg-madhab"
                      className="form-select"
                      value={activeCity.calculationSettings.madhab}
                      onChange={(e) =>
                        onUpdateCity(
                          (prev) => ({
                            ...prev,
                            calculationSettings: {
                              ...prev.calculationSettings,
                              madhab: e.target.value as MadhabType,
                            },
                          }),
                          {
                            field: 'madhab',
                            oldVal: activeCity.calculationSettings.madhab,
                            newVal: e.target.value,
                            note: 'تغيير مذهب حساب صلاة العصر',
                          }
                        )
                      }
                    >
                      <option value="shafi">الشافعي (الجمهور)</option>
                      <option value="hanafi">الحنفي</option>
                    </select>
                  </div>
                  <div>
                    <label>المناطق الشمالية/الجنوبية</label>
                    <select
                      id="cfg-high-lat"
                      className="form-select"
                      value={activeCity.calculationSettings.highLatitudeRule}
                      onChange={(e) =>
                        onUpdateCity((prev) => ({
                          ...prev,
                          calculationSettings: {
                            ...prev.calculationSettings,
                            highLatitudeRule: e.target.value as HighLatitudeRuleType,
                          },
                        }))
                      }
                    >
                      <option value="MiddleOfTheNight">منتصف الليل</option>
                      <option value="SeventhOfTheNight">سُبع الليل (أوروبا)</option>
                      <option value="TwilightAngle">زاوية الشفق</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>تعديل التوقيت (صيفي/شتوي)</label>
                  <select
                    id="cfg-dst"
                    className="form-select"
                    value={activeCity.calculationSettings.dstMode}
                    onChange={(e) =>
                      onUpdateCity((prev) => ({
                        ...prev,
                        calculationSettings: {
                          ...prev.calculationSettings,
                          dstMode: e.target.value as DstModeType,
                        },
                      }))
                    }
                  >
                    <option value="auto">تلقائي حسب المنطقة الزمنية ({activeCity.timeZoneId})</option>
                    <option value="0">بدون تعديل إضافي</option>
                    <option value="1">+1 ساعة (صيفي يدوي)</option>
                    <option value="-1">-1 ساعة (شتوي يدوي)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. أوقات الإقامة (مستقلة لكل مدينة) */}
          <div className="drawer-accordion">
            <div className="drawer-acc-header" onClick={() => toggleAcc('iqama')}>
              <span>أوقات الإقامة (مستقلة لهذه المدينة)</span>
              <span>{openAcc.iqama ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.iqama ? ' expanded' : ''}`}>
              <div className="input-row-2 form-group">
                <div>
                  <label>الفجر (دقائق)</label>
                  <input
                    type="number"
                    id="cfg-iq-fajr"
                    className="form-input-text"
                    value={activeCity.iqamaTimes.fajr}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateCity((prev) => ({
                        ...prev,
                        iqamaTimes: { ...prev.iqamaTimes, fajr: val },
                      }));
                    }}
                  />
                </div>
                <div>
                  <label>الظهر (دقائق)</label>
                  <input
                    type="number"
                    id="cfg-iq-dhuhr"
                    className="form-input-text"
                    value={activeCity.iqamaTimes.dhuhr}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateCity((prev) => ({
                        ...prev,
                        iqamaTimes: { ...prev.iqamaTimes, dhuhr: val },
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="input-row-2 form-group">
                <div>
                  <label>العصر (دقائق)</label>
                  <input
                    type="number"
                    id="cfg-iq-asr"
                    className="form-input-text"
                    value={activeCity.iqamaTimes.asr}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateCity((prev) => ({
                        ...prev,
                        iqamaTimes: { ...prev.iqamaTimes, asr: val },
                      }));
                    }}
                  />
                </div>
                <div>
                  <label>المغرب (دقائق)</label>
                  <input
                    type="number"
                    id="cfg-iq-maghrib"
                    className="form-input-text"
                    value={activeCity.iqamaTimes.maghrib}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateCity((prev) => ({
                        ...prev,
                        iqamaTimes: { ...prev.iqamaTimes, maghrib: val },
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="input-row-2 form-group">
                <div>
                  <label>العشاء (دقائق)</label>
                  <input
                    type="number"
                    id="cfg-iq-isha"
                    className="form-input-text"
                    value={activeCity.iqamaTimes.isha}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateCity((prev) => ({
                        ...prev,
                        iqamaTimes: { ...prev.iqamaTimes, isha: val },
                      }));
                    }}
                  />
                </div>
                <div>
                  <label>الجمعة (تتبع الظهر دائماً)</label>
                  <input
                    type="text"
                    id="cfg-iq-jummah"
                    className="form-input-text"
                    value={`${schedule.jummahFormatted12} (تتبع الظهر)`}
                    readOnly
                    style={{ opacity: 0.85, color: '#FBBF24' }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid #3B4B61',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#F59E0B',
                    fontSize: '13.5px',
                    marginBottom: '8px',
                  }}
                >
                  ⚙️ تخصيص خط الإقامة بالبطاقات (اللون والحجم)
                </div>
                <div className="input-row-2 form-group" style={{ marginBottom: '4px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px' }}>لون خط الإقامة</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        id="cfg-iqama-font-color"
                        value={tc.iqamaTextColor}
                        onChange={(e) => onChangeThemeColor('iqamaTextColor', e.target.value)}
                        style={{
                          width: '44px',
                          height: '38px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      />
                      <span
                        id="tag-iqama-font-color"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: tc.iqamaTextColor,
                          fontWeight: 'bold',
                        }}
                      >
                        {tc.iqamaTextColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12.5px' }}>حجم خط الإقامة (تكبير وتصغير)</label>
                    <div className="prayer-offset-stepper" style={{ marginTop: '2px' }}>
                      <button
                        type="button"
                        className="stepper-btn btn-minus"
                        onClick={() =>
                          onUpdateUI((prev) => ({
                            ...prev,
                            iqamaFontSize: Math.max(12, prev.iqamaFontSize - 1),
                          }))
                        }
                      >
                        -
                      </button>
                      <span className="stepper-display-val" id="disp-iqama-font-size">
                        {ui.iqamaFontSize}px
                      </span>
                      <button
                        type="button"
                        className="stepper-btn btn-plus"
                        onClick={() =>
                          onUpdateUI((prev) => ({
                            ...prev,
                            iqamaFontSize: Math.min(32, prev.iqamaFontSize + 1),
                          }))
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* أوقات الصلاة (يدوي - تعديل بالدقائق + / - مع التحديث التلقائي اليومي) */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: 'var(--gold-bright)' }}
              onClick={() => toggleAcc('offsets')}
            >
              <span>أوقات الصلاة (تعديل بالدقائق + / -)</span>
              <span>{openAcc.offsets ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.offsets ? ' expanded' : ''}`}>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                يُحفظ مقدار التعديل بالدقائق لهذه المدينة فقط ويبقى مطبّقاً تلقائياً مع تغير المواقيت اليومي:
              </p>
              <div id="prayer-offsets-list">
                {schedule.prayers.map((p) => {
                  const adj = activeCity.manualAdjustments[p.id] || {
                    offsetMinutes: 0,
                    mode: 'permanent',
                  };
                  const offset = adj.offsetMinutes || 0;
                  const offsetStr =
                    offset > 0 ? `+${offset} د` : offset < 0 ? `${offset} د` : '0 د';
                  return (
                    <div key={p.id} className="prayer-offset-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="prayer-offset-info">
                          <span className="prayer-offset-name">{p.name}</span>
                          <span className="prayer-offset-orig">
                            الأصلي الفلكي: {p.originalFormatted12}
                          </span>
                          <span className="prayer-offset-curr" id={`offset-curr-time-${p.id}`}>
                            المعروض: {p.finalFormatted12}
                          </span>
                        </div>
                        <div className="prayer-offset-stepper">
                          <button
                            type="button"
                            className="stepper-btn btn-minus"
                            onClick={() => onAdjustPrayerOffset(p.id, -1)}
                            title="إنقاص دقيقة"
                          >
                            -
                          </button>
                          <span className="stepper-display-val" id={`offset-val-${p.id}`}>
                            {offsetStr}
                          </span>
                          <button
                            type="button"
                            className="stepper-btn btn-plus"
                            onClick={() => onAdjustPrayerOffset(p.id, 1)}
                            title="زيادة دقيقة"
                          >
                            +
                          </button>
                          {offset !== 0 && (
                            <button
                              type="button"
                              className="stepper-btn"
                              style={{ fontSize: '14px', width: '30px', color: '#38BDF8' }}
                              onClick={() => onResetSingleOffset(p.id)}
                              title="إعادة هذه الصلاة إلى الوقت الأصلي"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          paddingTop: '6px',
                          fontSize: '11.5px',
                        }}
                      >
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '11.5px', width: 'auto' }}
                          value={adj.mode}
                          onChange={(e) =>
                            onChangeAdjustmentMode(
                              p.id,
                              e.target.value as AdjustmentMode,
                              adj.temporaryDate || wallClock.dateStr
                            )
                          }
                        >
                          <option value="permanent">تعديل دائم (لكل الأيام)</option>
                          <option value="temporary">تعديل مؤقت (لتاريخ محدد)</option>
                        </select>
                        {adj.mode === 'temporary' && (
                          <input
                            type="date"
                            className="form-input-text"
                            style={{ padding: '3px 6px', fontSize: '11.5px', width: 'auto' }}
                            value={adj.temporaryDate || wallClock.dateStr}
                            onChange={(e) =>
                              onChangeAdjustmentMode(p.id, 'temporary', e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="btn-clear-img"
                style={{ color: '#38BDF8', fontSize: '12px', marginTop: '8px' }}
                onClick={onResetAllOffsets}
              >
                ↺ إعادة ضبط جميع التعديلات لهذه المدينة إلى (0 دقيقة)
              </button>
            </div>
          </div>

          {/* 3. مراحل الصلاة */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: 'var(--gold-bright)' }}
              onClick={() => toggleAcc('stages')}
            >
              <span>مراحل الصلاة (الأذان، الإقامة، إغلاق الهاتف، الأذكار)</span>
              <span>{openAcc.stages ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.stages ? ' expanded' : ''}`}>
              {/* 1. الأذان */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  border: '1px solid #334155',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#F59E0B' }}>1. مرحلة الأذان</h4>
                <div className="input-row-2 form-group">
                  <div>
                    <label>مدة الأذان - الدقائق</label>
                    <input
                      type="number"
                      id="cfg-adhan-min"
                      className="form-input-text"
                      min={0}
                      value={ui.stages.adhan.min}
                      onChange={(e) =>
                        onUpdateUI((prev) => ({
                          ...prev,
                          stages: {
                            ...prev.stages,
                            adhan: {
                              ...prev.stages.adhan,
                              min: Math.max(0, parseInt(e.target.value, 10) || 0),
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>مدة الأذان - الثواني</label>
                    <input
                      type="number"
                      id="cfg-adhan-sec"
                      className="form-input-text"
                      min={0}
                      max={59}
                      value={ui.stages.adhan.sec}
                      onChange={(e) =>
                        onUpdateUI((prev) => ({
                          ...prev,
                          stages: {
                            ...prev.stages,
                            adhan: {
                              ...prev.stages.adhan,
                              sec: Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)),
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>صورة شاشة الأذان</label>
                  <input
                    type="file"
                    id="cfg-adhan-img"
                    accept="image/*"
                    className="form-input-text"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadImage('stage_adhan', f);
                    }}
                  />
                  <div className="image-preview-container" id="prev-adhan-box">
                    {images.stage_adhan ? (
                      <img src={images.stage_adhan} alt="معاينة الأذان" />
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '12px' }}>
                        لم يتم اختيار صورة (الافتراضي)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-clear-img"
                    onClick={() => onClearImage('stage_adhan')}
                  >
                    مسح الصورة
                  </button>
                </div>
                <div className="form-group">
                  <label>موضع نص الأذان</label>
                  <select
                    id="cfg-adhan-pos"
                    className="form-select"
                    value={ui.stages.adhan.pos}
                    onChange={(e) =>
                      onUpdateUI((prev) => ({
                        ...prev,
                        stages: {
                          ...prev.stages,
                          adhan: {
                            ...prev.stages.adhan,
                            pos: e.target.value as 'top' | 'center' | 'bottom',
                          },
                        },
                      }))
                    }
                  >
                    <option value="top">أعلى الشاشة</option>
                    <option value="center">منتصف الشاشة</option>
                    <option value="bottom">أسفل الشاشة</option>
                  </select>
                </div>
              </div>

              {/* 2. العد التنازلي للإقامة */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  border: '1px solid #334155',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#F59E0B' }}>
                  2. مرحلة العد التنازلي للإقامة
                </h4>
                <div className="form-group">
                  <label>صورة شاشة العد التنازلي</label>
                  <input
                    type="file"
                    id="cfg-iqama-img"
                    accept="image/*"
                    className="form-input-text"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadImage('stage_iqama', f);
                    }}
                  />
                  <div className="image-preview-container" id="prev-iqama-box">
                    {images.stage_iqama ? (
                      <img src={images.stage_iqama} alt="معاينة الإقامة" />
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '12px' }}>
                        لم يتم اختيار صورة (الافتراضي)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-clear-img"
                    onClick={() => onClearImage('stage_iqama')}
                  >
                    مسح الصورة
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  * وقت العد التنازلي يتم احتسابه تلقائياً من وقت الإقامة المحدد لكل صلاة في هذه المدينة.
                </p>
              </div>

              {/* 3. إغلاق الهاتف */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  border: '1px solid #334155',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#F87171' }}>3. مرحلة إغلاق الهاتف</h4>
                <div className="form-group">
                  <label>صورة شاشة إغلاق الهاتف</label>
                  <input
                    type="file"
                    id="cfg-silence-img"
                    accept="image/*"
                    className="form-input-text"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadImage('stage_silence', f);
                    }}
                  />
                  <div className="image-preview-container" id="prev-silence-box">
                    {images.stage_silence ? (
                      <img src={images.stage_silence} alt="معاينة إغلاق الهاتف" />
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '12px' }}>لم يتم اختيار صورة</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-clear-img"
                    onClick={() => onClearImage('stage_silence')}
                  >
                    مسح الصورة
                  </button>
                </div>
                <div className="input-row-2 form-group">
                  <div>
                    <label>مدة إغلاق الهاتف - الدقائق</label>
                    <input
                      type="number"
                      id="cfg-silence-min"
                      className="form-input-text"
                      min={0}
                      value={ui.stages.silence.min}
                      onChange={(e) =>
                        onUpdateUI((prev) => ({
                          ...prev,
                          stages: {
                            ...prev.stages,
                            silence: {
                              ...prev.stages.silence,
                              min: Math.max(0, parseInt(e.target.value, 10) || 0),
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>مدة إغلاق الهاتف - الثواني</label>
                    <input
                      type="number"
                      id="cfg-silence-sec"
                      className="form-input-text"
                      min={0}
                      max={59}
                      value={ui.stages.silence.sec}
                      onChange={(e) =>
                        onUpdateUI((prev) => ({
                          ...prev,
                          stages: {
                            ...prev.stages,
                            silence: {
                              ...prev.stages.silence,
                              sec: Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)),
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 4. أذكار ما بعد الصلاة (مستقلة لكل مدينة) */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '14px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  border: '1px solid #334155',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#34D399', fontSize: '15px' }}>
                  📿 4. مرحلة أذكار ما بعد الصلوات (مستقلة لهذه المدينة)
                </h4>

                <div className="form-group">
                  <label>حالة عرض الأذكار بعد الصلاة</label>
                  <select
                    id="cfg-azkar-enabled"
                    className="form-select"
                    value={activeCity.azkarSettings.enabled ? '1' : '0'}
                    onChange={(e) =>
                      onUpdateCity((prev) => ({
                        ...prev,
                        azkarSettings: {
                          ...prev.azkarSettings,
                          enabled: e.target.value === '1',
                        },
                      }))
                    }
                  >
                    <option value="1">✓ مفعّل — عرض الأذكار تلقائياً بعد انتهاء الصلاة</option>
                    <option value="0">✕ متوقف — عدم عرض الأذكار في هذه المدينة</option>
                  </select>
                </div>

                <div className="input-row-2 form-group">
                  <div>
                    <label>تأخير البدء بعد الإقامة (ثانية)</label>
                    <input
                      type="number"
                      id="cfg-azkar-delay"
                      className="form-input-text"
                      min={0}
                      max={600}
                      value={activeCity.azkarSettings.startDelaySec}
                      onChange={(e) =>
                        onUpdateCity((prev) => ({
                          ...prev,
                          azkarSettings: {
                            ...prev.azkarSettings,
                            startDelaySec: Math.max(0, parseInt(e.target.value, 10) || 0),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>مدة بقاء كل ذكر (1-60 ث)</label>
                    <input
                      type="number"
                      id="cfg-azkar-step"
                      className="form-input-text"
                      min={1}
                      max={60}
                      value={azkarStep}
                      onChange={(e) => {
                        const num = Math.min(60, Math.max(1, parseInt(e.target.value, 10) || 5));
                        onUpdateCity((prev) => ({
                          ...prev,
                          azkarSettings: { ...prev.azkarSettings, stepSec: num },
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Per-prayer Azkar start delay */}
                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#CBD5E1' }}>
                  <div style={{ marginBottom: '6px', color: '#34D399' }}>
                    توقيت بدء الأذكار الإضافي بعد كل صلاة (بالثواني):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as ObligatoryPrayerId[]).map(
                      (pid) => {
                        const labels: Record<ObligatoryPrayerId, string> = {
                          fajr: 'الفجر',
                          dhuhr: 'الظهر',
                          asr: 'العصر',
                          maghrib: 'المغرب',
                          isha: 'العشاء',
                        };
                        return (
                          <div key={pid} style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>
                              {labels[pid]}
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={600}
                              className="form-input-text"
                              style={{ padding: '4px', fontSize: '12px', textAlign: 'center' }}
                              value={activeCity.azkarSettings.perPrayerDelaySec?.[pid] ?? 0}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                onUpdateCity((prev) => ({
                                  ...prev,
                                  azkarSettings: {
                                    ...prev.azkarSettings,
                                    perPrayerDelaySec: {
                                      ...prev.azkarSettings.perPrayerDelaySec,
                                      [pid]: val,
                                    },
                                  },
                                }));
                              }}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div
                  id="azkar-timing-calc-info"
                  style={{
                    fontSize: '12px',
                    color: '#FBBF24',
                    marginBottom: '10px',
                    lineHeight: 1.5,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                  }}
                >
                  ⏱️ مدة كل ذكر: <b>{azkarStep} ثوانٍ</b> — إجمالي العرض: <b>{azkarTotalSec} ثانية</b> (9 أذكار بالتسلسل).
                </div>

                <div className="form-group">
                  <label>صورة خلفية شاشة الأذكار</label>
                  <input
                    type="file"
                    id="cfg-azkar-img"
                    accept="image/*"
                    className="form-input-text"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadImage('stage_azkar', f);
                    }}
                  />
                  <div className="image-preview-container" id="prev-azkar-box">
                    {images.stage_azkar ? (
                      <img src={images.stage_azkar} alt="معاينة الأذكار" />
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '12px' }}>
                        لم يتم اختيار صورة (الخلفية الإسلامية التلقائية)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-clear-img"
                    onClick={() => onClearImage('stage_azkar')}
                  >
                    مسح الصورة
                  </button>
                </div>

                <div className="color-picker-item">
                  <span className="color-picker-label">لون نصوص الأذكار ورقم الذكر</span>
                  <div className="color-picker-control">
                    <span className="color-hex-tag" id="tag-azkarTextColor-local">
                      {tc.azkarTextColor}
                    </span>
                    <input
                      type="color"
                      className="color-input-bubble"
                      id="col-azkarTextColor-local"
                      value={tc.azkarTextColor}
                      onChange={(e) => onChangeThemeColor('azkarTextColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="button" className="btn-test-sequence" onClick={onRunDemoSequence}>
                ▶ تجربة تشغيل المراحل الأربعة بالتسلسل الآن
              </button>
            </div>
          </div>

          {/* 3.5 إعدادات الشاشة ومنع السكون (مستقلة لكل مدينة) */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: '#A78BFA' }}
              onClick={() => toggleAcc('screen')}
            >
              <span>📱 إعدادات إغلاق الشاشة ومنع السكون</span>
              <span>{openAcc.screen ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.screen ? ' expanded' : ''}`}>
              <div className="form-group">
                <label>وضع الشاشة بعد الأذان والإقامة</label>
                <select
                  id="cfg-screen-mode"
                  className="form-select"
                  value={activeCity.screenSettings.mode}
                  onChange={(e) =>
                    onUpdateCity((prev) => ({
                      ...prev,
                      screenSettings: {
                        ...prev.screenSettings,
                        mode: e.target.value as CityProfile['screenSettings']['mode'],
                      },
                    }))
                  }
                >
                  <option value="always_on">💡 إبقاء الشاشة مضاءة دائماً (Wake Lock)</option>
                  <option value="after_adhan">🌑 إطفاء/تعتيم الشاشة بعد الأذان بمدة محددة</option>
                  <option value="after_iqama">🌙 إطفاء/تعتيم الشاشة بعد الإقامة بمدة محددة</option>
                </select>
              </div>

              {activeCity.screenSettings.mode !== 'always_on' && (
                <>
                  <div className="form-group">
                    <label>عدد الدقائق قبل إطفاء/تعتيم الشاشة</label>
                    <input
                      type="number"
                      id="cfg-screen-timeout"
                      className="form-input-text"
                      min={1}
                      max={180}
                      value={activeCity.screenSettings.timeoutMinutes}
                      onChange={(e) =>
                        onUpdateCity((prev) => ({
                          ...prev,
                          screenSettings: {
                            ...prev.screenSettings,
                            timeoutMinutes: Math.max(1, parseInt(e.target.value, 10) || 15),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={activeCity.screenSettings.keepClockVisible}
                        onChange={(e) =>
                          onUpdateCity((prev) => ({
                            ...prev,
                            screenSettings: {
                              ...prev.screenSettings,
                              keepClockVisible: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>إظهار ساعة خافتة أثناء وضع توفير الطاقة</span>
                    </label>
                  </div>
                </>
              )}

              <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                * ملاحظة أمان Android / Android TV: يتم التحكم بالشاشة عبر واجهة Wake Lock وتعتيم شاشة العرض دون إيقاف تشغيل الجهاز أو إغلاق التطبيق قسرياً.
              </p>

              <button
                type="button"
                className="btn-test-sequence"
                style={{ background: '#4C1D95' }}
                onClick={onTestScreenSaver}
              >
                🌙 معاينة وضع إطفاء/تعتيم الشاشة الآن
              </button>
            </div>
          </div>

          {/* 3.8 النسخ الاحتياطي وسجل التعديلات */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: '#34D399' }}
              onClick={() => toggleAcc('backup')}
            >
              <span>🛡️ النسخ الاحتياطي وسجل التعديلات</span>
              <span>{openAcc.backup ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.backup ? ' expanded' : ''}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className="btn-test-sequence"
                  style={{ background: '#0F766E', marginTop: 0 }}
                  onClick={onExportBackup}
                >
                  ⬇ تنزيل نسخة احتياطية كاملة (JSON)
                </button>

                <label
                  style={{
                    background: '#1E293B',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '9px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ⬆ استعادة نسخة احتياطية كاملة (جميع المدن)
                  <input
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onImportFullBackup(f);
                      e.target.value = '';
                    }}
                  />
                </label>

                <label
                  style={{
                    background: '#1E293B',
                    border: '1px solid #38BDF8',
                    color: '#7DD3FC',
                    borderRadius: '8px',
                    padding: '9px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  🔄 استعادة إعدادات هذه المدينة فقط ({activeCity.mosqueName})
                  <input
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onRestoreSingleCityBackup(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#F59E0B', marginBottom: '6px' }}>
                📜 سجل تغييرات هذه المدينة ({activeCity.changeHistory.length}):
              </div>
              <div
                style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '11.5px',
                }}
              >
                {activeCity.changeHistory.length === 0 ? (
                  <div style={{ color: '#64748B' }}>لا توجد تعديلات مسجلة لهذه المدينة بعد.</div>
                ) : (
                  activeCity.changeHistory.slice(0, 20).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        padding: '4px 0',
                        color: '#CBD5E1',
                      }}
                    >
                      <span style={{ color: '#34D399' }}>• {entry.note}</span> ({entry.oldValue} ←{' '}
                      {entry.newValue})
                      <div style={{ fontSize: '10px', color: '#64748B' }} dir="ltr">
                        {entry.timestamp.replace('T', ' ').slice(0, 19)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. الخلفية الرئيسية وتفتيح الصورة والسطوع */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: '#F59E0B' }}
              onClick={() => toggleAcc('bg')}
            >
              <span>🖼️ الخلفية الرئيسية وتفتيح الصورة والسطوع</span>
              <span>{openAcc.bg ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.bg ? ' expanded' : ''}`}>
              <div className="form-group">
                <label>تغيير صورة الخلفية (رفع من الجهاز)</label>
                <input
                  type="file"
                  id="cfg-main-bg"
                  accept="image/*"
                  className="form-input-text"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadImage('main_bg', f);
                  }}
                />
                <div className="image-preview-container" id="prev-main-bg-box" style={{ height: '120px' }}>
                  {images.main_bg || ui.presetBgUrl ? (
                    <img src={images.main_bg || ui.presetBgUrl || ''} alt="معاينة الخلفية" />
                  ) : (
                    <span style={{ color: '#64748B', fontSize: '12px' }}>
                      الخلفية الافتراضية (المسجد النبوي)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-clear-img"
                  onClick={() => onClearImage('main_bg')}
                  style={{ marginTop: '6px' }}
                >
                  ↺ استعادة الخلفية الأصلية
                </button>
              </div>

              <div className="form-group">
                <label>أو اختر من خلفيات المساجد الجاهزة عالية الدقة:</label>
                <div className="bg-preset-grid">
                  {PRESET_BGS.map((bg) => (
                    <div
                      key={bg.name}
                      className={`bg-preset-thumb${ui.presetBgUrl === bg.url ? ' active' : ''}`}
                      onClick={() => onSelectPresetBg(bg.url)}
                    >
                      <img src={bg.thumb} alt={bg.name} />
                      <span>{bg.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="form-group"
                style={{
                  marginTop: '14px',
                  background: 'rgba(0,0,0,0.35)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                }}
              >
                <label style={{ color: '#F59E0B', fontWeight: 700, fontSize: '14px' }}>
                  ☀️ وضع السطوع وتفتيح الصورة لتكن ساطعة:
                </label>

                <div className="brightness-modes-row">
                  <button
                    type="button"
                    className={`btn-brightness-mode${ui.bgMode === 'super' ? ' active' : ''}`}
                    onClick={() => onApplyBrightnessPreset('super')}
                  >
                    ☀️ ساطعة جداً (فائق)
                  </button>
                  <button
                    type="button"
                    className={`btn-brightness-mode${ui.bgMode === 'bright' ? ' active' : ''}`}
                    onClick={() => onApplyBrightnessPreset('bright')}
                  >
                    🌤️ ساطعة (واضحة)
                  </button>
                  <button
                    type="button"
                    className={`btn-brightness-mode${ui.bgMode === 'normal' ? ' active' : ''}`}
                    onClick={() => onApplyBrightnessPreset('normal')}
                  >
                    ⛅ متوازنة
                  </button>
                  <button
                    type="button"
                    className={`btn-brightness-mode${ui.bgMode === 'dim' ? ' active' : ''}`}
                    onClick={() => onApplyBrightnessPreset('dim')}
                  >
                    🌙 ليلية هادئة
                  </button>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <label style={{ margin: 0, fontSize: '13px' }}>
                      تفتيح سطوع الصورة (Brightness)
                    </label>
                    <span style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '14px' }}>
                      {ui.bgBrightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    id="slider-bg-brightness"
                    min={50}
                    max={200}
                    step={5}
                    value={ui.bgBrightness}
                    className="form-range-slider"
                    onChange={(e) =>
                      onUpdateUI((prev) => ({
                        ...prev,
                        bgBrightness: parseInt(e.target.value, 10),
                        bgMode: 'custom',
                      }))
                    }
                  />
                </div>

                <div style={{ marginTop: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <label style={{ margin: 0, fontSize: '13px' }}>
                      مستوى التعتيم (تقليله يجعل الصورة ساطعة كلياً)
                    </label>
                    <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '14px' }}>
                      {overlayLabel}
                    </span>
                  </div>
                  <input
                    type="range"
                    id="slider-bg-overlay"
                    min={0}
                    max={85}
                    step={5}
                    value={ui.bgOverlayOpacity}
                    className="form-range-slider"
                    onChange={(e) =>
                      onUpdateUI((prev) => ({
                        ...prev,
                        bgOverlayOpacity: parseInt(e.target.value, 10),
                        bgMode: 'custom',
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. تخصيص ألوان الصناديق والساعة والخطوط */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: '#38BDF8' }}
              onClick={() => toggleAcc('colors')}
            >
              <span>🎨 تخصيص ألوان الصناديق والساعة والخطوط</span>
              <span>{openAcc.colors ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.colors ? ' expanded' : ''}`}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  أنماط ألوان جاهزة للاختيار السريع:
                </span>
                <div className="theme-presets-row">
                  <button
                    type="button"
                    className="btn-theme-preset"
                    style={{ background: '#1e1b10', borderColor: '#c5a038' }}
                    onClick={() => onApplyThemePreset('gold')}
                  >
                    🌟 ذهبي ملكي
                  </button>
                  <button
                    type="button"
                    className="btn-theme-preset"
                    style={{ background: '#0f172a', borderColor: '#38bdf8' }}
                    onClick={() => onApplyThemePreset('blue')}
                  >
                    🔷 أزرق نيلي
                  </button>
                  <button
                    type="button"
                    className="btn-theme-preset"
                    style={{ background: '#062817', borderColor: '#34d399' }}
                    onClick={() => onApplyThemePreset('green')}
                  >
                    🟢 أخضر زمردي
                  </button>
                  <button
                    type="button"
                    className="btn-theme-preset"
                    style={{ background: '#18181b', borderColor: '#e4e4e7' }}
                    onClick={() => onApplyThemePreset('silver')}
                  >
                    ⚪ فضي بلاتيني
                  </button>
                </div>
              </div>

              {(
                [
                  ['mosqueNameColor', 'لون خط اسم المسجد'],
                  ['clockBoxBg', 'خلفية صندوق الساعة'],
                  ['clockBoxBorder', 'إطار صندوق الساعة'],
                  ['clockDigitsColor', 'خط أرقام الساعة (ساعات/دقائق)'],
                  ['clockSecColor', 'خط الثواني ومؤشر AM/PM'],
                  ['clockDateColor', 'خط التاريخ الهجري والميلادي'],
                  ['nextTitleColor', 'خط عنوان "باقي للصلاة القادمة" والوقت'],
                  ['nextNameColor', 'خط اسم الصلاة القادمة'],
                  ['nextTimerColor', 'خط عداد الوقت المتبقي'],
                  ['fajrTimeColor', 'رقم وقت صلاة الفجر'],
                  ['shuruqTimeColor', 'رقم وقت الشروق'],
                  ['dhuhrTimeColor', 'رقم وقت صلاة الظهر'],
                  ['asrTimeColor', 'رقم وقت صلاة العصر'],
                  ['maghribTimeColor', 'رقم وقت صلاة المغرب'],
                  ['ishaTimeColor', 'رقم وقت صلاة العشاء'],
                  ['cardsBg', 'خلفية صناديق الصلوات'],
                  ['cardsBorder', 'إطار صناديق الصلوات'],
                  ['cardsNameColor', 'خط أسماء الصلوات'],
                  ['iqamaTextColor', 'خط وقت الإقامة (في البطاقات)'],
                  ['jummahBg', 'خلفية صندوق صلاة الجمعة'],
                  ['jummahBorder', 'إطار صندوق صلاة الجمعة'],
                  ['jummahTextColor', 'خط صندوق صلاة الجمعة'],
                  ['azkarTextColor', '📿 لون نصوص أذكار ما بعد الصلاة'],
                  ['azkarTimerColor', '⏱️ لون عداد أذكار ما بعد الصلاة'],
                  ['adhanTextColor', '📢 لون نص وعنوان شاشة الأذان'],
                  ['adhanTimerColor', '⏰ لون عداد وقت الأذان'],
                  ['iqamaTimerColor', '🕌 لون عداد وقت الإقامة (العد التنازلي)'],
                  ['silenceTimerColor', '📴 لون عداد شاشة إغلاق الهاتف'],
                ] as [keyof ThemeColors, string][]
              ).map(([key, label]) => (
                <div key={key} className="color-picker-item">
                  <span className="color-picker-label">{label}</span>
                  <div className="color-picker-control">
                    <span className="color-hex-tag">{tc[key]}</span>
                    <input
                      type="color"
                      className="color-input-bubble"
                      value={tc[key]}
                      onChange={(e) => onChangeThemeColor(key, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px dashed #F59E0B',
                  borderRadius: '8px',
                  padding: '10px',
                  marginTop: '10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#FBBF24', marginBottom: '6px' }}>
                  ⚡ ضبط لون موحد لجميع عدادات العد التنازلي بنقرة واحدة:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    ['#F59E0B', '🟡 ذهبي'],
                    ['#38BDF8', '🔵 أزرق'],
                    ['#34D399', '🟢 زمردي'],
                    ['#F87171', '🔴 أحمر'],
                    ['#FFFFFF', '⚪ أبيض'],
                    ['#A855F7', '🟣 بنفسجي'],
                  ].map(([hex, label]) => (
                    <button
                      key={hex}
                      type="button"
                      className="btn-theme-preset"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: '#000',
                        borderColor: hex,
                        color: hex,
                      }}
                      onClick={() => onSetAllTimersColor(hex)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-clear-img"
                style={{ color: '#F87171', fontSize: '13px', marginTop: '10px' }}
                onClick={onResetThemeColors}
              >
                ↺ استعادة جميع الألوان الافتراضية
              </button>
            </div>
          </div>

          {/* 6. الصوتيات */}
          <div className="drawer-accordion">
            <div
              className="drawer-acc-header"
              style={{ color: '#38BDF8' }}
              onClick={() => toggleAcc('audio')}
            >
              <span>🔊 الصوتيات ورفع ملفات الأذان والتنبيهات</span>
              <span>{openAcc.audio ? '▲' : '▼'}</span>
            </div>
            <div className={`drawer-acc-body${openAcc.audio ? ' expanded' : ''}`}>
              <div className="form-group">
                <label>تشغيل الصوت العام</label>
                <select
                  id="cfg-sound-enabled"
                  className="form-select"
                  value={ui.soundEnabled ? '1' : '0'}
                  onChange={(e) =>
                    onUpdateUI((prev) => ({ ...prev, soundEnabled: e.target.value === '1' }))
                  }
                >
                  <option value="1">🔊 مفعّل (تشغيل الأذان والتنبيهات الصوتية)</option>
                  <option value="0">🔇 صامت (كتم جميع الأصوات)</option>
                </select>
              </div>

              <div
                className="form-group"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <label style={{ margin: 0, fontSize: '13px', color: '#F59E0B', fontWeight: 'bold' }}>
                    🎚️ مستوى الصوت (Volume):
                  </label>
                  <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '14px' }}>
                    {ui.audioVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-audio-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={ui.audioVolume}
                  className="form-range-slider"
                  onChange={(e) =>
                    onUpdateUI((prev) => ({
                      ...prev,
                      audioVolume: parseInt(e.target.value, 10),
                    }))
                  }
                />
              </div>

              {/* Fajr Audio */}
              <div
                className="audio-upload-card"
                style={{
                  border: '1px solid #d97706',
                  background: 'rgba(69, 26, 3, 0.35)',
                  marginBottom: '12px',
                }}
              >
                <label style={{ color: '#FBBF24', fontWeight: 700, fontSize: '14px' }}>
                  🌅 ملف صوت أذان الفجر المخصص (خاص بصلاة الفجر فقط):
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  className="form-input-text"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadAudio('adhan_fajr', f);
                    e.target.value = '';
                  }}
                />
                <div className="audio-file-badge" style={{ borderColor: '#d97706' }}>
                  <span style={{ color: audioNames.adhan_fajr ? '#10B981' : '#94A3B8' }}>
                    {audioNames.adhan_fajr
                      ? `✔ تم حفظ أذان الفجر: ${audioNames.adhan_fajr}`
                      : 'لم يتم رفع ملف خاص بالفجر (يتم استخدام الصوت الافتراضي)'}
                  </span>
                </div>
                <div className="audio-btn-row">
                  {playingAudioSlot === 'adhan_fajr' ? (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-stop"
                      onClick={onStopSounds}
                    >
                      ⏹ إيقاف
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-play"
                      onClick={() => onTestAudio('adhan_fajr')}
                    >
                      ▶ تجربة أذان الفجر
                    </button>
                  )}
                  {audioNames.adhan_fajr && (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-delete"
                      onClick={() => onRemoveAudio('adhan_fajr')}
                    >
                      🗑️ حذف صوت الفجر
                    </button>
                  )}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#CBD5E1' }}>مصدر أذان الفجر:</label>
                  <select
                    className="form-select"
                    value={ui.fajrAudioSource}
                    onChange={(e) =>
                      onUpdateUI((prev) => ({
                        ...prev,
                        fajrAudioSource: e.target.value as AppRootState['ui']['fajrAudioSource'],
                      }))
                    }
                  >
                    <option value="custom">📁 ملف مخصص مرفوع من جهازي للفجر</option>
                    <option value="preset_makkah">🕋 أذان الفجر بالحرم المكي</option>
                    <option value="preset_madinah">🕌 أذان الفجر بالمسجد النبوي الشريف</option>
                    <option value="same_as_adhan">🔄 نفس صوت الأذان العام لباقي الصلوات</option>
                    <option value="chime">🔔 تكبيرات ونغمة أذان الفجر</option>
                    <option value="silent">🔕 صامت لصلاة الفجر</option>
                  </select>
                </div>
              </div>

              {/* General Adhan Audio */}
              <div className="audio-upload-card">
                <label style={{ color: '#38BDF8', fontWeight: 700, fontSize: '14px' }}>
                  🕌 ملف صوت الأذان العام (لباقي الصلوات: الظهر، العصر، المغرب، العشاء):
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  className="form-input-text"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadAudio('adhan', f);
                    e.target.value = '';
                  }}
                />
                <div className="audio-file-badge">
                  <span style={{ color: audioNames.adhan ? '#10B981' : '#94A3B8' }}>
                    {audioNames.adhan
                      ? `✔ تم حفظ الأذان العام: ${audioNames.adhan}`
                      : 'لم يتم رفع ملف صوت حتى الآن'}
                  </span>
                </div>
                <div className="audio-btn-row">
                  {playingAudioSlot === 'adhan' ? (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-stop"
                      onClick={onStopSounds}
                    >
                      ⏹ إيقاف
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-play"
                      onClick={() => onTestAudio('adhan')}
                    >
                      ▶ تجربة الأذان العام
                    </button>
                  )}
                  {audioNames.adhan && (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-delete"
                      onClick={() => onRemoveAudio('adhan')}
                    >
                      🗑️ حذف الصوت المرفوع
                    </button>
                  )}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#CBD5E1' }}>أو اختر من أصوات الأذان العام الجاهزة:</label>
                  <select
                    className="form-select"
                    value={ui.adhanAudioSource}
                    onChange={(e) =>
                      onUpdateUI((prev) => ({
                        ...prev,
                        adhanAudioSource: e.target.value as AppRootState['ui']['adhanAudioSource'],
                      }))
                    }
                  >
                    <option value="custom">📁 ملف مخصص مرفوع من جهازي</option>
                    <option value="preset_makkah">🕋 أذان الحرم المكي الشريف</option>
                    <option value="preset_madinah">🕌 أذان المسجد النبوي الشريف</option>
                    <option value="chime">🔔 نغمة تنبيه وتكبيرات إسلامية</option>
                    <option value="silent">🔕 صامت بدون صوت</option>
                  </select>
                </div>
              </div>

              {/* Iqama Audio */}
              <div className="audio-upload-card" style={{ borderColor: '#38BDF8', marginTop: '12px' }}>
                <label style={{ color: '#38BDF8', fontWeight: 700, fontSize: '14px' }}>
                  🔔 خانة رفع ملف صوت تنبيه الإقامة:
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  className="form-input-text"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadAudio('iqama', f);
                    e.target.value = '';
                  }}
                />
                <div className="audio-file-badge">
                  <span style={{ color: audioNames.iqama ? '#38BDF8' : '#94A3B8' }}>
                    {audioNames.iqama
                      ? `✔ تم حفظ صوت الإقامة: ${audioNames.iqama}`
                      : 'نغمة تنبيه الإقامة الافتراضية'}
                  </span>
                </div>
                <div className="audio-btn-row">
                  {playingAudioSlot === 'iqama' ? (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-stop"
                      onClick={onStopSounds}
                    >
                      ⏹ إيقاف
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-play"
                      onClick={() => onTestAudio('iqama')}
                    >
                      ▶ تجربة صوت الإقامة
                    </button>
                  )}
                  {audioNames.iqama && (
                    <button
                      type="button"
                      className="btn-audio-action btn-audio-delete"
                      onClick={() => onRemoveAudio('iqama')}
                    >
                      🗑️ حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-bottom-bar">
          <button className="btn-save-close" onClick={onClose}>
            حفظ وإغلاق
          </button>
          <button className="btn-update-times" onClick={onRefreshAndSync}>
            تحديث مواقيت الصلاة
          </button>
        </div>
      </div>
    </>
  );
};
