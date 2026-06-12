// ── frames.ts — 60×40 촉각 그래픽 프레임 유틸 ──────────────────
import type { FormationKey } from './types';

export const COLS = 60;
export const ROWS = 40;
export const PIN_COUNT = COLS * ROWS; // 2400

/** 핀 그리드: Uint8Array(2400), 0=down 1=up, row-major */
export type Grid = Uint8Array;

export function emptyGrid(): Grid {
  return new Uint8Array(PIN_COUNT);
}

export function setPin(g: Grid, x: number, y: number, v = 1): void {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  g[y * COLS + x] = v;
}

export function setBlock(g: Grid, x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) setPin(g, x + dx, y + dy);
}

/** 그리드 → 600자 hex (300바이트, 8핀/바이트) */
export function gridToHex(g: Grid): string {
  let hex = '';
  for (let i = 0; i < PIN_COUNT; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) if (g[i + b]) byte |= 1 << b;
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToGrid(hex: string): Grid {
  const g = emptyGrid();
  for (let i = 0; i < Math.min(hex.length / 2, 300); i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
    for (let b = 0; b < 8; b++) if (byte & (1 << b)) g[i * 8 + b] = 1;
  }
  return g;
}

// ── 대형(FORMATION) 도식 ────────────────────────────────────────
// 규약: 멤버 = 2×2 블록, 센터/솔로 = 4×4, 무대 앞쪽 = 캔버스 하단.
// FORMATION 존: 최외곽 1핀 링(FX 전용)을 제외한 58×38 내부 사용.

const MEMBER = 2;
const CENTER = 4;

export function formationGrid(key: FormationKey): Grid {
  const g = emptyGrid();
  switch (key) {
    case 'V': {
      // V자: 센터 앞(하단), 좌우 후방으로 벌어짐
      setBlock(g, 28, 30, CENTER, CENTER); // 센터
      setBlock(g, 20, 24, MEMBER, MEMBER);
      setBlock(g, 38, 24, MEMBER, MEMBER);
      setBlock(g, 12, 18, MEMBER, MEMBER);
      setBlock(g, 46, 18, MEMBER, MEMBER);
      break;
    }
    case 'LINE': {
      // 일렬: 하단 가로 정렬
      const y = 26;
      [10, 22, 34, 46].forEach((x, i) =>
        setBlock(g, x, y, i === 1 ? CENTER : MEMBER, i === 1 ? CENTER : MEMBER),
      );
      break;
    }
    case 'CIRCLE': {
      // 원형: 중앙 비우고 8방위 배치
      const cx = 29;
      const cy = 20;
      const r = 12;
      for (let k = 0; k < 8; k++) {
        const a = (Math.PI * 2 * k) / 8;
        const x = Math.round(cx + Math.cos(a) * r);
        const y = Math.round(cy + Math.sin(a) * (r * 0.7));
        setBlock(g, x, y, MEMBER, MEMBER);
      }
      break;
    }
    case 'CENTER': {
      // 솔로 센터: 4×4 단독 + 후방 라인
      setBlock(g, 28, 28, CENTER, CENTER);
      [14, 22, 36, 44].forEach((x) => setBlock(g, x, 12, MEMBER, MEMBER));
      break;
    }
  }
  return g;
}

export function formationHex(key: FormationKey): string {
  return gridToHex(formationGrid(key));
}
