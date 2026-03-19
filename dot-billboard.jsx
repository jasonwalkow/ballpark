const {
  useState: useBillboardState,
  useRef: useBillboardRef,
  useEffect: useBillboardEffect,
} = React;

const DotBillboardTool = () => {
  const [words, setWords] = useBillboardState(['HELLO', 'WORLD']);
  const [inputText, setInputText] = useBillboardState('HELLO WORLD');
  const [dotSize, setDotSize] = useBillboardState(12);
  const [spacing, setSpacing] = useBillboardState(4);
  const [dotColor, setDotColor] = useBillboardState('#9CA3B0');
  const [backgroundColor, setBackgroundColor] = useBillboardState('#0A0A0A');
  const [scrollSpeed, setScrollSpeed] = useBillboardState(80);
  const [isPlaying, setIsPlaying] = useBillboardState(true);

  const canvasRef = useBillboardRef(null);
  const animationRef = useBillboardRef(null);
  const scrollOffsetRef = useBillboardRef(0);

  const dotFont = {
    'A': [[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
    'B': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0]],
    'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
    'D': [[1,1,1,0,0],[1,0,0,1,0],[1,0,0,0,1],[1,0,0,1,0],[1,1,1,0,0]],
    'E': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
    'F': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
    'G': [[0,1,1,1,0],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[0,1,1,1,0]],
    'H': [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
    'I': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
    'J': [[0,0,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0]],
    'K': [[1,0,0,0,1],[1,0,0,1,0],[1,1,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
    'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
    'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'P': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
    'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,1,0],[0,1,1,0,1]],
    'R': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,1,0],[1,0,0,0,1]],
    'S': [[0,1,1,1,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'V': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0]],
    'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
    'X': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
    'Y': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'Z': [[1,1,1,1,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1]],
    '0': [[0,1,1,1,0],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[0,1,1,1,0]],
    '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
    '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[1,1,1,1,1]],
    '3': [[1,1,1,1,0],[0,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
    '4': [[1,0,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
    '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
    '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
    '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
    '8': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
    '9': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,1,1,1,0]],
    ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
    '!': [[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0]],
    '?': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,1,0],[0,0,0,0,0],[0,0,1,0,0]],
  };

  const textToDots = (text) => {
    const dots = [];
    let xOffset = 0;
    
    for (let char of text.toUpperCase()) {
      const pattern = dotFont[char] || dotFont[' '];
      
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          if (pattern[y][x] === 1) {
            dots.push({ x: xOffset + x, y: y });
          }
        }
      }
      xOffset += 6;
    }
    
    return dots;
  };

  const handleTextUpdate = () => {
    const newWords = inputText.trim().split(/\s+/).filter(w => w.length > 0);
    setWords(newWords.length > 0 ? newWords : ['HELLO']);
  };

  useBillboardEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cellSize = dotSize + spacing;
    
    const viewportCols = 30;
    const viewportRows = 7;
    canvas.width = viewportCols * cellSize;
    canvas.height = viewportRows * cellSize;

    const fullText = words.join('   ') + '   ';
    const allDots = textToDots(fullText);
    
    const maxX = Math.max(...allDots.map(d => d.x), 0);
    const totalWidth = (maxX + 1) * cellSize;

    const animate = () => {
      if (isPlaying) {
        scrollOffsetRef.current = (scrollOffsetRef.current + scrollSpeed / 60) % totalWidth;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = dotColor;
      allDots.forEach(dot => {
        let x = dot.x * cellSize - scrollOffsetRef.current;
        
        while (x < canvas.width) {
          if (x > -cellSize) {
            const y = dot.y * cellSize;
            ctx.beginPath();
            ctx.arc(x + dotSize/2, y + dotSize/2, dotSize/2, 0, Math.PI * 2);
            ctx.fill();
          }
          x += totalWidth;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [words, dotSize, spacing, dotColor, backgroundColor, scrollSpeed, isPlaying]);

  return (
    <div className="flex flex-col md:flex-row md:h-screen min-h-screen overflow-hidden bg-bp-eyeblack relative z-1">
      {/* Generation zone (left) */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto bg-bp-eyeblack">
        <div className="border border-bp-blue rounded overflow-hidden shadow-2xl w-full h-full flex items-center justify-center">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Controls (right) */}
      <div className="w-full md:w-[380px] h-full bg-bp-eyeblack border-l border-bp-eyeblack/60 p-6 overflow-y-auto flex-shrink-0">
        <section className="sticky top-0 z-10 bg-bp-eyeblack mb-6 border-b border-bp-eyeblack/60 pb-4">
          <h1 className="text-lg md:text-2xl text-bp-blue font-normal mb-1">
            Dot Billboard Text
          </h1>
          <p className="text-xs text-bp-chalk text-justify">
            Start from a looping line of dots, then tune size, spacing, and speed until it feels like a stadium sign instead of a screen saver.
          </p>
        </section>

        <div className="space-y-5 flex flex-col h-full">
          <div className="flex flex-col gap-2 bg-bp-chalk/5 rounded px-3 py-2">
            <label className="text-sm text-bp-chalk">Text</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleTextUpdate()}
              placeholder="Type text here..."
              className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm font-mono uppercase"
            />
            <button
              onClick={handleTextUpdate}
              className="px-3 py-2 bg-bp-blue text-bp-chalk rounded text-sm transition-colors"
            >
              Update Text
            </button>
          </div>

          <div className="flex flex-col gap-2 bg-bp-chalk/5 rounded px-3 py-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-bp-chalk">Dot size</label>
              <span className="text-sm text-bp-chalk">{dotSize}</span>
            </div>
            <input
              type="range"
              value={dotSize}
              onChange={(e) => setDotSize(parseInt(e.target.value))}
              min="4"
              max="24"
              step="2"
              className="w-full accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 bg-bp-chalk/5 rounded px-3 py-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-bp-chalk">Spacing</label>
              <span className="text-sm text-bp-chalk">{spacing}</span>
            </div>
            <input
              type="range"
              value={spacing}
              onChange={(e) => setSpacing(parseInt(e.target.value))}
              min="0"
              max="12"
              step="1"
              className="w-full accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 bg-bp-chalk/5 rounded px-3 py-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-bp-chalk">Scroll speed</label>
              <span className="text-sm text-bp-chalk">{scrollSpeed}</span>
            </div>
            <input
              type="range"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
              min="20"
              max="200"
              step="10"
              className="w-full accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2 bg-bp-chalk/5 rounded px-3 py-2">
            <label className="text-sm text-bp-chalk">Dot color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={dotColor}
                onChange={(e) => setDotColor(e.target.value)}
                className="w-12 h-9 rounded bg-bp-chalk/5 cursor-pointer"
              />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-chalk text-sm">#</span>
                <input
                  type="text"
                  value={dotColor.replace('#', '')}
                  onChange={(e) => setDotColor('#' + e.target.value)}
                  className="w-full bg-bp-chalk/5 text-bp-chalk pl-7 pr-3 py-2 rounded text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-bp-chalk/5 rounded px-3 py-2">
            <label className="text-sm text-bp-chalk">Background color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-9 rounded bg-bp-chalk/5 cursor-pointer"
              />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-chalk text-sm">#</span>
                <input
                  type="text"
                  value={backgroundColor.replace('#', '')}
                  onChange={(e) => setBackgroundColor('#' + e.target.value)}
                  className="w-full bg-bp-chalk/5 text-bp-chalk pl-7 pr-3 py-2 rounded text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 bg-bp-eyeblack pt-4 border-t border-bp-eyeblack/60 mt-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-auto self-end px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Play
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

