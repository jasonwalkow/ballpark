const { useState, useEffect } = React;

const TOOL_ORDER = ['home', 'icon', 'art', 'pattern', 'billboard', 'video', 'ballparkify'];
const TOOL_LABELS = {
  home: 'Home',
  icon: 'Icon',
  art: 'Art',
  pattern: 'Pattern',
  billboard: 'Billboard',
  video: 'Video',
  ballparkify: 'Idioms',
};

const toolInfo = {
  home: {
    title: 'Ballpark Design Tools',
    description: 'Tool Directory',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  icon: {
    title: 'Dot Matrix Icon',
    description: '24x24 icon generator',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  art: {
    title: 'Dot Matrix Art',
    description: 'Full image converter',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="12" cy="5" r="1"/>
        <circle cx="12" cy="19" r="1"/>
        <circle cx="5" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="7.5" cy="7.5" r="1"/>
        <circle cx="16.5" cy="16.5" r="1"/>
        <circle cx="7.5" cy="16.5" r="1"/>
        <circle cx="16.5" cy="7.5" r="1"/>
      </svg>
    )
  },
  pattern: {
    title: 'Dot Pattern Generator',
    description: 'Generative corner patterns',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="4" cy="4" r="1" fill="currentColor"/>
        <circle cx="4" cy="8" r="1" fill="currentColor"/>
        <circle cx="8" cy="4" r="1" fill="currentColor"/>
        <circle cx="20" cy="4" r="1" fill="currentColor"/>
        <circle cx="20" cy="8" r="1" fill="currentColor"/>
        <circle cx="16" cy="4" r="1" fill="currentColor"/>
        <circle cx="4" cy="20" r="1" fill="currentColor"/>
        <circle cx="4" cy="16" r="1" fill="currentColor"/>
        <circle cx="8" cy="20" r="1" fill="currentColor"/>
        <circle cx="20" cy="20" r="1" fill="currentColor"/>
        <circle cx="20" cy="16" r="1" fill="currentColor"/>
        <circle cx="16" cy="20" r="1" fill="currentColor"/>
      </svg>
    )
  },
  billboard: {
    title: 'Dot Billboard Text',
    description: 'Scrolling text animation',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <line x1="7" y1="10" x2="7" y2="14"/>
        <line x1="12" y1="10" x2="12" y2="14"/>
        <line x1="17" y1="10" x2="17" y2="14"/>
      </svg>
    )
  },
  video: {
    title: 'Dot Matrix Video',
    description: 'Frame-by-frame video dot filter + recording',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="6" width="14" height="12" rx="2" />
        <path d="M17 10l4-2v8l-4-2v-2z" />
      </svg>
    )
  },
  ballparkify: {
    title: 'Baseball Idioms',
    description: 'Random baseball slang',
    icon: (
      <svg className="w-3 h-3 text-bp-chalk" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3c-2 2-2 7 0 9s7 0 9 0"/>
        <path d="M3 12c2 2 7 2 9 0s0-7 0-9"/>
      </svg>
    )
  }
};

const FloatingToolNav = ({ currentTool, onToolChange, isDayGame }) => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" aria-label="Quick tool navigation">
      <div
        className={[
          'pointer-events-auto flex items-center gap-1 rounded-full backdrop-blur px-1 py-1 shadow-[0_18px_50px_rgba(0,0,0,0.35)]',
          isDayGame ? 'border border-bp-blue/20 bg-bp-mound/90' : 'border border-bp-chalk/20 bg-bp-eyeblack/95',
        ].join(' ')}
      >
        {TOOL_ORDER.map((tool) => {
          const active = currentTool === tool;
          const isHome = tool === 'home';

          return (
            <button
              key={tool}
              type="button"
              onClick={() => onToolChange(tool)}
              className={[
                'relative inline-flex items-center justify-center rounded-full h-9',
                isHome ? 'w-9' : 'w-9 md:w-auto md:px-3',
                'uppercase font-eyebrow text-xs transition-colors',
                active
                  ? 'bg-bp-blue text-bp-chalk'
                  : isDayGame
                  ? 'text-bp-eyeblack hover:bg-bp-eyeblack/5'
                  : 'text-bp-chalk hover:bg-bp-chalk/10',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-bp-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
              aria-label={isHome ? 'Home' : `Open ${TOOL_LABELS[tool]}`}
            >
              {isHome ? (
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ) : (
                <>
                  <span className="md:hidden shrink-0 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0">
                    {React.cloneElement(toolInfo[tool].icon, { className: 'w-4 h-4 shrink-0' })}
                  </span>
                  <span className="hidden md:inline">{TOOL_LABELS[tool]}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const App = () => {
  const getInitialToolFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('tool');
      if (fromQuery && toolInfo[fromQuery]) return fromQuery;
    } catch (e) {}
    if (window && window.INITIAL_TOOL && toolInfo[window.INITIAL_TOOL]) {
      return window.INITIAL_TOOL;
    }
    return 'home';
  };

  const [currentTool, setCurrentTool] = useState(getInitialToolFromUrl);
  const [isDayGame, setIsDayGame] = useState(false);

  // Sync tool changes to the URL (?tool=...) and handle back/forward
  useEffect(() => {
    const updateUrl = (tool) => {
      try {
        const url = new URL(window.location.href);
        if (tool === 'home') {
          url.searchParams.delete('tool');
        } else {
          url.searchParams.set('tool', tool);
        }
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    };

    updateUrl(currentTool);

    const handlePopState = () => {
      setCurrentTool(getInitialToolFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool]);

  const isHome = currentTool === 'home';
  const appLight = isHome && isDayGame;

  return (
    <div
      className={[
        'min-h-screen',
        appLight ? 'bg-bp-mound text-bp-eyeblack' : 'bg-bp-eyeblack text-bp-chalk',
      ].join(' ')}
    >
      {isHome ? (
        <LandingPage
          onSelectTool={setCurrentTool}
          isDayGame={isDayGame}
          onToggleDayGame={() => setIsDayGame((prev) => !prev)}
        />
      ) : currentTool === 'icon' ? (
        <DotMatrixIconTool />
      ) : currentTool === 'art' ? (
        <DotMatrixArtTool />
      ) : currentTool === 'pattern' ? (
        <DotPatternGeneratorTool />
      ) : currentTool === 'billboard' ? (
        <DotBillboardTool />
      ) : currentTool === 'video' ? (
        <DotMatrixVideoTool />
      ) : (
        <BallparkifyTool />
      )}

      <FloatingToolNav currentTool={currentTool} onToolChange={setCurrentTool} isDayGame={isHome ? isDayGame : false} />
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

