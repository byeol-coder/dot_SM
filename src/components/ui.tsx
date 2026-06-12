// ── ui.tsx V2 — Modal · Toast · FxOverlay(SensoryMode 연동) ─────
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { subscribe } from '../bus';
import { useBeep, useSettings } from '../settings';

// ── Modal (포커스 트랩, Esc, 포커스 복귀) ─────────────────────────
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref      = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', h, true);
    return () => {
      document.removeEventListener('keydown', h, true);
      prevFocus.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            className="btn btn--ghost modal__close"
            onClick={onClose}
            aria-label="닫기"
          >✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
interface ToastItem {
  id: number;
  text: string;
  tone: 'info' | 'danger' | 'success' | 'warn';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const push = useCallback(
    (text: string, tone: ToastItem['tone'] = 'info') => {
      const id = ++idRef.current;
      setToasts(t => [...t, { id, text, tone }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
    },
    [],
  );
  const node = (
    <div className="toasts" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
  return { push, node };
}

// ── FX 카운트다운 오버레이 (SensoryMode 연동) ─────────────────────
// sensoryMode=full:    전체화면 + 카운트다운 숫자 + 오디오
// sensoryMode=reduced: 작은 코너 배지 + 약한 오디오
// sensoryMode=minimal: 텍스트 안내 배너만
export function FxOverlay() {
  const { settings } = useSettings();
  const beep = useBeep();
  const [fx, setFx] = useState<{ label: string; emoji: string; fx: 'firework'|'flame' } | null>(null);
  const [count, setCount] = useState(3);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const off = subscribe(e => {
      if (e.type !== 'FX_COUNTDOWN') return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      const label = e.fx === 'firework' ? '폭죽' : '불기둥';
      const emoji = e.fx === 'firework' ? '🎆' : '🔥';
      setFx({ label, emoji, fx: e.fx });
      setCount(3);
      beep(660, 100);
      timers.current.push(
        window.setTimeout(() => { setCount(2); beep(660, 100); }, 1000),
        window.setTimeout(() => { setCount(1); beep(880, 100); }, 2000),
        window.setTimeout(() => { setCount(0); beep(1100, 250); }, 3000),
        window.setTimeout(() => setFx(null), 3700),
      );
    });
    return () => { off(); timers.current.forEach(clearTimeout); };
  }, [beep]);

  if (!fx) return null;

  const mode = settings.sensoryMode;

  // minimal: 배너만
  if (mode === 'minimal') {
    return (
      <div
        className="fx-banner"
        role="alert"
        aria-live="assertive"
      >
        <span aria-hidden="true">⚠</span>
        {count > 0
          ? `특수 효과 ${count}초 전 — ${fx.label}`
          : `${fx.label} 연출 중 (감각 안전 모드)`}
      </div>
    );
  }

  // reduced: 코너 배지
  if (mode === 'reduced') {
    return (
      <div
        className="fx-badge"
        role="alert"
        aria-live="assertive"
      >
        <span aria-hidden="true">{fx.emoji}</span>
        <span className="fx-badge__count">{count > 0 ? count : '!'}</span>
        <span className="fx-badge__label">{count > 0 ? `${fx.label} ${count}초` : 'NOW'}</span>
      </div>
    );
  }

  // full: 전체화면
  return (
    <div
      className={`fx-overlay fx-overlay--${fx.fx}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="fx-overlay__emoji" aria-hidden="true">{fx.emoji}</div>
      <div className="fx-overlay__num">{count > 0 ? count : 'NOW'}</div>
      <div className="fx-overlay__label">
        {count > 0 ? `${fx.label} ${count}초 전` : `${fx.label} 발사!`}
      </div>
      {/* 접근성: 숨김 텍스트로 스크린리더용 카운트 */}
      <div className="sr-only" aria-live="off">
        {count > 0 ? `특수 효과 ${count}초 전` : '특수 효과 발사'}
      </div>
    </div>
  );
}
