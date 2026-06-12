// ── DotPadSim.tsx V2 — Dot Pad 320 고도화 시뮬레이터 ─────────────
// C1: 60×40 tactile grid (30fps rAF, 7가지 애니메이션 레이어)
// C2: 20-cell braille strip + 점자 출력 정책
// C3: 좌/우 패닝키, F1~F4 정책 내장
// C4: 기기 상태바 (connected/syncing/delayed/offline) + latency
// C5: 큐 히스토리 replay
// C6: 키보드 단축키 헬프 오버레이
// C7: 스크린리더 live announcement (aria-live)
// C8: 감각 안전 모드 (FX 강도 계수)

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKE,
} from 'react';
import { subscribe } from '../bus';
import { byteToBrailleChar, toBrailleBytes } from '../braille';
import { COLS, ROWS, emptyGrid, hexToGrid, type Grid } from '../frames';
import { useBeep, useSettings, useSensoryScale } from '../settings';
import type {
  CueHistoryItem,
  DeviceStatus,
  ShowPhase,
  TTKEvent,
  TTKEventType,
} from '../types';

const CELLS = 20;
const PAN_STEP = 18;
const HISTORY_MAX = 30;

// ── 텍스트 슬롯 우선순위: FX(4) > NOTICE(3) > HIGHLIGHT/GESTURE(2) > LYRIC(1) > PUSH(0) ──
interface TextSlot { raw: string; until: number; priority: number; }

// ── 기기 상태 → 색상·레이블 ─────────────────────────────────────
const STATUS_META: Record<DeviceStatus, { label: string; color: string; desc: string }> = {
  connected: { label: 'BLE 연결됨',    color: '#4dd7ff', desc: '정상 동작 중' },
  syncing:   { label: '동기화 중…',    color: '#ffd400', desc: '큐 수신 중' },
  delayed:   { label: '지연 감지',     color: '#ff6b35', desc: '네트워크 지연' },
  offline:   { label: 'BLE 끊김',     color: '#ff5252', desc: '연결을 확인하세요' },
};

// ── 출력 모드 레이블 ─────────────────────────────────────────────
const OUTPUT_LABEL: Record<string, string> = {
  braille: '점자 우선',
  graphic: '그래픽 우선',
  hybrid:  '혼합(기본)',
};

// ── 진동(비트 펄스) 존 크기 ──────────────────────────────────────
const VIB_SIZE: Record<string, number> = { low: 4, mid: 8, high: 12 };

interface Props {
  size?: 'full' | 'mini';
  interactive?: boolean;
  deviceStatus?: DeviceStatus;
  latencyMs?: number;
  phase?: ShowPhase;
  testWaveSignal?: number;
  onFKey?: (n: 1 | 2 | 3 | 4) => void;
}

export default function DotPadSim({
  size = 'full',
  interactive = false,
  deviceStatus = 'offline',
  latencyMs = 0,
  phase = 'pre',
  testWaveSignal = 0,
  onFKey,
}: Props) {
  const { settings, update } = useSettings();
  const beep = useBeep();
  const sensoryScale = useSensoryScale();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── 텍스트 슬롯 ref ───────────────────────────────────────────
  const slotRef = useRef<TextSlot>({ raw: '', until: 0, priority: 0 });
  const lyricRef = useRef<string>('');      // 상시 (priority 1)
  const pushRef  = useRef<string>('');      // 상시 (priority 0)

  // ── 그래픽 레이어 refs (rAF 내 직접 참조) ─────────────────────
  const gridRef      = useRef<Grid>(emptyGrid());
  const revealAtRef  = useRef(0);
  const beatRef      = useRef({ on: false, bpm: 120 });
  const fxAnimRef    = useRef({ startedAt: 0, active: false, fx: 'firework' as 'firework'|'flame' });
  const waveAtRef    = useRef(0);
  const scanAtRef    = useRef(0);   // 새 가사 세로 스캔 애니메이션
  const phaseRef     = useRef(phase);
  phaseRef.current   = phase;

  // ── 패닝 상태 ────────────────────────────────────────────────
  const [pan, setPan]             = useState(0);
  const [markerOn, setMarkerOn]   = useState(false);
  const [edgeFlash, setEdgeFlash] = useState<'l'|'r'|null>(null);

  // ── UI 상태 ──────────────────────────────────────────────────
  const [, forceRender]       = useState(0);
  const [helpOpen, setHelpOpen]   = useState(false);
  const [histOpen, setHistOpen]   = useState(false);
  const [history, setHistory]     = useState<CueHistoryItem[]>([]);
  const [announcement, setAnnouncement] = useState('');  // sr-only live region
  const histIdRef = useRef(0);
  const annTimerRef = useRef(0);

  // ── 유틸: live announcement ───────────────────────────────────
  const announce = useCallback((text: string) => {
    setAnnouncement('');
    clearTimeout(annTimerRef.current);
    // 비워야 리더기가 재감지함
    annTimerRef.current = window.setTimeout(() => setAnnouncement(text), 60);
  }, []);

  // ── 유틸: 새 줄 마커 (점7·8 2회 점멸) ─────────────────────────
  const newLineMarker = useCallback(() => {
    setMarkerOn(true);
    setTimeout(() => setMarkerOn(false), 220);
    setTimeout(() => setMarkerOn(true),  440);
    setTimeout(() => setMarkerOn(false), 660);
  }, []);

  // ── 유틸: 히스토리 추가 ─────────────────────────────────────
  const addHistory = useCallback((
    type: TTKEventType,
    label: string,
    raw: string,
    gridHex: string | null = null,
  ) => {
    const item: CueHistoryItem = {
      id: ++histIdRef.current,
      ts: Date.now(),
      type,
      label,
      raw,
      gridHex,
      replayable: true,
    };
    setHistory(prev => [item, ...prev].slice(0, HISTORY_MAX));
  }, []);

  // ── 현재 표시 텍스트 계산 (우선순위 적용) ────────────────────
  const getActiveText = useCallback((): string => {
    const now = Date.now();
    const s = slotRef.current;
    if (s.until > now && s.raw) return s.raw;
    if (lyricRef.current) return lyricRef.current;
    if (phaseRef.current !== 'live' && pushRef.current) return pushRef.current;
    return '';
  }, []);

  // ── 버스 구독 ────────────────────────────────────────────────
  useEffect(() => {
    const off = subscribe((e: TTKEvent) => {
      const now = Date.now();
      const setSlot = (raw: string, durationMs: number, priority: number) => {
        const cur = slotRef.current;
        if (cur.until > now && cur.priority > priority) return; // 낮은 우선순위 무시
        slotRef.current = { raw, until: now + durationMs, priority };
        setPan(0);
        newLineMarker();
      };

      switch (e.type) {
        case 'LYRIC':
          lyricRef.current = `[${e.memberInitial}] ${e.text}`;
          setPan(0);
          newLineMarker();
          scanAtRef.current = performance.now();
          addHistory('LYRIC', `[${e.member}] ${e.text}`, lyricRef.current);
          announce(`${e.member}: ${e.text}`);
          break;

        case 'HIGHLIGHT':
          setSlot(`✦ ${e.text}`, 4000, 2);
          addHistory('HIGHLIGHT', e.text, `✦ ${e.text}`);
          announce(e.text);
          break;

        case 'GESTURE':
          setSlot(e.text, 4000, 2);
          addHistory('GESTURE', e.text, e.text);
          announce(e.text);
          break;

        case 'FORMATION':
          setSlot(`대형: ${e.name}`, 5000, 2);
          gridRef.current   = hexToGrid(e.grid);
          revealAtRef.current = performance.now();
          addHistory('FORMATION', e.name, `대형: ${e.name}`, e.grid);
          announce(`대형 변환 — ${e.name}. ${e.text}`);
          break;

        case 'NOTICE':
          setSlot(e.text, 8000, 3);
          addHistory('NOTICE', e.text, e.text);
          announce(e.text);
          break;

        case 'FX_COUNTDOWN': {
          const scale = sensoryScale;
          if (scale === 0) {
            // minimal: 텍스트 안내만
            setSlot('FX 연출 — 감각 안전 모드 적용', 3500, 4);
            announce('특수 효과 연출 중. 감각 안전 모드로 강도가 제한됩니다.');
            break;
          }
          const label = e.fx === 'firework' ? '🎆 폭죽' : '🔥 불기둥';
          setSlot(`${label} 3초 전 — 3 · 2 · 1`, 3400, 4);
          fxAnimRef.current = { startedAt: performance.now(), active: true, fx: e.fx };
          addHistory('FX_COUNTDOWN', label, `${label} 3초 카운트다운`);
          announce(`주의 — ${label} 연출 3초 전입니다`);
          break;
        }

        case 'TEXT_PUSH':
          pushRef.current = e.text;
          if (phaseRef.current !== 'live') setPan(0);
          announce(e.text);
          break;

        case 'BEAT':
          beatRef.current = { on: e.on, bpm: e.bpm };
          break;

        case 'SHOW_START':
          waveAtRef.current = performance.now();
          setSlot('공연이 시작됩니다', 5000, 3);
          lyricRef.current = '';
          announce('공연이 시작됩니다');
          break;

        case 'SHOW_END':
          gridRef.current   = emptyGrid();
          beatRef.current   = { on: false, bpm: 120 };
          lyricRef.current  = '';
          pushRef.current   = '공연 종료 — 하이라이트 큐시트가 준비되었습니다';
          announce('공연이 종료되었습니다');
          break;

        case 'SONG_CHANGE':
          lyricRef.current = '';
          gridRef.current  = emptyGrid();
          break;

        default: break;
      }
      forceRender(n => n + 1);
    });
    return off;
  }, [newLineMarker, addHistory, announce, sensoryScale]);

  // 250ms 틱 — 점유 만료·상태 리렌더
  useEffect(() => {
    const t = setInterval(() => forceRender(n => n + 1), 250);
    return () => clearInterval(t);
  }, []);

  // 페어링 웨이브 테스트
  useEffect(() => {
    if (testWaveSignal > 0) {
      waveAtRef.current = performance.now();
      announce('Dot Pad 핀 테스트가 시작됩니다');
    }
  }, [testWaveSignal, announce]);

  // ── 점자 바 계산 ─────────────────────────────────────────────
  const raw      = getActiveText();
  const bytes    = toBrailleBytes(raw);
  const maxPan   = Math.max(0, bytes.length - CELLS);
  const safePan  = Math.min(pan, maxPan);
  const window20 = Array.from({ length: CELLS }, (_, i) => bytes[safePan + i] ?? 0);
  // 새 줄 마커: 셀 0에 점 7·8 OR 합산
  if (markerOn) window20[0] = window20[0] | 0xc0;

  // ── 패닝 함수 ────────────────────────────────────────────────
  const doPan = useCallback((dir: -1 | 1, jump = false) => {
    setPan(p => {
      const cur  = Math.min(p, maxPan);
      let   next = jump ? (dir < 0 ? 0 : maxPan) : cur + dir * PAN_STEP;
      next = Math.max(0, Math.min(next, maxPan));
      if (next === cur) {
        setEdgeFlash(dir < 0 ? 'l' : 'r');
        setTimeout(() => setEdgeFlash(null), 300);
        beep(440, 80);
        announce(dir < 0 ? '점자 시작 끝' : '점자 끝 도달');
      } else {
        beep(660, 40);
        announce(`점자 패닝 — ${next}번째 셀`);
      }
      return next;
    });
  }, [maxPan, beep, announce]);

  // ── F1~F4 내장 정책 ─────────────────────────────────────────
  // F1: 출력 모드 순환 (braille → graphic → hybrid → braille)
  // F2: 현재 큐 다시 재생 (히스토리 최신 항목)
  // F3: 촉각 강도 순환 (low → mid → high)
  // F4: 현재 화면 도움말 / 긴급 지원 (props.onFKey 위임)
  const handleFKey = useCallback((n: 1 | 2 | 3 | 4) => {
    if (n === 1) {
      // 출력 모드 전환
      const modes = ['hybrid', 'braille', 'graphic'] as const;
      const cur   = modes.indexOf(settings.outputMode as typeof modes[number]);
      const next  = modes[(cur + 1) % 3];
      update({ outputMode: next });
      announce(`출력 모드 전환 — ${OUTPUT_LABEL[next]}`);
      beep(880, 60);
      return;
    }
    if (n === 2) {
      // 현재 큐 다시 재생 (최신 히스토리)
      const latest = history[0];
      if (!latest) {
        announce('다시 재생할 큐가 없습니다');
        beep(440, 80);
        return;
      }
      slotRef.current = { raw: latest.raw, until: Date.now() + 5000, priority: 3 };
      if (latest.gridHex) {
        gridRef.current    = hexToGrid(latest.gridHex);
        revealAtRef.current = performance.now();
      }
      setPan(0);
      newLineMarker();
      announce(`이전 큐 재생 — ${latest.label}`);
      beep(660, 80);
      forceRender(n => n + 1);
      return;
    }
    if (n === 3) {
      // 촉각 강도 순환
      const vibs = ['low', 'mid', 'high'] as const;
      const cur  = vibs.indexOf(settings.vibration as typeof vibs[number]);
      const next = vibs[(cur + 1) % 3];
      update({ vibration: next });
      const label = next === 'low' ? '약' : next === 'mid' ? '중' : '강';
      announce(`촉각 강도 ${label}으로 변경`);
      beep(next === 'low' ? 440 : next === 'mid' ? 660 : 880, 80);
      return;
    }
    // F4: 도움말 토글 + 외부 위임 (긴급 호출 등)
    if (n === 4) {
      setHelpOpen(v => !v);
      onFKey?.(4);
      return;
    }
  }, [settings, update, history, newLineMarker, beep, announce, onFKey]);

  // ── 키보드 이벤트 (interactive 전용) ────────────────────────
  useEffect(() => {
    if (!interactive) return;
    const h = (ev: globalThis.KeyboardEvent) => {
      const tag = (ev.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (ev.key === ',') { ev.preventDefault(); doPan(-1, ev.shiftKey); }
      else if (ev.key === '.') { ev.preventDefault(); doPan(1,  ev.shiftKey); }
      else if (/^F[1-4]$/.test(ev.key)) { ev.preventDefault(); handleFKey(Number(ev.key[1]) as 1|2|3|4); }
      else if (ev.key === '?' || (ev.key === '/' && ev.shiftKey)) { setHelpOpen(v => !v); }
      else if (ev.key === 'h' || ev.key === 'H') { setHistOpen(v => !v); }
      else if (ev.key === 'Escape') { setHelpOpen(false); setHistOpen(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [interactive, doPan, handleFKey]);

  // ── 캔버스 렌더 루프 (30fps, 7 레이어) ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL   = size === 'full' ? 9 : 5;
    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;

    let raf  = 0;
    let last = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 33) return;
      last = t;

      const css    = getComputedStyle(canvas);
      const cUp    = css.getPropertyValue('--pin-up').trim()   || '#F5F7FA';
      const cDown  = css.getPropertyValue('--pin-down').trim() || '#262B36';
      const cFx    = css.getPropertyValue('--pin-fx').trim()   || '#FFD400';
      const cBeat  = css.getPropertyValue('--pin-beat').trim() || '#FF2D78';
      const cInfo  = css.getPropertyValue('--color-info').trim()|| '#4DD7FF';
      const cSurf2 = css.getPropertyValue('--color-surface-2').trim() || '#1B2230';

      ctx.fillStyle = cSurf2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pulseSize = VIB_SIZE[settings.vibration] ?? 8;
      const g = gridRef.current;

      // ── L1: FORMATION 컬럼 reveal (400ms) ──
      const revealMs   = t - revealAtRef.current;
      const outputMode = settings.outputMode;
      const showGraphic = outputMode !== 'braille';
      const revealCols = showGraphic
        ? (revealMs < 400 ? Math.floor((revealMs / 400) * COLS) : COLS)
        : 0;

      // ── L2: BEAT 중앙 펄스 ──
      const beat   = beatRef.current;
      const period = 60_000 / Math.max(beat.bpm, 1);
      const beatUp = beat.on && (t % period < period / 2);
      const bx0    = Math.floor(COLS / 2 - pulseSize / 2);
      const by0    = Math.floor(ROWS / 2 - pulseSize / 2);

      // ── L3: FX 테두리 단계 ──
      const fx    = fxAnimRef.current;
      const scale = sensoryScale;
      const fxEl  = fx.active ? t - fx.startedAt : -1;
      type FxEdge = 'all'|'lr'|'top'|'flash'|null;
      let fxEdge: FxEdge = null;
      if (scale > 0 && fxEl >= 0) {
        if      (fxEl < 1000)                   fxEdge = 'all';
        else if (fxEl < 2000 * scale)           fxEdge = 'lr';
        else if (fxEl < 3000 * scale)           fxEdge = 'top';
        else if (fxEl < 3000 * scale + 300)     fxEdge = 'flash';
        else                                     fx.active = false;
      }

      // ── L4: 페어링 웨이브 ──
      const waveEl  = t - waveAtRef.current;
      const waveCol = waveEl < 1200 ? Math.floor((waveEl / 1200) * COLS) : -1;

      // ── L5: 가사 수신 세로 스캔 라인 ──
      const scanEl = t - scanAtRef.current;
      const scanRow = scanEl < 300 ? Math.floor((scanEl / 300) * ROWS) : -1;

      // ── L6: 점자 미리보기 (graphic/hybrid 외엔 하단 4행에 밀도 표시) ──
      const showBrailleHint = outputMode !== 'graphic' && bytes.length > 0;

      // ── L7: 오프라인 크로스해치 ──
      const offline = deviceStatus === 'offline';

      const r = CELL * 0.36;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          let up    = false;
          let color = cUp;

          // 오프라인: 격자 패턴
          if (offline) {
            up    = (x + y) % 4 === 0;
            color = '#3a4255';
          } else {
            // L1: FORMATION
            if (x < revealCols && g[y * COLS + x]) { up = true; }

            // L2: BEAT 펄스
            if (beatUp && x >= bx0 && x < bx0 + pulseSize && y >= by0 && y < by0 + pulseSize) {
              up = true; color = cBeat;
            }

            // L3: FX 테두리
            const isEdge =
              fxEdge === 'flash' ? true :
              fxEdge === 'all'   ? (x===0||x===COLS-1||y===0||y===ROWS-1) :
              fxEdge === 'lr'    ? (x===0||x===COLS-1) :
              fxEdge === 'top'   ? (y===0) : false;
            if (isEdge) { up = true; color = cFx; }

            // L4: 웨이브
            if (waveCol >= 0 && Math.abs(x - waveCol) <= 1) { up = true; color = cInfo; }

            // L5: 가사 스캔 라인
            if (scanRow >= 0 && y === scanRow) { up = true; color = cInfo; }

            // L6: 점자 밀도 힌트 (하단 2행, 20셀 폭)
            if (showBrailleHint && y >= ROWS - 2 && x < CELLS) {
              const byteIdx = safePan + x;
              if (byteIdx < bytes.length) {
                const b = bytes[byteIdx];
                // 상위 4핀 → ROWS-2행, 하위 4핀 → ROWS-1행
                const row4 = y === ROWS - 2 ? (b & 0x0f) : ((b >> 4) & 0x0f);
                if (row4 > 0 && (row4 & (1 << (x % 4)))) { up = true; color = '#9aa4b5'; }
              }
            }
          }

          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, r, 0, Math.PI * 2);
          ctx.fillStyle = up ? color : cDown;
          ctx.fill();
        }
      }

      // 동기화 중: 우상단 스피너 효과 (scan line 반복)
      if (deviceStatus === 'syncing') {
        const syncAngle = (t / 2000) * Math.PI * 2;
        const cx = canvas.width - CELL * 3;
        const cy = CELL * 3;
        ctx.strokeStyle = cInfo;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * 2, syncAngle, syncAngle + Math.PI);
        ctx.stroke();
      }

      // 지연 감지: 우상단 느낌표
      if (deviceStatus === 'delayed') {
        ctx.fillStyle = '#ff6b35';
        ctx.font      = `bold ${CELL * 2.5}px monospace`;
        ctx.fillText('!', canvas.width - CELL * 3, CELL * 4);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, settings.vibration, settings.outputMode, deviceStatus, bytes, safePan, sensoryScale]);

  // ── 상태바 메타 ─────────────────────────────────────────────
  const stMeta     = STATUS_META[deviceStatus];
  const beatOn     = beatRef.current.on;
  const vibLabel   = settings.vibration === 'low' ? '약' : settings.vibration === 'mid' ? '중' : '강';
  const latLabel   = latencyMs > 0 ? `${latencyMs}ms` : '—';
  const latColor   = latencyMs > 200 ? '#ff5252' : latencyMs > 80 ? '#ff6b35' : '#4dd7ff';

  // ── 도움말 단축키 테이블 ─────────────────────────────────────
  const SHORTCUTS = [
    { key: ', / .', desc: '점자 바 한 페이지 패닝' },
    { key: 'Shift + , / .', desc: '처음 / 끝으로 이동' },
    { key: 'F1', desc: '출력 모드 전환 (혼합→점자→그래픽)' },
    { key: 'F2', desc: '이전 큐 다시 재생' },
    { key: 'F3', desc: '촉각 강도 전환 (약→중→강)' },
    { key: 'F4', desc: '도움말 열기 / 긴급 스태프 호출' },
    { key: 'H', desc: '큐 히스토리 열기 / 닫기' },
    { key: '?', desc: '이 도움말 열기 / 닫기' },
    { key: 'Esc', desc: '패널 닫기' },
  ];

  // ── render ───────────────────────────────────────────────────
  return (
    <div
      className={[
        'dotpad',
        `dotpad--${size}`,
        `dotpad--${deviceStatus}`,
        edgeFlash ? `dotpad--edge-${edgeFlash}` : '',
      ].filter(Boolean).join(' ')}
      role="application"
      aria-label={`Dot Pad 시뮬레이터. 상태: ${stMeta.label}. 현재 점자: ${raw || '없음'}. F1~F4 기능키 및 쉼표·마침표 패닝 사용 가능.`}
    >
      {/* ── sr-only live region ── */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      {/* ── 상태바 ── */}
      <div className="dotpad__statusbar" aria-hidden="true">
        <span
          className="dotpad__ble-dot"
          style={{ background: stMeta.color }}
          title={stMeta.desc}
        />
        <span className="dotpad__ble-label" style={{ color: stMeta.color }}>
          {stMeta.label}
        </span>
        {latencyMs > 0 && (
          <span className="dotpad__latency mono" style={{ color: latColor }}>
            {latLabel}
          </span>
        )}
        <span className="dotpad__batt" aria-hidden="true">▮▮▮</span>
        <span className={`dotpad__vib-ind ${beatOn ? 'is-on' : ''}`}>
          ((·)) {beatOn ? `${beatRef.current.bpm}bpm` : 'OFF'}
        </span>
        <span className="dotpad__output-mode mono">
          {OUTPUT_LABEL[settings.outputMode]}
        </span>
        <span className="dotpad__vib-level mono">振 {vibLabel}</span>
      </div>

      {/* ── 60×40 Tactile Grid Canvas ── */}
      <div className="dotpad__canvas-wrap" aria-hidden="true">
        <canvas ref={canvasRef} className="dotpad__canvas" />
        {deviceStatus === 'offline' && (
          <div className="dotpad__offline-badge">연결 없음</div>
        )}
        {deviceStatus === 'delayed' && (
          <div className="dotpad__delay-badge">지연 {latLabel}</div>
        )}
      </div>

      {/* ── 20-cell Braille Strip ── */}
      <div
        className="dotpad__brl-strip"
        aria-hidden="true"
        title={`점자 출력: ${raw}`}
      >
        <div className="dotpad__brl">
          {window20.map((b, i) => (
            <span
              key={i}
              className={[
                'dotpad__cell',
                i === 0 && markerOn ? 'is-marker' : '',
                b === 0 ? 'is-empty' : '',
              ].filter(Boolean).join(' ')}
              data-byte={b}
            >
              {byteToBrailleChar(b)}
            </span>
          ))}
        </div>
        {/* 셀 인덱스 눈금 */}
        <div className="dotpad__cell-ruler" aria-hidden="true">
          {Array.from({ length: CELLS }, (_, i) =>
            (i % 5 === 0) ? <span key={i}>{safePan + i + 1}</span> : <span key={i} />
          )}
        </div>
      </div>

      {/* ── 원문 + 패닝 위치 ── */}
      <div className="dotpad__raw">
        <span className="dotpad__raw-text">{raw || '\u00a0'}</span>
        {maxPan > 0 && (
          <span className="dotpad__pan-pos mono">
            {safePan + 1}–{Math.min(safePan + CELLS, bytes.length)}/{bytes.length}
          </span>
        )}
      </div>

      {/* ── 점자 출력 정책 인디케이터 ── */}
      <div className="dotpad__policy" aria-hidden="true">
        <span className={`dotpad__policy-dot ${settings.outputMode === 'braille' || settings.outputMode === 'hybrid' ? 'is-on' : ''}`}>⠿ 점자</span>
        <span className="dotpad__policy-sep">·</span>
        <span className={`dotpad__policy-dot ${settings.outputMode === 'graphic' || settings.outputMode === 'hybrid' ? 'is-on' : ''}`}>◻ 그래픽</span>
        <span className="dotpad__policy-sep">·</span>
        <span className={`dotpad__policy-dot ${sensoryScale < 1 ? 'is-warn' : ''}`}>
          {settings.sensoryMode === 'full' ? '感 일반' : settings.sensoryMode === 'reduced' ? '感 축소' : '感 최소'}
        </span>
      </div>

      {/* ── 하드웨어 키 버튼 ── */}
      {interactive && (
        <div className="dotpad__keys" role="group" aria-label="Dot Pad 하드웨어 키">
          <button
            type="button"
            className="btn btn--ghost dotpad__key dotpad__key--pan"
            onClick={() => doPan(-1)}
            onContextMenu={e => { e.preventDefault(); doPan(-1, true); }}
            aria-label="점자 이전 페이지 (쉼표 키 / 우클릭=처음으로)"
            title=", (우클릭=처음)"
          >◀</button>

          <button
            type="button"
            className="btn btn--ghost dotpad__key dotpad__key--f1"
            onClick={() => handleFKey(1)}
            aria-label="F1 — 출력 모드 전환"
            title="F1: 출력 모드 전환"
          >
            <span className="dotpad__key-fnum">F1</span>
            <span className="dotpad__key-label">모드</span>
          </button>

          <button
            type="button"
            className="btn btn--ghost dotpad__key dotpad__key--f2"
            onClick={() => handleFKey(2)}
            aria-label="F2 — 이전 큐 다시 재생"
            title="F2: 다시 재생"
          >
            <span className="dotpad__key-fnum">F2</span>
            <span className="dotpad__key-label">재생</span>
          </button>

          <button
            type="button"
            className="btn btn--ghost dotpad__key dotpad__key--f3"
            onClick={() => handleFKey(3)}
            aria-label="F3 — 촉각 강도 변경"
            title="F3: 강도 전환"
          >
            <span className="dotpad__key-fnum">F3</span>
            <span className="dotpad__key-label">강도 {vibLabel}</span>
          </button>

          <button
            type="button"
            className="btn btn--sos dotpad__key dotpad__key--f4"
            onClick={() => handleFKey(4)}
            aria-label="F4 — 도움말 / 긴급 스태프 호출"
            title="F4: 도움말 / SOS"
          >
            <span className="dotpad__key-fnum">F4</span>
            <span className="dotpad__key-label">도움</span>
          </button>

          <button
            type="button"
            className="btn btn--ghost dotpad__key dotpad__key--pan"
            onClick={() => doPan(1)}
            onContextMenu={e => { e.preventDefault(); doPan(1, true); }}
            aria-label="점자 다음 페이지 (마침표 키 / 우클릭=끝으로)"
            title=". (우클릭=끝)"
          >▶</button>

          <button
            type="button"
            className="btn btn--chip dotpad__key dotpad__key--hist"
            onClick={() => setHistOpen(v => !v)}
            aria-label="큐 히스토리"
            aria-expanded={histOpen}
            title="H: 히스토리"
          >🕐</button>
        </div>
      )}

      {/* ── 키보드 단축키 도움말 오버레이 ── */}
      {helpOpen && interactive && (
        <div
          className="dotpad__help"
          role="dialog"
          aria-modal="true"
          aria-label="Dot Pad 키보드 단축키 도움말"
        >
          <div className="dotpad__help-head">
            <strong>키보드 단축키</strong>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setHelpOpen(false)}
              aria-label="닫기"
            >✕</button>
          </div>
          <table className="dotpad__help-table">
            <thead>
              <tr><th>키</th><th>동작</th></tr>
            </thead>
            <tbody>
              {SHORTCUTS.map(s => (
                <tr key={s.key}>
                  <td><kbd className="kbd">{s.key}</kbd></td>
                  <td>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="caption dim">
            F4를 길게 누르거나 두 번 누르면 긴급 스태프가 호출됩니다.
          </p>
        </div>
      )}

      {/* ── 큐 히스토리 패널 ── */}
      {histOpen && interactive && (
        <div
          className="dotpad__hist"
          role="region"
          aria-label="큐 히스토리"
        >
          <div className="dotpad__hist-head">
            <strong>큐 히스토리</strong>
            <span className="caption dim">F2로 최신 큐 재생</span>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setHistOpen(false)}
              aria-label="닫기"
            >✕</button>
          </div>
          {history.length === 0 && (
            <p className="caption dim" style={{ padding: '10px' }}>수신된 큐가 없습니다.</p>
          )}
          <ul className="dotpad__hist-list">
            {history.map(item => (
              <li key={item.id} className="dotpad__hist-item">
                <span className="dotpad__hist-type mono">{item.type}</span>
                <span className="dotpad__hist-label">{item.label}</span>
                <span className="dotpad__hist-time mono dim">
                  {new Date(item.ts).toLocaleTimeString('ko-KR', { hour12: false })}
                </span>
                <button
                  type="button"
                  className="btn btn--chip"
                  onClick={() => {
                    slotRef.current = { raw: item.raw, until: Date.now() + 5000, priority: 3 };
                    if (item.gridHex) {
                      gridRef.current = hexToGrid(item.gridHex);
                      revealAtRef.current = performance.now();
                    }
                    setPan(0);
                    newLineMarker();
                    announce(`히스토리 재생 — ${item.label}`);
                    forceRender(n => n + 1);
                    setHistOpen(false);
                  }}
                  aria-label={`${item.label} 다시 재생`}
                >↺ 재생</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
