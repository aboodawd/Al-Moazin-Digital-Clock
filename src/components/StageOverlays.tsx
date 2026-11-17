import React from 'react';
import { AUTHENTIC_AZKAR } from '../data/azkarData';

export type ActiveStageType = 'adhan' | 'iqama' | 'silence' | 'azkar' | null;

interface StageOverlaysProps {
  activeStage: ActiveStageType;
  adhanPrayerName: string;
  adhanPos: 'top' | 'center' | 'bottom';
  stageRemainingSec: number;
  azkarIndex: number;
  adhanImg: string | null;
  iqamaImg: string | null;
  silenceImg: string | null;
  azkarImg: string | null;
  mainBgImg: string | null;
  onDismiss: () => void;
  screenDimmed: boolean;
  keepClockVisibleWhenDimmed: boolean;
  dimmedClockHM: string;
  dimmedClockAmPm: string;
  onWakeScreen: () => void;
}

function formatMMSS(sec: number): string {
  const safe = Math.max(0, sec);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const StageOverlays: React.FC<StageOverlaysProps> = ({
  activeStage,
  adhanPrayerName,
  adhanPos,
  stageRemainingSec,
  azkarIndex,
  adhanImg,
  iqamaImg,
  silenceImg,
  azkarImg,
  mainBgImg,
  onDismiss,
  screenDimmed,
  keepClockVisibleWhenDimmed,
  dimmedClockHM,
  dimmedClockAmPm,
  onWakeScreen,
}) => {
  const adhanJustify =
    adhanPos === 'top' ? 'flex-start' : adhanPos === 'bottom' ? 'flex-end' : 'center';
  const adhanBoxMargin =
    adhanPos === 'top'
      ? { marginTop: '40px' }
      : adhanPos === 'bottom'
      ? { marginBottom: '40px' }
      : { margin: 'auto' };

  const currentZikr = AUTHENTIC_AZKAR[azkarIndex] || AUTHENTIC_AZKAR[0];
  const azkarBg = azkarImg
    ? `url(${azkarImg})`
    : mainBgImg
    ? `url(${mainBgImg})`
    : 'radial-gradient(circle at center, #0F281B 0%, #030A06 100%)';

  return (
    <>
      {/* STAGE 1: الأذان */}
      <div
        className={`stage-overlay${activeStage === 'adhan' ? ' active' : ''}`}
        id="overlay-stage-adhan"
        style={{
          justifyContent: adhanJustify,
          backgroundImage: adhanImg
            ? `url(${adhanImg})`
            : 'radial-gradient(circle at center, #0F2317 0%, #030805 100%)',
        }}
      >
        <button
          className="stage-close-btn"
          onClick={onDismiss}
          title="إغلاق الصوت والصورة والعودة للرئيسية (X)"
          aria-label="إغلاق"
        >
          ✕
        </button>
        <div className="stage-banner-box" id="adhan-text-box" style={adhanBoxMargin}>
          <h1
            className="stage-title"
            id="stage-adhan-heading"
            style={{ fontSize: 'clamp(38px, 7.5vh, 80px)', margin: 0, lineHeight: 1.25 }}
          >
            حان الآن موعد أذان {adhanPrayerName}
          </h1>
        </div>
        <div>
          <div className="stage-timer-display" id="stage-adhan-timer">
            {formatMMSS(stageRemainingSec)}
          </div>
        </div>
      </div>

      {/* STAGE 2: العد التنازلي للإقامة */}
      <div
        className={`stage-overlay${activeStage === 'iqama' ? ' active' : ''}`}
        id="overlay-stage-iqama"
        style={{
          backgroundImage: iqamaImg
            ? `url(${iqamaImg})`
            : 'radial-gradient(circle at center, #1B3322 0%, #060D08 100%)',
        }}
      >
        <button
          className="stage-close-btn"
          onClick={onDismiss}
          title="إغلاق والصوت والعودة للرئيسية (X)"
          aria-label="إغلاق"
        >
          ✕
        </button>
        <div className="stage-banner-box">
          <h1 className="stage-title">العد التنازلي لإقامة صلاة {adhanPrayerName}</h1>
          <p className="stage-subtitle">استعدوا للصلاة رحمكم الله ◆ بين كل أذانين صلاة</p>
        </div>
        <div>
          <div className="stage-timer-display" id="stage-iqama-timer">
            {formatMMSS(stageRemainingSec)}
          </div>
        </div>
        <div className="stage-footer-text">استووا واعتدلوا وأتموا الصفوف الأولى</div>
      </div>

      {/* STAGE 3: إغلاق الهاتف */}
      <div
        className={`stage-overlay${activeStage === 'silence' ? ' active' : ''}`}
        id="overlay-stage-silence"
        style={{
          backgroundImage: silenceImg
            ? `url(${silenceImg})`
            : 'radial-gradient(circle at center, #260C0C 0%, #0A0202 100%)',
        }}
      >
        <button
          className="stage-close-btn"
          onClick={onDismiss}
          title="إغلاق والصوت والعودة للرئيسية (X)"
          aria-label="إغلاق"
        >
          ✕
        </button>
        {!silenceImg && (
          <div
            id="silence-text-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              width: '100%',
            }}
          >
            <div className="stage-banner-box">
              <div style={{ fontSize: '60px', marginBottom: '10px' }}>📴</div>
              <h1 className="stage-title" style={{ color: '#F87171' }}>
                من فضلك أغلق الهاتف عند دخول المسجد
              </h1>
              <p className="stage-subtitle">
                قال تعالى: «قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ»
              </p>
            </div>
            <div>
              <div
                className="stage-timer-display"
                style={{ color: '#F87171' }}
                id="stage-silence-timer"
              >
                {formatMMSS(stageRemainingSec)}
              </div>
            </div>
            <div className="stage-footer-text">
              يرجى وضع الهواتف على وضع الصامت أو إغلاقها
            </div>
          </div>
        )}
      </div>

      {/* STAGE 4: أذكار ما بعد الصلاة */}
      <div
        className={`stage-overlay${activeStage === 'azkar' ? ' active' : ''}`}
        id="overlay-stage-azkar"
        style={{ backgroundImage: azkarBg }}
      >
        <button
          className="stage-close-btn"
          onClick={onDismiss}
          title="إغلاق والصوت والعودة للرئيسية (X)"
          aria-label="إغلاق"
        >
          ✕
        </button>
        <div className="stage-banner-box">
          <h1 className="stage-title" style={{ marginBottom: '8px' }}>
            أذكار ما بعد الصلاة
          </h1>
          <div className="azkar-step-badge" id="azkar-counter-text">
            ذكر {azkarIndex + 1}
          </div>
          <div id="azkar-slide-title">
            {currentZikr.title}{' '}
            <span
              style={{
                fontSize: 'clamp(14px, 2.2vh, 22px)',
                opacity: 0.85,
                fontWeight: 'normal',
              }}
            >
              ({currentZikr.note})
            </span>
          </div>
          <div
            className="stage-subtitle"
            id="azkar-slide-content"
            dangerouslySetInnerHTML={{ __html: currentZikr.text }}
          />
        </div>
      </div>

      {/* Graceful Power-Saving / Screen-Off Overlay (Safe for TV / Android) */}
      {screenDimmed && (
        <div
          className="screen-saver-overlay"
          onClick={onWakeScreen}
          title="اضغط في أي مكان لإضاءة الشاشة"
        >
          {keepClockVisibleWhenDimmed ? (
            <div>
              <div
                style={{
                  fontFamily: "'Changa', monospace",
                  fontSize: 'clamp(56px, 12vh, 110px)',
                  fontWeight: 700,
                  direction: 'ltr',
                }}
              >
                {dimmedClockHM}{' '}
                <span style={{ fontSize: '0.4em' }}>{dimmedClockAmPm}</span>
              </div>
              <div style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>
                وضع توفير الطاقة — اضغط لإضاءة الشاشة
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', opacity: 0.35 }}>
              وضع إطفاء الشاشة المؤقت — اضغط لإيقاظ العرض
            </div>
          )}
        </div>
      )}
    </>
  );
};
