// ── Audience.tsx V3 — 촉각 그래픽 · 가사 프리뷰 중심 재설계 ────
// 레이아웃 원칙:
//   PRE : 셋리스트 좌 · DotPad+가사미리보기 우 → "손끝으로 먼저 만나는" 경험
//   LIVE: 가사 전면(hero-size) · DotPad 상시 하단 고정 → 시연 시 한눈에
//   POST: 큐시트 타임라인 · 닷패드 리플레이

import { useCallback, useEffect, useRef, useState } from 'react';
import { emit, emitLocal, getSnapshot, subscribe } from '../bus';
import DotPadSim from '../components/DotPadSim';
import { FxOverlay, Modal, useToast } from '../components/ui';
import { GROUP_NAME, SETLIST, TOUR_NAME, getSong } from '../data/setlist';
import { useA11yScopeProps, useSettings, useSpeak } from '../settings';
import type { A11yMode, DeviceStatus, ShowPhase, Song, TTKEvent } from '../types';

type Stage = 'onboarding' | 'pairing' | 'main';

interface FeedItem {
  id: number;
  emoji: string;
  text: string;
  kind: 'highlight' | 'gesture' | 'formation';
  time: string;
}

const SEAT = 'B구역 12열 7번';

const MODE_CARDS: { id: A11yMode; title: string; desc: string; icon: string }[] = [
  { id: 'mode-tactile-first',  title: '촉각 우선',   desc: 'Dot Pad 1차 · 음성 자동',   icon: '⠿' },
  { id: 'mode-low-vision',     title: '저시력',      desc: '1.5× 고대비',              icon: '◐' },
  { id: 'mode-screen-reader',  title: '스크린리더',  desc: 'VoiceOver 병용',           icon: '🗣' },
  { id: 'mode-standard',       title: '표준',        desc: '동행인 공유',              icon: '✦' },
];

// 멤버별 컬러 (아이브로 라벨 시스템과 분리)
const MEMBER_COLOR: Record<string, string> = {
  '미르': '#ff2d78', '라온': '#4dd7ff', '누리': '#ffd400', '가람': '#ff6b35', 'ALL': '#9aa4b5',
};

export default function Audience({ embedded = false }: { embedded?: boolean }) {
  const scope = useA11yScopeProps();
  const { settings, update, reset } = useSettings();
  const speak = useSpeak();
  const { push: toast, node: toastNode } = useToast();

  const [stage, setStage] = useState<Stage>(() =>
    localStorage.getItem('ttk-onboarded') ? 'main' : 'onboarding',
  );
  const [phase, setPhase] = useState<ShowPhase>(() => getSnapshot().phase);
  const [songId, setSongId] = useState<string | null>(() => getSnapshot().songId);
  const [connected, setConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('offline');
  const [latencyMs, setLatencyMs] = useState(0);
  const [pairBusy, setPairBusy] = useState(false);
  const [wave, setWave] = useState(0);

  // LIVE 상태
  const [lyrics, setLyrics] = useState<{ member: string; text: string; lineIdx: number }[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [beat, setBeat] = useState({ on: false, bpm: 0 });
  const [currentFormation, setCurrentFormation] = useState<string | null>(null);

  // PRE 상태
  const [selectedSong, setSelectedSong] = useState<Song | null>(SETLIST[0]);
  const [previewLineIdx, setPreviewLineIdx] = useState(0);

  // 공통
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [listening, setListening] = useState(false);
  const [cueIdx, setCueIdx] = useState(0);
  const [sosArmed, setSosArmed] = useState(false);

  const eventsRef = useRef<TTKEvent[]>([]);
  const feedId = useRef(0);
  const sosTimer = useRef(0);
  const lastMsgRef = useRef('');
  const lyricScrollRef = useRef<HTMLDivElement>(null);

  // ── 버스 수신 ──────────────────────────────────────────────
  useEffect(() => {
    const off = subscribe((e) => {
      eventsRef.current.push(e);
      switch (e.type) {
        case 'SHOW_START':
          setPhase('live');
          setLyrics([]);
          setFeed([]);
          setCurrentFormation(null);
          toast('공연이 시작됩니다!', 'success');
          speak('공연이 시작됩니다');
          break;
        case 'SHOW_END':
          setPhase('post');
          setBeat({ on: false, bpm: 0 });
          speak('공연이 끝났습니다');
          break;
        case 'SONG_CHANGE':
          setSongId(e.songId);
          setLyrics([]);
          const s = getSong(e.songId);
          if (s) toast(`♪ ${s.no}. ${s.title}`);
          break;
        case 'LYRIC':
          lastMsgRef.current = `${e.member}, ${e.text}`;
          setLyrics(prev => [...prev.slice(-12), { member: e.member, text: e.text, lineIdx: e.lineIdx }]);
          // 스크롤 바텀
          requestAnimationFrame(() => {
            lyricScrollRef.current?.scrollTo({ top: 9999, behavior: 'smooth' });
          });
          break;
        case 'HIGHLIGHT':
        case 'GESTURE':
          lastMsgRef.current = e.text;
          setFeed(prev => [{
            id: ++feedId.current, emoji: e.emoji, text: e.text,
            kind: (e.type === 'HIGHLIGHT' ? 'highlight' : 'gesture') as FeedItem['kind'],
            time: new Date(e.ts).toLocaleTimeString('ko-KR', { hour12: false }),
          }, ...prev].slice(0, 10));
          speak(e.text);
          break;
        case 'FORMATION':
          lastMsgRef.current = `${e.name} — ${e.text}`;
          setCurrentFormation(e.name);
          setFeed(prev => [{
            id: ++feedId.current, emoji: '◇', text: `${e.name} — ${e.text}`,
            kind: 'formation' as FeedItem['kind'],
            time: new Date(e.ts).toLocaleTimeString('ko-KR', { hour12: false }),
          }, ...prev].slice(0, 10));
          speak(`대형 변환 — ${e.name}`);
          break;
        case 'BEAT':
          setBeat({ on: e.on, bpm: e.bpm });
          break;
        case 'NOTICE':
          lastMsgRef.current = e.text;
          toast(e.text);
          speak(e.text);
          break;
      }
    });
    return off;
  }, [speak, toast]);

  // ── 페어링 ─────────────────────────────────────────────────
  const pair = useCallback(() => {
    setPairBusy(true);
    setWave(w => w + 1);
    setDeviceStatus('syncing');
    setTimeout(() => {
      setDeviceStatus('connected');
      setLatencyMs(8);
      setConnected(true);
      setPairBusy(false);
      emitLocal({ type: 'DEVICE_CONNECTED', ts: Date.now(), deviceId: 'DOTPAD-SIM-001' });
      emitLocal({ type: 'TEXT_PUSH', ts: Date.now(), text: '닷패드 연결 완료. 환영합니다!' });
      speak('닷패드 연결이 완료되었습니다');
      setTimeout(() => setLatencyMs(12), 3000);
      setTimeout(() => setLatencyMs(8), 4500);
    }, 1400);
  }, [speak]);

  // ── PRE: 가사 미리보기 패드 전송 ──────────────────────────
  const sendLyricPreview = useCallback((song: Song, lineIdx: number) => {
    const line = song.lyrics[lineIdx];
    if (!line) return;
    const text = `${song.no}. ${song.title} — [${line.member}] ${line.text}`;
    emitLocal({ type: 'TEXT_PUSH', ts: Date.now(), text });
    speak(`${line.member}: ${line.text}`);
  }, [speak]);

  // ── 큐시트 (POST) ──────────────────────────────────────────
  const cueSheet = buildCueSheet(eventsRef.current);

  // ── STT ───────────────────────────────────────────────────
  const recRef = useRef<{ stop: () => void } | null>(null);
  const toggleStt = useCallback(() => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const W = window as unknown as { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; start: () => void; stop: () => void; }; };
    if (!W.webkitSpeechRecognition) { toast('이 브라우저는 음성 입력을 지원하지 않습니다'); return; }
    const rec = new W.webkitSpeechRecognition();
    rec.lang = 'ko-KR'; rec.interimResults = false;
    rec.onresult = (e) => { const t = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(' '); setMemo(m => m ? `${m} ${t}` : t); };
    rec.onend = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true); speak('말씀하세요');
  }, [listening, speak, toast]);

  // ── F키 ───────────────────────────────────────────────────
  const onFKey = useCallback((n: 1 | 2 | 3 | 4) => {
    if (n === 4) {
      if (!sosArmed) {
        setSosArmed(true);
        toast('한 번 더 누르면 스태프를 호출합니다', 'danger');
        speak('한 번 더 누르면 스태프를 호출합니다');
        clearTimeout(sosTimer.current);
        sosTimer.current = window.setTimeout(() => setSosArmed(false), 3000);
      } else {
        setSosArmed(false); clearTimeout(sosTimer.current);
        emit({ type: 'SOS', ts: Date.now(), seat: SEAT });
        toast(`스태프 호출 완료 — ${SEAT}`, 'danger');
        speak('스태프를 호출했습니다');
      }
      return;
    }
    if (n === 1) {
      const last = lastMsgRef.current || '아직 수신된 메시지가 없습니다';
      emitLocal({ type: 'TEXT_PUSH', ts: Date.now(), text: last });
      speak(last); return;
    }
    if (n === 2) {
      if (phase === 'pre' && selectedSong) {
        const next = (previewLineIdx + 1) % selectedSong.lyrics.length;
        setPreviewLineIdx(next);
        sendLyricPreview(selectedSong, next);
      } else if (phase === 'live') {
        const f = feed[0];
        if (f) { speak(f.text); toast(f.text); }
      } else {
        const items = cueSheet.flatMap(s => s.items);
        if (items.length) {
          const ni = (cueIdx + 1) % items.length;
          setCueIdx(ni);
          emitLocal({ type: 'TEXT_PUSH', ts: Date.now(), text: items[ni].text });
          speak(items[ni].text);
        }
      }
      return;
    }
    if (phase === 'post') { toggleStt(); return; }
    const desc = phase === 'live'
      ? `${getSong(songId)?.title ?? ''} 공연 중`
      : '공연 전 대기 — 셋리스트와 가사를 미리 확인하세요';
    speak(desc); toast(desc);
  }, [phase, sosArmed, feed, previewLineIdx, selectedSong, cueIdx, songId, speak, toast, toggleStt, cueSheet, sendLyricPreview]);

  const downloadCueSheet = useCallback(() => {
    const data = { tour: TOUR_NAME, seat: SEAT, memo, cueSheet, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'my-tactile-cuesheet.json'; a.click();
    URL.revokeObjectURL(a.href); toast('큐시트를 저장했습니다', 'success');
  }, [memo, cueSheet, toast]);

  const song = getSong(songId);
  const nowLyric = lyrics[lyrics.length - 1] ?? null;

  // ══════════════════════════════════════════════════════════
  return (
    <div className={`app audience ${embedded ? 'is-embedded' : ''}`} {...scope}>
      <FxOverlay />
      {toastNode}

      {/* ── 헤더 (최소화) ─────────────────────────────────── */}
      <header className="aud-header">
        <span className="eyebrow">TOUCH THE K-POP · {GROUP_NAME}</span>
        <div className="aud-header__right">
          {beat.on && <span className="beat-ind" aria-label={`비트 ${beat.bpm}BPM`}>♪ {beat.bpm}</span>}
          {deviceStatus === 'connected' && (
            <span className="ble-pill is-on">● BLE</span>
          )}
          {deviceStatus !== 'connected' && deviceStatus !== 'offline' && (
            <span className="ble-pill is-sync">◎ {deviceStatus === 'syncing' ? '동기화' : '지연'}</span>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSettingsOpen(true)} aria-label="설정">⚙</button>
        </div>
      </header>

      {/* ════ A0 온보딩 ════ */}
      {stage === 'onboarding' && (
        <main className="view view--onboard">
          <div className="onboard-text">
            <p className="eyebrow">ACCESSIBILITY ONBOARDING</p>
            <h1 className="display">오늘 공연,<br /><em className="pink">어떻게</em> 함께할까요?</h1>
            <p className="dim body">선택한 모드는 언제든 설정에서 바꿀 수 있습니다.</p>
          </div>
          <div className="mode-grid" role="radiogroup" aria-label="접근성 모드 선택">
            {MODE_CARDS.map(m => (
              <button key={m.id} type="button" role="radio"
                aria-checked={settings.mode === m.id}
                className={`mode-card ${settings.mode === m.id ? 'is-active' : ''}`}
                onClick={() => { update({ mode: m.id }); speak(`${m.title} 모드`); }}
              >
                <span className="mode-card__icon" aria-hidden="true">{m.icon}</span>
                <span className="mode-card__title">{m.title}</span>
                <span className="mode-card__desc">{m.desc}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--primary btn--xl btn--block"
            onClick={() => { localStorage.setItem('ttk-onboarded', '1'); setStage('pairing'); }}>
            이 모드로 시작하기 →
          </button>
        </main>
      )}

      {/* ════ A1 페어링 ════ */}
      {stage === 'pairing' && (
        <main className="view view--pairing">
          <div className="pair-top">
            <p className="eyebrow">DEVICE PAIRING</p>
            <h1 className="display">Dot Pad를 <em className="cyan">연결</em>합니다</h1>
            <p className="dim body">핀 테스트 웨이브로 60×40 전체 핀 동작을 확인합니다.</p>
          </div>
          {/* DotPad가 주인공 */}
          <div className="pair-pad-hero">
            <DotPadSim size="full" deviceStatus={deviceStatus} latencyMs={latencyMs}
              testWaveSignal={wave} phase="pre" />
          </div>
          <div className="pair-actions">
            {!connected ? (
              <button type="button" className="btn btn--primary btn--xl btn--block"
                onClick={pair} disabled={pairBusy}>
                {pairBusy ? (
                  <><span className="spin" aria-hidden="true">◎</span> 핀 테스트 진행 중…</>
                ) : '⠿ Dot Pad 연결'}
              </button>
            ) : (
              <div className="row gap">
                <button type="button" className="btn btn--ghost" onClick={() => setWave(w => w + 1)}>
                  핀 테스트 다시
                </button>
                <button type="button" className="btn btn--primary btn--xl" style={{ flex: 1 }}
                  onClick={() => setStage('main')}>
                  공연장 입장 →
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ════ A2 PRE-SHOW ════ 2-pane 레이아웃 */}
      {stage === 'main' && phase === 'pre' && (
        <main className="view view--pre">
          {/* 좌: 셋리스트 + 곡 해설 */}
          <aside className="pre-left">
            <p className="eyebrow">{TOUR_NAME}</p>
            <h2 className="pre-title">오늘의<br /><em className="pink">셋리스트</em></h2>
            <ul className="songlist" role="list">
              {SETLIST.map(s => (
                <li key={s.id}>
                  <button type="button"
                    className={`song-card ${selectedSong?.id === s.id ? 'is-selected' : ''}`}
                    onClick={() => { setSelectedSong(s); setPreviewLineIdx(0); sendLyricPreview(s, 0); }}
                    aria-pressed={selectedSong?.id === s.id}>
                    <span className="song-card__no">{String(s.no).padStart(2, '0')}</span>
                    <span className="song-card__t">
                      <strong>{s.title}</strong>
                      <span className="dim">{s.titleEn} · {s.bpm}BPM</span>
                    </span>
                    {selectedSong?.id === s.id && <span className="song-card__sel" aria-hidden="true">▶</span>}
                  </button>
                </li>
              ))}
            </ul>
            {selectedSong && (
              <div className="song-concept">
                <p className="eyebrow">곡 해설</p>
                <p className="body dim">{selectedSong.concept}</p>
              </div>
            )}
          </aside>

          {/* 우: DotPad + 가사 미리보기 (주인공) */}
          <div className="pre-right">
            <div className="pre-pad-label">
              <span className="eyebrow">MY DOT PAD</span>
              <span className="dim caption">곡을 선택하면 점자로 미리 읽어보세요</span>
            </div>

            <DotPadSim size="full" interactive
              deviceStatus={deviceStatus} latencyMs={latencyMs}
              phase={phase} onFKey={onFKey} />

            {/* 가사 미리보기 — DotPad 바로 아래 */}
            {selectedSong && (
              <div className="lyric-preview" aria-label={`${selectedSong.title} 가사 미리보기`}>
                <div className="lyric-preview__head">
                  <span className="eyebrow">{selectedSong.title} 가사 미리보기</span>
                  <div className="row gap">
                    <button type="button" className="btn btn--chip"
                      onClick={() => { const p = (previewLineIdx - 1 + selectedSong.lyrics.length) % selectedSong.lyrics.length; setPreviewLineIdx(p); sendLyricPreview(selectedSong, p); }}
                      aria-label="이전 파트">◀</button>
                    <span className="lyric-preview__pos mono dim">
                      {previewLineIdx + 1} / {selectedSong.lyrics.length}
                    </span>
                    <button type="button" className="btn btn--chip"
                      onClick={() => { const p = (previewLineIdx + 1) % selectedSong.lyrics.length; setPreviewLineIdx(p); sendLyricPreview(selectedSong, p); }}
                      aria-label="다음 파트">▶</button>
                  </div>
                </div>

                {/* 전체 가사 — 현재 선택 강조 */}
                <ol className="lyric-lines-pre">
                  {selectedSong.lyrics.map((l, i) => (
                    <li key={i}>
                      <button type="button"
                        className={`lyric-pre-line ${i === previewLineIdx ? 'is-active' : ''}`}
                        onClick={() => { setPreviewLineIdx(i); sendLyricPreview(selectedSong, i); }}>
                        <span
                          className="member-dot"
                          style={{ background: MEMBER_COLOR[l.member] ?? '#9aa4b5' }}
                          aria-hidden="true" />
                        <span className="member-chip">{l.member}</span>
                        <span className="lyric-pre-line__text">{l.text}</span>
                        {i === previewLineIdx && (
                          <span className="lyric-pre-line__hint" aria-hidden="true">⠿ 전송됨</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ol>

                <button type="button" className="btn btn--secondary btn--block"
                  onClick={() => { emitLocal({ type: 'TEXT_PUSH', ts: Date.now(), text: `${selectedSong.title} — ${selectedSong.concept}` }); toast('곡 해설을 Dot Pad로 전송했습니다', 'success'); speak('곡 해설을 닷패드로 전송합니다'); }}>
                  ⠿ 곡 해설 전체 → Dot Pad
                </button>
              </div>
            )}

            <p className="caption dim" style={{ textAlign: 'center', marginTop: 8 }}>
              ◀▶ 패닝 · F2 다음 가사 · F4 스태프 호출
            </p>
          </div>
        </main>
      )}

      {/* ════ A3 LIVE ════ 가사 전면 + DotPad 하단 */}
      {stage === 'main' && phase === 'live' && (
        <main className="view view--live">

          {/* 1. 상단: 곡 정보 + 대형 배지 */}
          <div className="live-header">
            <div className="live-now">
              <span className="live-dot" aria-hidden="true" />
              <span className="live-label">LIVE</span>
              {song && <span className="live-song">{song.no}. {song.title}</span>}
            </div>
            {currentFormation && (
              <div className="formation-badge" aria-label={`현재 대형: ${currentFormation}`}>
                <span aria-hidden="true">◇</span> {currentFormation}
              </div>
            )}
          </div>

          {/* 2. 중앙: 현재 가사 히어로 */}
          <div className="lyric-hero" aria-label="현재 가사">
            {nowLyric ? (
              <>
                <div className="lyric-hero__member"
                  style={{ color: MEMBER_COLOR[nowLyric.member] ?? 'var(--color-label)' }}>
                  <span className="member-dot"
                    style={{ background: MEMBER_COLOR[nowLyric.member] ?? '#9aa4b5', width: 10, height: 10 }}
                    aria-hidden="true" />
                  {nowLyric.member}
                </div>
                <p className="lyric-hero__text" aria-live="polite" aria-atomic="true">
                  {nowLyric.text}
                </p>
              </>
            ) : (
              <p className="lyric-hero__waiting dim">가사가 곧 흐릅니다…</p>
            )}
          </div>

          {/* 3. 가사 히스토리 스크롤 */}
          <div className="lyric-history" ref={lyricScrollRef} role="log" aria-live="polite" aria-label="가사 히스토리">
            {lyrics.slice(0, -1).map((l, i) => (
              <p key={`${l.lineIdx}-${i}`} className="lyric-hist-line">
                <span className="member-chip" style={{ borderColor: MEMBER_COLOR[l.member] ?? 'transparent' }}>{l.member}</span>
                {l.text}
              </p>
            ))}
          </div>

          {/* 4. 퍼포먼스 피드 (우측 슬라이딩) */}
          {feed.length > 0 && (
            <div className="feed-ticker" aria-label="퍼포먼스 피드" aria-live="assertive">
              <div className="feed-ticker__item feed-ticker__item--latest">
                <span aria-hidden="true">{feed[0].emoji}</span>
                {feed[0].text}
              </div>
              {feed.slice(1, 3).map(f => (
                <div key={f.id} className="feed-ticker__item feed-ticker__item--prev">
                  <span aria-hidden="true">{f.emoji}</span>{f.text}
                </div>
              ))}
            </div>
          )}

          {/* 5. DotPad — 하단 고정 (항상 보임) */}
          <div className="live-pad-dock">
            <DotPadSim size="full" interactive
              deviceStatus={deviceStatus} latencyMs={latencyMs}
              phase={phase} onFKey={onFKey} />
          </div>
        </main>
      )}

      {/* ════ A4 POST-SHOW ════ */}
      {stage === 'main' && phase === 'post' && (
        <main className="view view--post">
          <p className="eyebrow">POST-SHOW</p>
          <h1 className="display">오늘 밤의 기록,<br /><em className="cyan">하이라이트</em></h1>

          {cueSheet.length === 0 ? (
            <p className="dim body">수신된 공연 기록이 없습니다. 운영자 콘솔에서 AUTO 재생을 먼저 실행하세요.</p>
          ) : (
            cueSheet.map(sec => (
              <section key={sec.songId} className="cs-song">
                <h2 className="h2">{sec.no}. {sec.title}</h2>
                <ul className="cs-list">
                  {sec.items.map((it, i) => (
                    <li key={i} className="cs-item">
                      <span className="mono dim">{it.time}</span>
                      <span aria-hidden="true">{it.emoji}</span>
                      <span>{it.text}</span>
                      <button type="button" className="btn btn--chip cs-item__replay"
                        onClick={() => { emitLocal({ type: 'TEXT_PUSH', ts: Date.now(), text: it.text }); toast('Dot Pad로 재전송', 'success'); }}
                        aria-label={`${it.text} Dot Pad로 다시 보기`}>⠿</button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <section className="memo">
            <p className="eyebrow">MY MEMO</p>
            <textarea className="input memo__ta" rows={3} value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="오늘 가장 인상 깊었던 순간은…" aria-label="감상 메모" />
            <div className="row gap">
              <button type="button" className={`btn btn--secondary ${listening ? 'is-rec' : ''}`}
                onClick={toggleStt} aria-pressed={listening}>
                {listening ? '● 듣는 중…' : '🎙 음성 메모'}
              </button>
              <button type="button" className="btn btn--primary" onClick={downloadCueSheet}>
                ⬇ 큐시트 저장
              </button>
            </div>
          </section>

          <DotPadSim size="full" interactive
            deviceStatus={deviceStatus} latencyMs={latencyMs}
            phase={phase} onFKey={onFKey} />
        </main>
      )}

      {/* ── 설정 모달 ── */}
      {settingsOpen && (
        <Modal title="접근성 설정" onClose={() => setSettingsOpen(false)}>
          <div className="a11y-status">
            <span className="a11y-badge a11y-badge--pass">✓ 저장됨</span>
            {settings.highContrast && <span className="a11y-badge a11y-badge--pass">고대비</span>}
            {settings.reducedMotion && <span className="a11y-badge a11y-badge--warn">모션 감소</span>}
            {settings.sensoryMode !== 'full' && <span className="a11y-badge a11y-badge--warn">감각 안전</span>}
          </div>
          <p className="eyebrow">접근성 모드</p>
          <div className="mode-grid mode-grid--compact" role="radiogroup" aria-label="접근성 모드">
            {MODE_CARDS.map(m => (
              <button key={m.id} type="button" role="radio"
                aria-checked={settings.mode === m.id}
                className={`mode-card ${settings.mode === m.id ? 'is-active' : ''}`}
                onClick={() => update({ mode: m.id })}>
                <span className="mode-card__icon">{m.icon}</span>
                <span className="mode-card__title">{m.title}</span>
              </button>
            ))}
          </div>
          <p className="eyebrow">감각 안전 모드</p>
          <div className="sensory-cards" role="radiogroup" aria-label="감각 안전 모드">
            {([
              { id: 'full', icon: '✦', title: '일반', desc: 'FX 전체' },
              { id: 'reduced', icon: '◑', title: '축소', desc: 'FX 50%' },
              { id: 'minimal', icon: '○', title: '최소', desc: '텍스트만' },
            ] as const).map(s => (
              <button key={s.id} type="button" role="radio"
                aria-checked={settings.sensoryMode === s.id}
                className={`sensory-card ${settings.sensoryMode === s.id ? 'is-active' : ''}`}
                onClick={() => update({ sensoryMode: s.id })}>
                <span className="sensory-card__icon">{s.icon}</span>
                <span className="sensory-card__title">{s.title}</span>
                <span className="sensory-card__desc">{s.desc}</span>
              </button>
            ))}
          </div>
          <p className="eyebrow">Dot Pad 출력 모드</p>
          <div className="policy-cards" role="radiogroup" aria-label="출력 모드">
            {([
              { id: 'hybrid', label: '혼합' },
              { id: 'braille', label: '점자 우선' },
              { id: 'graphic', label: '그래픽 우선' },
            ] as const).map(p => (
              <button key={p.id} type="button" role="radio"
                aria-checked={settings.outputMode === p.id}
                className={`policy-card ${settings.outputMode === p.id ? 'is-active' : ''}`}
                onClick={() => update({ outputMode: p.id })}>{p.label}</button>
            ))}
          </div>
          <label className="set-row">
            <span>글자 크기 <strong>{settings.fontScale.toFixed(1)}×</strong></span>
            <input type="range" min={1} max={2} step={0.1} value={settings.fontScale}
              onChange={e => update({ fontScale: Number(e.target.value) })} aria-label="글자 크기 배율" />
          </label>
          <label className="set-row"><span>고대비</span>
            <input type="checkbox" checked={settings.highContrast} onChange={e => update({ highContrast: e.target.checked })} />
          </label>
          <label className="set-row"><span>모션 감소</span>
            <input type="checkbox" checked={settings.reducedMotion} onChange={e => update({ reducedMotion: e.target.checked })} />
          </label>
          <label className="set-row"><span>효과음</span>
            <input type="checkbox" checked={settings.sound} onChange={e => update({ sound: e.target.checked })} />
          </label>
          <div className="set-row">
            <span>진동 강도</span>
            <div className="row gap" role="radiogroup" aria-label="진동 강도">
              {(['low', 'mid', 'high'] as const).map(v => (
                <button key={v} type="button" role="radio"
                  aria-checked={settings.vibration === v}
                  className={`btn btn--chip ${settings.vibration === v ? 'is-active' : ''}`}
                  onClick={() => update({ vibration: v })}>{v === 'low' ? '약' : v === 'mid' ? '중' : '강'}</button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn--ghost"
            onClick={() => { reset(); setSettingsOpen(false); setStage('onboarding'); }}>
            초기화 · 온보딩 다시 보기
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── 헬퍼 ──────────────────────────────────────────────────────
interface CueSheetSection {
  songId: string; no: number; title: string;
  items: { time: string; emoji: string; text: string }[];
}

function buildCueSheet(events: TTKEvent[]): CueSheetSection[] {
  const out: CueSheetSection[] = [];
  let cur: CueSheetSection | null = null;
  for (const e of events) {
    if (e.type === 'SONG_CHANGE') {
      const s = getSong(e.songId);
      if (s) { cur = { songId: s.id, no: s.no, title: `${s.title} (${s.titleEn})`, items: [] }; out.push(cur); }
    } else if (cur) {
      const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour12: false });
      if (e.type === 'HIGHLIGHT' || e.type === 'GESTURE') cur.items.push({ time, emoji: e.emoji, text: e.text });
      else if (e.type === 'FORMATION') cur.items.push({ time, emoji: '◇', text: `${e.name} — ${e.text}` });
      else if (e.type === 'FX_COUNTDOWN') cur.items.push({ time, emoji: e.fx === 'firework' ? '🎆' : '🔥', text: e.fx === 'firework' ? '폭죽 연출' : '불기둥 연출' });
    }
  }
  return out.filter(s => s.items.length > 0);
}
