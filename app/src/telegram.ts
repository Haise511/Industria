/**
 * Thin wrapper around the Telegram Web App SDK loaded by index.html.
 *
 * Uses window.Telegram.WebApp directly (no `import '@twa-dev/sdk'`) because
 * we only need the runtime API, not the SDK's bundled types. This keeps the
 * bundle tiny and avoids SSR/typing issues.
 */

export interface TgWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    setText: (t: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    enable: () => void;
    disable: () => void;
  };
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (ev: string, cb: () => void) => void;
  offEvent?: (ev: string, cb: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function getTg(): TgWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

/**
 * Initialize the Telegram Mini App on first mount:
 *  - signal "ready" so Telegram hides its splash
 *  - expand to full viewport height
 *  - paint header & background to match our fixed dark theme so the OS chrome
 *    (top notch / pull-down area) does not flash a different color
 */
export function initTelegram(): TgWebApp | null {
  const tg = getTg();
  if (!tg) return null;
  try {
    tg.ready();
    if (!tg.isExpanded) tg.expand();
    tg.setHeaderColor?.('#1d1d1d');
    tg.setBackgroundColor?.('#1d1d1d');
  } catch {
    // Silently ignore — older Telegram clients may not support every method.
  }
  return tg;
}

/** Trigger haptic impact when supported (iOS/Android only). */
export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  getTg()?.HapticFeedback?.impactOccurred(style);
}
