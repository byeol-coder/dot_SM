// ── settings.tsx V2 — 확장 접근성 설정 컨텍스트 ─────────────────
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, type A11ySettings, type SensoryMode } from './types';

const KEY = 'ttk-a11y';

function load(): A11ySettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<A11ySettings>) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

interface Ctx {
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(load);

  const update = useCallback((patch: Partial<A11ySettings>) => {
    setSettings((prev) => {
      let next = { ...prev, ...patch };
      if (patch.mode === 'mode-low-vision') {
        next = { ...next, highContrast: true, fontScale: Math.max(next.fontScale, 1.5) };
      }
      if (patch.mode === 'mode-tactile-first') {
        next = { ...next, outputMode: 'hybrid' };
      }
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem('ttk-onboarded');
    } catch { /* ignore */ }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  return useContext(SettingsContext);
}

export function useA11yScopeProps() {
  const { settings } = useSettings();
  const osReduced =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    'data-a11y-mode': settings.mode,
    'data-hc': String(settings.highContrast),
    'data-rm': String(settings.reducedMotion || osReduced),
    'data-sensory': settings.sensoryMode,
    'data-output': settings.outputMode,
    style: { ['--font-scale' as string]: String(settings.fontScale) },
  } as const;
}

/** TTS — 촉각 우선/스크린리더 모드 */
export function useSpeak() {
  const { settings } = useSettings();
  return useCallback(
    (text: string, priority: 'polite' | 'assertive' = 'polite') => {
      const allowed = settings.mode === 'mode-tactile-first' ||
        (settings.mode === 'mode-screen-reader' && priority === 'assertive');
      if (!allowed) return;
      try {
        if (priority === 'assertive') speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ko-KR';
        u.rate = 1.2;
        speechSynthesis.speak(u);
      } catch { /* ignore */ }
    },
    [settings.mode],
  );
}

/** WebAudio 비프 (효과음 ON일 때) */
export function useBeep() {
  const { settings } = useSettings();
  return useCallback(
    (freq = 880, ms = 90) => {
      if (!settings.sound) return;
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctor();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0.06;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + ms / 1000);
        osc.onended = () => ctx.close();
      } catch { /* ignore */ }
    },
    [settings.sound],
  );
}

/** 감각 안전 모드별 FX 강도 계수 */
export function useSensoryScale(): number {
  const { settings } = useSettings();
  const map: Record<SensoryMode, number> = { full: 1, reduced: 0.5, minimal: 0 };
  return map[settings.sensoryMode];
}

export function useOsReducedMotion(): boolean {
  const [v, setV] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const h = () => setV(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return v;
}
