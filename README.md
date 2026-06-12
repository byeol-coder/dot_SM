# Touch the K-POP — 라이브 촉각 큐시트 프로토타입 V1

dot × SM Entertainment · 시각장애 관객을 위한 실시간 공연 접근성 경험.
React + TypeScript + Vite 단일 프로젝트, 외부 서버 없이 동작합니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

빌드 결과물로 시연하려면:

```bash
npm run build
npx serve dist     # 또는 임의의 정적 서버
```

> `dist/index.html`을 file://로 직접 열면 탭 간 BroadcastChannel이 제한될 수 있습니다.
> **`#/demo` 통합 분할 뷰는 단일 탭이므로 어디서든 동작**합니다.

## 라우트

| 경로 | 화면 |
|---|---|
| `/` | 랜딩 (역할 선택) |
| `#/demo` | **통합 시연** — 운영자 콘솔 + 관객 앱(폰 프레임) 한 화면. 발표 추천 |
| `#/audience` | 관객 앱 (온보딩 → 페어링 → PRE / LIVE / POST) |
| `#/operator` | 운영자 콘솔 |

두 탭에 audience / operator를 각각 띄우면 BroadcastChannel(`ttk-bus`)로 실시간 연동됩니다.

## 90초 시연 시나리오 (말 없이 화면만으로)

1. `#/demo` 진입 — 우측 관객 앱에서 **촉각 우선 모드 선택 → Dot Pad 연결**(핀 웨이브) → 입장
2. 관객 PRE-SHOW: 곡 카드 → 프리뷰 → **"Dot Pad로 읽기"** → 점자 바 패닝(◀▶)
3. 좌측 운영자: **▶ SHOW START** → 관객 화면이 자동으로 LIVE 전환
4. 운영자: **▶ AUTO 타임라인 재생** — 가사·중계·V자 대형(촉각 도식)·비트 펄스·🎆 3초 카운트다운이 시간축대로 자동 발사
5. 관객 패드에서 **F4 두 번** → 운영자에 🆘 SOS 배너
6. 운영자: **■ SHOW END** → 관객 POST-SHOW: 하이라이트 큐시트 + 음성 메모 + JSON 저장

## 키보드 맵

**운영자**: `Space` 커서 가사 발사 · `↑↓` 커서 이동 · `1~4` 퀵큐(하이라이트/제스처/대형/FX) · `B` 비트 토글 · `Esc` 메뉴 닫기
**관객(Dot Pad)**: `,` `.` 점자 바 패닝(Shift=처음/끝) · `F1` 다시 읽기 · `F2` 다음 항목 · `F3` 화면 설명(POST=음성 메모) · `F4` 스태프 호출(2단계 확인)

## 구현 범위

- **Dot Pad Simulator**: 60×40핀 캔버스(대형 도식·중앙 비트 펄스 존·FX 테두리 단계 연출), 20셀 점자 텍스트 바(18셀 스텝 패닝·새 줄 마커 점7·8 점멸), 하드웨어 키 F1~F4
- **Live Cue Playback Engine**: `src/engine.ts` — 곡 타임라인(rAF 시간축) 자동 재생 + 운영자 수동 발사 공용 변환
- **큐 종류**: LYRIC / HIGHLIGHT·GESTURE(performance) / FORMATION(촉각 그래픽) / BEAT(haptic) / FX_COUNTDOWN(safety 3초) / NOTICE / TEXT_PUSH / SOS
- **접근성**: 모드 4종 온보딩, 고대비, 글자 1.0~2.0×, 모션 감소(+OS `prefers-reduced-motion`), 전 기능 키보드 조작, ARIA live(가사 polite / 중계 assertive / FX alert), 설정 localStorage(`ttk-a11y`) 저장
- **Mock 데이터**: `public/mock-cues.json` (가상 그룹 LUMIN, 3곡 35큐 — TS 원본 `src/data/setlist.ts`)

## 저작권 · 데이터 고지

그룹(LUMIN)·멤버·가사·곡명은 본 프로토타입을 위해 창작된 **가상 콘텐츠**이며 실제 아티스트와 무관합니다.
점자 변환(`src/braille.ts`)은 자모 풀어쓰기 기반 **데모용 근사**로, 실서비스에서는 공인 변환 엔진으로 교체합니다.
