// ── App.tsx — 해시 라우팅: 랜딩 / #/audience / #/operator / #/demo ──
import { useEffect, useState } from 'react';
import Audience from './apps/Audience';
import Demo from './apps/Demo';
import SMDemo from './apps/SMDemo';
import Operator from './apps/Operator';
import { SettingsProvider } from './settings';

type Route = 'landing' | 'audience' | 'operator' | 'demo' | 'presentation' | 'sm';

function parseRoute(): Route {
  const h = location.hash;
  if (h.startsWith('#/audience')) return 'audience';
  if (h.startsWith('#/operator')) return 'operator';
  if (h.startsWith('#/sm')) return 'sm';
  if (h.startsWith('#/presentation')) return 'presentation';
  if (h.startsWith('#/demo')) return 'demo';
  return 'landing';
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRoute);
  useEffect(() => {
    const h = () => setRoute(parseRoute());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  useEffect(() => {
    document.body.dataset.app = route;
  }, [route]);

  if (route === 'audience')
    return (
      <SettingsProvider>
        <Audience />
      </SettingsProvider>
    );
  if (route === 'operator') return <Operator />;
  if (route === 'sm') return <SMDemo />;
  if (route === 'presentation') return <Demo />;
  if (route === 'demo')
    return (
      <SettingsProvider>
        <div className="demo-split">
          <div className="demo-split__pane demo-split__pane--op">
            <Operator embedded />
          </div>
          <div className="demo-split__pane demo-split__pane--aud">
            <div className="phone-frame">
              <Audience embedded />
            </div>
          </div>
        </div>
      </SettingsProvider>
    );

  // ── 랜딩 ──
  return (
    <main className="landing">
      <div className="landing__glow" aria-hidden="true" />
      <p className="eyebrow">dot × SM ENTERTAINMENT · ACCESSIBLE K-POP CONCERT EXPERIENCE</p>
      <h1 className="landing__title">
        Touch <span className="pink">the</span> K-POP
      </h1>
      <p className="landing__sub">
        라이브 촉각 큐시트 프로토타입 <span className="cyan">V1</span> — 보이지 않는 공연을, 만질 수 있는
        공연으로.
      </p>
      <div className="landing__cards">
        <a className="landing__card landing__card--sm" href="#/sm">
          <span className="landing__card-icon" aria-hidden="true">✦</span>
          <strong>aespa · RIIZE 데모 (SM 발표용)</strong>
          <span className="dim">팀 선택 → 곡·파트 → 엠블럼 촉각 출력</span>
        </a>
        <a className="landing__card landing__card--featured" href="#/presentation">
          <span className="landing__card-icon" aria-hidden="true">⠿</span>
          <strong>발표 데모 (신규)</strong>
          <span className="dim">DotPad 캔버스 + 그래픽 프리셋 — SM 발표 전용</span>
        </a>
        <a className="landing__card" href="#/demo">
          <span className="landing__card-icon" aria-hidden="true">⚡</span>
          <strong>통합 시연 (추천)</strong>
          <span className="dim">운영자 콘솔 + 관객 앱을 한 화면에서 — 발표용</span>
        </a>
        <a className="landing__card" href="#/audience">
          <span className="landing__card-icon" aria-hidden="true">⠿</span>
          <strong>Audience App</strong>
          <span className="dim">관객용 — 온보딩 · Dot Pad · LIVE 뷰</span>
        </a>
        <a className="landing__card" href="#/operator">
          <span className="landing__card-icon" aria-hidden="true">🎛</span>
          <strong>Operator Console</strong>
          <span className="dim">운영자용 — 큐 발사 · AUTO 타임라인 · 로그</span>
        </a>
      </div>
      <p className="caption dim landing__hint">
        두 탭으로 열어도 실시간 연동됩니다(BroadcastChannel). 그룹·가사는 데모용 가상 창작물입니다.
      </p>
    </main>
  );
}
