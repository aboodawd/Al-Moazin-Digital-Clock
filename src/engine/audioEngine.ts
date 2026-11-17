import { AudioStore, type AudioSlotKey } from '../storage/persistence';
import type { UISettings } from '../types/prayer';

const PRESET_ADHAN_URLS: Record<string, string> = {
  preset_makkah: 'https://download.quranicaudio.com/misc/athan/makkah.mp3',
  preset_madinah: 'https://download.quranicaudio.com/misc/athan/madinah.mp3',
};

let activeHtmlAudio: HTMLAudioElement | null = null;
let activeAudioNodes: OscillatorNode[] = [];
let activeAudioCtx: AudioContext | null = null;
let activeSoundTimeouts: ReturnType<typeof setTimeout>[] = [];
let isAudioUnlocked = false;

export function unlockAudioContext(): void {
  if (isAudioUnlocked) return;
  isAudioUnlocked = true;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
      activeAudioCtx = new AudioCtx();
    }
    if (activeAudioCtx.state === 'suspended') {
      void activeAudioCtx.resume();
    }
  } catch {
    // ignore
  }
}

export function stopAllSounds(onStateChange?: (playingType: AudioSlotKey | null) => void): void {
  try {
    if (activeHtmlAudio) {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
      activeHtmlAudio = null;
    }
    if (activeSoundTimeouts.length) {
      activeSoundTimeouts.forEach((t) => clearTimeout(t));
      activeSoundTimeouts = [];
    }
    if (activeAudioNodes.length) {
      activeAudioNodes.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      activeAudioNodes = [];
    }
    if (activeAudioCtx) {
      try {
        void activeAudioCtx.close();
      } catch {
        // ignore
      }
      activeAudioCtx = null;
    }
  } catch {
    // ignore
  }
  onStateChange?.(null);
}

export function setLiveAudioVolume(volumePercent: number): void {
  if (activeHtmlAudio) {
    activeHtmlAudio.volume = Math.min(1, Math.max(0, volumePercent / 100));
  }
}

export function playChimeTone(
  freq: number,
  durSec: number,
  soundEnabled: boolean,
  volumePercent: number
): void {
  if (!soundEnabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
      activeAudioCtx = new AudioCtx();
    }
    if (activeAudioCtx.state === 'suspended') {
      void activeAudioCtx.resume();
    }
    const ctx = activeAudioCtx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const volMultiplier = Math.min(1, Math.max(0, volumePercent / 100));
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0.35 * volMultiplier, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durSec);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durSec);
    activeAudioNodes.push(osc);
    osc.onended = () => {
      const idx = activeAudioNodes.indexOf(osc);
      if (idx > -1) activeAudioNodes.splice(idx, 1);
    };
  } catch {
    // ignore
  }
}

function playFallbackAdhanChime(
  soundEnabled: boolean,
  volumePercent: number,
  onEnded: () => void
): void {
  playChimeTone(440, 0.8, soundEnabled, volumePercent);
  activeSoundTimeouts.push(
    setTimeout(() => playChimeTone(554.37, 0.8, soundEnabled, volumePercent), 350)
  );
  activeSoundTimeouts.push(
    setTimeout(() => playChimeTone(659.25, 1.2, soundEnabled, volumePercent), 700)
  );
  activeSoundTimeouts.push(setTimeout(onEnded, 2500));
}

export async function playAudioSlot(
  type: AudioSlotKey,
  ui: UISettings,
  onStateChange?: (playingType: AudioSlotKey | null) => void,
  onNotify?: (msg: string) => void
): Promise<void> {
  stopAllSounds(onStateChange);
  if (!ui.soundEnabled) {
    onNotify?.('الصوت مكتوم حالياً، يرجى تفعيل الصوت أولاً');
    return;
  }

  const vol = Math.min(1, Math.max(0, (ui.audioVolume ?? 100) / 100));

  if (type === 'adhan_fajr') {
    const src = ui.fajrAudioSource || 'custom';
    if (src === 'silent') {
      onNotify?.('وضع أذان الفجر الحالي مضبوط على: صامت');
      return;
    }
    if (src === 'same_as_adhan') {
      return playAudioSlot('adhan', ui, onStateChange, onNotify);
    }
    if (src === 'custom') {
      const item = (await AudioStore.get('adhan_fajr')) || (await AudioStore.get('adhan'));
      if (item?.data) {
        try {
          const audio = new Audio(item.data);
          audio.volume = vol;
          activeHtmlAudio = audio;
          audio.onended = () => stopAllSounds(onStateChange);
          onStateChange?.('adhan_fajr');
          await audio.play();
          return;
        } catch {
          // fallback below
        }
      }
    } else if (PRESET_ADHAN_URLS[src]) {
      try {
        const audio = new Audio(PRESET_ADHAN_URLS[src]);
        audio.volume = vol;
        activeHtmlAudio = audio;
        audio.onended = () => stopAllSounds(onStateChange);
        onStateChange?.('adhan_fajr');
        await audio.play();
        return;
      } catch {
        // fallback below
      }
    }
    onStateChange?.('adhan_fajr');
    playFallbackAdhanChime(ui.soundEnabled, ui.audioVolume, () => onStateChange?.(null));
    return;
  }

  if (type === 'adhan') {
    const src = ui.adhanAudioSource || 'custom';
    if (src === 'silent') {
      onNotify?.('وضع الأذان الحالي مضبوط على: صامت');
      return;
    }
    if (src === 'custom') {
      const item = await AudioStore.get('adhan');
      if (item?.data) {
        try {
          const audio = new Audio(item.data);
          audio.volume = vol;
          activeHtmlAudio = audio;
          audio.onended = () => stopAllSounds(onStateChange);
          onStateChange?.('adhan');
          await audio.play();
          return;
        } catch {
          // fallback below
        }
      }
    } else if (PRESET_ADHAN_URLS[src]) {
      try {
        const audio = new Audio(PRESET_ADHAN_URLS[src]);
        audio.volume = vol;
        activeHtmlAudio = audio;
        audio.onended = () => stopAllSounds(onStateChange);
        onStateChange?.('adhan');
        await audio.play();
        return;
      } catch {
        // fallback below
      }
    }
    onStateChange?.('adhan');
    playFallbackAdhanChime(ui.soundEnabled, ui.audioVolume, () => onStateChange?.(null));
    return;
  }

  if (type === 'iqama') {
    const item = await AudioStore.get('iqama');
    if (item?.data) {
      try {
        const audio = new Audio(item.data);
        audio.volume = vol;
        activeHtmlAudio = audio;
        audio.onended = () => stopAllSounds(onStateChange);
        onStateChange?.('iqama');
        await audio.play();
        return;
      } catch {
        // fallback
      }
    }
    onStateChange?.('iqama');
    playChimeTone(554.37, 1.2, ui.soundEnabled, ui.audioVolume);
    activeSoundTimeouts.push(setTimeout(() => onStateChange?.(null), 1300));
  }
}
