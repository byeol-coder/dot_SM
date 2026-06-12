// ── graphics.ts — DotPad 60×40 그래픽 프리셋 ───────────────────
// 발표 시연용 임팩트 그래픽. Canvas 2D Path → Grid 변환 방식.
import { COLS, ROWS, emptyGrid, gridToHex, setBlock, setPin, type Grid } from '../frames';

// ── 픽셀 드로잉 헬퍼 ───────────────────────────────────────────
function drawCircleOutline(g: Grid, cx: number, cy: number, r: number, thick = 1) {
  for (let angle = 0; angle < 360; angle += 1) {
    const rad = (angle * Math.PI) / 180;
    for (let t = 0; t < thick; t++) {
      const x = Math.round(cx + (r - t) * Math.cos(rad));
      const y = Math.round(cy + (r - t) * Math.sin(rad));
      setPin(g, x, y);
    }
  }
}

function drawLine(g: Grid, x0: number, y0: number, x1: number, y1: number, thick = 1) {
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

// ── 하트 그래픽 (Hearts2Hearts 레퍼런스 스타일) ────────────────
export function heartGrid(): Grid {
  const g = emptyGrid();
  const cx = 30, cy = 21, scale = 1.0;
  // 하트 = 두 원 + V자 하단
  // 왼쪽 원
  drawCircleOutline(g, Math.round(cx - 8 * scale), Math.round(cy - 6 * scale), Math.round(8 * scale), 2);
  // 오른쪽 원
  drawCircleOutline(g, Math.round(cx + 8 * scale), Math.round(cy - 6 * scale), Math.round(8 * scale), 2);
  // 하단 V
  drawLine(g, Math.round(cx - 15 * scale), Math.round(cy - 1 * scale), cx, Math.round(cy + 14 * scale), 2);
  drawLine(g, Math.round(cx + 15 * scale), Math.round(cy - 1 * scale), cx, Math.round(cy + 14 * scale), 2);
  // 하트 내부 하단 채우기 (핀 밀도 증가)
  for (let row = 0; row < 8; row++) {
    const half = Math.round((8 - row) * 1.7);
    for (let col = -half; col <= half; col++) {
      setPin(g, cx + col, cy + row + 2);
    }
  }
  return g;
}

// ── 더블 하트 (인피니티 엠블럼 근사) ─────────────────────────
export function doubleHeartGrid(): Grid {
  const g = emptyGrid();
  // 왼쪽 하트
  const lx = 19, ly = 21;
  drawCircleOutline(g, lx - 5, ly - 4, 6, 2);
  drawCircleOutline(g, lx + 5, ly - 4, 6, 2);
  drawLine(g, lx - 10, ly - 1, lx, ly + 9, 2);
  drawLine(g, lx + 10, ly - 1, lx, ly + 9, 2);
  for (let row = 0; row < 5; row++) {
    const half = Math.round((5 - row) * 1.6);
    for (let col = -half; col <= half; col++) setPin(g, lx + col, ly + row + 1);
  }
  // 오른쪽 하트
  const rx = 41, ry = 21;
  drawCircleOutline(g, rx - 5, ry - 4, 6, 2);
  drawCircleOutline(g, rx + 5, ry - 4, 6, 2);
  drawLine(g, rx - 10, ry - 1, rx, ry + 9, 2);
  drawLine(g, rx + 10, ry - 1, rx, ry + 9, 2);
  for (let row = 0; row < 5; row++) {
    const half = Math.round((5 - row) * 1.6);
    for (let col = -half; col <= half; col++) setPin(g, rx + col, ry + row + 1);
  }
  return g;
}

// ── 별 그래픽 (5각형) ─────────────────────────────────────────
export function starGrid(cx = 30, cy = 20, r = 16): Grid {
  const g = emptyGrid();
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    const ai = ((i + 0.5) * 72 - 90) * (Math.PI / 180);
    pts.push([Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))]);
    pts.push([Math.round(cx + r * 0.4 * Math.cos(ai)), Math.round(cy + r * 0.4 * Math.sin(ai))]);
  }
  for (let i = 0; i < 10; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % 10];
    drawLine(g, x0, y0, x1, y1, 2);
  }
  return g;
}

// ── 다이아몬드 (엠블럼) ──────────────────────────────────────
export function diamondGrid(): Grid {
  const g = emptyGrid();
  const cx = 30, cy = 20;
  const w = 20, h = 16;
  drawLine(g, cx, cy - h, cx + w, cy, 2);
  drawLine(g, cx + w, cy, cx, cy + h, 2);
  drawLine(g, cx, cy + h, cx - w, cy, 2);
  drawLine(g, cx - w, cy, cx, cy - h, 2);
  // 내부 격자
  for (let row = -6; row <= 6; row += 3) {
    const half = Math.round((1 - Math.abs(row) / h) * w);
    drawLine(g, cx - half, cy + row, cx + half, cy + row, 1);
  }
  return g;
}

// ── 원형 대형 (가수 동선) ────────────────────────────────────
export function circleFormationGrid(): Grid {
  const g = emptyGrid();
  const cx = 30, cy = 20, r = 14;
  drawCircleOutline(g, cx, cy, r, 1);
  // 멤버 4명
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 - 45) * (Math.PI / 180);
    const mx = Math.round(cx + r * Math.cos(a));
    const my = Math.round(cy + r * Math.sin(a));
    setBlock(g, mx - 1, my - 1, 3, 3);
  }
  // 중앙 센터 포인트
  setBlock(g, cx - 2, cy - 2, 4, 4);
  return g;
}

// ── V자 대형 ────────────────────────────────────────────────
export function vFormationGrid(): Grid {
  const g = emptyGrid();
  const cx = 30;
  // 센터 (앞)
  setBlock(g, cx - 2, 30, 4, 4);
  // 2열
  setBlock(g, cx - 10, 24, 3, 3);
  setBlock(g, cx + 8, 24, 3, 3);
  // 3열 (뒤)
  setBlock(g, cx - 18, 17, 3, 3);
  setBlock(g, cx + 16, 17, 3, 3);
  // V자 라인
  drawLine(g, cx, 33, cx - 19, 17, 1);
  drawLine(g, cx, 33, cx + 20, 17, 1);
  return g;
}

// ── 워드마크 "DOT" (픽셀 레터링) ──────────────────────────────
// 각 글자: 7×9 픽셀 비트맵
const PIXEL_FONT: Record<string, number[][]> = {
  D: [
    [1,1,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,1,0],
    [1,1,1,0,0],
    [0,0,0,0,0],
  ],
  O: [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [0,0,0,0,0],
  ],
  T: [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
  ],
  P: [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [0,0,0,0,0],
  ],
  A: [
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,0,0,0,0],
  ],
  ' ': Array(9).fill([0,0,0]),
};

function drawText(g: Grid, text: string, startX: number, startY: number, scale = 2) {
  let x = startX;
  for (const ch of text.toUpperCase()) {
    const bitmap = PIXEL_FONT[ch] ?? PIXEL_FONT[' '];
    for (let row = 0; row < bitmap.length; row++) {
      for (let col = 0; col < bitmap[row].length; col++) {
        if (bitmap[row][col]) {
          for (let sy = 0; sy < scale; sy++)
            for (let sx = 0; sx < scale; sx++)
              setPin(g, x + col * scale + sx, startY + row * scale + sy);
        }
      }
    }
    x += (bitmap[0].length + 1) * scale;
  }
}

export function wordmarkDotGrid(): Grid {
  const g = emptyGrid();
  drawText(g, 'DOT', 4, 12, 2);
  // 하단 장식선
  drawLine(g, 4, 35, 38, 35, 1);
  return g;
}

export function wordmarkTouchGrid(): Grid {
  const g = emptyGrid();
  drawText(g, 'TOUCH', 2, 10, 1);
  drawText(g, 'THE', 12, 22, 1);
  drawText(g, 'PAD', 8, 30, 1);
  return g;
}

// ── 별자리 패턴 (우주 테마) ──────────────────────────────────
export function constellationGrid(): Grid {
  const g = emptyGrid();
  const stars: [number, number][] = [
    [10, 8], [22, 5], [38, 10], [50, 7],
    [6, 20], [18, 18], [30, 15], [45, 22],
    [12, 30], [28, 28], [42, 32], [55, 28],
    [20, 38], [38, 36], [52, 35],
  ];
  // 별 점
  stars.forEach(([x, y]) => setBlock(g, x - 1, y - 1, 2, 2));
  // 연결선
  const lines: [number, number][] = [
    [0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[8,9],[9,10],[10,11],
    [1,5],[5,9],[2,6],[6,10],[9,13],[10,14],
  ];
  lines.forEach(([a, b]) => drawLine(g, stars[a][0], stars[a][1], stars[b][0], stars[b][1], 1));
  return g;
}

// ── 파동 패턴 (음악 비주얼라이저) ───────────────────────────
export function waveGrid(frame = 0): Grid {
  const g = emptyGrid();
  for (let x = 0; x < COLS; x++) {
    const amp = 8 + Math.round(4 * Math.sin(x * 0.3 + frame * 0.2));
    const y1 = 20 - amp, y2 = 20 + amp;
    drawLine(g, x, y1, x, y2, 1);
  }
  return g;
}

// ── 프리셋 테이블 ────────────────────────────────────────────
export interface GraphicPreset {
  id: string;
  label: string;
  labelEn: string;
  color: string;        // 핀 글로우 컬러
  generate: () => Grid;
  narrative: string;    // REAL-TIME TACTILE NARRATIVE 텍스트
}

export const GRAPHIC_PRESETS: GraphicPreset[] = [
  {
    id: 'heart',
    label: '하트',
    labelEn: 'HEART',
    color: '#ff2d78',
    generate: heartGrid,
    narrative: '교차하는 루프 형태의 고주파 촉각 구조 — 심장 박동처럼 수축과 이완이 반복되는 패턴이 손끝에 전달됩니다.',
  },
  {
    id: 'double-heart',
    label: '더블 하트',
    labelEn: 'DOUBLE HEART',
    color: '#ff2d78',
    generate: doubleHeartGrid,
    narrative: '두 개의 하트가 맞닿은 인피니티 엠블럼. 팬과 아티스트의 연결을 의미하며, 좌우 대칭 촉각 구조로 표출됩니다.',
  },
  {
    id: 'star',
    label: '별',
    labelEn: 'STAR',
    color: '#ffd400',
    generate: starGrid,
    narrative: '5각형 별 실루엣 — 날카로운 꼭짓점에서 중앙으로 수렴하는 촉각 경로가 공연의 클라이맥스를 표현합니다.',
  },
  {
    id: 'diamond',
    label: '다이아몬드',
    labelEn: 'DIAMOND',
    color: '#4dd7ff',
    generate: diamondGrid,
    narrative: '마름모 엠블럼 — 내부 격자 구조가 빛의 굴절을 표현하며, 고급스러운 촉각 텍스처를 제공합니다.',
  },
  {
    id: 'constellation',
    label: '별자리',
    labelEn: 'CONSTELLATION',
    color: '#9b8dff',
    generate: constellationGrid,
    narrative: '15개의 별과 연결선으로 구성된 별자리 지도 — 공연장 천장의 우주를 손끝으로 탐험합니다.',
  },
  {
    id: 'v-formation',
    label: 'V자 대형',
    labelEn: 'V FORMATION',
    color: '#ff6b35',
    generate: vFormationGrid,
    narrative: '5인조 V자 대형 — 센터가 앞으로 나서고 양 날개가 뒤로 펼쳐지는 댄스 브레이크 순간의 동선입니다.',
  },
  {
    id: 'circle-formation',
    label: '원형 대형',
    labelEn: 'CIRCLE FORMATION',
    color: '#ff6b35',
    generate: circleFormationGrid,
    narrative: '원형 런닝 대형 — 무대 전체를 사용하는 역동적인 구성. 중앙의 솔로 포인트로 시선이 집중됩니다.',
  },
  {
    id: 'wordmark',
    label: 'DOT 워드마크',
    labelEn: 'DOT WORDMARK',
    color: '#4dd7ff',
    generate: wordmarkDotGrid,
    narrative: '닷 공식 워드마크 — 픽셀 폰트로 재현된 "DOT" 로고가 점자 디스플레이 위에 선명하게 새겨집니다.',
  },
  {
    id: 'wave',
    label: '음파',
    labelEn: 'SOUND WAVE',
    color: '#41d98d',
    generate: () => waveGrid(0),
    narrative: '사인파 기반 음파 패턴 — 음악의 주파수가 핀의 높낮이로 번역되어 소리를 시각·촉각으로 동시에 경험합니다.',
  },
];

export function getPreset(id: string): GraphicPreset | undefined {
  return GRAPHIC_PRESETS.find(p => p.id === id);
}
