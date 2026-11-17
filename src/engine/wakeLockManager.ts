// Safe Screen Control Manager (Wake Lock API + Graceful Screen-Off Dimmer)
// Never attempts to force-shutdown OS or hardware (Android / Android TV safe).

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}

let activeWakeLock: WakeLockSentinelLike | null = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (type: 'screen') => Promise<WakeLockSentinelLike>;
      };
    };
    if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
      if (activeWakeLock && !activeWakeLock.released) {
        return true;
      }
      activeWakeLock = await nav.wakeLock.request('screen');
      return true;
    }
  } catch {
    // WakeLock may be restricted in non-HTTPS or background tabs; ignore gracefully
  }
  return false;
}

export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (activeWakeLock && !activeWakeLock.released) {
      await activeWakeLock.release();
    }
    activeWakeLock = null;
  } catch {
    activeWakeLock = null;
  }
}

export function isWakeLockSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { wakeLock?: unknown };
  return Boolean(nav.wakeLock);
}
