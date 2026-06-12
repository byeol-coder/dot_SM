// ── SMDemo.tsx — SM 파트너 발표 전용 화면 ───────────────────────
// 아티스트 선택 → 팀 컬러·엠블럼 전환
// 곡·파트 선택 → DotPad에 파트 텍스트 + 팀 엠블럼 동시 출력
// 레이아웃: 좌 컨트롤 / 우 DotPad 캔버스 (레퍼런스 구조 유지)

import { useCallback, useEffect, useRef, useState } from 'react';
import { ARTISTS, AESPA, RIIZE, getArtist, type Artist, type ArtistId, type SongPart } from '../data/artists';
import { SM_GRAPHIC_PRESETS, getSmPreset, getSmPresetsByArtist, type SmGraphicPreset } from '../data/sm-graphics';
import { COLS, ROWS, emptyGrid, type Grid } from '../frames';
import { toBrailleBytes, byteToBrailleChar } from '../braille';

const CELL = 11;
const BRAILLE_CELLS = 20;

// 멤버명 표시용 라벨
const MEMBER_LABEL: Record<string, string> = {
  ALL: 'ALL', UNIT: 'UNIT',
  Karina: 'Karina', Giselle: 'Giselle', Winter: 'Winter', Ningning: 'Ningning',
  Shotaro: 'Shotaro', Sungchan: 'Sungchan', Eunseok: 'Eunseok',
  Seunghan: 'Seunghan', Wonbin: 'Wonbin', Sohee: 'Sohee', Anton: 'Anton',
};

export default function SMDemo() {
  // ── 아티스트 선택 ────────────────────────────────────────────
  const [artistId, setArtistId]     = useState<ArtistId>('aespa');
  const artist: Artist               = getArtist(artistId);

  // ── 곡·파트 선택 ────────────────────────────────────────────
  const [songIdx, setSongIdx]        = useState(0);
  const [activePart, setActivePart]  = useState<SongPart | null>(null);
  const song = artist.songs[songIdx] ?? artist.songs[0];

  // ── 엠블럼 ──────────────────────────────────────────────────
  const [activeEmblem, setActiveEmblem] = useState<SmGraphicPreset>(
    getSmPresetsByArtist('aespa')[0]
  );
  const [pinColor, setPinColor]     = useState(AESPA.pinColor);

  // ── DotPad 상태 ─────────────────────────────────────────────
  const [narrative, setNarrative]   = useState('');
  const [statusLabel, setStatusLabel] = useState('STANDBY MODE');
  const [brailleText, setBrailleText] = useState('');
  const [pan, setPan]               = useState(0);

  // ── Canvas refs ──────────────────────────────────────────────
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gridRef     = useRef<Grid>(emptyGrid());
  const revealAtRef = useRef(0);
  const colorRef    = useRef(pinColor);
  colorRef.current  = pinColor;

  // ── 아티스트 전환 ────────────────────────────────────────────
  const switchArtist = useCallback((id: ArtistId) => {
    const a = getArtist(id);
    setArtistId(id);
    setSongIdx(0);
    setActivePart(null);
    setBrailleText('');
    setPan(0);
    const presets = getSmPresetsByArtist(id);
    setActiveEmblem(presets[0]);
    setPinColor(a.pinColor);
    gridRef.current  = presets[0].generate();
    revealAtRef.current = performance.now();
    setNarrative(presets[0].narrative);
    setStatusLabel(`${a.name} MODE`);
  }, []);

  // 초기 그래픽 로드
  useEffect(() => {
    const preset = getSmPresetsByArtist('aespa')[0];
    gridRef.current = preset.generate();
    revealAtRef.current = performance.now();
    setNarrative(preset.narrative);
  }, []);

  // ── 엠블럼 활성화 ────────────────────────────────────────────
  const activateEmblem = useCallback((preset: SmGraphicPreset) => {
    setActiveEmblem(preset);
    setPinColor(preset.color);
    gridRef.current = preset.generate();
    revealAtRef.current = performance.now();
    setNarrative(preset.narrative);
    setStatusLabel('EMBLEM ACTIVE');
  }, []);

  // ── 파트 선택 → DotPad 출력 ──────────────────────────────────
  const selectPart = useCallback((part: SongPart) => {
    setActivePart(part);
    // 점자 텍스트 업데이트
    const text = part.tactileNote;
    setBrailleText(text);
    setPan(0);
    // 해당 멤버의 팀 엠블럼 중 첫 번째로 전환
    const songEmblems = song.emblems;
    const matchedPreset = songEmblems
      .map(id => getSmPreset(id))
      .find(p => p !== undefined);
    if (matchedPreset) activateEmblem(matchedPreset);
    setNarrative(`${part.member} — ${part.section} / ${part.note}`);
    setStatusLabel('PART ACTIVE');
  }, [song, activateEmblem]);

  // ── 점자 계산 ────────────────────────────────────────────────
  const brailleBytes = toBrailleBytes(brailleText);
  const maxPan       = Math.max(0, brailleBytes.length - BRAILLE_CELLS);
  const safePan      = Math.min(pan, maxPan);
  const cells20      = Array.from({ length: BRAILLE_CELLS }, (_, i) => brailleBytes[safePan + i] ?? 0);

  // ── rAF 렌더 ─────────────────────────────────────────────────
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

      ctx.fillStyle = '#0d0f14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const g         = gridRef.current;
      const revealMs  = t - revealAtRef.current;
      const revealCols = revealMs < 700 ? Math.floor((revealMs / 700) * COLS) : COLS;
      const col       = colorRef.current;
      const r         = CELL * 0.38;

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const up  = x < revealCols && g[y * COLS + x] === 1;
          const cx2 = x * CELL + CELL / 2;
          const cy2 = y * CELL + CELL / 2;

          ctx.beginPath();
          ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
          if (up) {
            const grd = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r * 2.8);
            grd.addColorStop(0, '#ffffff');
            grd.addColorStop(0.2, col);
            grd.addColorStop(0.5, col);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
          } else {
            ctx.fillStyle = '#1a1f2e';
          }
          ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const emblems = getSmPresetsByArtist(artistId);
  const memberColor = (m: string) => artist.memberColors[m] ?? '#9aa4b5';

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="sm-root" style={{ '--artist-color': artist.color, '--artist-accent': artist.accentColor } as React.CSSProperties}>

      {/* ══ 좌 패널 ══════════════════════════════════════════════ */}
      <aside className="sm-left">

        {/* 아티스트 선택 */}
        <div className="sm-artist-switcher">
          {ARTISTS.map(a => (
            <button key={a.id} type="button"
              className={`sm-artist-btn ${artistId === a.id ? 'is-active' : ''}`}
              style={{ '--btn-color': a.color } as React.CSSProperties}
              onClick={() => switchArtist(a.id as ArtistId)}>
              <span className="sm-artist-btn__name">{a.name}</span>
              <span className="sm-artist-btn__ko">{a.nameKo}</span>
            </button>
          ))}
        </div>

        {/* 팀 태그라인 */}
        <p className="sm-tagline">{artist.tagline}</p>

        {/* 곡 선택 탭 */}
        <div className="sm-song-tabs" role="tablist" aria-label="곡 선택">
          {artist.songs.map((s, i) => (
            <button key={s.id} type="button" role="tab"
              aria-selected={songIdx === i}
              className={`sm-song-tab ${songIdx === i ? 'is-active' : ''}`}
              onClick={() => { setSongIdx(i); setActivePart(null); setBrailleText(''); }}>
              {s.title}
              <span className="sm-song-tab__year">{s.year}</span>
            </button>
          ))}
        </div>

        {/* 곡 컨셉 */}
        <p className="sm-concept">{song.concept}</p>

        {/* 파트 리스트 — 핵심 UI */}
        <div className="sm-parts-header">
          <span className="sm-section-label">SONG STRUCTURE</span>
          <span className="sm-section-sub dim">파트 선택 → Dot Pad 즉시 출력</span>
        </div>
        <ol className="sm-parts">
          {song.parts.map(part => (
            <li key={part.id}>
              <button type="button"
                className={`sm-part-btn ${activePart?.id === part.id ? 'is-active' : ''}`}
                style={{ '--member-color': memberColor(part.member) } as React.CSSProperties}
                onClick={() => selectPart(part)}>
                <span className="sm-part-member"
                  style={{ background: memberColor(part.member) }}>
                  {MEMBER_LABEL[part.member] ?? part.member}
                </span>
                <span className="sm-part-section">{part.section}</span>
                <span className="sm-part-note">{part.note}</span>
                {activePart?.id === part.id && (
                  <span className="sm-part-active-badge" aria-hidden="true">⠿ 출력 중</span>
                )}
              </button>
            </li>
          ))}
        </ol>

        {/* 엠블럼 퀵 셀렉터 */}
        <div className="sm-emblem-header">
          <span className="sm-section-label">TACTILE EMBLEMS</span>
        </div>
        <div className="sm-emblems">
          {emblems.map(e => (
            <button key={e.id} type="button"
              className={`sm-emblem-btn ${activeEmblem.id === e.id ? 'is-active' : ''}`}
              style={{ '--emblem-color': e.color } as React.CSSProperties}
              onClick={() => activateEmblem(e)}>
              {e.label}
            </button>
          ))}
        </div>

      </aside>

      {/* ══ 우 패널 — DotPad 캔버스 ══════════════════════════════ */}
      <main className="sm-right">

        {/* 캔버스 헤더 */}
        <div className="sm-canvas-header">
          <span className="sm-canvas-title">
            LAYER A: DOT PAD TACTILE MONITOR (60×40 PINS)
          </span>
          <span className="sm-canvas-status" style={{ color: artist.color }}>
            {statusLabel}
          </span>
        </div>

        {/* 메인 캔버스 */}
        <div className="sm-canvas-wrap">
          <canvas ref={canvasRef} className="sm-canvas"
            aria-label={`Dot Pad — ${activeEmblem.label} 출력 중`} />
        </div>

        {/* 20-cell 점자 바 */}
        <div className="sm-braille-wrap">
          <div className="sm-braille-header">
            <span className="sm-section-label">BRAILLE OUTPUT</span>
            <div className="sm-braille-pan">
              <button type="button" className="sm-pan-btn"
                onClick={() => setPan(p => Math.max(0, p - 18))}
                aria-label="이전">◀</button>
              <span className="sm-pan-pos dim mono">
                {brailleText
                  ? `${safePan + 1}–${Math.min(safePan + BRAILLE_CELLS, brailleBytes.length)} / ${brailleBytes.length}`
                  : '—'}
              </span>
              <button type="button" className="sm-pan-btn"
                onClick={() => setPan(p => Math.min(maxPan, p + 18))}
                aria-label="다음">▶</button>
            </div>
          </div>
          <div className="sm-braille-cells" aria-label={`점자 출력: ${brailleText || '없음'}`}>
            {cells20.map((b, i) => (
              <span key={i} className={`sm-braille-cell ${b === 0 ? 'is-empty' : ''}`}>
                {byteToBrailleChar(b)}
              </span>
            ))}
          </div>
          <p className="sm-braille-raw dim">{brailleText || '\u00a0'}</p>
        </div>

        {/* 텍스트 피드 */}
        <div className="sm-narrative-header">
          REAL-TIME TACTILE NARRATIVE <span className="dim">(대체 텍스트 해설 피드)</span>
        </div>
        <div className="sm-narrative" role="status" aria-live="polite">
          {narrative || (
            <span className="dim">파트를 선택하거나 엠블럼을 탭하면 해설이 표시됩니다.</span>
          )}
        </div>

        {/* 활성 파트 상세 */}
        {activePart && (
          <div className="sm-part-detail"
            style={{ borderColor: memberColor(activePart.member) }}>
            <span className="sm-part-detail__member"
              style={{ color: memberColor(activePart.member) }}>
              {MEMBER_LABEL[activePart.member]}
            </span>
            <span className="sm-part-detail__section">— {activePart.section}</span>
            <span className="sm-part-detail__note">{activePart.note}</span>
          </div>
        )}

      </main>
    </div>
  );
}
