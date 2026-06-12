// ── Operator.tsx — 운영자 콘솔 (B0~B4) ─────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emit, resetShow, subscribe } from '../bus';
import DotPadSim from '../components/DotPadSim';
import { useToast } from '../components/ui';
import { GROUP_NAME, SETLIST, TOUR_NAME, getSong } from '../data/setlist';
import { PlaybackEngine, cueToEvent, type EngineState } from '../engine';
import { formationHex } from '../frames';
import type { FormationKey, TTKEvent } from '../types';

interface LogRow {
  id: number;
  time: string;
  type: string;
  summary: string;
  rehearsal: boolean;
}

const HIGHLIGHTS = [
  { emoji: '🔥', text: '대규모 칼군무 — 함성 포인트!' },
  { emoji: '🌊', text: '응원봉 파도 — 객석 전체가 출렁입니다' },
  { emoji: '🎤', text: '떼창 구간 — 마이크가 객석을 향합니다' },
];
const GESTURES = [
  { emoji: '😉', text: '카메라를 향한 윙크' },
  { emoji: '🫰', text: '객석을 향해 손하트' },
  { emoji: '😂', text: '멤버 간 안무 장난' },
];
const FORMATIONS: { key: FormationKey; name: string; text: string }[] = [
  { key: 'V', name: 'V자 대형', text: '센터 전진, V자 대형 전개' },
  { key: 'LINE', name: '일렬 대형', text: '무대 앞 일렬 정렬' },
  { key: 'CIRCLE', name: '원형 대형', text: '전 멤버 원형 러닝' },
  { key: 'CENTER', name: '솔로 센터', text: '솔로 센터, 후방 라인 대기' },
];
const FXS = [
  { fx: 'firework' as const, label: '🎆 폭죽' },
  { fx: 'flame' as const, label: '🔥 불기둥' },
];

type MenuKind = 'h' | 'g' | 'f' | 'x' | null;

export default function Operator({ embedded = false }: { embedded?: boolean }) {
  const { push: toast, node: toastNode } = useToast();
  const [rehearsal, setRehearsal] = useState(true);
  const [live, setLive] = useState(false);
  const [songId, setSongId] = useState(SETLIST[0].id);
  const [cursor, setCursor] = useState(0);
  const [beatOn, setBeatOn] = useState(false);
  const [menu, setMenu] = useState<MenuKind>(null);
  const [log, setLog] = useState<LogRow[]>([]);
  const [sosAlert, setSosAlert] = useState<string | null>(null);
  const [lastEvt, setLastEvt] = useState<{ type: string; time: string } | null>(null);
  const [monitor, setMonitor] = useState<{ lyric: string; feed: string[] }>({ lyric: '—', feed: [] });
  const [engineState, setEngineState] = useState<EngineState>({
    playing: false,
    songId: null,
    elapsedMs: 0,
    durationMs: 0,
  });

  const logId = useRef(0);
  const rehearsalRef = useRef(rehearsal);
  rehearsalRef.current = rehearsal;
  const song = getSong(songId)!;

  const engine = useMemo(() => new PlaybackEngine(setEngineState), []);
  useEffect(() => () => engine.stop(false), [engine]);

  // ── 버스 수신 → 로그/모니터 ──
  useEffect(() => {
    const off = subscribe((e: TTKEvent) => {
      const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour12: false });
      setLastEvt({ type: e.type, time });
      setLog((prev) =>
        [
          {
            id: ++logId.current,
            time,
            type: e.type,
            summary: summarize(e),
            rehearsal: rehearsalRef.current,
          },
          ...prev,
        ].slice(0, 200),
      );
      if (e.type === 'LYRIC') setMonitor((m) => ({ ...m, lyric: `[${e.member}] ${e.text}` }));
      if (e.type === 'HIGHLIGHT' || e.type === 'GESTURE' || e.type === 'FORMATION') {
        const t = e.type === 'FORMATION' ? `◇ ${e.name}` : `${e.emoji} ${e.text}`;
        setMonitor((m) => ({ ...m, feed: [t, ...m.feed].slice(0, 3) }));
      }
      if (e.type === 'SOS') {
        setSosAlert(`좌석 ${e.seat} — 스태프 호출 요청`);
        setTimeout(() => setSosAlert(null), 10000);
      }
      if (e.type === 'SONG_CHANGE') {
        setSongId(e.songId);
        setCursor(0);
      }
      if (e.type === 'BEAT') setBeatOn(e.on);
    });
    return off;
  }, []);

  // ── 발사 함수들 ──
  const fireLyric = useCallback(
    (idx: number) => {
      const line = song.lyrics[idx];
      if (!line) return;
      emit({
        type: 'LYRIC',
        ts: Date.now(),
        songId: song.id,
        lineIdx: idx,
        member: line.member,
        memberInitial: line.memberInitial,
        text: line.text,
      });
      setCursor(Math.min(idx + 1, song.lyrics.length - 1));
    },
    [song],
  );

  const fireHighlight = (p: (typeof HIGHLIGHTS)[number]) =>
    emit({ type: 'HIGHLIGHT', ts: Date.now(), emoji: p.emoji, text: p.text });
  const fireGesture = (p: (typeof GESTURES)[number]) =>
    emit({ type: 'GESTURE', ts: Date.now(), emoji: p.emoji, text: p.text });
  const fireFormation = (p: (typeof FORMATIONS)[number]) =>
    emit({ type: 'FORMATION', ts: Date.now(), name: p.name, text: p.text, grid: formationHex(p.key) });
  const fireFx = (fx: 'firework' | 'flame') =>
    emit({ type: 'FX_COUNTDOWN', ts: Date.now(), fx, seconds: 3 });
  const toggleBeat = useCallback(() => {
    emit({ type: 'BEAT', ts: Date.now(), on: !beatOn, bpm: song.bpm });
  }, [beatOn, song.bpm]);

  const selectSong = useCallback(
    (id: string) => {
      engine.stop(false);
      emit({ type: 'SONG_CHANGE', ts: Date.now(), songId: id });
    },
    [engine],
  );

  const startShow = useCallback(() => {
    resetShow();
    emit({ type: 'SHOW_START', ts: Date.now() });
    emit({ type: 'SONG_CHANGE', ts: Date.now(), songId: SETLIST[0].id });
    setLive(true);
    toast('SHOW START — 전 관객 LIVE 뷰 전환', 'success');
  }, [toast]);

  const endShow = useCallback(() => {
    engine.stop(false);
    if (beatOn) emit({ type: 'BEAT', ts: Date.now(), on: false, bpm: song.bpm });
    emit({ type: 'SHOW_END', ts: Date.now() });
    setLive(false);
    toast('SHOW END — 큐시트 생성 완료', 'success');
  }, [engine, beatOn, song.bpm, toast]);

  const autoPlay = useCallback(() => {
    if (engine.playing) {
      engine.stop();
      toast('자동 재생 정지');
    } else {
      engine.play(song);
      toast(`▶ AUTO — ${song.title} 타임라인 재생 (${Math.round(song.durationMs / 1000)}초)`);
    }
  }, [engine, song, toast]);

  // ── 키보드 단축키 ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        fireLyric(cursor);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(song.lyrics.length - 1, c + 1));
      } else if (e.key === '1') fireHighlight(HIGHLIGHTS[0]);
      else if (e.key === '2') fireGesture(GESTURES[0]);
      else if (e.key === '3') fireFormation(FORMATIONS[0]);
      else if (e.key === '4') fireFx('firework');
      else if (e.key === 'b' || e.key === 'B') toggleBeat();
      else if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cursor, song, fireLyric, toggleBeat]);

  // ── 자유 입력 ──
  const [free, setFree] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const sendFree = useCallback(() => {
    const t = free.trim();
    if (!t) return;
    emit({ type: 'NOTICE', ts: Date.now(), text: t });
    setRecent((r) => [t, ...r.filter((x) => x !== t)].slice(0, 5));
    setFree('');
  }, [free]);

  const exportLog = useCallback(() => {
    const data = { tour: TOUR_NAME, exportedAt: new Date().toISOString(), log: [...log].reverse() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ttk-cue-log.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [log]);

  const progress = engineState.durationMs
    ? Math.min(100, (engineState.elapsedMs / engineState.durationMs) * 100)
    : 0;

  return (
    <div className={`app operator ${embedded ? 'is-embedded' : ''}`} data-app="operator">
      {toastNode}
      {sosAlert && (
        <div className="sos-banner" role="alert">
          🆘 {sosAlert}
          <button type="button" className="btn btn--ghost" onClick={() => setSosAlert(null)}>
            확인
          </button>
        </div>
      )}

      <header className="op-header">
        <div>
          <span className="eyebrow">OPERATOR CONSOLE</span>
          <strong>
            {GROUP_NAME} · {TOUR_NAME}
          </strong>
        </div>
        <div className="row gap">
          <label className="op-rehearsal">
            <input type="checkbox" checked={rehearsal} onChange={(e) => setRehearsal(e.target.checked)} />
            리허설 모드
          </label>
          {!live ? (
            <button type="button" className="btn btn--primary" onClick={startShow}>
              ▶ SHOW START
            </button>
          ) : (
            <button type="button" className="btn btn--sos" onClick={endShow}>
              ■ SHOW END
            </button>
          )}
        </div>
      </header>
      {rehearsal && <div className="rehearsal-mark" aria-hidden="true">REHEARSAL</div>}

      <div className="op-grid">
        {/* ── 좌: 셋리스트 ── */}
        <aside className="op-col op-col--list" aria-label="셋리스트">
          <h2 className="eyebrow">SETLIST</h2>
          <ul className="op-songs">
            {SETLIST.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`op-song ${s.id === songId ? 'is-active' : ''}`}
                  onClick={() => selectSong(s.id)}
                  aria-current={s.id === songId}
                >
                  <span className="mono">{String(s.no).padStart(2, '0')}</span>
                  <span className="op-song__t">
                    <strong>{s.title}</strong>
                    <span className="dim caption">
                      {s.bpm} BPM · 큐 {s.timeline.length}개
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`btn ${engineState.playing ? 'btn--sos' : 'btn--secondary'} btn--block`}
            onClick={autoPlay}
          >
            {engineState.playing ? '■ AUTO 정지' : '▶ AUTO 타임라인 재생'}
          </button>
          {engineState.playing && (
            <div
              className="op-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="자동 재생 진행률"
            >
              <div className="op-progress__bar" style={{ width: `${progress}%` }} />
            </div>
          )}
          <p className="caption dim">
            AUTO: 곡 타임라인의 모든 큐(가사·중계·대형·FX·비트)를 시간축대로 자동 발사합니다 — 핸즈프리 시연용.
          </p>
        </aside>

        {/* ── 중: 큐 패드 ── */}
        <section className="op-col op-col--pad" aria-label="라이브 큐 패드">
          <h2 className="eyebrow">
            LYRIC SYNC — {song.title}{' '}
            <span className="dim">(Space=발사 · ↑↓=커서)</span>
          </h2>
          <ol className="op-lyrics">
            {song.lyrics.map((l, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`op-line ${i === cursor ? 'is-cursor' : ''}`}
                  onClick={() => fireLyric(i)}
                >
                  <span className="member-chip">{l.member}</span>
                  {l.text}
                  {i === cursor && <span className="op-line__hint mono">⏎ Space</span>}
                </button>
              </li>
            ))}
          </ol>

          <h2 className="eyebrow">QUICK CUES <span className="dim">(키=기본 프리셋 즉시 발사 · 클릭=선택)</span></h2>
          <div className="op-quick">
            <QuickBtn
              k="1"
              emoji="🔥"
              label="하이라이트"
              open={menu === 'h'}
              onOpen={() => setMenu(menu === 'h' ? null : 'h')}
              options={HIGHLIGHTS.map((p) => ({
                label: `${p.emoji} ${p.text}`,
                fire: () => fireHighlight(p),
              }))}
              onClose={() => setMenu(null)}
            />
            <QuickBtn
              k="2"
              emoji="😉"
              label="제스처"
              open={menu === 'g'}
              onOpen={() => setMenu(menu === 'g' ? null : 'g')}
              options={GESTURES.map((p) => ({ label: `${p.emoji} ${p.text}`, fire: () => fireGesture(p) }))}
              onClose={() => setMenu(null)}
            />
            <QuickBtn
              k="3"
              emoji="◇"
              label="대형"
              open={menu === 'f'}
              onOpen={() => setMenu(menu === 'f' ? null : 'f')}
              options={FORMATIONS.map((p) => ({ label: `◇ ${p.name}`, fire: () => fireFormation(p) }))}
              onClose={() => setMenu(null)}
            />
            <QuickBtn
              k="4"
              emoji="💥"
              label="FX 3초"
              open={menu === 'x'}
              onOpen={() => setMenu(menu === 'x' ? null : 'x')}
              options={FXS.map((p) => ({ label: `${p.label} — 3초 카운트다운`, fire: () => fireFx(p.fx) }))}
              onClose={() => setMenu(null)}
            />
            <button
              type="button"
              className={`op-quickbtn ${beatOn ? 'is-on' : ''}`}
              onClick={toggleBeat}
              aria-pressed={beatOn}
            >
              <span className="mono op-quickbtn__key">B</span>
              <span className="op-quickbtn__emoji" aria-hidden="true">
                ♪
              </span>
              <span>비트 {beatOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <h2 className="eyebrow">FREE TEXT — 돌발 공지</h2>
          <div className="row gap">
            <input
              className="input"
              value={free}
              onChange={(e) => setFree(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendFree()}
              placeholder="예: 잠시 후 멘트 시간입니다"
              aria-label="자유 입력 공지"
            />
            <button type="button" className="btn btn--secondary" onClick={sendFree}>
              전송
            </button>
          </div>
          {recent.length > 0 && (
            <div className="row gap wrap">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="btn btn--chip"
                  onClick={() => emit({ type: 'NOTICE', ts: Date.now(), text: r })}
                >
                  ↺ {r}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── 우: 모니터 + 로그 ── */}
        <aside className="op-col op-col--mon" aria-label="송출 모니터">
          <h2 className="eyebrow">SEND MONITOR</h2>
          <div className="op-mon">
            <p className="caption dim">관객 가사 뷰</p>
            <p className="op-mon__lyric">{monitor.lyric}</p>
            <p className="caption dim">중계 피드</p>
            {monitor.feed.length === 0 && <p className="caption dim">—</p>}
            {monitor.feed.map((f, i) => (
              <p key={i} className="caption">
                {f}
              </p>
            ))}
          </div>
          <DotPadSim size="mini" deviceStatus={live ? 'connected' : 'syncing'} latencyMs={live ? 8 : 0} phase={live ? 'live' : 'pre'} />
          <p className="caption dim mono">
            last: {lastEvt ? `${lastEvt.type} @ ${lastEvt.time}` : '—'} · latency ≈ 0ms (local bus)
          </p>

          <div className="row gap space-between">
            <h2 className="eyebrow">CUE LOG ({log.length})</h2>
            <button type="button" className="btn btn--chip" onClick={exportLog}>
              ⬇ JSON
            </button>
          </div>
          <div className="op-log" role="log" aria-live="off">
            {log.map((r) => (
              <div key={r.id} className="op-log__row">
                <span className="mono dim">{r.time}</span>
                <span className={`op-log__type t-${r.type}`}>{r.type}</span>
                <span className="op-log__sum">{r.summary}</span>
                {r.rehearsal && <span className="op-log__rh mono">R</span>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuickBtn({
  k,
  emoji,
  label,
  open,
  onOpen,
  onClose,
  options,
}: {
  k: string;
  emoji: string;
  label: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  options: { label: string; fire: () => void }[];
}) {
  return (
    <div className="op-quickwrap">
      <button type="button" className="op-quickbtn" onClick={onOpen} aria-expanded={open} aria-haspopup="menu">
        <span className="mono op-quickbtn__key">{k}</span>
        <span className="op-quickbtn__emoji" aria-hidden="true">
          {emoji}
        </span>
        <span>{label}</span>
      </button>
      {open && (
        <div className="op-menu" role="menu">
          {options.map((o, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className="op-menu__item"
              onClick={() => {
                o.fire();
                onClose();
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function summarize(e: TTKEvent): string {
  switch (e.type) {
    case 'LYRIC':
      return `[${e.member}] ${e.text}`;
    case 'HIGHLIGHT':
    case 'GESTURE':
      return `${e.emoji} ${e.text}`;
    case 'FORMATION':
      return `◇ ${e.name}`;
    case 'FX_COUNTDOWN':
      return e.fx === 'firework' ? '🎆 폭죽 3초 카운트다운' : '🔥 불기둥 3초 카운트다운';
    case 'BEAT':
      return e.on ? `♪ BEAT ON ${e.bpm}bpm` : '♪ BEAT OFF';
    case 'SONG_CHANGE':
      return getSong(e.songId)?.title ?? e.songId;
    case 'NOTICE':
    case 'TEXT_PUSH':
      return e.text;
    case 'SOS':
      return `🆘 ${e.seat}`;
    case 'SHOW_START':
      return '공연 시작';
    case 'SHOW_END':
      return '공연 종료';
    case 'DEVICE_CONNECTED':
      return e.deviceId;
  }
}
