const { useState: useLandingState, useEffect: useLandingEffect, useRef: useLandingRef } = React;

const MARQUEE_TEXT = 'Ballpark Tools';
const LETTER_COUNT = MARQUEE_TEXT.length;

const SCRAMBLE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const scrambleText = (original, revealProgress) => {
  // revealProgress: 0..1 (left-to-right reveal)
  const revealCount = Math.floor(revealProgress * original.length);

  return original
    .split('')
    .map((ch, i) => {
      if (i < revealCount) return ch;
      // Don't scramble digits (keeps counters/pills readable)
      if (/[0-9]/.test(ch)) return ch;
      // Keep whitespace + punctuation stable.
      if (!/[A-Za-z0-9]/.test(ch)) return ch;
      const randIndex = Math.floor(Math.random() * SCRAMBLE_ALPHABET.length);
      return SCRAMBLE_ALPHABET[randIndex];
    })
    .join('');
};

const LandingPage = ({ onSelectTool, isDayGame, onToggleDayGame }) => {
  const [marqueeHovered, setMarqueeHovered] = useLandingState(false);
  const [scatter, setScatter] = useLandingState(() =>
    Array(LETTER_COUNT).fill(0).map(() => ({ x: 0, y: 0, r: 0 }))
  );

  const heroParagraph =
    "Ballpark’s generative tools extend the brand system beyond static guidelines, letting the dugout spin up on-brand assets quickly, consistently, and at scale. These aren’t shortcuts—they’re disciplined systems that keep the structure intact while taking the manual labor out of making assets, so the same Ballpark precision shows up on every field we play on.";
  const [heroDisplay, setHeroDisplay] = useLandingState(() =>
    scrambleText(heroParagraph, 0)
  );

  useLandingEffect(() => {
    const DELAY_MS = 1000;
    const DURATION_MS = 1700;
    let raf = 0;
    let start = 0;
    const timeout = setTimeout(() => {
      start = Date.now();
      raf = requestAnimationFrame(tick);
    }, DELAY_MS);

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / DURATION_MS);
      setHeroDisplay(scrambleText(heroParagraph, progress));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setHeroDisplay(heroParagraph);
      }
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  const topEyebrowText = 'BALLPARK TOOLS';
  const bottomEyebrowText = 'Brand guidelines, in motion.';
  const [topEyebrowDisplay, setTopEyebrowDisplay] = useLandingState(() =>
    scrambleText(topEyebrowText, 0)
  );
  const [bottomEyebrowDisplay, setBottomEyebrowDisplay] = useLandingState(() =>
    scrambleText(bottomEyebrowText, 0)
  );

  useLandingEffect(() => {
    const DELAY_MS = 350;
    const DURATION_MS = 950;
    let raf = 0;
    let timeout = 0;

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / DURATION_MS);
      setTopEyebrowDisplay(scrambleText(topEyebrowText, progress));
      setBottomEyebrowDisplay(scrambleText(bottomEyebrowText, progress));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTopEyebrowDisplay(topEyebrowText);
        setBottomEyebrowDisplay(bottomEyebrowText);
      }
    };

    timeout = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, DELAY_MS);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const tools = [
    {
      id: 'icon',
      name: 'Dot Matrix Icon',
      description: 'Convert images into 24x24 dot matrix icons with customizable colors and threshold controls.',
      previewImage: '/images/dot-matrix-icon.png',
      icon: (
        <svg className="w-12 h-12 text-bp-blue" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      features: ['24x24 grid', 'Auto-invert detection', 'SVG & PNG export']
    },
    {
      id: 'art',
      name: 'Dot Matrix Art',
      description: 'Transform full images into artistic dot patterns with variable resolution and color controls.',
      previewImage: '/images/dot-matrix-art.png',
      icon: (
        <svg className="w-12 h-12 text-bp-grass" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      ),
      features: ['20-150 dot resolution', 'Single color mode', 'Opacity controls']
    },
    {
      id: 'pattern',
      name: 'Dot Pattern Generator',
      description: 'Create generative corner-biased dot patterns with seeded randomization and multi-color palettes.',
      previewImage: '/images/dot-pattern-generator.png',
      icon: (
        <svg className="w-12 h-12 text-bp-mustard" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      ),
      features: ['Corner-biased distribution', 'Multi-color clustering', 'Seeded patterns']
    },
    {
      id: 'billboard',
      name: 'Dot Billboard Text',
      description: 'Create scrolling LED-style text displays with 5x7 dot matrix font and animation controls.',
      previewImage: '/images/dot-billboard-text.png',
      icon: (
        <svg className="w-12 h-12 text-bp-sky" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <line x1="7" y1="10" x2="7" y2="14"/>
          <line x1="12" y1="10" x2="12" y2="14"/>
          <line x1="17" y1="10" x2="17" y2="14"/>
        </svg>
      ),
      features: ['Scrolling animation', 'Custom text', 'Speed controls']
    },
    {
      id: 'video',
      name: 'Dot Matrix Video',
      description: 'Turn uploaded videos into animated dot-matrix playback with recording and download.',
      previewImage: '/images/dot-matrix-video.png',
      icon: (
        <svg className="w-12 h-12 text-bp-blue" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="6" width="14" height="12" rx="2"/>
          <path d="M17 10l4-2v8l-4-2v-2z"/>
        </svg>
      ),
      features: ['Frame-by-frame filter', 'Threshold + detail', 'Record & download']
    },
    {
      id: 'ballparkify',
      name: 'Baseball Idioms',
      description: 'Generate random baseball idioms and slang from a collection of 100+ classic phrases.',
      previewImage: '/images/ballparkify.png',
      icon: (
        <svg className="w-12 h-12 text-bp-glove" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3c-2 2-2 7 0 9s7 0 9 0"/>
          <path d="M3 12c2 2 7 2 9 0s0-7 0-9"/>
        </svg>
      ),
      features: ['100+ idioms', 'Random generation', 'Copy to clipboard']
    }
  ];

  return (
    <div className={`min-h-screen text-bp-blue relative z-1 ${isDayGame ? 'bg-bp-mound' : 'bg-bp-eyeblack'}`}>
      <header className={`${isDayGame ? 'bg-bp-mound' : 'bg-bp-eyeblack'}`}>
        <div className="py-4">
          <div className="flex items-start justify-between mb-8 px-4">
            <p className="text-sm uppercase font-eyebrow text-justify">
              {topEyebrowDisplay}
            </p>
            <button
              type="button"
              onClick={onToggleDayGame}
              className={`relative flex w-[72px] h-8 rounded-full overflow-hidden ${
                isDayGame ? 'bg-bp-mound' : 'bg-bp-eyeblack'
              }`}
              aria-label={isDayGame ? 'Switch to night game' : 'Switch to day game'}
            >
                <span
                  className={`absolute top-0 left-0 h-full w-1/2 rounded-full bg-bp-blue transition-transform duration-150 ${isDayGame ? 'translate-x-0' : 'translate-x-full'}`}
                aria-hidden
              />
              <span className="relative z-10 flex-1 flex items-center justify-center">
                <svg
                  className={`w-4 h-4 shrink-0 ${isDayGame ? 'text-bp-chalk' : 'text-bp-blue'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
              <span className="relative z-10 flex-1 flex items-center justify-center">
                <svg
                  className={`w-4 h-4 shrink-0 ${isDayGame ? 'text-bp-blue' : 'text-bp-chalk'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
            </button>
          </div>

          {/* Scrolling BP Dots hero text – letters scatter on hover */}
          <div className="overflow-hidden my-12">
            <div
              className="flex gap-24 whitespace-nowrap animate-marquee text-[18vw] font-billboard tracking-[20%] uppercase text-bp-blue cursor-default"
              onMouseEnter={() => {
                setScatter(
                  Array(LETTER_COUNT)
                    .fill(0)
                    .map(() => ({
                      x: (Math.random() - 0.5) * 100,
                      y: (Math.random() - 0.5) * 80,
                      r: (Math.random() - 0.5) * 24,
                    }))
                );
                setMarqueeHovered(true);
              }}
              onMouseLeave={() => setMarqueeHovered(false)}
            >
              {[0, 1, 2, 3].map((copy) => (
                <span key={copy} className="inline-flex">
                  {MARQUEE_TEXT.split('').map((char, i) => (
                    <span
                      key={`${copy}-${i}`}
                      className="inline-block transition-transform duration-300 ease-out"
                      style={{
                        transform: marqueeHovered
                          ? `translate(${scatter[i].x}px, ${scatter[i].y}px) rotate(${scatter[i].r}deg)`
                          : 'translate(0,0) rotate(0deg)',
                        transitionDelay: marqueeHovered ? `${i * 18}ms` : '0ms',
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          {/* Centered hero copy */}
          <div className="max-w-6xl px-4 mx-auto space-y-4 text-left columns-1 md:columns-2" style={{ columnGap: '64px' }}>
            <p className="text-body">{heroDisplay}</p>
          </div>

        </div>
      </header>

      <main className="w-full px-4 lg:px-6 my-24">
        <ol className="space-y-6">
          {tools.map((tool, index) => (
            <ToolRow
              key={tool.id}
              index={index + 1}
              tool={tool}
              onSelectTool={onSelectTool}
              isDayGame={isDayGame}
            />
          ))}
        </ol>

        <div className="mt-16 text-center text-xs uppercase font-eyebrow">
          <p>{bottomEyebrowDisplay}</p>
        </div>
      </main>
    </div>
  );
};

const ToolRow = ({ index, tool, onSelectTool, isDayGame }) => {
  const [isHovering, setIsHovering] = useLandingState(false);
  const [cursorPos, setCursorPos] = useLandingState({ x: 0, y: 0 });
  const cardRef = useLandingRef(null);

  const titleText = tool.name;
  const descText = tool.description;
  const badgeText = index.toString().padStart(2, '0');
  const [badgeDisplay, setBadgeDisplay] = useLandingState(() => scrambleText(badgeText, 0));

  const [titleDisplay, setTitleDisplay] = useLandingState(() =>
    scrambleText(titleText, 0)
  );
  const [descDisplay, setDescDisplay] = useLandingState(() =>
    scrambleText(descText, 0)
  );

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  useLandingEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    let hasStarted = false;
    let raf = 0;
    let timeout = 0;

    const DELAY_MS = 250;
    const DURATION_MS = 1000;

    const start = () => {
      if (hasStarted) return;
      hasStarted = true;

      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / DURATION_MS);
        setTitleDisplay(scrambleText(titleText, progress));
        setDescDisplay(scrambleText(descText, progress));
        setBadgeDisplay(scrambleText(badgeText, progress));

        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setTitleDisplay(titleText);
          setDescDisplay(descText);
          setBadgeDisplay(badgeText);
        }
      };

      timeout = setTimeout(() => {
        raf = requestAnimationFrame(tick);
      }, DELAY_MS);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (timeout) clearTimeout(timeout);
    };
  }, [tool.id]);

  return (
    <li
      className="group/callout grid lg:grid-cols-3 gap-4 lg:gap-6 cursor-pointer"
      onClick={() => onSelectTool(tool.id)}
      ref={cardRef}
    >
      {/* Left column: preview */}
      <div
        className="lg:col-span-2 relative rounded border border-bp-blue overflow-hidden lg:min-h-[220px] lg:min-h-[320px] flex items-center justify-center aspect-video"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMove}
      >
        {tool.previewImage ? (
          <img
            src={tool.previewImage}
            alt={`${tool.name} preview`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <>
            <div
              className={`absolute inset-5 border border-dashed rounded pointer-events-none ${
                isDayGame ? 'border-bp-blue/40' : 'border-bp-eyeblack/40'
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs uppercase text-bp-blue">Drop a GIF preview in this frame</span>
            </div>
          </>
        )}

        {isHovering && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="px-4 py-1 rounded-full bg-bp-blue text-2xl uppercase shadow-lg border border-bp-blue font-eyebrow whitespace-nowrap text-bp-chalk">
              Launch tool
            </div>
          </div>
        )}
      </div>

      {/* Right column: meta card */}
      <div className="bg-transparent border border-bp-blue rounded p-4 md:p-8 flex flex-col justify-between space-y-4 group-hover/callout:bg-bp-blue gap-8">
        <div className="flex flex-col gap-3 text-bp-blue">
          <div className={`w-8 h-8 flex items-center justify-center text-sm uppercase font-eyebrow rounded-full bg-bp-blue ${isDayGame ? 'text-bp-mound' : 'text-bp-eyeblack'} group-hover/callout:bg-bp-chalk group-hover/callout:text-bp-blue transition-colors`}>
            {badgeDisplay}
          </div>
          <h2 className="text-xl lg:text-4xl tracking-tight group-hover/callout:text-bp-chalk">
            {titleDisplay}
          </h2>
          <p className="text-base leading-tight max-w-xl text-bp-blue transition-colors group-hover/callout:text-bp-chalk text-balance">
            {descDisplay}
          </p>
        </div>

        <div className="flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTool(tool.id);
            }}
            className="w-full px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity group-hover/callout:bg-bp-chalk group-hover/callout:text-bp-blue"
          >
            Launch tool
          </button>
        </div>
      </div>

    </li>
  );
};

