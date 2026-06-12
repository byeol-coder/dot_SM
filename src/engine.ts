// ── engine.ts — Live Cue Playback Engine ───────────────────────
// 곡 타임라인을 시간축 기반으로 재생하거나, 운영자 수동 큐를 TTKEvent로 변환.
import { emit } from './bus';
import { formationHex } from './frames';
import type { Song, TimelineCue, TTKEvent } from './types';

export function cueToEvent(song: Song, cue: TimelineCue): TTKEvent {
  const ts = Date.now();
  switch (cue.kind) {
    case 'LYRIC': {
      const line = song.lyrics[cue.lineIdx];
      return {
        type: 'LYRIC',
        ts,
        songId: song.id,
        lineIdx: cue.lineIdx,
        member: line.member,
        memberInitial: line.memberInitial,
        text: line.text,
      };
    }
    case 'HIGHLIGHT':
      return { type: 'HIGHLIGHT', ts, emoji: cue.emoji, text: cue.text };
    case 'GESTURE':
      return { type: 'GESTURE', ts, emoji: cue.emoji, text: cue.text };
    case 'FORMATION':
      return { type: 'FORMATION', ts, name: cue.name, text: cue.text, grid: formationHex(cue.gridKey) };
    case 'FX_COUNTDOWN':
      return { type: 'FX_COUNTDOWN', ts, fx: cue.fx, seconds: 3 };
    case 'BEAT':
      return { type: 'BEAT', ts, on: cue.on, bpm: song.bpm };
  }
}

export interface EngineState {
  playing: boolean;
  songId: string | null;
  elapsedMs: number;
  durationMs: number;
}

type TickHandler = (s: EngineState) => void;

export class PlaybackEngine {
  private raf = 0;
  private startAt = 0;
  private song: Song | null = null;
  private fired = new Set<number>();
  private onTick: TickHandler;

  constructor(onTick: TickHandler) {
    this.onTick = onTick;
  }

  get playing(): boolean {
    return this.raf !== 0;
  }

  play(song: Song): void {
    this.stop(false);
    this.song = song;
    this.fired.clear();
    this.startAt = performance.now();
    emit({ type: 'SONG_CHANGE', ts: Date.now(), songId: song.id });
    const loop = () => {
      if (!this.song) return;
      const elapsed = performance.now() - this.startAt;
      this.song.timeline.forEach((cue, i) => {
        if (!this.fired.has(i) && elapsed >= cue.at) {
          this.fired.add(i);
          emit(cueToEvent(this.song!, cue));
        }
      });
      this.onTick({
        playing: true,
        songId: this.song.id,
        elapsedMs: elapsed,
        durationMs: this.song.durationMs,
      });
      if (elapsed >= this.song.durationMs) {
        this.stop();
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(notify = true): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    const songId = this.song?.id ?? null;
    const duration = this.song?.durationMs ?? 0;
    this.song = null;
    if (notify)
      this.onTick({ playing: false, songId, elapsedMs: 0, durationMs: duration });
  }
}
