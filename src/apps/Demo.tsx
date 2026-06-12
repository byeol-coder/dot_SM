// ── Demo.tsx — 발표 전용 단일 화면 ─────────────────────────────
// 레이아웃: 좌(컨트롤) / 우(DotPad 캔버스 + 텍스트 피드)
// 탭: 프리뷰 아카이브 / 라이브 제어단 / 시스템 관제
// 레퍼런스: Hearts2Hearts × Dot Pad 발표 스크린샷 구조

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emit, subscribe } from '../bus';
import { GRAPHIC_PRESETS, getPreset, type GraphicPreset } from '../data/graphics';
import { SETLIST, getSong } from '../data/setlist';
import { PlaybackEngine } from '../engine';
import { formationHex } from '../frames';
import { COLS, ROWS, emptyGrid, hexToGrid, type Grid } from '../frames';
import { useBeep } from '../settings';
import type { TTKEvent } from '../types';

type Tab = 'preview' | 'live' | 'system';

// 핀 셀 픽셀 크기 — 캔버스 꽉 채움
const CELL = 11;

// 멤버별 컬러
const MEMBER_COLOR: Record<string, string> = {
  '미르': '#ff2d78', '라온': '#4dd7ff', '누리': '#ffd400', '가람': '#ff6b35', 'ALL': '#9aa4b5',
};

export default function Demo() {
  const beep = useBeep();
  const [tab, setTab] = useState<Tab>('preview');

  // ── 그래픽 상태 ─────────────────────────────────────────────
  const [activePresetId, setActivePresetId] = useState<string>('heart');
  const [pinColor, setPinColor] = useState('#ff2d78');
  const [narrative, setNarrative] = useState(GRAPHIC_PRESETS[0].narrative);
  const [statusLabel, setStatusLabel] = useState('STANDBY MODE');
  const [statusColor, setStatusColor] = useState('#9aa4b5');

  const gridRef    = useRef<Grid>(emptyGrid());
  const revealAtRef = useRef(0);
  const fxAtRef    = useRef(0);
  const beatRef    = useRef({ on: false, bpm: 120 });
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // ── 라이브 큐 상태 ─────────────────────────────────────────
  const [songId, setSongId] = useState(SETLIST[0].id);
  const [lyricText, setLyricText] = useState('');
  const [lyricMember, setLyricMember] = useState('');
  const [engineState, setEngineState] = useState({ playing: false, elapsedMs: 0, durationMs: 0 });
  const engine = useMemo(() => new PlaybackEngine(s => setEngineState(s)), []);
  useEffect(() => () => engine.stop(false), [engine]);

  // ── 버스 구독 ───────────────────────────────────────────────
  useEffect(() => {
    const off = subscribe((e: TTKEvent) => {
      switch (e.type) {
        case 'FORMATION':
          gridRef.current = hexToGrid(e.grid);
          revealAtRef.current = performance.now();
          setPinColor('#ff6b35');
          setNarrative(`대형 변환 — ${e.name}. ${e.text}`);
          setStatusLabel('FORMATION ACTIVE');
          setStatusColor('#ff6b35');
          break;
        case 'LYRIC':
          setLyricText(e.text);
          setLyricMember(e.member);
          setNarrative(`[${e.member}] ${e.text}`);
          break;
        case 'HIGHLIGHT':
        case 'GESTURE':
          setNarrative(`${e.emoji}  ${e.text}`);
          setStatusLabel('PERFORMANCE CUE');
          setStatusColor('#ffd400');
          break;
        case 'BEAT':
          beatRef.current = { on: e.on, bpm: e.bpm };
          break;
        case 'FX_COUNTDOWN':
          fxAtRef.current = performance.now();
          setNarrative(`⚡ ${e.fx === 'firework' ? '폭죽' : '불기둥'} — 3초 카운트다운 시작`);
          setStatusLabel('FX COUNTDOWN');
          setStatusColor('#ffd400');
          break;
        case 'SHOW_START':
          setStatusLabel('LIVE');
          setStatusColor('#ff2d78');
          break;
        case 'SHOW_END':
          setStatusLabel('STANDBY MODE');
          setStatusColor('#9aa4b5');
          break;
        case 'SONG_CHANGE':
          setLyricText('');
          setSongId(e.songId);
          break;
      }
    });
    return off;
  }, []);

  // ── 프리셋 활성화 ──────────────────────────────────────────
  const activatePreset = useCallback((preset: GraphicPreset) => {
    gridRef.current = preset.generate();
    revealAtRef.current = performance.now();
    setPinColor(preset.color);
    setNarrative(preset.narrative);
    setActivePresetId(preset.id);
    setStatusLabel('PREVIEW MODE');
    setStatusColor('#4dd7ff');
    beep(660, 60);
  }, [beep]);

  // ── rAF 캔버스 렌더 ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;

    let raf = 0, last = 0;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 33) return;
      last = t;

      // 배경
      ctx.fillStyle = '#0d0f14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 그리드 점 배경 (다운 핀)
      const g = gridRef.current;
      const revealMs  = t - revealAtRef.current;
      const revealCols = revealMs < 600
        ? Math.floor((revealMs / 600) * COLS) : COLS;

      // BEAT 펄스
      const beat   = beatRef.current;
      const period = 60_000 / Math.max(beat.bpm, 1);
      const beatUp = beat.on && (t % period < period * 0.45);
      const bSize  = 6;
      const bx0    = Math.floor(COLS / 2 - bSize / 2);
      const by0    = Math.floor(ROWS / 2 - bSize / 2);

      // FX 테두리 (3초)
      const fxEl   = t - fxAtRef.current;
      const fxEdge = fxEl < 1000 ? 'all' : fxEl < 2000 ? 'lr' : fxEl < 3000 ? 'top' : fxEl < 3400 ? 'flash' : null;

      const r = CELL * 0.38;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const up = x < revealCols && g[y * COLS + x] === 1;
          const cx2 = x * CELL + CELL / 2;
          const cy2 = y * CELL + CELL / 2;

          // FX 테두리
          const isEdge =
            fxEdge === 'flash' ? true :
            fxEdge === 'all'   ? (x===0||x===COLS-1||y===0||y===ROWS-1) :
            fxEdge === 'lr'    ? (x===0||x===COLS-1) :
            fxEdge === 'top'   ? (y===0) : false;

          // BEAT 중앙 펄스
          const isBeat = beatUp && x >= bx0 && x < bx0 + bSize && y >= by0 && y < by0 + bSize;

          let fillColor: string;
          if (isEdge) {
            fillColor = '#ffd400';
          } else if (isBeat) {
            fillColor = '#ff2d78';
          } else if (up) {
            // 활성 핀 — 글로우 + 색상
            fillColor = pinColor;
          } else {
            fillColor = '#1e2332';
          }

          ctx.beginPath();
          ctx.arc(cx2, cy2, r, 0, Math.PI * 2);

          if (up && !isEdge) {
            // 글로우 효과
            const grd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r * 2.5);
            grd.addColorStop(0, fillColor);
            grd.addColorStop(0.4, fillColor);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
          } else {
            ctx.fillStyle = fillColor;
          }
          ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [pinColor]);

  const song = getSong(songId)!;
  const progress = engineState.durationMs ? (engineState.elapsedMs / engineState.durationMs) * 100 : 0;

  // ── 탭 콘텐츠 ──────────────────────────────────────────────
  const renderTabContent = () => {
    if (tab === 'preview') return (
      <div className="demo-tab-content">
        {/* 현재 선택 그래픽 */}
        <div className="demo-now-playing">
          <div className="demo-now-playing__label">
            {getPreset(activePresetId)?.labelEn ?? '—'}
          </div>
          <div className="demo-now-playing__controls">
            <button className="demo-nav-btn" type="button"
              onClick={() => {
                const idx = GRAPHIC_PRESETS.findIndex(p => p.id === activePresetId);
                activatePreset(GRAPHIC_PRESETS[(idx - 1 + GRAPHIC_PRESETS.length) % GRAPHIC_PRESETS.length]);
              }} aria-label="이전">◀</button>
            <button className="demo-play-btn" type="button"
              onClick={() => activatePreset(getPreset(activePresetId)!)}>
              ♩ AI 촉각 자동 재생 가동
            </button>
            <button className="demo-nav-btn" type="button"
              onClick={() => {
                const idx = GRAPHIC_PRESETS.findIndex(p => p.id === activePresetId);
                activatePreset(GRAPHIC_PRESETS[(idx + 1) % GRAPHIC_PRESETS.length]);
              }} aria-label="다음">▶</button>
          </div>
        </div>

        {/* 그래픽 프리셋 그리드 */}
        <div className="demo-presets">
          {GRAPHIC_PRESETS.map(p => (
            <button key={p.id} type="button"
              className={`demo-preset-btn ${activePresetId === p.id ? 'is-active' : ''}`}
              style={{ '--accent': p.color } as React.CSSProperties}
              onClick={() => activatePreset(p)}>
              <span className="demo-preset-btn__en">{p.labelEn}</span>
              <span className="demo-preset-btn__kr">{p.label}</span>
            </button>
          ))}
        </div>

        {/* 퀵 액션 */}
        <div className="demo-quick">
          <button type="button" className="demo-quick-btn"
            onClick={() => { activatePreset(getPreset('wordmark')!); }}>
            DOT 공식 워드마크 활성화
          </button>
          <button type="button" className="demo-quick-btn demo-quick-btn--accent"
            onClick={() => { activatePreset(getPreset('double-heart')!); }}>
            💗 더블 하트 엠블럼 활성화
          </button>
        </div>
      </div>
    );

    if (tab === 'live') return (
      <div className="demo-tab-content">
        {/* 곡 선택 */}
        <select className="demo-select" value={songId}
          onChange={e => { engine.stop(false); setSongId(e.target.value); }}
          aria-label="곡 선택">
          {SETLIST.map(s => (
            <option key={s.id} value={s.id}>
              {s.no}. {s.titleEn} — {s.title} [{s.bpm}BPM]
            </option>
          ))}
        </select>

        {/* 현재 가사 (라이브 시) */}
        <div className="demo-lyric-box">
          {lyricText ? (
            <>
              <span className="demo-lyric-member"
                style={{ color: MEMBER_COLOR[lyricMember] ?? '#9aa4b5' }}>
                {lyricMember}
              </span>
              <span className="demo-lyric-text">{lyricText}</span>
            </>
          ) : (
            <span className="demo-lyric-idle">재생 시작 후 가사가 여기 표시됩니다</span>
          )}
        </div>

        {/* AUTO 재생 */}
        <button type="button"
          className={`demo-play-btn ${engineState.playing ? 'is-playing' : ''}`}
          onClick={() => {
            if (engineState.playing) { engine.stop(); }
            else {
              emit({ type: 'SHOW_START', ts: Date.now() });
              engine.play(song);
            }
          }}>
          {engineState.playing ? '■ AUTO 정지' : '♩ AI 촉각 자동 재생 가동'}
        </button>

        {engineState.playing && (
          <div className="demo-progress-wrap" role="progressbar"
            aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="demo-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* 수동 큐 */}
        <div className="demo-manual-cues">
          <p className="demo-section-label">즉시 발사</p>
          <div className="demo-quick">
            {song.timeline.filter(c => c.kind === 'FORMATION').map((c, i) => (
              c.kind === 'FORMATION' && (
                <button key={i} type="button" className="demo-quick-btn"
                  onClick={() => {
                    emit({ type: 'FORMATION', ts: Date.now(), name: c.name, text: c.text, grid: formationHex(c.gridKey) });
                  }}>
                  ◇ {c.name}
                </button>
              )
            ))}
            <button type="button" className="demo-quick-btn demo-quick-btn--fx"
              onClick={() => emit({ type: 'FX_COUNTDOWN', ts: Date.now(), fx: 'firework', seconds: 3 })}>
              🎆 폭죽 3초
            </button>
            <button type="button" className="demo-quick-btn demo-quick-btn--fx"
              onClick={() => emit({ type: 'FX_COUNTDOWN', ts: Date.now(), fx: 'flame', seconds: 3 })}>
              🔥 불기둥 3초
            </button>
            <button type="button" className={`demo-quick-btn ${beatRef.current.on ? 'is-beat' : ''}`}
              onClick={() => emit({ type: 'BEAT', ts: Date.now(), on: !beatRef.current.on, bpm: song.bpm })}>
              ♪ BEAT {beatRef.current.on ? 'OFF' : 'ON'}
            </button>
          </div>
        </div>
      </div>
    );

    // system 탭
    return (
      <div className="demo-tab-content">
        <div className="demo-system-row">
          <span className="demo-system-label">BLE STATUS</span>
          <span className="demo-system-value" style={{ color: '#41d98d' }}>● CONNECTED (SIM)</span>
        </div>
        <div className="demo-system-row">
          <span className="demo-system-label">DEVICE</span>
          <span className="demo-system-value">Dot Pad 320 · 60×40 · 2400 PINS</span>
        </div>
        <div className="demo-system-row">
          <span className="demo-system-label">LATENCY</span>
          <span className="demo-system-value" style={{ color: '#4dd7ff' }}>8ms</span>
        </div>
        <div className="demo-system-row">
          <span className="demo-system-label">RENDER</span>
          <span className="demo-system-value">30fps rAF · 7 layers</span>
        </div>
        <div className="demo-system-row">
          <span className="demo-system-label">BRAILLE</span>
          <span className="demo-system-value">20-cell strip · KO approx.</span>
        </div>
        <div className="demo-system-row">
          <span className="demo-system-label">GRAPHICS</span>
          <span className="demo-system-value">{GRAPHIC_PRESETS.length} presets loaded</span>
        </div>
        <div className="demo-system-row">
          <span className="demo-system-label">BUS</span>
          <span className="demo-system-value">BroadcastChannel 'ttk-bus'</span>
        </div>
        <div className="demo-system-divider" />
        <button type="button" className="demo-quick-btn"
          onClick={() => { gridRef.current = emptyGrid(); revealAtRef.current = 0; setNarrative(''); setStatusLabel('STANDBY MODE'); setStatusColor('#9aa4b5'); }}>
          캔버스 초기화
        </button>
      </div>
    );
  };

  return (
    <div className="demo-root">

      {/* ── 좌: 컨트롤 패널 ── */}
      <aside className="demo-left">
        {/* 탭 */}
        <nav className="demo-tabs" role="tablist" aria-label="메뉴">
          {([
            { id: 'preview', label: '♩ 프리뷰 아카이브' },
            { id: 'live',    label: '▶ 라이브 제어단' },
            { id: 'system',  label: '⊞ 시스템 관제' },
          ] as const).map(t => (
            <button key={t.id} type="button" role="tab"
              aria-selected={tab === t.id}
              className={`demo-tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* 곡/그래픽 타이틀 바 */}
        <div className="demo-title-bar">
          {tab === 'live'
            ? `${song.no}. ${song.titleEn} ——  ${song.title} [AI 동선 가이드]`
            : `${getPreset(activePresetId)?.labelEn ?? '—'} —— ${getPreset(activePresetId)?.label ?? ''} [AI 촉각 가이드]`}
        </div>

        {/* 탭 콘텐츠 */}
        {renderTabContent()}
      </aside>

      {/* ── 우: DotPad 캔버스 패널 ── */}
      <main className="demo-right">
        {/* 캔버스 헤더 */}
        <div className="demo-canvas-header">
          <span className="demo-canvas-title">
            LAYER A: DOT PAD TACTILE MONITOR (60×40 PINS)
          </span>
          <span className="demo-canvas-status" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* 60×40 메인 캔버스 */}
        <div className="demo-canvas-wrap">
          <canvas ref={canvasRef} className="demo-canvas" aria-label="Dot Pad 60×40 촉각 그래픽 디스플레이" />
        </div>

        {/* 텍스트 피드 */}
        <div className="demo-narrative-header">
          REAL-TIME TACTILE NARRATIVE <span className="dim">(대체 텍스트 해설 피드)</span>
        </div>
        <div className="demo-narrative" role="status" aria-live="polite">
          {narrative || <span className="dim">대기 중 — 그래픽을 선택하거나 라이브 재생을 시작하세요.</span>}
        </div>
      </main>
    </div>
  );
}
