const {
  useState: usePatternState,
  useRef: usePatternRef,
  useCallback: usePatternCallback,
  useEffect: usePatternEffect,
} = React;

const DotPatternGeneratorTool = () => {
  const [width, setWidth] = usePatternState(1200);
  const [height, setHeight] = usePatternState(800);
  const [bgColor, setBgColor] = usePatternState('#0e0e0e');
  const [transparent, setTransparent] = usePatternState(false);
  const [gridSpacing, setGridSpacing] = usePatternState(17);
  const [dotSize, setDotSize] = usePatternState(10);
  const [cornerIntensity, setCornerIntensity] = usePatternState(0.57);
  const [falloff, setFalloff] = usePatternState(0.31);
  const [centerQuietRadius, setCenterQuietRadius] = usePatternState(0.34);
  const [centerSoftness, setCenterSoftness] = usePatternState(0.56);
  const [organicJitter, setOrganicJitter] = usePatternState(0.45);
  const [seed, setSeed] = usePatternState('pattern-001');
  
  const [colors, setColors] = usePatternState([
    '#1141FF',
    '#DEB5A4',
    '#CEDC9E',
    '#EAC9ED',
    '#F5E5A3',
    '#F3EFFE',
    '#D4E4FF'
  ]);

  const canvasRef = usePatternRef(null);
  const [dotCount, setDotCount] = usePatternState(0);

  const generatePattern = usePatternCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    if (transparent) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Used for probability randomness so the dot field stays organic.
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const rand = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };

    const cols = Math.floor(width / gridSpacing);
    const rows = Math.floor(height / gridSpacing);
    let count = 0;

    // Coarse color clustering (swatches) so adjacent dots tend to share colors.
    // Uses a separate deterministic hash so we don't introduce per-dot color jitter.
    let seedHash = 0;
    for (let i = 0; i < seed.length; i++) {
      seedHash = ((seedHash << 5) - seedHash) + seed.charCodeAt(i);
      seedHash |= 0;
    }
    const clusterCells = Math.max(2, Math.round(60 / gridSpacing));

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let nx = cols > 1 ? x / (cols - 1) : 0.5;
        let ny = rows > 1 ? y / (rows - 1) : 0.5;

        if (organicJitter > 0) {
          nx += (rand() - 0.5) * organicJitter * 0.1;
          ny += (rand() - 0.5) * organicJitter * 0.1;
        }

        const d1 = Math.sqrt(nx * nx + ny * ny) / Math.sqrt(2);
        const d2 = Math.sqrt((1-nx) * (1-nx) + ny * ny) / Math.sqrt(2);
        const d3 = Math.sqrt(nx * nx + (1-ny) * (1-ny)) / Math.sqrt(2);
        const d4 = Math.sqrt((1-nx) * (1-nx) + (1-ny) * (1-ny)) / Math.sqrt(2);
        
        const minDist = Math.min(d1, d2, d3, d4);

        const cornerValue = Math.pow(1 - minDist, 1 + falloff * 3);

        // Normalize center distance to 0..1 (0 at center, 1 at corners)
        const distCenter = Math.sqrt((nx - 0.5) * (nx - 0.5) + (ny - 0.5) * (ny - 0.5)) / Math.SQRT1_2;
        
        let centerFactor = 1;
        if (distCenter < centerQuietRadius) {
          centerFactor = 0;
        } else if (distCenter < centerQuietRadius + centerSoftness) {
          const t = (distCenter - centerQuietRadius) / Math.max(0.01, centerSoftness);
          centerFactor = t * t * (3 - 2 * t);
        }

        const probability = cornerIntensity * cornerValue * centerFactor;

        if (rand() < probability) {
          const clusterX = Math.floor(x / clusterCells);
          const clusterY = Math.floor(y / clusterCells);
          const clusterHash = (clusterX * 73856093) ^ (clusterY * 19349663) ^ seedHash;
          const color = colors[Math.abs(clusterHash) % colors.length];
          
          const px = x * gridSpacing + gridSpacing / 2;
          const py = y * gridSpacing + gridSpacing / 2;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
          count++;
        }
      }
    }

    setDotCount(count);
  }, [width, height, bgColor, transparent, gridSpacing, dotSize, cornerIntensity, falloff, centerQuietRadius, centerSoftness, organicJitter, seed, colors]);

  usePatternEffect(() => {
    generatePattern();
  }, [generatePattern]);

  const addColor = () => {
    setColors([...colors, '#F9F9F9']);
  };

  const removeColor = (index) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const updateColor = (index, value) => {
    const newColors = [...colors];
    newColors[index] = value.startsWith('#') ? value : '#' + value;
    setColors(newColors);
  };

  const randomSeed = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = 'pattern-';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setSeed(s);
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dot-pattern.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
  };

  const downloadSVG = () => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const rand = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };

    const cols = Math.floor(width / gridSpacing);
    const rows = Math.floor(height / gridSpacing);

    // Coarse color clustering (swatches) so adjacent dots tend to share colors.
    // Kept deterministic so the SVG matches the canvas output.
    let seedHash = 0;
    for (let i = 0; i < seed.length; i++) {
      seedHash = ((seedHash << 5) - seedHash) + seed.charCodeAt(i);
      seedHash |= 0;
    }
    const clusterCells = Math.max(2, Math.round(60 / gridSpacing));

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`;
    if (!transparent) svg += `  <rect width="${width}" height="${height}" fill="${bgColor}"/>\n`;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let nx = x / (cols - 1 || 1);
        let ny = y / (rows - 1 || 1);

        if (organicJitter > 0) {
          nx += (rand() - 0.5) * organicJitter * 0.1;
          ny += (rand() - 0.5) * organicJitter * 0.1;
        }

        const d1 = Math.sqrt(nx * nx + ny * ny) / Math.sqrt(2);
        const d2 = Math.sqrt((1-nx)*(1-nx) + ny*ny) / Math.sqrt(2);
        const d3 = Math.sqrt(nx*nx + (1-ny)*(1-ny)) / Math.sqrt(2);
        const d4 = Math.sqrt((1-nx)*(1-nx) + (1-ny)*(1-ny)) / Math.sqrt(2);
        const minDist = Math.min(d1, d2, d3, d4);
        const cornerValue = Math.pow(1 - minDist, 1 + falloff * 3);
        // Normalize center distance to 0..1 (0 at center, 1 at corners)
        const distCenter = Math.sqrt((nx-0.5)*(nx-0.5) + (ny-0.5)*(ny-0.5)) / Math.SQRT1_2;
        
        let centerFactor = 1;
        if (distCenter < centerQuietRadius) {
          centerFactor = 0;
        } else if (distCenter < centerQuietRadius + centerSoftness) {
          const t = (distCenter - centerQuietRadius) / Math.max(0.01, centerSoftness);
          centerFactor = t * t * (3 - 2 * t);
        }

        const probability = cornerIntensity * cornerValue * centerFactor;

        if (rand() < probability) {
          const clusterX = Math.floor(x / clusterCells);
          const clusterY = Math.floor(y / clusterCells);
          const clusterHash = (clusterX * 73856093) ^ (clusterY * 19349663) ^ seedHash;
          const color = colors[Math.abs(clusterHash) % colors.length];
          const px = x * gridSpacing + gridSpacing / 2;
          const py = y * gridSpacing + gridSpacing / 2;
          svg += `  <circle cx="${px}" cy="${py}" r="${dotSize/2}" fill="${color}"/>\n`;
        }
      }
    }

    svg += '</svg>';
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dot-pattern.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="flex flex-col md:flex-row md:h-screen min-h-screen bg-bp-eyeblack">
      <div className="order-2 lg:order-2 w-full md:w-[380px] bg-bp-eyeblack border-l border-bp-eyeblack/60 p-6 overflow-y-auto">
        <section className="sticky top-0 z-10 bg-bp-eyeblack mb-6 border-b border-bp-eyeblack/60 pb-4">
          <h1 className="text-lg md:text-2xl text-bp-blue font-normal mb-1">
            Dot Pattern Generator
          </h1>
          <p className="text-xs text-bp-chalk text-justify">
            Generate seeded dot fields that always land on-brand. Dial in spacing, corners, and color clusters until it feels like a backdrop, not a focal.
          </p>
        </section>
        <div className="space-y-5 flex flex-col h-full">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-bp-chalk">Width (px)</label>
              <input type="number" value={width} onChange={e => setWidth(+e.target.value || 0)}
                className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-bp-chalk">Height (px)</label>
              <input type="number" value={height} onChange={e => setHeight(+e.target.value || 0)}
                className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-bp-chalk">Background Color</label>
            <div className="flex gap-2">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} disabled={transparent}
                className="w-12 h-9 rounded bg-bp-chalk/5 cursor-pointer" />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-chalk text-sm">#</span>
                <input type="text" value={bgColor.replace('#', '')} onChange={e => setBgColor('#' + e.target.value)} disabled={transparent}
                  className="w-full bg-bp-chalk/5 text-bp-chalk pl-7 pr-3 py-2 rounded text-sm font-mono uppercase" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)}
                className="w-4 h-4 accent-bp-blue" />
              <span className="text-sm text-bp-chalk">Transparent background</span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-bp-chalk">Dot Colors</label>
              <button onClick={addColor} className="text-xs px-2 py-1 bg-bp-blue text-bp-chalk rounded">
                + Add
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {colors.map((color, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="color" value={color} onChange={e => updateColor(i, e.target.value)}
                    className="w-10 h-9 rounded bg-bp-chalk/5 cursor-pointer" />
                  <div className="flex-1 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-bp-chalk text-xs">#</span>
                    <input type="text" value={color.replace('#', '')}
                      onChange={e => updateColor(i, '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                      maxLength={6}
                      className="w-full bg-bp-chalk/5 text-bp-chalk pl-6 pr-2 py-2 rounded text-xs font-mono uppercase" />
                  </div>
                  {colors.length > 1 && (
                    <button onClick={() => removeColor(i)} className="text-bp-blue hover:text-bp-chalk text-xl w-6 h-6 transition-colors">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Grid spacing</label><span className="text-sm text-bp-chalk">{gridSpacing}</span></div>
            <input type="range" value={gridSpacing} onChange={e => setGridSpacing(+e.target.value)} min="10" max="50" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Dot size</label><span className="text-sm text-bp-chalk">{dotSize}</span></div>
            <input type="range" value={dotSize} onChange={e => setDotSize(+e.target.value)} min="2" max="20" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Corner intensity</label><span className="text-sm text-bp-chalk">{cornerIntensity.toFixed(2)}</span></div>
            <input type="range" value={cornerIntensity} onChange={e => setCornerIntensity(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Falloff (tight → wide)</label><span className="text-sm text-bp-chalk">{falloff.toFixed(2)}</span></div>
            <input type="range" value={falloff} onChange={e => setFalloff(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Center quiet radius</label><span className="text-sm text-bp-chalk">{centerQuietRadius.toFixed(2)}</span></div>
            <input type="range" value={centerQuietRadius} onChange={e => setCenterQuietRadius(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Center softness</label><span className="text-sm text-bp-chalk">{centerSoftness.toFixed(2)}</span></div>
            <input type="range" value={centerSoftness} onChange={e => setCenterSoftness(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-bp-chalk">Organic jitter</label><span className="text-sm text-bp-chalk">{organicJitter.toFixed(2)}</span></div>
            <input type="range" value={organicJitter} onChange={e => setOrganicJitter(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-bp-blue" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-bp-chalk">Seed</label>
            <input type="text" value={seed} onChange={e => setSeed(e.target.value)}
              className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm font-mono" />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={generatePattern} className="px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm w-auto">Regenerate</button>
            <button onClick={randomSeed} className="px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm w-auto">Random seed</button>
          </div>

          <div className="sticky bottom-0 z-10 bg-bp-eyeblack pt-4 border-t border-bp-eyeblack/60 mt-auto">
            <div className="flex w-full items-center justify-between gap-4">
              <button
                onClick={downloadSVG}
                className="flex items-center gap-2 w-auto px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download SVG
              </button>
              <button
                onClick={downloadPNG}
                className="flex items-center gap-2 w-auto px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PNG
              </button>
            </div>
          </div>

          <p className="text-bp-chalk text-sm text-center">{width} × {height}px • {dotCount} dots</p>
        </div>
      </div>

      <div className="order-1 lg:order-1 flex-1 flex items-center justify-center p-4 md:p-6 bg-bp-eyeblack">
        <canvas ref={canvasRef} className="border border-bp-blue rounded shadow-2xl" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    </div>
  );
};

