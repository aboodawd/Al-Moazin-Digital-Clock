import type {
  CalculationMethodId,
  CityCalculationSettings,
  CityDef,
  CityProfile,
  CountryDef,
  HighLatitudeRuleType,
  MadhabType,
} from '../types/prayer';

export const METHOD_LABELS: Record<
  CalculationMethodId,
  { ar: string; en: string; fajrAngle: number; ishaAngle: number; ishaInterval: number }
> = {
  JordanAwqaf: {
    ar: 'وزارة الأوقاف الأردنية (18° / 18°)',
    en: 'Jordan Ministry of Awqaf (18° / 18°)',
    fajrAngle: 18.0,
    ishaAngle: 18.0,
    ishaInterval: 0,
  },
  UmmAlQura: {
    ar: 'أم القرى - مكة المكرمة (18.5° / 90د)',
    en: 'Umm Al-Qura University, Makkah',
    fajrAngle: 18.5,
    ishaAngle: 0,
    ishaInterval: 90,
  },
  MuslimWorldLeague: {
    ar: 'رابطة العالم الإسلامي (18° / 17°)',
    en: 'Muslim World League (MWL)',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
    ishaInterval: 0,
  },
  Egyptian: {
    ar: 'الهيئة المصرية العامة للمساحة (19.5° / 17.5°)',
    en: 'Egyptian General Authority of Survey',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    ishaInterval: 0,
  },
  Turkey: {
    ar: 'رئاسة الشؤون الدينية التركية - ديانت (18° / 17°)',
    en: 'Diyanet İşleri Başkanlığı, Turkey',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
    ishaInterval: 0,
  },
  Dubai: {
    ar: 'دائرة الشؤون الإسلامية بدبي (18.2° / 18.2°)',
    en: 'Dubai / UAE Authority',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
    ishaInterval: 0,
  },
  Kuwait: {
    ar: 'وزارة الأوقاف الكويتية (18° / 17.5°)',
    en: 'Kuwait Ministry of Awqaf',
    fajrAngle: 18.0,
    ishaAngle: 17.5,
    ishaInterval: 0,
  },
  Qatar: {
    ar: 'وزارة الأوقاف القطرية (18° / 90د)',
    en: 'Qatar Calendar House',
    fajrAngle: 18.0,
    ishaAngle: 0,
    ishaInterval: 90,
  },
  NorthAmerica: {
    ar: 'الجمعية الإسلامية لأمريكا الشمالية ISNA (15° / 15°)',
    en: 'ISNA (North America)',
    fajrAngle: 15.0,
    ishaAngle: 15.0,
    ishaInterval: 0,
  },
  Karachi: {
    ar: 'جامعة العلوم الإسلامية بكراتشي (18° / 18°)',
    en: 'University of Islamic Sciences, Karachi',
    fajrAngle: 18.0,
    ishaAngle: 18.0,
    ishaInterval: 0,
  },
  Singapore: {
    ar: 'مجلس الشؤون الإسلامية سنغافورة (20° / 18°)',
    en: 'MUIS (Singapore / Malaysia)',
    fajrAngle: 20.0,
    ishaAngle: 18.0,
    ishaInterval: 0,
  },
  MoonsightingCommittee: {
    ar: 'لجنة تحري الهلال العالمية (18° / 18°)',
    en: 'Moonsighting Committee Worldwide',
    fajrAngle: 18.0,
    ishaAngle: 18.0,
    ishaInterval: 0,
  },
  Tehran: {
    ar: 'معهد الجيوفيزياء بجامعة طهران (17.7° / 14°)',
    en: 'Institute of Geophysics, Tehran',
    fajrAngle: 17.7,
    ishaAngle: 14.0,
    ishaInterval: 0,
  },
  Custom: {
    ar: 'إعدادات مخصصة (زوايا يدوية)',
    en: 'Custom Angles',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
    ishaInterval: 0,
  },
};

function c(
  countryId: string,
  cityId: string,
  nameAr: string,
  nameEn: string,
  lat: number,
  lng: number,
  timeZoneId: string,
  defaultMethod?: CalculationMethodId
): CityDef {
  return { countryId, cityId, nameAr, nameEn, lat, lng, timeZoneId, defaultMethod };
}

export const WORLD_COUNTRIES: CountryDef[] = [
  // =========================================================================
  // الدول العربية (Arab Countries)
  // =========================================================================
  {
    countryId: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    region: 'arab',
    defaultMethod: 'JordanAwqaf',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('JO', 'jo_amman', 'عمّان', 'Amman', 31.9539, 35.9106, 'Asia/Amman'),
      c('JO', 'jo_irbid', 'إربد', 'Irbid', 32.5568, 35.8469, 'Asia/Amman'),
      c('JO', 'jo_zarqa', 'الزرقاء', 'Zarqa', 32.0728, 36.0880, 'Asia/Amman'),
      c('JO', 'jo_aqaba', 'العقبة', 'Aqaba', 29.5321, 35.0063, 'Asia/Amman'),
      c('JO', 'jo_salt', 'السلط', 'As-Salt', 32.0392, 35.7272, 'Asia/Amman'),
      c('JO', 'jo_madaba', 'مادبا', 'Madaba', 31.7197, 35.7956, 'Asia/Amman'),
      c('JO', 'jo_jerash', 'جرش', 'Jerash', 32.2747, 35.8961, 'Asia/Amman'),
      c('JO', 'jo_mafraq', 'المفرق', 'Mafraq', 32.3429, 36.2080, 'Asia/Amman'),
      c('JO', 'jo_maan', 'معان', 'Maan', 30.1927, 35.7342, 'Asia/Amman'),
      c('JO', 'jo_karak', 'الكرك', 'Al-Karak', 31.1853, 35.7048, 'Asia/Amman'),
      c('JO', 'jo_tafilah', 'الطفيلة', 'Tafilah', 30.8375, 35.6044, 'Asia/Amman'),
      c('JO', 'jo_ajloun', 'عجلون', 'Ajloun', 32.3326, 35.7518, 'Asia/Amman'),
    ],
  },
  {
    countryId: 'SA',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    region: 'arab',
    defaultMethod: 'UmmAlQura',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('SA', 'sa_riyadh', 'الرياض', 'Riyadh', 24.7136, 46.6753, 'Asia/Riyadh'),
      c('SA', 'sa_makkah', 'مكة المكرمة', 'Makkah', 21.3891, 39.8579, 'Asia/Riyadh'),
      c('SA', 'sa_madinah', 'المدينة المنورة', 'Madinah', 24.5247, 39.5692, 'Asia/Riyadh'),
      c('SA', 'sa_jeddah', 'جدة', 'Jeddah', 21.4858, 39.1925, 'Asia/Riyadh'),
      c('SA', 'sa_dammam', 'الدمام', 'Dammam', 26.4207, 50.0888, 'Asia/Riyadh'),
      c('SA', 'sa_khobar', 'الخبر', 'Khobar', 26.2172, 50.1971, 'Asia/Riyadh'),
      c('SA', 'sa_taif', 'الطائف', 'Taif', 21.2703, 40.4158, 'Asia/Riyadh'),
      c('SA', 'sa_buraidah', 'القصيم - بريدة', 'Qassim (Buraidah)', 26.3260, 43.9750, 'Asia/Riyadh'),
      c('SA', 'sa_abha', 'أبها', 'Abha', 18.2164, 42.5053, 'Asia/Riyadh'),
      c('SA', 'sa_tabuk', 'تبوك', 'Tabuk', 28.3835, 36.5662, 'Asia/Riyadh'),
      c('SA', 'sa_hail', 'حائل', 'Hail', 27.5114, 41.7208, 'Asia/Riyadh'),
      c('SA', 'sa_najran', 'نجران', 'Najran', 17.5656, 44.2289, 'Asia/Riyadh'),
    ],
  },
  {
    countryId: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'United Arab Emirates',
    region: 'arab',
    defaultMethod: 'Dubai',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('AE', 'ae_dubai', 'دبي', 'Dubai', 25.2048, 55.2708, 'Asia/Dubai'),
      c('AE', 'ae_abudhabi', 'أبوظبي', 'Abu Dhabi', 24.4539, 54.3773, 'Asia/Dubai'),
      c('AE', 'ae_sharjah', 'الشارقة', 'Sharjah', 25.3463, 55.4209, 'Asia/Dubai'),
      c('AE', 'ae_ajman', 'عجمان', 'Ajman', 25.4052, 55.5136, 'Asia/Dubai'),
      c('AE', 'ae_rasalkhaimah', 'رأس الخيمة', 'Ras Al Khaimah', 25.7895, 55.9432, 'Asia/Dubai'),
      c('AE', 'ae_fujairah', 'الفجيرة', 'Fujairah', 25.1288, 56.3265, 'Asia/Dubai'),
      c('AE', 'ae_alain', 'العين', 'Al Ain', 24.1302, 55.8023, 'Asia/Dubai'),
    ],
  },
  {
    countryId: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    region: 'arab',
    defaultMethod: 'Qatar',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('QA', 'qa_doha', 'الدوحة', 'Doha', 25.2854, 51.5310, 'Asia/Qatar'),
      c('QA', 'qa_rayyan', 'الريان', 'Al Rayyan', 25.2919, 51.4244, 'Asia/Qatar'),
      c('QA', 'qa_wakrah', 'الوكرة', 'Al Wakrah', 25.1659, 51.5976, 'Asia/Qatar'),
      c('QA', 'qa_khor', 'الخور', 'Al Khor', 25.6804, 51.4969, 'Asia/Qatar'),
    ],
  },
  {
    countryId: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    region: 'arab',
    defaultMethod: 'Kuwait',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('KW', 'kw_kuwaitcity', 'مدينة الكويت', 'Kuwait City', 29.3759, 47.9774, 'Asia/Kuwait'),
      c('KW', 'kw_hawalli', 'حولي', 'Hawalli', 29.3328, 48.0286, 'Asia/Kuwait'),
      c('KW', 'kw_ahmadi', 'الأحمدي', 'Al Ahmadi', 29.0769, 48.0839, 'Asia/Kuwait'),
      c('KW', 'kw_jahra', 'الجهراء', 'Al Jahra', 29.3375, 47.6581, 'Asia/Kuwait'),
    ],
  },
  {
    countryId: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    region: 'arab',
    defaultMethod: 'UmmAlQura',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('BH', 'bh_manama', 'المنامة', 'Manama', 26.2285, 50.5860, 'Asia/Bahrain'),
      c('BH', 'bh_muharraq', 'المحرق', 'Muharraq', 26.2572, 50.6119, 'Asia/Bahrain'),
      c('BH', 'bh_riffa', 'الرفاع', 'Riffa', 26.1300, 50.5550, 'Asia/Bahrain'),
    ],
  },
  {
    countryId: 'OM',
    nameAr: 'سلطنة عُمان',
    nameEn: 'Oman',
    region: 'arab',
    defaultMethod: 'UmmAlQura',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('OM', 'om_muscat', 'مسقط', 'Muscat', 23.5880, 58.3829, 'Asia/Muscat'),
      c('OM', 'om_salalah', 'صلالة', 'Salalah', 17.0151, 54.0924, 'Asia/Muscat'),
      c('OM', 'om_sohar', 'صحار', 'Sohar', 24.3643, 56.7468, 'Asia/Muscat'),
      c('OM', 'om_nizwa', 'نزوى', 'Nizwa', 22.9333, 57.5333, 'Asia/Muscat'),
    ],
  },
  {
    countryId: 'YE',
    nameAr: 'اليمن',
    nameEn: 'Yemen',
    region: 'arab',
    defaultMethod: 'UmmAlQura',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('YE', 'ye_sanaa', 'صنعاء', 'Sanaa', 15.3694, 44.1910, 'Asia/Aden'),
      c('YE', 'ye_aden', 'عدن', 'Aden', 12.7855, 45.0187, 'Asia/Aden'),
      c('YE', 'ye_taiz', 'تعز', 'Taiz', 13.5795, 44.0209, 'Asia/Aden'),
      c('YE', 'ye_hudaydah', 'الحديدة', 'Al Hudaydah', 14.7979, 42.9545, 'Asia/Aden'),
      c('YE', 'ye_mukalla', 'المكلا', 'Al Mukalla', 14.5425, 49.1242, 'Asia/Aden'),
    ],
  },
  {
    countryId: 'IQ',
    nameAr: 'العراق',
    nameEn: 'Iraq',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('IQ', 'iq_baghdad', 'بغداد', 'Baghdad', 33.3152, 44.3661, 'Asia/Baghdad'),
      c('IQ', 'iq_basra', 'البصرة', 'Basra', 30.5085, 47.7804, 'Asia/Baghdad'),
      c('IQ', 'iq_mosul', 'الموصل', 'Mosul', 36.3489, 43.1577, 'Asia/Baghdad'),
      c('IQ', 'iq_erbil', 'أربيل', 'Erbil', 36.1911, 44.0092, 'Asia/Baghdad'),
      c('IQ', 'iq_najaf', 'النجف', 'Najaf', 32.0000, 44.3360, 'Asia/Baghdad'),
      c('IQ', 'iq_karbala', 'كربلاء', 'Karbala', 32.6160, 44.0249, 'Asia/Baghdad'),
      c('IQ', 'iq_sulaymaniyah', 'السليمانية', 'Sulaymaniyah', 35.5669, 45.4161, 'Asia/Baghdad'),
    ],
  },
  {
    countryId: 'SY',
    nameAr: 'سوريا',
    nameEn: 'Syria',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('SY', 'sy_damascus', 'دمشق', 'Damascus', 33.5138, 36.2765, 'Asia/Damascus'),
      c('SY', 'sy_aleppo', 'حلب', 'Aleppo', 36.2021, 37.1343, 'Asia/Damascus'),
      c('SY', 'sy_homs', 'حمص', 'Homs', 34.7324, 36.7137, 'Asia/Damascus'),
      c('SY', 'sy_latakia', 'اللاذقية', 'Latakia', 35.5317, 35.7901, 'Asia/Damascus'),
      c('SY', 'sy_hama', 'حماة', 'Hama', 35.1318, 36.7578, 'Asia/Damascus'),
    ],
  },
  {
    countryId: 'LB',
    nameAr: 'لبنان',
    nameEn: 'Lebanon',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('LB', 'lb_beirut', 'بيروت', 'Beirut', 33.8938, 35.5018, 'Asia/Beirut'),
      c('LB', 'lb_tripoli', 'طرابلس', 'Tripoli', 34.4367, 35.8497, 'Asia/Beirut'),
      c('LB', 'lb_sidon', 'صيدا', 'Sidon', 33.5571, 35.3729, 'Asia/Beirut'),
      c('LB', 'lb_tyre', 'صور', 'Tyre', 33.2705, 35.2038, 'Asia/Beirut'),
    ],
  },
  {
    countryId: 'PS',
    nameAr: 'فلسطين',
    nameEn: 'Palestine',
    region: 'arab',
    defaultMethod: 'JordanAwqaf',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('PS', 'ps_jerusalem', 'القدس الشريف', 'Jerusalem', 31.7683, 35.2137, 'Asia/Jerusalem'),
      c('PS', 'ps_gaza', 'غزة', 'Gaza', 31.5017, 34.4668, 'Asia/Gaza'),
      c('PS', 'ps_nablus', 'نابلس', 'Nablus', 32.2211, 35.2544, 'Asia/Hebron'),
      c('PS', 'ps_hebron', 'الخليل', 'Hebron', 31.5326, 35.0998, 'Asia/Hebron'),
      c('PS', 'ps_ramallah', 'رام الله', 'Ramallah', 31.9038, 35.2034, 'Asia/Hebron'),
      c('PS', 'ps_jenin', 'جنين', 'Jenin', 32.4573, 35.2999, 'Asia/Hebron'),
      c('PS', 'ps_tulkarm', 'طولكرم', 'Tulkarm', 32.3104, 35.0286, 'Asia/Hebron'),
      c('PS', 'ps_bethlehem', 'بيت لحم', 'Bethlehem', 31.7054, 35.2024, 'Asia/Hebron'),
      c('PS', 'ps_jericho', 'أريحا', 'Jericho', 31.8611, 35.4618, 'Asia/Hebron'),
    ],
  },
  {
    countryId: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    region: 'arab',
    defaultMethod: 'Egyptian',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('EG', 'eg_cairo', 'القاهرة', 'Cairo', 30.0444, 31.2357, 'Africa/Cairo'),
      c('EG', 'eg_alexandria', 'الإسكندرية', 'Alexandria', 31.2001, 29.9187, 'Africa/Cairo'),
      c('EG', 'eg_giza', 'الجيزة', 'Giza', 30.0131, 31.2089, 'Africa/Cairo'),
      c('EG', 'eg_mansoura', 'المنصورة', 'Mansoura', 31.0409, 31.3785, 'Africa/Cairo'),
      c('EG', 'eg_tanta', 'طنطا', 'Tanta', 30.7865, 31.0004, 'Africa/Cairo'),
      c('EG', 'eg_asyut', 'أسيوط', 'Asyut', 27.1809, 31.1837, 'Africa/Cairo'),
      c('EG', 'eg_luxor', 'الأقصر', 'Luxor', 25.6872, 32.6396, 'Africa/Cairo'),
      c('EG', 'eg_aswan', 'أسوان', 'Aswan', 24.0889, 32.8998, 'Africa/Cairo'),
      c('EG', 'eg_portsaid', 'بورسعيد', 'Port Said', 31.2653, 32.3019, 'Africa/Cairo'),
      c('EG', 'eg_suez', 'السويس', 'Suez', 29.9668, 32.5498, 'Africa/Cairo'),
    ],
  },
  {
    countryId: 'SD',
    nameAr: 'السودان',
    nameEn: 'Sudan',
    region: 'arab',
    defaultMethod: 'Egyptian',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('SD', 'sd_khartoum', 'الخرطوم', 'Khartoum', 15.5007, 32.5599, 'Africa/Khartoum'),
      c('SD', 'sd_omdurman', 'أم درمان', 'Omdurman', 15.6445, 32.4777, 'Africa/Khartoum'),
      c('SD', 'sd_portsudan', 'بورتسودان', 'Port Sudan', 19.6158, 37.2164, 'Africa/Khartoum'),
      c('SD', 'sd_bahri', 'الخرطوم بحري', 'Khartoum North', 15.6333, 32.5333, 'Africa/Khartoum'),
    ],
  },
  {
    countryId: 'LY',
    nameAr: 'ليبيا',
    nameEn: 'Libya',
    region: 'arab',
    defaultMethod: 'Egyptian',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('LY', 'ly_tripoli', 'طرابلس', 'Tripoli', 32.8872, 13.1913, 'Africa/Tripoli'),
      c('LY', 'ly_benghazi', 'بنغازي', 'Benghazi', 32.1194, 20.0868, 'Africa/Tripoli'),
      c('LY', 'ly_misrata', 'مصراتة', 'Misrata', 32.3754, 15.0925, 'Africa/Tripoli'),
      c('LY', 'ly_sabha', 'سبها', 'Sabha', 27.0377, 14.4283, 'Africa/Tripoli'),
    ],
  },
  {
    countryId: 'TN',
    nameAr: 'تونس',
    nameEn: 'Tunisia',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('TN', 'tn_tunis', 'تونس', 'Tunis', 36.8065, 10.1815, 'Africa/Tunis'),
      c('TN', 'tn_sfax', 'صفاقس', 'Sfax', 34.7406, 10.7603, 'Africa/Tunis'),
      c('TN', 'tn_sousse', 'سوسة', 'Sousse', 35.8256, 10.6084, 'Africa/Tunis'),
      c('TN', 'tn_kairouan', 'القيروان', 'Kairouan', 35.6781, 10.0963, 'Africa/Tunis'),
    ],
  },
  {
    countryId: 'DZ',
    nameAr: 'الجزائر',
    nameEn: 'Algeria',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('DZ', 'dz_algiers', 'الجزائر', 'Algiers', 36.7538, 3.0588, 'Africa/Algiers'),
      c('DZ', 'dz_oran', 'وهران', 'Oran', 35.6971, -0.6308, 'Africa/Algiers'),
      c('DZ', 'dz_constantine', 'قسنطينة', 'Constantine', 36.3650, 6.6147, 'Africa/Algiers'),
      c('DZ', 'dz_annaba', 'عنابة', 'Annaba', 36.9000, 7.7667, 'Africa/Algiers'),
      c('DZ', 'dz_tlemcen', 'تلمسان', 'Tlemcen', 34.8783, -1.3150, 'Africa/Algiers'),
    ],
  },
  {
    countryId: 'MA',
    nameAr: 'المغرب',
    nameEn: 'Morocco',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('MA', 'ma_rabat', 'الرباط', 'Rabat', 34.0209, -6.8416, 'Africa/Casablanca'),
      c('MA', 'ma_casablanca', 'الدار البيضاء', 'Casablanca', 33.5731, -7.5898, 'Africa/Casablanca'),
      c('MA', 'ma_fes', 'فاس', 'Fes', 34.0181, -5.0078, 'Africa/Casablanca'),
      c('MA', 'ma_marrakesh', 'مراكش', 'Marrakesh', 31.6295, -7.9811, 'Africa/Casablanca'),
      c('MA', 'ma_tangier', 'طنجة', 'Tangier', 35.7595, -5.8340, 'Africa/Casablanca'),
      c('MA', 'ma_agadir', 'أكادير', 'Agadir', 30.4278, -9.5981, 'Africa/Casablanca'),
    ],
  },
  {
    countryId: 'MR',
    nameAr: 'موريتانيا',
    nameEn: 'Mauritania',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('MR', 'mr_nouakchott', 'نواكشوط', 'Nouakchott', 18.0735, -15.9582, 'Africa/Nouakchott'),
      c('MR', 'mr_nouadhibou', 'نواذيبو', 'Nouadhibou', 20.9310, -17.0347, 'Africa/Nouakchott'),
    ],
  },
  {
    countryId: 'SO',
    nameAr: 'الصومال',
    nameEn: 'Somalia',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('SO', 'so_mogadishu', 'مقديشو', 'Mogadishu', 2.0469, 45.3182, 'Africa/Mogadishu'),
      c('SO', 'so_hargeisa', 'هرجيسا', 'Hargeisa', 9.5600, 44.0650, 'Africa/Mogadishu'),
    ],
  },
  {
    countryId: 'DJ',
    nameAr: 'جيبوتي',
    nameEn: 'Djibouti',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('DJ', 'dj_djibouti', 'جيبوتي', 'Djibouti City', 11.8251, 42.5903, 'Africa/Djibouti'),
    ],
  },
  {
    countryId: 'KM',
    nameAr: 'جزر القمر',
    nameEn: 'Comoros',
    region: 'arab',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('KM', 'km_moroni', 'موروني', 'Moroni', -11.7172, 43.2473, 'Indian/Comoro'),
    ],
  },

  // =========================================================================
  // الدول الأوروبية (European Countries)
  // =========================================================================
  {
    countryId: 'DE',
    nameAr: 'ألمانيا',
    nameEn: 'Germany',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('DE', 'de_hameln', 'هامِلن', 'Hameln', 52.1031, 9.3578, 'Europe/Berlin'),
      c('DE', 'de_kassel', 'كاسل', 'Kassel', 51.3127, 9.4797, 'Europe/Berlin'),
      c('DE', 'de_berlin', 'برلين', 'Berlin', 52.5200, 13.4050, 'Europe/Berlin'),
      c('DE', 'de_frankfurt', 'فرانكفورت', 'Frankfurt', 50.1109, 8.6821, 'Europe/Berlin'),
      c('DE', 'de_hannover', 'هانوفر', 'Hannover', 52.3759, 9.7320, 'Europe/Berlin'),
      c('DE', 'de_munich', 'ميونخ', 'Munich', 48.1351, 11.5820, 'Europe/Berlin'),
      c('DE', 'de_hamburg', 'هامبورغ', 'Hamburg', 53.5511, 9.9937, 'Europe/Berlin'),
      c('DE', 'de_stuttgart', 'شتوتغارت', 'Stuttgart', 48.7758, 9.1829, 'Europe/Berlin'),
      c('DE', 'de_dusseldorf', 'دوسلدورف', 'Düsseldorf', 51.2277, 6.7735, 'Europe/Berlin'),
      c('DE', 'de_cologne', 'كولونيا', 'Cologne', 50.9375, 6.9603, 'Europe/Berlin'),
      c('DE', 'de_dortmund', 'دورتموند', 'Dortmund', 51.5136, 7.4653, 'Europe/Berlin'),
      c('DE', 'de_essen', 'إيسن', 'Essen', 51.4556, 7.0116, 'Europe/Berlin'),
      c('DE', 'de_leipzig', 'لايبزيغ', 'Leipzig', 51.3397, 12.3731, 'Europe/Berlin'),
      c('DE', 'de_bremen', 'بريمن', 'Bremen', 53.0793, 8.8017, 'Europe/Berlin'),
      c('DE', 'de_dresden', 'دريسدن', 'Dresden', 51.0504, 13.7373, 'Europe/Berlin'),
      c('DE', 'de_nuremberg', 'نورنبرغ', 'Nuremberg', 49.4521, 11.0767, 'Europe/Berlin'),
    ],
  },
  {
    countryId: 'FR',
    nameAr: 'فرنسا',
    nameEn: 'France',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('FR', 'fr_paris', 'باريس', 'Paris', 48.8566, 2.3522, 'Europe/Paris'),
      c('FR', 'fr_lyon', 'ليون', 'Lyon', 45.7640, 4.8357, 'Europe/Paris'),
      c('FR', 'fr_marseille', 'مرسيليا', 'Marseille', 43.2965, 5.3698, 'Europe/Paris'),
      c('FR', 'fr_toulouse', 'تولوز', 'Toulouse', 43.6047, 1.4442, 'Europe/Paris'),
      c('FR', 'fr_nice', 'نيس', 'Nice', 43.7102, 7.2620, 'Europe/Paris'),
      c('FR', 'fr_strasbourg', 'ستراسبورغ', 'Strasbourg', 48.5734, 7.7521, 'Europe/Paris'),
      c('FR', 'fr_lille', 'ليل', 'Lille', 50.6292, 3.0573, 'Europe/Paris'),
    ],
  },
  {
    countryId: 'GB',
    nameAr: 'بريطانيا',
    nameEn: 'United Kingdom',
    region: 'europe',
    defaultMethod: 'MoonsightingCommittee',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('GB', 'gb_london', 'لندن', 'London', 51.5072, -0.1276, 'Europe/London'),
      c('GB', 'gb_birmingham', 'برمنغهام', 'Birmingham', 52.4862, -1.8904, 'Europe/London'),
      c('GB', 'gb_manchester', 'مانشستر', 'Manchester', 53.4808, -2.2426, 'Europe/London'),
      c('GB', 'gb_liverpool', 'ليفربول', 'Liverpool', 53.4084, -2.9916, 'Europe/London'),
      c('GB', 'gb_leeds', 'ليدز', 'Leeds', 53.8008, -1.5491, 'Europe/London'),
      c('GB', 'gb_glasgow', 'غلاسكو', 'Glasgow', 55.8642, -4.2518, 'Europe/London'),
      c('GB', 'gb_edinburgh', 'إدنبرة', 'Edinburgh', 55.9533, -3.1883, 'Europe/London'),
      c('GB', 'gb_bradford', 'برادفورد', 'Bradford', 53.7960, -1.7594, 'Europe/London'),
    ],
  },
  {
    countryId: 'IT',
    nameAr: 'إيطاليا',
    nameEn: 'Italy',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('IT', 'it_rome', 'روما', 'Rome', 41.9028, 12.4964, 'Europe/Rome'),
      c('IT', 'it_milan', 'ميلانو', 'Milan', 45.4642, 9.1900, 'Europe/Rome'),
      c('IT', 'it_naples', 'نابولي', 'Naples', 40.8518, 14.2681, 'Europe/Rome'),
      c('IT', 'it_turin', 'تورينو', 'Turin', 45.0703, 7.6869, 'Europe/Rome'),
      c('IT', 'it_bologna', 'بولونيا', 'Bologna', 44.4949, 11.3426, 'Europe/Rome'),
      c('IT', 'it_florence', 'فلورنسا', 'Florence', 43.7696, 11.2558, 'Europe/Rome'),
    ],
  },
  {
    countryId: 'ES',
    nameAr: 'إسبانيا',
    nameEn: 'Spain',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('ES', 'es_madrid', 'مدريد', 'Madrid', 40.4168, -3.7038, 'Europe/Madrid'),
      c('ES', 'es_barcelona', 'برشلونة', 'Barcelona', 41.3874, 2.1686, 'Europe/Madrid'),
      c('ES', 'es_seville', 'إشبيلية', 'Seville', 37.3891, -5.9845, 'Europe/Madrid'),
      c('ES', 'es_valencia', 'فالنسيا', 'Valencia', 39.4699, -0.3763, 'Europe/Madrid'),
      c('ES', 'es_granada', 'غرناطة', 'Granada', 37.1773, -3.5986, 'Europe/Madrid'),
      c('ES', 'es_cordoba', 'قرطبة', 'Cordoba', 37.8882, -4.7794, 'Europe/Madrid'),
      c('ES', 'es_malaga', 'ملقة', 'Malaga', 36.7213, -4.4214, 'Europe/Madrid'),
    ],
  },
  {
    countryId: 'NL',
    nameAr: 'هولندا',
    nameEn: 'Netherlands',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('NL', 'nl_amsterdam', 'أمستردام', 'Amsterdam', 52.3676, 4.9041, 'Europe/Amsterdam'),
      c('NL', 'nl_rotterdam', 'روتردام', 'Rotterdam', 51.9244, 4.4777, 'Europe/Amsterdam'),
      c('NL', 'nl_hague', 'لاهاي', 'The Hague', 52.0705, 4.3007, 'Europe/Amsterdam'),
      c('NL', 'nl_utrecht', 'أوتريخت', 'Utrecht', 52.0907, 5.1214, 'Europe/Amsterdam'),
      c('NL', 'nl_eindhoven', 'أيندهوفن', 'Eindhoven', 51.4416, 5.4697, 'Europe/Amsterdam'),
    ],
  },
  {
    countryId: 'BE',
    nameAr: 'بلجيكا',
    nameEn: 'Belgium',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('BE', 'be_brussels', 'بروكسل', 'Brussels', 50.8503, 4.3517, 'Europe/Brussels'),
      c('BE', 'be_antwerp', 'أنتويرب', 'Antwerp', 51.2194, 4.4025, 'Europe/Brussels'),
      c('BE', 'be_ghent', 'غنت', 'Ghent', 51.0543, 3.7174, 'Europe/Brussels'),
      c('BE', 'be_liege', 'لييج', 'Liège', 50.6326, 5.5797, 'Europe/Brussels'),
    ],
  },
  {
    countryId: 'AT',
    nameAr: 'النمسا',
    nameEn: 'Austria',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('AT', 'at_vienna', 'فيينا', 'Vienna', 48.2082, 16.3738, 'Europe/Vienna'),
      c('AT', 'at_graz', 'غراتس', 'Graz', 47.0707, 15.4395, 'Europe/Vienna'),
      c('AT', 'at_linz', 'لينز', 'Linz', 48.3069, 14.2858, 'Europe/Vienna'),
      c('AT', 'at_salzburg', 'سالزبورغ', 'Salzburg', 47.8095, 13.0550, 'Europe/Vienna'),
      c('AT', 'at_innsbruck', 'إنسبروك', 'Innsbruck', 47.2692, 11.4041, 'Europe/Vienna'),
    ],
  },
  {
    countryId: 'CH',
    nameAr: 'سويسرا',
    nameEn: 'Switzerland',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('CH', 'ch_zurich', 'زيورخ', 'Zurich', 47.3769, 8.5417, 'Europe/Zurich'),
      c('CH', 'ch_geneva', 'جنيف', 'Geneva', 46.2044, 6.1432, 'Europe/Zurich'),
      c('CH', 'ch_basel', 'بازل', 'Basel', 47.5596, 7.5886, 'Europe/Zurich'),
      c('CH', 'ch_bern', 'برن', 'Bern', 46.9480, 7.4474, 'Europe/Zurich'),
      c('CH', 'ch_lausanne', 'لوزان', 'Lausanne', 46.5197, 6.6323, 'Europe/Zurich'),
    ],
  },
  {
    countryId: 'SE',
    nameAr: 'السويد',
    nameEn: 'Sweden',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('SE', 'se_stockholm', 'ستوكهولم', 'Stockholm', 59.3293, 18.0686, 'Europe/Stockholm'),
      c('SE', 'se_gothenburg', 'غوتنبرغ', 'Gothenburg', 57.7089, 11.9746, 'Europe/Stockholm'),
      c('SE', 'se_malmo', 'مالمو', 'Malmö', 55.6050, 13.0038, 'Europe/Stockholm'),
      c('SE', 'se_uppsala', 'أوبسالا', 'Uppsala', 59.8586, 17.6389, 'Europe/Stockholm'),
    ],
  },
  {
    countryId: 'NO',
    nameAr: 'النرويج',
    nameEn: 'Norway',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('NO', 'no_oslo', 'أوسلو', 'Oslo', 59.9139, 10.7522, 'Europe/Oslo'),
      c('NO', 'no_bergen', 'بيرغن', 'Bergen', 60.3913, 5.3221, 'Europe/Oslo'),
      c('NO', 'no_trondheim', 'تروندهايم', 'Trondheim', 63.4305, 10.3951, 'Europe/Oslo'),
    ],
  },
  {
    countryId: 'DK',
    nameAr: 'الدنمارك',
    nameEn: 'Denmark',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('DK', 'dk_copenhagen', 'كوبنهاغن', 'Copenhagen', 55.6761, 12.5683, 'Europe/Copenhagen'),
      c('DK', 'dk_aarhus', 'آرهوس', 'Aarhus', 56.1629, 10.2039, 'Europe/Copenhagen'),
      c('DK', 'dk_odense', 'أودنسه', 'Odense', 55.4038, 10.4024, 'Europe/Copenhagen'),
    ],
  },
  {
    countryId: 'FI',
    nameAr: 'فنلندا',
    nameEn: 'Finland',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('FI', 'fi_helsinki', 'هلسنكي', 'Helsinki', 60.1699, 24.9384, 'Europe/Helsinki'),
      c('FI', 'fi_tampere', 'تامبيري', 'Tampere', 61.4978, 23.7610, 'Europe/Helsinki'),
      c('FI', 'fi_turku', 'توركو', 'Turku', 60.4518, 22.2666, 'Europe/Helsinki'),
    ],
  },
  {
    countryId: 'PL',
    nameAr: 'بولندا',
    nameEn: 'Poland',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('PL', 'pl_warsaw', 'وارسو', 'Warsaw', 52.2297, 21.0122, 'Europe/Warsaw'),
      c('PL', 'pl_krakow', 'كراكوف', 'Krakow', 50.0647, 19.9450, 'Europe/Warsaw'),
      c('PL', 'pl_gdansk', 'غدانسك', 'Gdansk', 54.3520, 18.6466, 'Europe/Warsaw'),
    ],
  },
  {
    countryId: 'CZ',
    nameAr: 'التشيك',
    nameEn: 'Czech Republic',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('CZ', 'cz_prague', 'براغ', 'Prague', 50.0755, 14.4378, 'Europe/Prague'),
      c('CZ', 'cz_brno', 'برنو', 'Brno', 49.1951, 16.6068, 'Europe/Prague'),
    ],
  },
  {
    countryId: 'GR',
    nameAr: 'اليونان',
    nameEn: 'Greece',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('GR', 'gr_athens', 'أثينا', 'Athens', 37.9838, 23.7275, 'Europe/Athens'),
      c('GR', 'gr_thessaloniki', 'سالونيك', 'Thessaloniki', 40.6401, 22.9444, 'Europe/Athens'),
    ],
  },
  {
    countryId: 'PT',
    nameAr: 'البرتغال',
    nameEn: 'Portugal',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('PT', 'pt_lisbon', 'لشبونة', 'Lisbon', 38.7223, -9.1393, 'Europe/Lisbon'),
      c('PT', 'pt_porto', 'بورتو', 'Porto', 41.1579, -8.6291, 'Europe/Lisbon'),
    ],
  },
  {
    countryId: 'IE',
    nameAr: 'أيرلندا',
    nameEn: 'Ireland',
    region: 'europe',
    defaultMethod: 'MoonsightingCommittee',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('IE', 'ie_dublin', 'دبلن', 'Dublin', 53.3498, -6.2603, 'Europe/Dublin'),
      c('IE', 'ie_cork', 'كورك', 'Cork', 51.8985, -8.4756, 'Europe/Dublin'),
    ],
  },
  {
    countryId: 'RO',
    nameAr: 'رومانيا',
    nameEn: 'Romania',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('RO', 'ro_bucharest', 'بوخارست', 'Bucharest', 44.4268, 26.1025, 'Europe/Bucharest'),
      c('RO', 'ro_cluj', 'كلوج نابوكا', 'Cluj-Napoca', 46.7712, 23.6236, 'Europe/Bucharest'),
    ],
  },
  {
    countryId: 'BG',
    nameAr: 'بلغاريا',
    nameEn: 'Bulgaria',
    region: 'europe',
    defaultMethod: 'Turkey',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('BG', 'bg_sofia', 'صوفيا', 'Sofia', 42.6977, 23.3219, 'Europe/Sofia'),
      c('BG', 'bg_plovdiv', 'بلوفديف', 'Plovdiv', 42.1354, 24.7453, 'Europe/Sofia'),
    ],
  },
  {
    countryId: 'TR',
    nameAr: 'تركيا',
    nameEn: 'Turkey',
    region: 'europe',
    defaultMethod: 'Turkey',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('TR', 'tr_istanbul', 'إسطنبول', 'Istanbul', 41.0082, 28.9784, 'Europe/Istanbul'),
      c('TR', 'tr_ankara', 'أنقرة', 'Ankara', 39.9334, 32.8597, 'Europe/Istanbul'),
      c('TR', 'tr_izmir', 'إزمير', 'Izmir', 38.4237, 27.1428, 'Europe/Istanbul'),
      c('TR', 'tr_antalya', 'أنطاليا', 'Antalya', 36.8969, 30.7133, 'Europe/Istanbul'),
      c('TR', 'tr_bursa', 'بورصة', 'Bursa', 40.1885, 29.0610, 'Europe/Istanbul'),
      c('TR', 'tr_konya', 'قونية', 'Konya', 37.8746, 32.4932, 'Europe/Istanbul'),
      c('TR', 'tr_gaziantep', 'غازي عنتاب', 'Gaziantep', 37.0662, 37.3833, 'Europe/Istanbul'),
    ],
  },
  {
    countryId: 'HU',
    nameAr: 'المجر',
    nameEn: 'Hungary',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('HU', 'hu_budapest', 'بودابست', 'Budapest', 47.4979, 19.0402, 'Europe/Budapest')],
  },
  {
    countryId: 'BA',
    nameAr: 'البوسنة والهرسك',
    nameEn: 'Bosnia and Herzegovina',
    region: 'europe',
    defaultMethod: 'Turkey',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('BA', 'ba_sarajevo', 'سراييفو', 'Sarajevo', 43.8563, 18.4131, 'Europe/Sarajevo')],
  },
  {
    countryId: 'AL',
    nameAr: 'ألبانيا',
    nameEn: 'Albania',
    region: 'europe',
    defaultMethod: 'Turkey',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('AL', 'al_tirana', 'تيرانا', 'Tirana', 41.3275, 19.8187, 'Europe/Tirane')],
  },
  {
    countryId: 'XK',
    nameAr: 'كوسوفو',
    nameEn: 'Kosovo',
    region: 'europe',
    defaultMethod: 'Turkey',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('XK', 'xk_pristina', 'بريشتينا', 'Pristina', 42.6629, 21.1655, 'Europe/Belgrade')],
  },
  {
    countryId: 'HR',
    nameAr: 'كرواتيا',
    nameEn: 'Croatia',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('HR', 'hr_zagreb', 'زغرب', 'Zagreb', 45.8150, 15.9819, 'Europe/Zagreb')],
  },
  {
    countryId: 'RS',
    nameAr: 'صربيا',
    nameEn: 'Serbia',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('RS', 'rs_belgrade', 'بلغراد', 'Belgrade', 44.7866, 20.4489, 'Europe/Belgrade')],
  },
  {
    countryId: 'SK',
    nameAr: 'سلوفاكيا',
    nameEn: 'Slovakia',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('SK', 'sk_bratislava', 'براتيسلافا', 'Bratislava', 48.1486, 17.1077, 'Europe/Bratislava')],
  },
  {
    countryId: 'UA',
    nameAr: 'أوكرانيا',
    nameEn: 'Ukraine',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('UA', 'ua_kyiv', 'كييف', 'Kyiv', 50.4501, 30.5234, 'Europe/Kyiv'),
      c('UA', 'ua_odessa', 'أوديسا', 'Odesa', 46.4825, 30.7233, 'Europe/Kyiv'),
    ],
  },
  {
    countryId: 'RU',
    nameAr: 'روسيا',
    nameEn: 'Russia',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('RU', 'ru_moscow', 'موسكو', 'Moscow', 55.7558, 37.6173, 'Europe/Moscow'),
      c('RU', 'ru_stpetersburg', 'سانت بطرسبرغ', 'Saint Petersburg', 59.9343, 30.3351, 'Europe/Moscow'),
      c('RU', 'ru_kazan', 'قازان', 'Kazan', 55.7961, 49.1064, 'Europe/Moscow'),
      c('RU', 'ru_grozny', 'غروزني', 'Grozny', 43.3179, 45.6982, 'Europe/Moscow'),
    ],
  },
  {
    countryId: 'LU',
    nameAr: 'لوكسمبورغ',
    nameEn: 'Luxembourg',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [c('LU', 'lu_luxembourg', 'لوكسمبورغ', 'Luxembourg City', 49.6116, 6.1319, 'Europe/Luxembourg')],
  },
  {
    countryId: 'IS',
    nameAr: 'أيسلندا',
    nameEn: 'Iceland',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [c('IS', 'is_reykjavik', 'ريكيافيك', 'Reykjavik', 64.1466, -21.9426, 'Atlantic/Reykjavik')],
  },
  {
    countryId: 'CY',
    nameAr: 'قبرص',
    nameEn: 'Cyprus',
    region: 'europe',
    defaultMethod: 'Turkey',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('CY', 'cy_nicosia', 'نيقوسيا', 'Nicosia', 35.1856, 33.3823, 'Asia/Nicosia')],
  },
  {
    countryId: 'MT',
    nameAr: 'مالطا',
    nameEn: 'Malta',
    region: 'europe',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('MT', 'mt_valletta', 'فاليتا', 'Valletta', 35.8989, 14.5146, 'Europe/Malta')],
  },

  // =========================================================================
  // الأمريكتان (Americas)
  // =========================================================================
  {
    countryId: 'US',
    nameAr: 'الولايات المتحدة',
    nameEn: 'United States',
    region: 'americas',
    defaultMethod: 'NorthAmerica',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('US', 'us_newyork', 'نيويورك', 'New York', 40.7128, -74.0060, 'America/New_York'),
      c('US', 'us_washington', 'واشنطن', 'Washington, D.C.', 38.9072, -77.0369, 'America/New_York'),
      c('US', 'us_chicago', 'شيكاغو', 'Chicago', 41.8781, -87.6298, 'America/Chicago'),
      c('US', 'us_losangeles', 'لوس أنجلوس', 'Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles'),
      c('US', 'us_houston', 'هيوستن', 'Houston', 29.7604, -95.3698, 'America/Chicago'),
      c('US', 'us_detroit', 'ديترويت', 'Detroit', 42.3314, -83.0458, 'America/Detroit'),
      c('US', 'us_dearborn', 'ديربورن', 'Dearborn', 42.3223, -83.1763, 'America/Detroit'),
      c('US', 'us_miami', 'ميامي', 'Miami', 25.7617, -80.1918, 'America/New_York'),
      c('US', 'us_dallas', 'دالاس', 'Dallas', 32.7767, -96.7970, 'America/Chicago'),
      c('US', 'us_boston', 'بوسطن', 'Boston', 42.3601, -71.0589, 'America/New_York'),
      c('US', 'us_seattle', 'سياتل', 'Seattle', 47.6062, -122.3321, 'America/Los_Angeles'),
      c('US', 'us_sanfrancisco', 'سان فرانسيسكو', 'San Francisco', 37.7749, -122.4194, 'America/Los_Angeles'),
    ],
  },
  {
    countryId: 'CA',
    nameAr: 'كندا',
    nameEn: 'Canada',
    region: 'americas',
    defaultMethod: 'NorthAmerica',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('CA', 'ca_toronto', 'تورونتو', 'Toronto', 43.6532, -79.3832, 'America/Toronto'),
      c('CA', 'ca_montreal', 'مونتريال', 'Montreal', 45.5017, -73.5673, 'America/Toronto'),
      c('CA', 'ca_ottawa', 'أوتاوا', 'Ottawa', 45.4215, -75.6972, 'America/Toronto'),
      c('CA', 'ca_vancouver', 'فانكوفر', 'Vancouver', 49.2827, -123.1207, 'America/Vancouver'),
      c('CA', 'ca_calgary', 'كالغاري', 'Calgary', 51.0447, -114.0719, 'America/Edmonton'),
      c('CA', 'ca_edmonton', 'إدمونتون', 'Edmonton', 53.5461, -113.4938, 'America/Edmonton'),
    ],
  },
  {
    countryId: 'BR',
    nameAr: 'البرازيل',
    nameEn: 'Brazil',
    region: 'americas',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('BR', 'br_saopaulo', 'ساو باولو', 'São Paulo', -23.5505, -46.6333, 'America/Sao_Paulo'),
      c('BR', 'br_rio', 'ريو دي جانيرو', 'Rio de Janeiro', -22.9068, -43.1729, 'America/Sao_Paulo'),
      c('BR', 'br_brasilia', 'برازيليا', 'Brasília', -15.7975, -47.8919, 'America/Sao_Paulo'),
    ],
  },
  {
    countryId: 'AR',
    nameAr: 'الأرجنتين',
    nameEn: 'Argentina',
    region: 'americas',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('AR', 'ar_buenosaires', 'بوينس آيرس', 'Buenos Aires', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires'),
    ],
  },
  {
    countryId: 'MX',
    nameAr: 'المكسيك',
    nameEn: 'Mexico',
    region: 'americas',
    defaultMethod: 'NorthAmerica',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('MX', 'mx_mexicocity', 'مكسيكو سيتي', 'Mexico City', 19.4326, -99.1332, 'America/Mexico_City'),
    ],
  },

  // =========================================================================
  // آسيا (Asia)
  // =========================================================================
  {
    countryId: 'PK',
    nameAr: 'باكستان',
    nameEn: 'Pakistan',
    region: 'asia',
    defaultMethod: 'Karachi',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('PK', 'pk_islamabad', 'إسلام آباد', 'Islamabad', 33.6844, 73.0479, 'Asia/Karachi'),
      c('PK', 'pk_karachi', 'كراتشي', 'Karachi', 24.8607, 67.0011, 'Asia/Karachi'),
      c('PK', 'pk_lahore', 'لاهور', 'Lahore', 31.5204, 74.3587, 'Asia/Karachi'),
    ],
  },
  {
    countryId: 'IN',
    nameAr: 'الهند',
    nameEn: 'India',
    region: 'asia',
    defaultMethod: 'Karachi',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('IN', 'in_delhi', 'نيودلهي', 'New Delhi', 28.6139, 77.2090, 'Asia/Kolkata'),
      c('IN', 'in_mumbai', 'مومباي', 'Mumbai', 19.0760, 72.8777, 'Asia/Kolkata'),
      c('IN', 'in_hyderabad', 'حيدر آباد', 'Hyderabad', 17.3850, 78.4867, 'Asia/Kolkata'),
    ],
  },
  {
    countryId: 'BD',
    nameAr: 'بنغلاديش',
    nameEn: 'Bangladesh',
    region: 'asia',
    defaultMethod: 'Karachi',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('BD', 'bd_dhaka', 'دكا', 'Dhaka', 23.8103, 90.4125, 'Asia/Dhaka'),
      c('BD', 'bd_chittagong', 'شيتاغونغ', 'Chittagong', 22.3569, 91.7832, 'Asia/Dhaka'),
    ],
  },
  {
    countryId: 'ID',
    nameAr: 'إندونيسيا',
    nameEn: 'Indonesia',
    region: 'asia',
    defaultMethod: 'Singapore',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('ID', 'id_jakarta', 'جاكرتا', 'Jakarta', -6.2088, 106.8456, 'Asia/Jakarta'),
      c('ID', 'id_surabaya', 'سورابايا', 'Surabaya', -7.2575, 112.7521, 'Asia/Jakarta'),
      c('ID', 'id_bandung', 'باندونغ', 'Bandung', -6.9175, 107.6191, 'Asia/Jakarta'),
    ],
  },
  {
    countryId: 'MY',
    nameAr: 'ماليزيا',
    nameEn: 'Malaysia',
    region: 'asia',
    defaultMethod: 'Singapore',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('MY', 'my_kualalumpur', 'كوالالمبور', 'Kuala Lumpur', 3.1390, 101.6869, 'Asia/Kuala_Lumpur'),
      c('MY', 'my_penang', 'بينانغ', 'Penang', 5.4141, 100.3288, 'Asia/Kuala_Lumpur'),
    ],
  },
  {
    countryId: 'SG',
    nameAr: 'سنغافورة',
    nameEn: 'Singapore',
    region: 'asia',
    defaultMethod: 'Singapore',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('SG', 'sg_singapore', 'سنغافورة', 'Singapore', 1.3521, 103.8198, 'Asia/Singapore'),
    ],
  },
  {
    countryId: 'IR',
    nameAr: 'إيران',
    nameEn: 'Iran',
    region: 'asia',
    defaultMethod: 'Tehran',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('IR', 'ir_tehran', 'طهران', 'Tehran', 35.6892, 51.3890, 'Asia/Tehran'),
      c('IR', 'ir_mashhad', 'مشهد', 'Mashhad', 36.2605, 59.6168, 'Asia/Tehran'),
    ],
  },
  {
    countryId: 'AF',
    nameAr: 'أفغانستان',
    nameEn: 'Afghanistan',
    region: 'asia',
    defaultMethod: 'Karachi',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('AF', 'af_kabul', 'كابل', 'Kabul', 34.5553, 69.2075, 'Asia/Kabul'),
    ],
  },
  {
    countryId: 'UZ',
    nameAr: 'أوزبكستان',
    nameEn: 'Uzbekistan',
    region: 'asia',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('UZ', 'uz_tashkent', 'طشقند', 'Tashkent', 41.2995, 69.2401, 'Asia/Tashkent'),
      c('UZ', 'uz_samarkand', 'سمرقند', 'Samarkand', 39.6542, 66.9597, 'Asia/Samarkand'),
    ],
  },
  {
    countryId: 'KZ',
    nameAr: 'كازاخستان',
    nameEn: 'Kazakhstan',
    region: 'asia',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'SeventhOfTheNight',
    cities: [
      c('KZ', 'kz_astana', 'أستانا', 'Astana', 51.1605, 71.4704, 'Asia/Almaty'),
      c('KZ', 'kz_almaty', 'ألماتي', 'Almaty', 43.2220, 76.8512, 'Asia/Almaty'),
    ],
  },
  {
    countryId: 'AZ',
    nameAr: 'أذربيجان',
    nameEn: 'Azerbaijan',
    region: 'asia',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('AZ', 'az_baku', 'باكو', 'Baku', 40.4093, 49.8671, 'Asia/Baku')],
  },
  {
    countryId: 'JP',
    nameAr: 'اليابان',
    nameEn: 'Japan',
    region: 'asia',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('JP', 'jp_tokyo', 'طوكيو', 'Tokyo', 35.6762, 139.6503, 'Asia/Tokyo'),
      c('JP', 'jp_osaka', 'أوساكا', 'Osaka', 34.6937, 135.5023, 'Asia/Tokyo'),
    ],
  },
  {
    countryId: 'CN',
    nameAr: 'الصين',
    nameEn: 'China',
    region: 'asia',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'hanafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('CN', 'cn_beijing', 'بكين', 'Beijing', 39.9042, 116.4074, 'Asia/Shanghai'),
      c('CN', 'cn_shanghai', 'شنغهاي', 'Shanghai', 31.2304, 121.4737, 'Asia/Shanghai'),
      c('CN', 'cn_urumqi', 'أورومتشي', 'Urumqi', 43.8256, 87.6168, 'Asia/Shanghai'),
    ],
  },
  {
    countryId: 'KR',
    nameAr: 'كوريا الجنوبية',
    nameEn: 'South Korea',
    region: 'asia',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('KR', 'kr_seoul', 'سيول', 'Seoul', 37.5665, 126.9780, 'Asia/Seoul'),
    ],
  },

  // =========================================================================
  // أفريقيا (Africa - Non-Arab)
  // =========================================================================
  {
    countryId: 'NG',
    nameAr: 'نيجيريا',
    nameEn: 'Nigeria',
    region: 'africa',
    defaultMethod: 'Egyptian',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('NG', 'ng_abuja', 'أبوجا', 'Abuja', 9.0765, 7.3986, 'Africa/Lagos'),
      c('NG', 'ng_lagos', 'لاغوس', 'Lagos', 6.5244, 3.3792, 'Africa/Lagos'),
      c('NG', 'ng_kano', 'كانو', 'Kano', 12.0022, 8.5920, 'Africa/Lagos'),
    ],
  },
  {
    countryId: 'ZA',
    nameAr: 'جنوب أفريقيا',
    nameEn: 'South Africa',
    region: 'africa',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('ZA', 'za_johannesburg', 'جوهانسبرغ', 'Johannesburg', -26.2041, 28.0473, 'Africa/Johannesburg'),
      c('ZA', 'za_capetown', 'كيب تاون', 'Cape Town', -33.9249, 18.4241, 'Africa/Johannesburg'),
    ],
  },
  {
    countryId: 'SN',
    nameAr: 'السنغال',
    nameEn: 'Senegal',
    region: 'africa',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('SN', 'sn_dakar', 'داكار', 'Dakar', 14.7167, -17.4677, 'Africa/Dakar')],
  },
  {
    countryId: 'KE',
    nameAr: 'كينيا',
    nameEn: 'Kenya',
    region: 'africa',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('KE', 'ke_nairobi', 'نيروبي', 'Nairobi', -1.2921, 36.8219, 'Africa/Nairobi'),
      c('KE', 'ke_mombasa', 'مومباسا', 'Mombasa', -4.0435, 39.6682, 'Africa/Nairobi'),
    ],
  },
  {
    countryId: 'ET',
    nameAr: 'إثيوبيا',
    nameEn: 'Ethiopia',
    region: 'africa',
    defaultMethod: 'Egyptian',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [c('ET', 'et_addis', 'أديس أبابا', 'Addis Ababa', 9.0320, 38.7469, 'Africa/Addis_Ababa')],
  },

  // =========================================================================
  // أوقيانوسيا (Oceania)
  // =========================================================================
  {
    countryId: 'AU',
    nameAr: 'أستراليا',
    nameEn: 'Australia',
    region: 'oceania',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('AU', 'au_sydney', 'سيدني', 'Sydney', -33.8688, 151.2093, 'Australia/Sydney'),
      c('AU', 'au_melbourne', 'ملبورن', 'Melbourne', -37.8136, 144.9631, 'Australia/Melbourne'),
      c('AU', 'au_perth', 'بيرث', 'Perth', -31.9505, 115.8605, 'Australia/Perth'),
      c('AU', 'au_brisbane', 'بريزبن', 'Brisbane', -27.4705, 153.0260, 'Australia/Brisbane'),
    ],
  },
  {
    countryId: 'NZ',
    nameAr: 'نيوزيلندا',
    nameEn: 'New Zealand',
    region: 'oceania',
    defaultMethod: 'MuslimWorldLeague',
    defaultMadhab: 'shafi',
    defaultHighLatitudeRule: 'MiddleOfTheNight',
    cities: [
      c('NZ', 'nz_auckland', 'أوكلاند', 'Auckland', -36.8485, 174.7633, 'Pacific/Auckland'),
      c('NZ', 'nz_wellington', 'ويلينغتون', 'Wellington', -41.2865, 174.7762, 'Pacific/Auckland'),
    ],
  },
];

export function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '');
}

export function findCountryById(
  countryId: string,
  customCountries: CountryDef[] = []
): CountryDef | undefined {
  return (
    WORLD_COUNTRIES.find((co) => co.countryId === countryId) ||
    customCountries.find((co) => co.countryId === countryId)
  );
}

export function findCountryByName(
  name: string,
  customCountries: CountryDef[] = []
): CountryDef | undefined {
  const q = normalizeSearchText(name);
  if (!q) return undefined;
  const all = [...WORLD_COUNTRIES, ...customCountries];
  return (
    all.find(
      (co) =>
        normalizeSearchText(co.nameAr) === q ||
        normalizeSearchText(co.nameEn) === q ||
        co.countryId.toLowerCase() === q
    ) ||
    all.find(
      (co) =>
        normalizeSearchText(co.nameAr).includes(q) ||
        normalizeSearchText(co.nameEn).includes(q)
    )
  );
}

export function findCityById(
  cityId: string,
  customCities: CityDef[] = [],
  customCountries: CountryDef[] = []
): { country?: CountryDef; city?: CityDef } {
  for (const country of WORLD_COUNTRIES) {
    const found = country.cities.find((ci) => ci.cityId === cityId);
    if (found) return { country, city: found };
  }
  const custom = customCities.find((ci) => ci.cityId === cityId);
  if (custom) {
    const country = findCountryById(custom.countryId, customCountries);
    return { country, city: custom };
  }
  return {};
}

export function getCitiesForCountry(countryId: string, customCities: CityDef[] = []): CityDef[] {
  const country = findCountryById(countryId);
  const base = country ? country.cities : [];
  const extra = customCities.filter((ci) => ci.countryId === countryId);
  return [...base, ...extra];
}

export function searchCountries(
  query: string,
  customCountries: CountryDef[] = []
): CountryDef[] {
  const all = [...WORLD_COUNTRIES, ...customCountries];
  const q = normalizeSearchText(query);
  if (!q) return all;
  return all.filter(
    (co) =>
      normalizeSearchText(co.nameAr).includes(q) ||
      normalizeSearchText(co.nameEn).includes(q) ||
      co.countryId.toLowerCase().includes(q)
  );
}

const EXTRA_COUNTRY_TIMEZONES: Array<{ names: string[]; tz: string }> = [
  { names: ['ايسلندا', 'iceland'], tz: 'Atlantic/Reykjavik' },
  { names: ['مالطا', 'malta'], tz: 'Europe/Malta' },
  { names: ['لوكسمبورغ', 'luxembourg'], tz: 'Europe/Luxembourg' },
  { names: ['البوسنه', 'البوسنة والهرسك', 'bosnia'], tz: 'Europe/Sarajevo' },
  { names: ['كوسوفو', 'kosovo'], tz: 'Europe/Belgrade' },
  { names: ['مقدونيا', 'north macedonia', 'macedonia'], tz: 'Europe/Skopje' },
  { names: ['البانيا', 'albania'], tz: 'Europe/Tirane' },
  { names: ['قبرص', 'cyprus'], tz: 'Asia/Nicosia' },
  { names: ['افغانستان', 'afghanistan'], tz: 'Asia/Kabul' },
  { names: ['اوزبكستان', 'uzbekistan'], tz: 'Asia/Tashkent' },
  { names: ['كازاخستان', 'kazakhstan'], tz: 'Asia/Almaty' },
  { names: ['اذربيجان', 'azerbaijan'], tz: 'Asia/Baku' },
  { names: ['جورجيا', 'georgia'], tz: 'Asia/Tbilisi' },
  { names: ['سريلانكا', 'sri lanka'], tz: 'Asia/Colombo' },
  { names: ['نيبال', 'nepal'], tz: 'Asia/Kathmandu' },
  { names: ['المالديف', 'maldives'], tz: 'Indian/Maldives' },
  { names: ['بروناي', 'brunei'], tz: 'Asia/Brunei' },
  { names: ['موريتانيا', 'mauritania'], tz: 'Africa/Nouakchott' },
  { names: ['تشاد', 'chad'], tz: 'Africa/Ndjamena' },
  { names: ['النيجر', 'niger'], tz: 'Africa/Niamey' },
  { names: ['مالي', 'mali'], tz: 'Africa/Bamako' },
  { names: ['غانا', 'ghana'], tz: 'Africa/Accra' },
  { names: ['تنزانيا', 'tanzania'], tz: 'Africa/Dar_es_Salaam' },
  { names: ['اوغندا', 'uganda'], tz: 'Africa/Kampala' },
  { names: ['تشيلي', 'chile'], tz: 'America/Santiago' },
  { names: ['كولومبيا', 'colombia'], tz: 'America/Bogota' },
  { names: ['بيرو', 'peru'], tz: 'America/Lima' },
  { names: ['فنزويلا', 'venezuela'], tz: 'America/Caracas' },
];

export function estimateTimeZoneForLocation(
  countryName: string,
  lat: number,
  lng: number,
  customCountries: CountryDef[] = []
): string {
  const matchedCountry = findCountryByName(countryName, customCountries);
  if (matchedCountry && matchedCountry.cities.length > 0) {
    // Pick closest city inside the matched country if coords are valid
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      let best = matchedCountry.cities[0];
      let bestDist = Infinity;
      for (const ci of matchedCountry.cities) {
        const d = (ci.lat - lat) ** 2 + (ci.lng - lng) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = ci;
        }
      }
      return best.timeZoneId;
    }
    return matchedCountry.cities[0].timeZoneId;
  }

  const norm = normalizeSearchText(countryName);
  if (norm) {
    const extra = EXTRA_COUNTRY_TIMEZONES.find((item) =>
      item.names.some((n) => norm.includes(normalizeSearchText(n)))
    );
    if (extra) return extra.tz;
  }

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    // Find nearest built-in city within ~7 degrees so DST rules match when close
    let nearest: CityDef | null = null;
    let nearestDist = Infinity;
    for (const co of WORLD_COUNTRIES) {
      for (const ci of co.cities) {
        const d = (ci.lat - lat) ** 2 + (ci.lng - lng) ** 2;
        if (d < nearestDist) {
          nearestDist = d;
          nearest = ci;
        }
      }
    }
    if (nearest && nearestDist <= 64) {
      return nearest.timeZoneId;
    }
    // Solar-hour Etc/GMT fallback (note IANA Etc/GMT sign convention is inverted!)
    const offsetHours = Math.max(-12, Math.min(14, Math.round(lng / 15)));
    if (offsetHours === 0) return 'UTC';
    return offsetHours > 0 ? `Etc/GMT-${offsetHours}` : `Etc/GMT+${Math.abs(offsetHours)}`;
  }

  return 'UTC';
}

export function searchCities(countryId: string, query: string, customCities: CityDef[] = []): CityDef[] {
  const list = getCitiesForCountry(countryId, customCities);
  const q = normalizeSearchText(query);
  if (!q) return list;
  return list.filter(
    (ci) =>
      normalizeSearchText(ci.nameAr).includes(q) ||
      normalizeSearchText(ci.nameEn).includes(q) ||
      ci.cityId.toLowerCase().includes(q)
  );
}

export function buildDefaultCalculationSettings(
  method: CalculationMethodId,
  madhab: MadhabType,
  highLatitudeRule: HighLatitudeRuleType
): CityCalculationSettings {
  const m = METHOD_LABELS[method] || METHOD_LABELS.MuslimWorldLeague;
  return {
    method,
    fajrAngle: m.fajrAngle,
    ishaAngle: m.ishaAngle,
    ishaInterval: m.ishaInterval,
    madhab,
    highLatitudeRule,
    dstMode: 'auto',
  };
}

export function createDefaultCityProfile(city: CityDef, country?: CountryDef): CityProfile {
  const method = city.defaultMethod || country?.defaultMethod || 'MuslimWorldLeague';
  const madhab = city.defaultMadhab || country?.defaultMadhab || 'shafi';
  const highLat = country?.defaultHighLatitudeRule || (Math.abs(city.lat) >= 48 ? 'SeventhOfTheNight' : 'MiddleOfTheNight');

  const isDefaultAmman = city.cityId === 'jo_amman';

  return {
    countryId: city.countryId,
    cityId: city.cityId,
    mosqueName: isDefaultAmman ? 'مصلى شارع بسمان' : `مسجد ${city.nameAr}`,
    neighborhood: isDefaultAmman ? 'وسط البلد' : city.nameAr,
    street: isDefaultAmman ? 'شارع بسمان' : '',
    timeZoneId: city.timeZoneId,
    coordinates: {
      lat: city.lat,
      lng: city.lng,
      elevation: city.elevation || 0,
    },
    calculationSettings: buildDefaultCalculationSettings(method, madhab, highLat),
    manualAdjustments: {
      fajr: { offsetMinutes: 0, mode: 'permanent' },
      shuruq: { offsetMinutes: 0, mode: 'permanent' },
      dhuhr: { offsetMinutes: 0, mode: 'permanent' },
      asr: { offsetMinutes: 0, mode: 'permanent' },
      maghrib: { offsetMinutes: 0, mode: 'permanent' },
      isha: { offsetMinutes: 0, mode: 'permanent' },
    },
    iqamaTimes: {
      fajr: 20,
      dhuhr: 15,
      asr: 15,
      maghrib: 10,
      isha: 15,
    },
    azkarSettings: {
      enabled: true,
      startDelaySec: 0,
      stepSec: 5,
      autoSequence: true,
      perPrayerDelaySec: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      },
    },
    screenSettings: {
      mode: 'always_on',
      timeoutMinutes: 15,
      keepClockVisible: true,
    },
    calculatedPrayerTimes: null,
    lastUpdated: '',
    changeHistory: [],
  };
}
