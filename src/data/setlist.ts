// ── setlist.ts — 데모용 가상 셋리스트 ───────────────────────────
// 그룹·멤버·가사 전부 본 프로토타입을 위해 창작된 가상 콘텐츠입니다.
import type { Song } from '../types';

export const GROUP_NAME = 'LUMIN';
export const TOUR_NAME = 'LUMIN WORLD TOUR — PRISM';

export const MEMBERS = [
  { name: '미르', en: 'MIR', initial: 'M' },
  { name: '라온', en: 'RAON', initial: 'R' },
  { name: '누리', en: 'NURI', initial: 'N' },
  { name: '가람', en: 'GARAM', initial: 'G' },
];

export const SETLIST: Song[] = [
  {
    id: 'song-neon',
    no: 1,
    title: '네온 펄스',
    titleEn: 'NEON PULSE',
    bpm: 128,
    durationMs: 52_000,
    concept:
      '도시의 밤, 꺼지지 않는 심장 박동을 네온 불빛에 비유한 오프닝 곡. ' +
      '후렴의 반복되는 "켜져라"는 무대 조명이 객석으로 번지는 연출과 동기화됩니다. ' +
      '1절은 미르·라온, 2절은 누리·가람이 끌고 가며, 댄스 브레이크에서 V자 대형이 등장합니다.',
    lyrics: [
      { member: '미르', memberInitial: 'M', text: '꺼진 거리 위로 번지는 빛' },
      { member: '라온', memberInitial: 'R', text: '심장 소리가 먼저 달려가' },
      { member: '누리', memberInitial: 'N', text: '켜져라 켜져라 우리의 밤' },
      { member: '가람', memberInitial: 'G', text: '멈추지 않는 네온 펄스' },
      { member: '미르', memberInitial: 'M', text: '같은 박자로 뛰는 마음' },
      { member: 'ALL', memberInitial: 'A', text: '지금 이 순간을 켜 — Neon Pulse!' },
    ],
    timeline: [
      { at: 0, kind: 'BEAT', on: true },
      { at: 1_000, kind: 'LYRIC', lineIdx: 0 },
      { at: 6_000, kind: 'LYRIC', lineIdx: 1 },
      { at: 10_000, kind: 'GESTURE', emoji: '😉', text: '라온, 카메라에 윙크' },
      { at: 12_000, kind: 'LYRIC', lineIdx: 2 },
      { at: 17_000, kind: 'LYRIC', lineIdx: 3 },
      { at: 21_000, kind: 'FORMATION', name: 'V자 대형', text: '댄스 브레이크 — 센터 미르, V자 대형 전개', gridKey: 'V' },
      { at: 25_000, kind: 'HIGHLIGHT', emoji: '🔥', text: '대규모 칼군무 — 함성 포인트!' },
      { at: 30_000, kind: 'LYRIC', lineIdx: 4 },
      { at: 35_000, kind: 'LYRIC', lineIdx: 5 },
      { at: 40_000, kind: 'FX_COUNTDOWN', fx: 'flame' },
      { at: 46_000, kind: 'FORMATION', name: '일렬 대형', text: '엔딩 — 무대 앞 일렬 정렬', gridKey: 'LINE' },
      { at: 50_000, kind: 'BEAT', on: false },
    ],
  },
  {
    id: 'song-gravity',
    no: 2,
    title: '중력',
    titleEn: 'GRAVITY',
    bpm: 92,
    durationMs: 48_000,
    concept:
      '서로를 끌어당기는 마음을 중력에 빗댄 미디엄 템포 곡. ' +
      '가사의 "떨어져도 같은 궤도"는 팬과 아티스트의 관계를 의미합니다. ' +
      '브릿지에서 누리의 솔로 센터 무대가 펼쳐지고, 멤버 간 잔잔한 팬서비스가 많은 곡입니다.',
    lyrics: [
      { member: '누리', memberInitial: 'N', text: '멀어질수록 선명해지는' },
      { member: '가람', memberInitial: 'G', text: '너라는 중력의 방향' },
      { member: '미르', memberInitial: 'M', text: '떨어져도 같은 궤도 위' },
      { member: '라온', memberInitial: 'R', text: '결국 너에게 도착할 거야' },
      { member: 'ALL', memberInitial: 'A', text: '끌려가 — 더 가까이, Gravity' },
    ],
    timeline: [
      { at: 1_000, kind: 'LYRIC', lineIdx: 0 },
      { at: 7_000, kind: 'LYRIC', lineIdx: 1 },
      { at: 13_000, kind: 'GESTURE', emoji: '🫰', text: '가람, 객석을 향해 손하트' },
      { at: 16_000, kind: 'LYRIC', lineIdx: 2 },
      { at: 22_000, kind: 'FORMATION', name: '솔로 센터', text: '브릿지 — 누리 솔로 센터, 후방 라인 대기', gridKey: 'CENTER' },
      { at: 26_000, kind: 'LYRIC', lineIdx: 3 },
      { at: 32_000, kind: 'GESTURE', emoji: '😂', text: '미르·라온, 안무 중 서로 장난' },
      { at: 36_000, kind: 'LYRIC', lineIdx: 4 },
      { at: 41_000, kind: 'HIGHLIGHT', emoji: '🌊', text: '응원봉 파도 — 객석 전체가 출렁입니다' },
    ],
  },
  {
    id: 'song-starlight',
    no: 3,
    title: '스타라이트 런',
    titleEn: 'STARLIGHT RUN',
    bpm: 140,
    durationMs: 55_000,
    concept:
      '투어의 피날레. 밤하늘을 달리는 유성우처럼, 모든 멤버가 무대를 가로지르며 ' +
      '관객과 함께 달리는 곡입니다. 엔딩 폭죽 연출이 두 차례 등장하며, ' +
      '마지막 후렴은 떼창 구간으로 설계되어 있습니다.',
    lyrics: [
      { member: '라온', memberInitial: 'R', text: '별빛이 쏟아지는 트랙 위로' },
      { member: '미르', memberInitial: 'M', text: '숨이 차도 멈추지 마' },
      { member: '가람', memberInitial: 'G', text: '나란히 달리는 우리의 빛' },
      { member: '누리', memberInitial: 'N', text: '끝나지 않을 이 밤을 가로질러' },
      { member: 'ALL', memberInitial: 'A', text: '달려가 — Starlight Run! (떼창)' },
      { member: 'ALL', memberInitial: 'A', text: '고마워요, 오늘 밤의 모든 별들' },
    ],
    timeline: [
      { at: 0, kind: 'BEAT', on: true },
      { at: 1_000, kind: 'LYRIC', lineIdx: 0 },
      { at: 6_000, kind: 'LYRIC', lineIdx: 1 },
      { at: 11_000, kind: 'FORMATION', name: '원형 대형', text: '전 멤버 원형 러닝 — 무대 전체 사용', gridKey: 'CIRCLE' },
      { at: 15_000, kind: 'LYRIC', lineIdx: 2 },
      { at: 19_000, kind: 'FX_COUNTDOWN', fx: 'firework' },
      { at: 24_000, kind: 'LYRIC', lineIdx: 3 },
      { at: 29_000, kind: 'HIGHLIGHT', emoji: '🎤', text: '떼창 구간 — 마이크가 객석을 향합니다' },
      { at: 33_000, kind: 'LYRIC', lineIdx: 4 },
      { at: 40_000, kind: 'FX_COUNTDOWN', fx: 'firework' },
      { at: 46_000, kind: 'LYRIC', lineIdx: 5 },
      { at: 50_000, kind: 'FORMATION', name: '일렬 인사', text: '피날레 — 일렬 정렬 후 단체 인사', gridKey: 'LINE' },
      { at: 53_000, kind: 'BEAT', on: false },
    ],
  },
];

export function getSong(id: string | null): Song | null {
  return SETLIST.find((s) => s.id === id) ?? null;
}
