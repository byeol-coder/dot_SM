// ── sm-graphics.ts — aespa · RIIZE 전용 엠블럼 그래픽 ──────────
// 60×40 핀 그리드 기반. drawLine / drawCircleOutline / setBlock 조합.

import { emptyGrid, setBlock, setPin, type Grid } from '../frames';

// ── 공통 드로잉 헬퍼 (graphics.ts 와 독립) ───────────────────────
function circ(g: Grid, cx: number, cy: number, r: number, thick = 2) {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let t = 0; t < thick; t++) {
      setPin(g, Math.round(cx + (r - t) * Math.cos(rad)), Math.round(cy + (r - t) * Math.sin(rad)));
    }
  }
}

function line(g: Grid, x0: number, y0: number, x1: number, y1: number, thick = 2) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  while (true) {
    for (let tx = 0; tx < thick; tx++)
      for (let ty = 0; ty < thick; ty++) setPin(g, x + tx, y + ty);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
  }
}

function arc(g: Grid, cx: number, cy: number, r: number, startDeg: number, endDeg: number, thick = 2) {
  for (let a = startDeg; a <= endDeg; a += 0.8) {
    const rad = (a * Math.PI) / 180;
    for (let t = 0; t < thick; t++) {
      setPin(g, Math.round(cx + (r - t) * Math.cos(rad)), Math.round(cy + (r - t) * Math.sin(rad)));
    }
  }
}

function star(g: Grid, cx: number, cy: number, outerR: number, innerR: number, points: number, thick = 2) {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))]);
  }
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    line(g, x0, y0, x1, y1, thick);
  }
}

function fill(g: Grid, cx: number, cy: number, r: number) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) setPin(g, x, y);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// aespa 엠블럼 4종
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** æ 심볼 — ae 리가처 형태: a 원 + e 내부 절개선 */
export function aeSymbolGrid(): Grid {
  const g = emptyGrid();
  const cx = 30, cy = 20;
  // 큰 원 (a의 볼)
  circ(g, cx - 4, cy, 13, 2);
  // e 오른쪽 열린 원 (270°~90° 호)
  arc(g, cx + 8, cy, 10, -80, 80, 2);
  // e 중간 수평선
  line(g, cx + 1, cy, cx + 17, cy, 2);
  // a 오른쪽 내림선
  line(g, cx + 9, cy - 13, cx + 9, cy + 13, 2);
  // 하단 장식 점
  fill(g, cx - 4, cy + 18, 2);
  fill(g, cx + 8, cy + 18, 2);
  return g;
}

/** 나비 — aespa 세계관 상징 */
export function aeButterflyGrid(): Grid {
  const g = emptyGrid();
  const cx = 30, cy = 20;
  // 왼쪽 날개 위
  arc(g, cx - 14, cy - 6, 13, 0, 170, 2);
  // 왼쪽 날개 아래
  arc(g, cx - 10, cy + 6, 9, 10, 190, 2);
  // 오른쪽 날개 위
  arc(g, cx + 14, cy - 6, 13, 10, 180, 2);
  // 오른쪽 날개 아래
  arc(g, cx + 10, cy + 6, 9, -10, 170, 2);
  // 몸통
  line(g, cx, cy - 10, cx, cy + 12, 2);
  // 더듬이
  line(g, cx, cy - 10, cx - 8, cy - 18, 1);
  line(g, cx, cy - 10, cx + 8, cy - 18, 1);
  fill(g, cx - 8, cy - 18, 1);
  fill(g, cx + 8, cy - 18, 1);
  return g;
}

/** 포털 (æ 세계관 게이트) — 동심 타원 + 중앙 다이아 */
export function aePortalGrid(): Grid {
  const g = emptyGrid();
  const cx = 30, cy = 20;
  // 외곽 타원
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    setPin(g, Math.round(cx + 26 * Math.cos(rad)), Math.round(cy + 17 * Math.sin(rad)));
    setPin(g, Math.round(cx + 25 * Math.cos(rad)), Math.round(cy + 16 * Math.sin(rad)));
  }
  // 중간 타원
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    setPin(g, Math.round(cx + 17 * Math.cos(rad)), Math.round(cy + 11 * Math.sin(rad)));
  }
  // 내부 다이아몬드
  line(g, cx, cy - 8, cx + 8, cy, 2);
  line(g, cx + 8, cy, cx, cy + 8, 2);
  line(g, cx, cy + 8, cx - 8, cy, 2);
  line(g, cx - 8, cy, cx, cy - 8, 2);
  // 방사선
  for (let i = 0; i < 8; i++) {
    const a = (i * 45) * (Math.PI / 180);
    const x1 = Math.round(cx + 10 * Math.cos(a));
    const y1 = Math.round(cy + 10 * Math.sin(a));
    const x2 = Math.round(cx + 16 * Math.cos(a));
    const y2 = Math.round(cy + 16 * Math.sin(a));
    line(g, x1, y1, x2, y2, 1);
  }
  return g;
}

/** aespa 워드마크 "æspa" — 픽셀 레터링 */
export function aeWordmarkGrid(): Grid {
  const g = emptyGrid();
  // æ (ae 합자)
  circ(g, 8, 20, 7, 2);
  arc(g, 18, 20, 7, -90, 90, 2);
  line(g, 11, 20, 24, 20, 2);
  line(g, 23, 13, 23, 27, 2);
  // s
  arc(g, 32, 16, 5, 120, 360, 2);
  arc(g, 32, 24, 5, -60, 180, 2);
  // p
  circ(g, 42, 17, 5, 2);
  line(g, 37, 12, 37, 32, 2);
  // a
  circ(g, 51, 20, 7, 2);
  line(g, 57, 13, 57, 27, 2);
  // 하단 라인
  line(g, 2, 33, 58, 33, 1);
  return g;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RIIZE 엠블럼 4종
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 번개 — RIIZE 에너지 심볼 */
export function riizeLightningGrid(): Grid {
  const g = emptyGrid();
  // 큰 번개
  line(g, 36, 3,  22, 22, 3);
  line(g, 22, 22, 32, 22, 3);
  line(g, 32, 22, 18, 38, 3);
  // 작은 번개 (우측)
  line(g, 46, 8,  38, 20, 2);
  line(g, 38, 20, 44, 20, 2);
  line(g, 44, 20, 36, 32, 2);
  // 배경 방사 효과
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 + 30) * (Math.PI / 180);
    line(g,
      Math.round(27 + 8 * Math.cos(a)), Math.round(22 + 8 * Math.sin(a)),
      Math.round(27 + 14 * Math.cos(a)), Math.round(22 + 14 * Math.sin(a)), 1
    );
  }
  return g;
}

/** 크라운 — RIIZE 리더십 심볼 */
export function riizeCrownGrid(): Grid {
  const g = emptyGrid();
  const cx = 30;
  // 크라운 베이스
  line(g, 6, 32, 54, 32, 2);
  // 크라운 몸체
  line(g, 6, 32, 6, 20, 2);
  line(g, 54, 32, 54, 20, 2);
  // 3개의 봉우리
  line(g, 6, 20,  cx - 10, 10, 2);
  line(g, cx - 10, 10, cx, 18, 2);
  line(g, cx, 18, cx, 8, 2);
  line(g, cx, 8, cx + 10, 10, 2);
  line(g, cx + 10, 10, 54, 20, 2);
  // 크라운 보석 (작은 원 3개)
  fill(g, cx - 10, 10, 2);
  fill(g, cx, 8, 2);
  fill(g, cx + 10, 10, 2);
  // 크라운 내부 장식
  line(g, 14, 32, 14, 22, 1);
  line(g, 24, 32, 24, 22, 1);
  line(g, 36, 32, 36, 22, 1);
  line(g, 46, 32, 46, 22, 1);
  return g;
}

/** 7각 별 — RIIZE 7인 */
export function riizeStar7Grid(): Grid {
  const g = emptyGrid();
  star(g, 30, 20, 17, 7, 7, 2);
  // 중앙 원
  circ(g, 30, 20, 4, 2);
  // 멤버 수: 점 7개 (바깥 꼭짓점에)
  for (let i = 0; i < 7; i++) {
    const a = (i * (360 / 7) - 90) * (Math.PI / 180);
    fill(g, Math.round(30 + 17 * Math.cos(a)), Math.round(20 + 17 * Math.sin(a)), 2);
  }
  return g;
}

/** RIIZE 워드마크 "RIIZE" — 픽셀 레터링 */
export function riizeWordmarkGrid(): Grid {
  const g = emptyGrid();
  // R
  line(g, 3, 12, 3, 28, 2);
  arc(g, 9, 16, 5, -90, 90, 2);
  line(g, 3, 20, 13, 20, 2);
  line(g, 8, 20, 14, 28, 2);
  // I
  line(g, 19, 12, 19, 28, 2);
  // I (두 번째)
  line(g, 24, 12, 24, 28, 2);
  // Z
  line(g, 29, 12, 40, 12, 2);
  line(g, 40, 12, 29, 28, 2);
  line(g, 29, 28, 40, 28, 2);
  // E
  line(g, 45, 12, 45, 28, 2);
  line(g, 45, 12, 56, 12, 2);
  line(g, 45, 20, 54, 20, 2);
  line(g, 45, 28, 56, 28, 2);
  // 하단 라인
  line(g, 2, 33, 58, 33, 1);
  return g;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 프리셋 맵
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SmGraphicPreset {
  id: string;
  label: string;
  artistId: 'aespa' | 'riize';
  color: string;
  generate: () => Grid;
  narrative: string;
}

export const SM_GRAPHIC_PRESETS: SmGraphicPreset[] = [
  // aespa
  {
    id: 'ae-symbol',
    label: 'æ 심볼',
    artistId: 'aespa',
    color: '#c084fc',
    generate: aeSymbolGrid,
    narrative: 'æ 리가처 — aespa 고유의 "ae" 합자 심볼. 현실 자아와 아바타 æ가 하나로 수렴하는 순간을 선명한 핀 구조로 표현합니다.',
  },
  {
    id: 'ae-butterfly',
    label: '나비',
    artistId: 'aespa',
    color: '#e879f9',
    generate: aeButterflyGrid,
    narrative: 'aespa 나비 — 현실과 가상 세계를 넘나드는 자유의 상징. 좌우 비대칭 날개 구조가 변환의 순간을 촉각으로 전달합니다.',
  },
  {
    id: 'ae-portal',
    label: 'æ 포털',
    artistId: 'aespa',
    color: '#a855f7',
    generate: aePortalGrid,
    narrative: 'KWANGYA 포털 게이트 — æ 세계관의 진입점. 동심 타원과 중앙 다이아몬드가 차원 이동의 긴장감을 핀 진동으로 전달합니다.',
  },
  {
    id: 'ae-wordmark',
    label: 'æspa 워드마크',
    artistId: 'aespa',
    color: '#c084fc',
    generate: aeWordmarkGrid,
    narrative: 'æspa 공식 워드마크 — ae 합자부터 시작하는 4글자가 Dot Pad 핀 위에 새겨집니다. 하단 라인이 무대의 지평선을 표현합니다.',
  },
  // RIIZE
  {
    id: 'riize-lightning',
    label: '번개',
    artistId: 'riize',
    color: '#f97316',
    generate: riizeLightningGrid,
    narrative: 'RIIZE 번개 심볼 — 7인의 에너지가 하나로 집결하는 순간. 대·소 이중 번개 구조가 리더와 팀의 역동적 관계를 표현합니다.',
  },
  {
    id: 'riize-crown',
    label: '크라운',
    artistId: 'riize',
    color: '#fb923c',
    generate: riizeCrownGrid,
    narrative: 'RIIZE 크라운 — 청춘의 왕관. 3개의 봉우리는 과거·현재·미래를, 4개의 내부 기둥은 팀의 균형을 촉각으로 전달합니다.',
  },
  {
    id: 'riize-star7',
    label: '7각 별',
    artistId: 'riize',
    color: '#fbbf24',
    generate: riizeStar7Grid,
    narrative: 'RIIZE 7각별 — 7인 멤버를 상징하는 꼭짓점과 중앙 원이 팀의 단결을 표현합니다. 각 꼭짓점의 솔리드 핀이 강렬한 존재감을 전달합니다.',
  },
  {
    id: 'riize-wordmark',
    label: 'RIIZE 워드마크',
    artistId: 'riize',
    color: '#f97316',
    generate: riizeWordmarkGrid,
    narrative: 'RIIZE 공식 워드마크 — R·I·I·Z·E 5글자가 Dot Pad 전면을 가득 채웁니다. 더블 I가 팀의 두 축을 상징합니다.',
  },
];

export function getSmPresetsByArtist(artistId: 'aespa' | 'riize'): SmGraphicPreset[] {
  return SM_GRAPHIC_PRESETS.filter(p => p.artistId === artistId);
}

export function getSmPreset(id: string): SmGraphicPreset | undefined {
  return SM_GRAPHIC_PRESETS.find(p => p.id === id);
}
