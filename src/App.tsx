import { useEffect, useMemo, useState } from 'react';
import Audience from './apps/Audience';
import Demo from './apps/Demo';
import SMDemo from './apps/SMDemo';
import Operator from './apps/Operator';
import { SettingsProvider, useA11yScopeProps } from './settings';

type Route = 'landing' | 'audience' | 'operator' | 'demo' | 'presentation' | 'sm';

interface ModeLink {
  route: Route;
  href: string;
  label: string;
  eyebrow: string;
  desc: string;
  icon: string;
  recommended?: boolean;
}

const MODE_LINKS: ModeLink[] = [
  {
    route: 'sm',
    href: '#/sm',
    label: 'SM Demo',
    eyebrow: 'Executive showcase',
    desc: '파트·곡·엠블럼을 선택해 SM 스타일 촉각 공연 접근성 제안을 바로 시연합니다.',
    icon: '✦',
    recommended: true,
  },
  {
    route: 'demo',
    href: '#/demo',
    label: 'Dual Demo',
    eyebrow: 'Operator + Audience',
    desc: '운영자 콘솔과 관객 앱을 한 화면에 띄워 실시간 연동을 발표용으로 확인합니다.',
    icon: '⚡',
  },
  {
    route: 'audience',
    href: '#/audience',
    label: 'Audience Mode',
    eyebrow: 'Blind & low vision first',
    desc: '큰 글자, 음성 안내, Dot Pad 미리보기 중심의 관객용 공연 경험입니다.',
    icon: '⠿',
  },
  {
    route: 'operator',
    href: '#/operator',
    label: 'Operator Mode',
    eyebrow: 'Live cue command',
    desc: '가사·안무·무대효과·비트 큐를 키보드와 버튼으로 빠르게 송출합니다.',
    icon: '🎛',
  },
  {
    route: 'presentation',
    href: '#/presentation',
    label: 'Presentation Demo',
    eyebrow: 'Tactile canvas',
    desc: 'Dot Pad 그래픽 프리셋과 발표용 촉각 캔버스를 집중 시연합니다.',
    icon: '◇',
  },
];

function parseRoute(): Route {
  const h = window.location.hash;
  if (h.startsWith('#/audience')) return 'audience';
  if (h.startsWith('#/operator')) return 'operator';
  if (h.startsWith('#/sm')) return 'sm';
  if (h.startsWith('#/presentation')) return 'presentation';
  if (h.startsWith('#/demo')) return 'demo';
  return 'landing';
}

export default function App() {
  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  );
}

function AppShell() {
  const [route, setRoute] = useState<Route>(parseRoute);
  const scope = useA11yScopeProps();

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.body.dataset.app = route;
  }, [route]);

  if (route === 'audience') return <Audience />;
  if (route === 'operator') return <Operator />;
  if (route === 'sm') return <SMDemo />;
  if (route === 'presentation') return <Demo />;
  if (route === 'demo') {
    return (
      <div className="demo-split premium-demo-split" {...scope}>
        <a className="skip-link" href="#demo-audience">관객 화면으로 건너뛰기</a>
        <div className="demo-split__pane demo-split__pane--op" id="demo-operator" aria-label="운영자 콘솔 패널">
          <Operator embedded />
        </div>
        <div className="demo-split__pane demo-split__pane--aud" id="demo-audience" aria-label="관객 앱 패널">
          <div className="phone-frame" role="region" aria-label="관객 모바일 미리보기">
            <Audience embedded />
          </div>
        </div>
      </div>
    );
  }

  return <Landing route={route} scope={scope} />;
}

function Landing({ route, scope }: { route: Route; scope: ReturnType<typeof useA11yScopeProps> }) {
  const activeIndex = useMemo(() => MODE_LINKS.findIndex((m) => m.route === route), [route]);

  return (
    <main className="landing premium-landing" {...scope}>
      <a className="skip-link" href="#mode-navigation">모드 선택으로 건너뛰기</a>
      <div className="landing__glow premium-aurora" aria-hidden="true" />
      <div className="premium-noise" aria-hidden="true" />

      <section className="premium-hero" aria-labelledby="landing-title">
        <div className="premium-hero__copy">
          <p className="eyebrow">dot × SM ENTERTAINMENT · ACCESSIBLE K-POP CONCERT EXPERIENCE</p>
          <div className="premium-status-row" aria-label="시연 상태">
            <span className="premium-live-badge"><span aria-hidden="true" />LIVE TACTILE LAB</span>
            <span className="premium-status-chip">60×40 Dot Pad Preview</span>
            <span className="premium-status-chip">Screen reader ready</span>
          </div>
          <h1 id="landing-title" className="landing__title premium-title">
            Touch <span className="pink">the</span> K-POP
          </h1>
          <p className="landing__sub premium-subtitle">
            Live tactile cue sheets for lyrics, choreography, stage effects, and audience energy —
            보이지 않는 공연을 손끝으로 읽고, 느끼고, 따라갈 수 있는 프리미엄 접근성 인터페이스입니다.
          </p>
          <div className="premium-hero__actions" aria-label="추천 시작 경로">
            <a className="btn btn--primary btn--xl" href="#/sm">SM Demo 시작</a>
            <a className="btn btn--secondary btn--xl" href="#/audience">Audience Mode</a>
          </div>
        </div>

        <div className="premium-hero__visual" aria-label="촉각 핀과 라이브 큐 흐름을 표현한 미리보기" role="img">
          <div className="premium-pad-frame">
            <div className="premium-pad-head">
              <span>DOT PAD OUTPUT</span>
              <strong>Connected · 8ms</strong>
            </div>
            <div className="premium-dot-matrix" aria-hidden="true">
              {Array.from({ length: 240 }, (_, i) => (
                <span key={i} className={(i % 11 === 0 || i % 17 === 0 || (i > 80 && i < 145 && i % 5 === 0)) ? 'is-raised' : ''} />
              ))}
            </div>
            <div className="premium-braille-strip" aria-hidden="true">⠠⠞⠕⠥⠉⠓⠀⠞⠓⠑⠀⠅⠤⠏⠕⠏</div>
          </div>
        </div>
      </section>

      <section className="premium-metrics" aria-label="핵심 가치">
        <article>
          <span className="mono">01</span>
          <strong>Blind-first flow</strong>
          <p>스크린리더, 키보드, 큰 터치 타깃, 명확한 상태 안내를 기본값으로 설계했습니다.</p>
        </article>
        <article>
          <span className="mono">02</span>
          <strong>Live performance control</strong>
          <p>가사·비트·안무·FX 큐를 운영자와 관객 화면에 동시에 송출합니다.</p>
        </article>
        <article>
          <span className="mono">03</span>
          <strong>Executive-ready story</strong>
          <p>SM·파트너·학교·뮤지엄 발표에서 바로 이해되는 데모 구조로 정리했습니다.</p>
        </article>
      </section>

      <nav id="mode-navigation" className="landing__cards premium-mode-nav" aria-label="프로토타입 모드 선택">
        {MODE_LINKS.map((item, index) => (
          <a
            key={item.route}
            className={`landing__card premium-mode-card ${item.recommended ? 'is-recommended' : ''}`}
            href={item.href}
            aria-current={activeIndex === index ? 'page' : undefined}
          >
            <span className="landing__card-icon premium-mode-card__icon" aria-hidden="true">{item.icon}</span>
            <span className="premium-mode-card__body">
              <span className="premium-mode-card__eyebrow">{item.eyebrow}</span>
              <strong>{item.label}</strong>
              <span className="dim">{item.desc}</span>
            </span>
            {item.recommended && <span className="premium-reco">추천</span>}
          </a>
        ))}
      </nav>

      <p className="caption dim landing__hint premium-footnote">
        두 탭으로 열어도 실시간 연동됩니다(BroadcastChannel). 그룹·가사·그래픽은 데모용 가상 창작물이며, 외부 저작권 이미지 없이 구성했습니다.
      </p>
    </main>
  );
}
