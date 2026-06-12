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
      <section className="landing__hero">
        <div className="landing__hero-copy">
          <p className="eyebrow">AI-POWERED LIVE TACTILE PERFORMANCE INTERFACE</p>
          <h1 className="landing__title">
            Touch <span className="pink">the</span> K-POP
          </h1>
          <p className="landing__sub">
            Live tactile cue sheets for lyrics, choreography, stage effects, and audience energy.
          </p>
          <div className="landing__hero-tags" aria-label="키워드">
            <span>Dot Pad</span>
            <span>Accessibility</span>
            <span>K-POP</span>
            <span>Cinematic stage</span>
          </div>
          <div className="landing__actions">
            <a className="landing__cta" href="#/demo">
              통합 시연 보기
            </a>
            <a className="landing__cta landing__cta--ghost" href="#/audience">
              Audience 모드
            </a>
          </div>
        </div>
        <div className="landing__hero-panel" aria-hidden="true">
              <div className="landing__status-card">
            <span className="landing__status-badge">STANDBY</span>
            <strong>Live tactile performance lab</strong>
            <p>Premium concert control room for accessible K-POP stage cues.</p>
          </div>
          <div className="landing__status-grid">
            <div>
              <span className="landing__stat-label">Modes</span>
              <strong>Audience · Operator · Demo · SM Demo</strong>
            </div>
            <div>
              <span className="landing__stat-label">Output</span>
              <strong>60×40 tactile grid · Braille · FX</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__grid" aria-label="메인 모드 탐색">
        <a className="landing__card landing__card--sm" href="#/sm">
          <span className="landing__card-icon" aria-hidden="true">✦</span>
          <strong>SM Demo</strong>
          <span className="dim">Entertainment partner showcase for tactile emblems and part output.</span>
        </a>
        <a className="landing__card landing__card--featured" href="#/presentation">
          <span className="landing__card-icon" aria-hidden="true">⠿</span>
          <strong>Presentation Demo</strong>
          <span className="dim">Dot Pad canvas + graphic presets for high-end briefing.</span>
        </a>
        <a className="landing__card" href="#/demo">
          <span className="landing__card-icon" aria-hidden="true">⚡</span>
          <strong>Integrated Demo</strong>
          <span className="dim">Operator + Audience split view for live performance flow.</span>
        </a>
        <a className="landing__card" href="#/audience">
          <span className="landing__card-icon" aria-hidden="true">⠿</span>
          <strong>Audience App</strong>
          <span className="dim">Simple tactile pulse experience for concert audiences.</span>
        </a>
        <a className="landing__card" href="#/operator">
          <span className="landing__card-icon" aria-hidden="true">🎛</span>
          <strong>Operator Console</strong>
          <span className="dim">Cue launch, auto timeline, and live stage monitoring.</span>
        </a>
      </section>

      <p className="caption dim landing__hint">
        Two tabs sync in real-time via BroadcastChannel. Content is mock staging for demo only.
      </p>
    </main>
  );
}
