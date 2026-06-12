// ── braille.ts — 데모용 점자 근사 변환 (한국 점자 규정 기반 자모 풀어쓰기)
// V1 범위: 약자·된소리 규칙 미적용. 실서비스에서는 공인 변환 엔진으로 교체.

type Dots = number[]; // 1~8

const CHO: Record<number, Dots> = {
  0: [4], // ㄱ
  1: [4], // ㄲ (근사)
  2: [1, 4], // ㄴ
  3: [2, 4], // ㄷ
  4: [2, 4], // ㄸ (근사)
  5: [5], // ㄹ
  6: [1, 5], // ㅁ
  7: [4, 5], // ㅂ
  8: [4, 5], // ㅃ (근사)
  9: [6], // ㅅ
  10: [6], // ㅆ (근사)
  11: [], // ㅇ — 표기 생략
  12: [4, 6], // ㅈ
  13: [4, 6], // ㅉ (근사)
  14: [5, 6], // ㅊ
  15: [1, 2, 4], // ㅋ
  16: [1, 2, 5], // ㅌ
  17: [1, 4, 5], // ㅍ
  18: [2, 4, 5], // ㅎ
};

const JUNG: Record<number, Dots> = {
  0: [1, 2, 6], // ㅏ
  1: [1, 2, 3, 5], // ㅐ
  2: [3, 4, 5], // ㅑ
  3: [3, 4, 5, 6], // ㅒ (근사)
  4: [2, 3, 4], // ㅓ
  5: [1, 3, 4, 5], // ㅔ
  6: [1, 5, 6], // ㅕ
  7: [3, 4], // ㅖ
  8: [1, 3, 6], // ㅗ
  9: [1, 2, 3, 6], // ㅘ
  10: [1, 2, 3, 5, 6], // ㅙ (근사)
  11: [1, 3, 4, 5, 6], // ㅚ
  12: [3, 4, 6], // ㅛ
  13: [1, 3, 4], // ㅜ
  14: [1, 2, 3, 4], // ㅝ
  15: [1, 2, 3, 4, 5], // ㅞ (근사)
  16: [1, 3, 4, 5], // ㅟ (근사)
  17: [1, 4, 6], // ㅠ
  18: [2, 4, 6], // ㅡ
  19: [2, 4, 5, 6], // ㅢ
  20: [1, 3, 5], // ㅣ
};

const JONG: Record<number, Dots> = {
  1: [1], // ㄱ
  2: [1], // ㄲ (근사)
  4: [2, 5], // ㄴ
  7: [3, 5], // ㄷ
  8: [2], // ㄹ
  16: [2, 6], // ㅁ
  17: [1, 2], // ㅂ
  19: [3], // ㅅ
  20: [3], // ㅆ (근사)
  21: [2, 3, 5, 6], // ㅇ
  22: [1, 3], // ㅈ
  23: [2, 3], // ㅊ
  24: [2, 3, 5], // ㅋ
  25: [2, 3, 6], // ㅌ
  26: [2, 5, 6], // ㅍ
  27: [3, 5, 6], // ㅎ
};

const EN_BASE: Record<string, Dots> = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5],
  f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
};

function dotsToByte(d: Dots): number {
  return d.reduce((acc, n) => acc | (1 << (n - 1)), 0);
}

function enLetter(ch: string): Dots | null {
  const c = ch.toLowerCase();
  const code = c.charCodeAt(0);
  if (code < 97 || code > 122) return null;
  if (c === 'w') return [2, 4, 5, 6];
  const idx = code - 97;
  if (idx < 10) return EN_BASE[c];
  if (idx < 20) return [...EN_BASE[String.fromCharCode(97 + idx - 10)], 3];
  return [...EN_BASE[String.fromCharCode(97 + idx - 20)], 3, 6];
}

const DIGIT = 'jabcdefghi'; // 0→j, 1→a …

/** 텍스트 → 점자 셀 바이트 배열 (셀당 1바이트, 점1~8 = bit0~7) */
export function toBrailleBytes(text: string): number[] {
  const out: number[] = [];
  let numberMode = false;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (!/[0-9]/.test(ch)) numberMode = false;
    if (ch === ' ') {
      out.push(0);
    } else if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      const cho = Math.floor(idx / 588);
      const jung = Math.floor((idx % 588) / 28);
      const jong = idx % 28;
      const c = CHO[cho] ?? [];
      if (c.length) out.push(dotsToByte(c));
      out.push(dotsToByte(JUNG[jung] ?? []));
      if (jong !== 0) out.push(dotsToByte(JONG[jong] ?? []));
    } else if (/[0-9]/.test(ch)) {
      if (!numberMode) out.push(dotsToByte([3, 4, 5, 6])); // 수표 (연속 숫자엔 1회)
      numberMode = true;
      out.push(dotsToByte(EN_BASE[DIGIT[Number(ch)]]));
    } else {
      const en = enLetter(ch);
      if (en) out.push(dotsToByte(en));
      else if (/[.,!?·…:;'"\-]/.test(ch)) out.push(dotsToByte([2])); // 문장부호 근사
      else out.push(0);
    }
  }
  return out;
}

/** 바이트 → 점자 유니코드 문자 (U+2800 기반) */
export function byteToBrailleChar(b: number): string {
  return String.fromCharCode(0x2800 + (b & 0xff));
}

export function toBrailleString(text: string): string {
  return toBrailleBytes(text).map(byteToBrailleChar).join('');
}
