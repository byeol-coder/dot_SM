// ── Touch the K-POP V2 · 공용 타입 ──────────────────────────────

export type ShowPhase = 'idle' | 'pre' | 'live' | 'post';

export interface LyricLine {
  member: string;
  memberInitial: string;
  text: string;
}

/** 큐 타임라인 항목 */
export type TimelineCue =
  | { at: number; kind: 'LYRIC'; lineIdx: number }
  | { at: number; kind: 'HIGHLIGHT'; emoji: string; text: string }
  | { at: number; kind: 'GESTURE'; emoji: string; text: string }
  | { at: number; kind: 'FORMATION'; name: string; text: string; gridKey: FormationKey }
  | { at: number; kind: 'FX_COUNTDOWN'; fx: 'firework' | 'flame' }
  | { at: number; kind: 'BEAT'; on: boolean };

export type FormationKey = 'V' | 'LINE' | 'CIRCLE' | 'CENTER';

export interface Song {
  id: string;
  no: number;
  title: string;
  titleEn: string;
  bpm: number;
  concept: string;
  lyrics: LyricLine[];
  timeline: TimelineCue[];
  durationMs: number;
}

// ── 버스 이벤트 ─────────────────────────────────────────────────

export type TTKEvent =
  | { type: 'SHOW_START'; ts: number }
  | { type: 'SHOW_END'; ts: number }
  | { type: 'SONG_CHANGE'; ts: number; songId: string }
  | {
      type: 'LYRIC';
      ts: number;
      songId: string;
      lineIdx: number;
      member: string;
      memberInitial: string;
      text: string;
    }
  | { type: 'HIGHLIGHT'; ts: number; emoji: string; text: string }
  | { type: 'GESTURE'; ts: number; emoji: string; text: string }
  | { type: 'FORMATION'; ts: number; name: string; text: string; grid: string }
  | { type: 'FX_COUNTDOWN'; ts: number; fx: 'firework' | 'flame'; seconds: 3 }
  | { type: 'BEAT'; ts: number; on: boolean; bpm: number }
  | { type: 'NOTICE'; ts: number; text: string }
  | { type: 'TEXT_PUSH'; ts: number; text: string }
  | { type: 'SOS'; ts: number; seat: string }
  | { type: 'DEVICE_CONNECTED'; ts: number; deviceId: string };

export type TTKEventType = TTKEvent['type'];

// ── 접근성 설정 ─────────────────────────────────────────────────

export type A11yMode =
  | 'mode-tactile-first'
  | 'mode-low-vision'
  | 'mode-screen-reader'
  | 'mode-standard';

/** 촉각 출력 정책 */
export type TactilePolicy =
  | 'policy-braille-priority'   // 점자 텍스트 최우선
  | 'policy-graphic-priority'   // 그래픽 도식 최우선
  | 'policy-balanced';           // 균형(기본)

/** 기기 연결 상태 */
export type DeviceStatus = 'connected' | 'syncing' | 'delayed' | 'offline';

/** 감각 안전 모드: FX 강도 제한 */
export type SensoryMode = 'full' | 'reduced' | 'minimal';

export interface A11ySettings {
  mode: A11yMode;
  fontScale: number;           // 1.0 ~ 2.0
  highContrast: boolean;
  reducedMotion: boolean;
  vibration: 'low' | 'mid' | 'high';
  sound: boolean;
  tactilePolicy: TactilePolicy;
  sensoryMode: SensoryMode;
  outputMode: 'braille' | 'graphic' | 'hybrid'; // F1 토글 대상
}

export const DEFAULT_SETTINGS: A11ySettings = {
  mode: 'mode-standard',
  fontScale: 1.0,
  highContrast: false,
  reducedMotion: false,
  vibration: 'mid',
  sound: false,
  tactilePolicy: 'policy-balanced',
  sensoryMode: 'full',
  outputMode: 'hybrid',
};

// ── 큐 히스토리 항목 ─────────────────────────────────────────────
export interface CueHistoryItem {
  id: number;
  ts: number;
  type: TTKEventType;
  label: string;
  raw: string;           // 점자 출력된 원문
  gridHex: string | null;
  replayable: boolean;
}
