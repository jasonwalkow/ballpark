const {
  useState: useIconState,
  useRef: useIconRef,
  useCallback: useIconCallback,
  useEffect: useIconEffect,
} = React;

function detectShouldInvert(data) {
  const pixels = data.data;
  let totalBrightness = 0;
  let opaqueCount = 0;
  const step = Math.max(4, Math.floor(pixels.length / 4 / 1000));

  for (let i = 0; i < pixels.length; i += step * 4) {
    const a = pixels[i + 3];
    if (a < 30) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    totalBrightness += r * 0.299 + g * 0.587 + b * 0.114;
    opaqueCount++;
  }

  if (opaqueCount === 0) return false;
  const avgBrightness = totalBrightness / opaqueCount;
  return avgBrightness > 140;
}

function computeDotGrid(imageData, gridSize, threshold, invertMode) {
  const cols = gridSize;
  const rows = gridSize;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = imageData.width;
  srcCanvas.height = imageData.height;
  const srcCtx = srcCanvas.getContext("2d");
  srcCtx.putImageData(imageData, 0, 0);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  tempCtx.drawImage(srcCanvas, 0, 0, cols, rows);
  const scaledData = tempCtx.getImageData(0, 0, cols, rows);

  const grid = [];

  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = scaledData.data[i];
      const g = scaledData.data[i + 1];
      const b = scaledData.data[i + 2];
      const a = scaledData.data[i + 3];

      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      const alpha = a / 255;

      let showDot;
      if (invertMode) {
        showDot = alpha > 0.3 && brightness < (255 - threshold);
      } else {
        showDot = alpha > 0.3 && brightness > threshold;
      }

      row.push(showDot);
    }
    grid.push(row);
  }

  return grid;
}

const DotMatrixIconTool = () => {
  const [imageData, setImageData] = useIconState(null);
  /** After "Upload new image", stay on the dropzone instead of re-loading the default example. */
  const [skipDefaultImage, setSkipDefaultImage] = useIconState(false);
  const [threshold, setThreshold] = useIconState(80);
  const [dotColor, setDotColor] = useIconState("#1141FF");
  const [bgColor, setBgColor] = useIconState("#0a0a0a");
  const [invertMode, setInvertMode] = useIconState(true);

  const gridSize = 24;
  const dotSize = 2;
  const gap = 1;

  const canvasRef = useIconRef(null);
  const fileInputRef = useIconRef(null);
  const openFileDialogOnResetRef = useIconRef(false);

  const handleImageLoad = useIconCallback((data, { skipInvertDetection = false } = {}) => {
    if (!skipInvertDetection) {
      const shouldInvert = detectShouldInvert(data);
      setInvertMode(shouldInvert);
    }
    setImageData(data);
  }, []);

  const handleReset = useIconCallback(() => {
    setSkipDefaultImage(true);
    openFileDialogOnResetRef.current = true;
    setImageData(null);
    setThreshold(80);
    setDotColor("#1141FF");
    setBgColor("#0a0a0a");
    setInvertMode(false);
  }, []);

  const renderDotMatrix = useIconCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = gridSize;
    const rows = gridSize;
    const cellSize = dotSize + gap;
    const canvasSize = cols * cellSize + gap;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const grid = computeDotGrid(imageData, gridSize, threshold, invertMode);

    const radius = dotSize / 2;
    const glowRadius = 4;

    ctx.save();
    ctx.shadowColor = dotColor;
    ctx.shadowBlur = glowRadius;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x]) {
          const cx = gap + x * cellSize + radius;
          const cy = gap + y * cellSize + radius;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }
    }
    ctx.restore();

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x]) {
          const cx = gap + x * cellSize + radius;
          const cy = gap + y * cellSize + radius;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }
    }
  }, [imageData, gridSize, dotSize, threshold, dotColor, bgColor, gap, invertMode]);

  useIconEffect(() => {
    renderDotMatrix();
  }, [renderDotMatrix]);

  // Load a default example image on first visit so the tool
  // feels immediately useful before the user uploads anything.
  useIconEffect(() => {
    if (imageData) return;
    if (skipDefaultImage) return;

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
      handleImageLoad(data, { skipInvertDetection: true });
    };
    img.src = "/images/baseball.png";

    return () => {
      isCancelled = true;
    };
  }, [imageData, handleImageLoad, skipDefaultImage]);

  // After reset, open the OS file picker once the dropzone (and hidden input) is mounted.
  useIconEffect(() => {
    if (!openFileDialogOnResetRef.current) return;
    if (imageData) return;
    openFileDialogOnResetRef.current = false;
    fileInputRef.current?.click();
  }, [imageData]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "dot-matrix-icon.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadSVG = () => {
    if (!imageData) return;

    const cols = gridSize;
    const rows = gridSize;
    const cellSize = dotSize + gap;
    const canvasSize = cols * cellSize + gap;
    const radius = dotSize / 2;

    const grid = computeDotGrid(imageData, gridSize, threshold, invertMode);

    let glowCircles = "";
    let crispCircles = "";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x]) {
          const cx = gap + x * cellSize + radius;
          const cy = gap + y * cellSize + radius;
          glowCircles += `    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${dotColor}"/>\n`;
          crispCircles += `    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${dotColor}"/>\n`;
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${canvasSize}" height="${canvasSize}" fill="${bgColor}"/>
  <g filter="url(#glow)">
${glowCircles}  </g>
  <g>
${crispCircles}  </g>
</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "dot-matrix-icon.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ImageDropzone = ({ onImageLoad, fileInputRef }) => {
    const [isDragging, setIsDragging] = useIconState(false);

    const processFile = useIconCallback((file) => {
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

    const handleDrop = useIconCallback((e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    }, [processFile]);

    return (
      <button
        type="button"
        onDrop={handleDrop}
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
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto">
        {!imageData ? (
          <div className="max-w-md mx-auto flex flex-col items-center gap-8">
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl text-bp-chalk">Turn any image into a dot matrix icon</h2>
              <p className="text-sm text-bp-chalk">
                Upload an image and we'll convert it into a grid of dots. Works best with icons, logos, and simple shapes.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <ImageDropzone onImageLoad={handleImageLoad} fileInputRef={fileInputRef} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full h-full">
            <div className="rounded border border-bp-blue p-6 sm:p-10 flex items-center justify-center min-h-[400px] h-full" style={{ backgroundColor: bgColor }}>
              <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
            </div>
          </div>
        )}
      </div>

      {/* Controls (right) */}
      <div className="w-full md:w-[380px] h-full bg-bp-eyeblack border-l border-bp-eyeblack/60 p-6 overflow-y-auto flex-shrink-0">
        <div className="flex flex-col h-full">
          <section className="sticky top-0 z-10 bg-bp-eyeblack mb-6 border-b border-bp-eyeblack/60 pb-4">
            <h1 className="text-lg md:text-2xl text-bp-blue font-normal">Dot Matrix Icon</h1>
            <p className="text-xs text-bp-chalk max-w-xl text-justify mt-1">
              Start from a ready-made dot icon and then swap in your own artwork. Keep the grid tight and simple so every pixel earns its spot.
            </p>
          </section>

          {!imageData ? (
            <div className="bg-bp-chalk/5 rounded px-3 py-2 text-bp-chalk/80">
              Upload an image to enable controls and export options.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm text-bp-chalk">Controls</h2>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm text-bp-chalk">Invert Detection</label>
                  <span className="text-xs text-bp-chalk">{invertMode ? "Dots on dark pixels" : "Dots on bright pixels"}</span>
                </div>
                <label className="relative inline-block w-11 h-6">
                  <input type="checkbox" checked={invertMode} onChange={(e) => setInvertMode(e.target.checked)} className="sr-only peer" />
                  <span className="absolute cursor-pointer inset-0 bg-bp-eyeblack rounded-full peer-checked:bg-bp-blue transition-colors"></span>
                  <span className="absolute left-1 top-1 bg-bp-chalk w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-bp-chalk"></span>
                </label>
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-bp-chalk">Brightness Threshold</label>
                  <span className="text-xs font-mono text-bp-chalk">{threshold}</span>
                </div>
                <input type="range" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} min="0" max="255" step="1" className="w-full" />
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-bp-chalk">Dot Color</label>
                  <div className="flex items-center gap-2">
                    <label className="w-8 h-8 rounded cursor-pointer overflow-hidden" style={{ backgroundColor: dotColor }}>
                      <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)} className="sr-only" />
                    </label>
                    <span className="text-xs font-mono text-bp-chalk uppercase">{dotColor}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-bp-chalk">Background</label>
                  <div className="flex items-center gap-2">
                    <label className="w-8 h-8 rounded cursor-pointer overflow-hidden" style={{ backgroundColor: bgColor }}>
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="sr-only" />
                    </label>
                    <span className="text-xs font-mono text-bp-chalk uppercase">{bgColor}</span>
                  </div>
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
                    Upload a new image to start over, or adjust the controls to fine-tune your dot matrix icon.
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

