// ── ttk-bus: BroadcastChannel(탭 간) + 로컬 리스너(동일 탭 분할 데모) ──
import type { TTKEvent } from './types';

type Listener = (e: TTKEvent) => void;

const CHANNEL = 'ttk-bus';
const listeners = new Set<Listener>();

let bc: BroadcastChannel | null = null;
try {
  bc = new BroadcastChannel(CHANNEL);
  bc.onmessage = (msg) => {
    const e = msg.data as TTKEvent;
    listeners.forEach((l) => l(e));
  };
} catch {
  bc = null; // file:// 등 미지원 환경 — 동일 탭 데모(#/demo)는 계속 동작
}

/** 로컬 전용 송출 — 탭 간 브로드캐스트·스냅숏 없이 같은 화면의 패드에만 반영 (F키 등) */
export function emitLocal(e: TTKEvent): void {
  listeners.forEach((l) => l(e));
}

export function emit(e: TTKEvent): void {
  // 동일 탭 구독자에게 즉시 전달
  listeners.forEach((l) => l(e));
  // 다른 탭으로 브로드캐스트
  bc?.postMessage(e);
  // 쇼 상태 스냅숏 (새로고침 복구용)
  persistSnapshot(e);
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ── 상태 스냅숏 ────────────────────────────────────────────────
export interface ShowSnapshot {
  phase: 'idle' | 'pre' | 'live' | 'post';
  songId: string | null;
  beatOn: boolean;
  bpm: number;
}

const SNAP_KEY = 'ttk-show-state';

function readSnap(): ShowSnapshot {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    if (raw) return JSON.parse(raw) as ShowSnapshot;
  } catch {
    /* ignore */
  }
  return { phase: 'pre', songId: null, beatOn: false, bpm: 0 };
}

function persistSnapshot(e: TTKEvent) {
  const s = readSnap();
  if (e.type === 'SHOW_START') s.phase = 'live';
  else if (e.type === 'SHOW_END') {
    s.phase = 'post';
    s.beatOn = false;
  } else if (e.type === 'SONG_CHANGE') s.songId = e.songId;
  else if (e.type === 'BEAT') {
    s.beatOn = e.on;
    s.bpm = e.bpm;
  }
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function getSnapshot(): ShowSnapshot {
  return readSnap();
}

export function resetShow(): void {
  try {
    localStorage.setItem(
      SNAP_KEY,
      JSON.stringify({ phase: 'pre', songId: null, beatOn: false, bpm: 0 }),
    );
  } catch {
    /* ignore */
  }
}
