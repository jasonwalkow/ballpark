const {
  useState: useArtState,
  useRef: useArtRef,
  useCallback: useArtCallback,
  useEffect: useArtEffect,
} = React;

const DotMatrixArtTool = () => {
  const [imageData, setImageData] = useArtState(null);
  const [dotSize, setDotSize] = useArtState(6);
  const [dotSpacing, setDotSpacing] = useArtState(2);
  const [gridSize, setGridSize] = useArtState(50);
  const [opacity, setOpacity] = useArtState(1);
  const [colorMode, setColorMode] = useArtState('original');
  const [dotColor, setDotColor] = useArtState('#141414');
  const [invertPattern, setInvertPattern] = useArtState(false);
  const [dotData, setDotData] = useArtState([]);

  const canvasRef = useArtRef(null);
  const fileInputRef = useArtRef(null);
  const openFileDialogOnResetRef = useArtRef(false);
  const hasLoadedDefaultRef = useArtRef(false);

  const processImage = useArtCallback(() => {
    if (!imageData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const aspectRatio = imageData.width / imageData.height;
    let gridWidth, gridHeight;

    if (aspectRatio > 1) {
      gridWidth = gridSize;
      gridHeight = Math.round(gridSize / aspectRatio);
    } else {
      gridHeight = gridSize;
      gridWidth = Math.round(gridSize * aspectRatio);
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = gridWidth;
    tempCanvas.height = gridHeight;
    
    const img = new Image();
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0, gridWidth, gridHeight);
      const data = tempCtx.getImageData(0, 0, gridWidth, gridHeight);
      const pixels = data.data;

      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };

      const rgb = colorMode === 'single' ? hexToRgb(dotColor) : null;

      const newDotData = [];
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const i = (y * gridWidth + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3] / 255;

          let finalAlpha = invertPattern ? (1 - a) : a;
          const adjustedAlpha = Math.min(finalAlpha * opacity, 1);

          if (adjustedAlpha > 0.05) {
            newDotData.push({
              x: x * (dotSize + dotSpacing) + dotSize / 2,
              y: y * (dotSize + dotSpacing) + dotSize / 2,
              r: colorMode === 'single' ? rgb.r : r,
              g: colorMode === 'single' ? rgb.g : g,
              b: colorMode === 'single' ? rgb.b : b,
              a: adjustedAlpha
            });
          }
        }
      }

      setDotData(newDotData);

      const canvasWidth = gridWidth * (dotSize + dotSpacing);
      const canvasHeight = gridHeight * (dotSize + dotSpacing);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      newDotData.forEach(dot => {
        ctx.fillStyle = `rgba(${dot.r}, ${dot.g}, ${dot.b}, ${dot.a})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = imageData.width;
    srcCanvas.height = imageData.height;
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.putImageData(imageData, 0, 0);
    img.src = srcCanvas.toDataURL();
  }, [imageData, dotSize, dotSpacing, gridSize, opacity, colorMode, dotColor, invertPattern]);

  useArtEffect(() => {
    processImage();
  }, [processImage]);

  const handleImageLoad = (data) => {
    setImageData(data);
  };

  // Load a default example image on first visit so the tool
  // opens with a ready-made artwork that users can tweak or replace.
  useArtEffect(() => {
    if (hasLoadedDefaultRef.current) return;
    if (imageData) return;
    hasLoadedDefaultRef.current = true;

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isCancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height);
      handleImageLoad(data);
    };
    img.src = "/images/catch.png";

    return () => {
      isCancelled = true;
    };
  }, [imageData]);

  const handleReset = () => {
    openFileDialogOnResetRef.current = true;
    setImageData(null);
    setDotData([]);
  };

  useArtEffect(() => {
    if (!openFileDialogOnResetRef.current) return;
    if (imageData) return; // wait until the dropzone is mounted
    openFileDialogOnResetRef.current = false;
    fileInputRef.current?.click();
  }, [imageData]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dot-matrix-art.png';
      a.click();
      window.URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const downloadSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
`;

    dotData.forEach(dot => {
      svg += `  <circle cx="${dot.x}" cy="${dot.y}" r="${dotSize / 2}" fill="rgba(${dot.r},${dot.g},${dot.b},${dot.a})"/>\n`;
    });

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dot-matrix-art.svg';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const ImageDropzone = ({ onImageLoad, fileInputRef }) => {
    const [isDragging, setIsDragging] = useArtState(false);

    const processFile = useArtCallback((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          onImageLoad(imageData);
        };
        img.src = e.target?.result;
      };
      reader.readAsDataURL(file);
    }, [onImageLoad]);

    return (
      <button
        type="button"
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) processFile(file);
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center w-full aspect-square rounded border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragging ? "border-bp-blue bg-bp-eyeblack" : "border-bp-chalk/70 hover:border-bp-blue hover:bg-bp-eyeblack"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
          className="sr-only"
        />
        <div className="flex flex-col items-center gap-4 text-bp-chalk">
          <div className="relative">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <svg className="w-3 h-3 absolute -bottom-1 -right-1 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-bp-chalk">Drop an image here</span>
            <span className="text-xs text-bp-chalk">or click to browse</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row md:h-screen min-h-screen overflow-hidden bg-bp-eyeblack relative z-1">
      {/* Generation zone (left) */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto bg-bp-eyeblack">
        {!imageData ? (
          <div className="max-w-md mx-auto flex flex-col items-center gap-8">
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl text-bp-chalk">Convert any image into dot matrix art</h2>
              <p className="text-sm text-bp-chalk">
                Upload a photo and transform it into artistic dot patterns. Works great with portraits, landscapes, and detailed images.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <ImageDropzone onImageLoad={handleImageLoad} fileInputRef={fileInputRef} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full h-full">
            <div className="rounded border border-bp-blue p-6 sm:p-10 flex items-center justify-center min-h-[400px] bg-bp-eyeblack overflow-auto h-full">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Controls (right) */}
      <div className="w-full md:w-[380px] h-full bg-bp-eyeblack border-l border-bp-eyeblack/60 p-6 overflow-y-auto flex-shrink-0">
        <div className="flex flex-col h-full">
          <section className="sticky top-0 z-10 bg-bp-eyeblack mb-6 border-b border-bp-eyeblack/60 pb-4">
            <h1 className="text-lg md:text-2xl text-bp-blue font-normal">Dot Matrix Art</h1>
            <p className="text-xs text-bp-chalk max-w-xl text-justify mt-1">
              Begin with a sample image, then nudge resolution, spacing, and opacity until the dots feel like fabric—not pixels.
            </p>
          </section>

          {!imageData ? (
            <div className="bg-bp-chalk/5 rounded px-3 py-2 text-bp-chalk/80">
              Upload an image to enable controls and export options.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm text-bp-chalk">Controls</h2>

              <div className="flex flex-col gap-6">
                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-bp-chalk">Dot Size</label>
                    <span className="text-xs font-mono text-bp-chalk">{dotSize}px</span>
                  </div>
                  <input type="range" value={dotSize} onChange={(e) => setDotSize(parseInt(e.target.value))} min="2" max="20" step="1" className="w-full" />
                </div>

                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-bp-chalk">Dot Spacing</label>
                    <span className="text-xs font-mono text-bp-chalk">{dotSpacing}px</span>
                  </div>
                  <input type="range" value={dotSpacing} onChange={(e) => setDotSpacing(parseInt(e.target.value))} min="0" max="10" step="1" className="w-full" />
                </div>

                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-bp-chalk">Resolution</label>
                    <span className="text-xs font-mono text-bp-chalk">{gridSize} dots</span>
                  </div>
                  <input type="range" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} min="20" max="150" step="5" className="w-full" />
                </div>

                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-bp-chalk">Opacity Factor</label>
                    <span className="text-xs font-mono text-bp-chalk">{opacity.toFixed(1)}</span>
                  </div>
                  <input type="range" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} min="0.5" max="2" step="0.1" className="w-full" />
                </div>

                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-2">
                  <label className="text-sm text-bp-chalk">Color Mode</label>
                  <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm">
                    <option value="original">Original Colors</option>
                    <option value="single">Single Color</option>
                  </select>
                </div>

                {colorMode === 'single' && (
                  <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-2">
                    <label className="text-sm text-bp-chalk">Dot Color</label>
                    <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)} className="w-full h-10 rounded bg-bp-chalk/5 cursor-pointer" />
                  </div>
                )}

                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-sm text-bp-chalk">Invert Pattern</label>
                    <span className="text-xs text-bp-chalk">Reverse opacity values</span>
                  </div>
                  <label className="relative inline-block w-11 h-6">
                    <input type="checkbox" checked={invertPattern} onChange={(e) => setInvertPattern(e.target.checked)} className="sr-only peer" />
                    <span className="absolute cursor-pointer inset-0 bg-bp-eyeblack rounded-full peer-checked:bg-bp-blue transition-colors"></span>
                    <span className="absolute left-1 top-1 bg-bp-chalk w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-bp-chalk"></span>
                  </label>
                </div>
              </div>

              <div className="mt-auto sticky bottom-0 z-10 bg-bp-eyeblack pt-4 flex flex-col gap-4">
                <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                  <h2 className="text-sm text-bp-chalk">Export</h2>
                  <div className="flex gap-3">
                    <button onClick={downloadPNG} className="flex-1 px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm flex items-center justify-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      PNG
                    </button>
                    <button onClick={downloadSVG} className="flex-1 px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm flex items-center justify-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      SVG
                    </button>
                  </div>
                </div>

                <div className="bg-bp-chalk/5 rounded px-3 py-2">
                  <p className="text-xs text-bp-chalk leading-relaxed">
                    Higher resolution creates more dots for finer detail. Increase opacity factor to make colors more vibrant.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-3 w-full px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload new image
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

