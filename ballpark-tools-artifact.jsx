import React, { useState, useRef, useCallback, useEffect } from 'react';

// Utility function to detect if image should be inverted
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

// Compute dot grid from image data
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

// Hamburger Menu Component
function HamburgerMenu({ currentTool, onToolChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const tools = [
    { id: 'home', name: '🏠 Home', description: 'Back to tool directory' },
    { id: 'icon', name: 'Dot Matrix Icon', description: '24x24 icon generator' },
    { id: 'art', name: 'Dot Matrix Art', description: 'Full image converter' },
    { id: 'pattern', name: 'Dot Pattern Generator', description: 'Generative corner patterns' },
    { id: 'billboard', name: 'Dot Billboard Text', description: 'Scrolling text animation' },
    { id: 'ballparkify', name: 'Baseball Idioms', description: 'Random baseball slang' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors"
      >
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded shadow-xl z-50 overflow-hidden">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => {
                  onToolChange(tool.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                  currentTool === tool.id ? 'bg-zinc-800' : ''
                }`}
              >
                <div className="font-medium text-sm text-zinc-100">{tool.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{tool.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Icon Generator Tool
function DotMatrixIconTool() {
  const [imageData, setImageData] = useState(null);
  const [threshold, setThreshold] = useState(80);
  const [dotColor, setDotColor] = useState("#1141FF");
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [invertMode, setInvertMode] = useState(false);

  const gridSize = 24;
  const dotSize = 2;
  const gap = 1;

  const canvasRef = useRef(null);

  const handleImageLoad = useCallback((data) => {
    const shouldInvert = detectShouldInvert(data);
    setInvertMode(shouldInvert);
    setImageData(data);
  }, []);

  const handleReset = useCallback(() => {
    setImageData(null);
    setThreshold(80);
    setDotColor("#1141FF");
    setBgColor("#0a0a0a");
    setInvertMode(false);
  }, []);

  const renderDotMatrix = useCallback(() => {
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

  useEffect(() => {
    renderDotMatrix();
  }, [renderDotMatrix]);

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

  const ImageDropzone = ({ onImageLoad }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const processFile = useCallback((file) => {
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

    const handleDrop = useCallback((e) => {
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
          isDragging ? "border-zinc-400 bg-zinc-800" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900"
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
        <div className="flex flex-col items-center gap-4 text-zinc-400">
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
            <span className="text-sm font-medium text-zinc-300">Drop an image here</span>
            <span className="text-xs text-zinc-500">or click to browse</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-full px-4 sm:px-6 py-6">
      {!imageData ? (
        <div className="max-w-md mx-auto flex flex-col items-center gap-8">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-zinc-100">
              Turn any image into a dot matrix icon
            </h2>
            <p className="text-sm text-zinc-400">
              Upload an image and we'll convert it into a grid of dots. Works best with icons, logos, and simple shapes.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ImageDropzone onImageLoad={handleImageLoad} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Preview</h2>
              <span className="text-xs font-mono text-zinc-500">24x24 dots</span>
            </div>
            <div className="rounded border border-zinc-800 p-6 sm:p-10 flex items-center justify-center min-h-[400px]" style={{ backgroundColor: bgColor }}>
              <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-sm font-medium text-zinc-400">Controls</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <label className="text-sm text-zinc-400">Invert Detection</label>
                <span className="text-xs text-zinc-500">
                  {invertMode ? "Dots on dark pixels" : "Dots on bright pixels"}
                </span>
              </div>
              <label className="relative inline-block w-11 h-6">
                <input type="checkbox" checked={invertMode} onChange={(e) => setInvertMode(e.target.checked)} className="sr-only peer" />
                <span className="absolute cursor-pointer inset-0 bg-zinc-800 rounded-full peer-checked:bg-zinc-100 transition-colors"></span>
                <span className="absolute left-1 top-1 bg-zinc-500 w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-zinc-900"></span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">Brightness Threshold</label>
                <span className="text-xs font-mono text-zinc-400">{threshold}</span>
              </div>
              <input type="range" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} min="0" max="255" step="1" className="w-full" />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm text-zinc-400">Dot Color</label>
                <div className="flex items-center gap-2">
                  <label className="w-8 h-8 rounded border border-zinc-700 cursor-pointer overflow-hidden" style={{ backgroundColor: dotColor }}>
                    <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)} className="sr-only" />
                  </label>
                  <span className="text-xs font-mono text-zinc-400 uppercase">{dotColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm text-zinc-400">Background</label>
                <div className="flex items-center gap-2">
                  <label className="w-8 h-8 rounded border border-zinc-700 cursor-pointer overflow-hidden" style={{ backgroundColor: bgColor }}>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="sr-only" />
                  </label>
                  <span className="text-xs font-mono text-zinc-400 uppercase">{bgColor}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 flex flex-col gap-3">
              <h2 className="text-sm font-medium text-zinc-400">Export</h2>
              <div className="flex gap-3">
                <button onClick={downloadPNG} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  PNG
                </button>
                <button onClick={downloadSVG} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  SVG
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Upload a new image to start over, or adjust the controls to fine-tune your dot matrix icon.
              </p>
              <button onClick={handleReset} className="mt-3 text-sm text-zinc-400 hover:text-zinc-100 cursor-pointer">
                Upload new image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Art Generator Tool  
function DotMatrixArtTool() {
  const [imageData, setImageData] = useState(null);
  const [dotSize, setDotSize] = useState(6);
  const [dotSpacing, setDotSpacing] = useState(2);
  const [gridSize, setGridSize] = useState(50);
  const [opacity, setOpacity] = useState(1);
  const [colorMode, setColorMode] = useState('original');
  const [dotColor, setDotColor] = useState('#141414');
  const [invertPattern, setInvertPattern] = useState(false);
  const [dotData, setDotData] = useState([]);

  const canvasRef = useRef(null);

  const processImage = useCallback(() => {
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

  useEffect(() => {
    processImage();
  }, [processImage]);

  const handleImageLoad = (data) => {
    setImageData(data);
  };

  const handleReset = () => {
    setImageData(null);
    setDotData([]);
  };

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

  const ImageDropzone = ({ onImageLoad }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const processFile = useCallback((file) => {
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
          isDragging ? "border-zinc-400 bg-zinc-800" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900"
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
        <div className="flex flex-col items-center gap-4 text-zinc-400">
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
            <span className="text-sm font-medium text-zinc-300">Drop an image here</span>
            <span className="text-xs text-zinc-500">or click to browse</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-full px-4 sm:px-6 py-6">
      {!imageData ? (
        <div className="max-w-md mx-auto flex flex-col items-center gap-8">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-zinc-100">
              Convert any image into dot matrix art
            </h2>
            <p className="text-sm text-zinc-400">
              Upload a photo and transform it into artistic dot patterns. Works great with portraits, landscapes, and detailed images.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <ImageDropzone onImageLoad={handleImageLoad} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Preview</h2>
              <span className="text-xs font-mono text-zinc-500">{gridSize} dots</span>
            </div>
            <div className="rounded border border-zinc-800 p-6 sm:p-10 flex items-center justify-center min-h-[400px] bg-zinc-900 overflow-auto">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-sm font-medium text-zinc-400">Controls</h2>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-400">Dot Size</label>
                  <span className="text-xs font-mono text-zinc-400">{dotSize}px</span>
                </div>
                <input type="range" value={dotSize} onChange={(e) => setDotSize(parseInt(e.target.value))} min="2" max="20" step="1" className="w-full" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-400">Dot Spacing</label>
                  <span className="text-xs font-mono text-zinc-400">{dotSpacing}px</span>
                </div>
                <input type="range" value={dotSpacing} onChange={(e) => setDotSpacing(parseInt(e.target.value))} min="0" max="10" step="1" className="w-full" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-400">Resolution</label>
                  <span className="text-xs font-mono text-zinc-400">{gridSize} dots</span>
                </div>
                <input type="range" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} min="20" max="150" step="5" className="w-full" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-400">Opacity Factor</label>
                  <span className="text-xs font-mono text-zinc-400">{opacity.toFixed(1)}</span>
                </div>
                <input type="range" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} min="0.5" max="2" step="0.1" className="w-full" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400">Color Mode</label>
                <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded text-sm">
                  <option value="original">Original Colors</option>
                  <option value="single">Single Color</option>
                </select>
              </div>

              {colorMode === 'single' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-400">Dot Color</label>
                  <input type="color" value={dotColor} onChange={(e) => setDotColor(e.target.value)} className="w-full h-10 rounded border border-zinc-800 cursor-pointer" />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm text-zinc-400">Invert Pattern</label>
                  <span className="text-xs text-zinc-500">Reverse opacity values</span>
                </div>
                <label className="relative inline-block w-11 h-6">
                  <input type="checkbox" checked={invertPattern} onChange={(e) => setInvertPattern(e.target.checked)} className="sr-only peer" />
                  <span className="absolute cursor-pointer inset-0 bg-zinc-800 rounded-full peer-checked:bg-zinc-100 transition-colors"></span>
                  <span className="absolute left-1 top-1 bg-zinc-500 w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-zinc-900"></span>
                </label>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 flex flex-col gap-3">
              <h2 className="text-sm font-medium text-zinc-400">Export</h2>
              <div className="flex gap-3">
                <button onClick={downloadPNG} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  PNG
                </button>
                <button onClick={downloadSVG} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  SVG
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Higher resolution creates more dots for finer detail. Increase opacity factor to make colors more vibrant.
              </p>
              <button onClick={handleReset} className="mt-3 text-sm text-zinc-400 hover:text-zinc-100 cursor-pointer">
                Upload new image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dot Pattern Generator Tool
function DotPatternGeneratorTool() {
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [bgColor, setBgColor] = useState('#0e0e0e');
  const [transparent, setTransparent] = useState(false);
  const [gridSpacing, setGridSpacing] = useState(25);
  const [dotSize, setDotSize] = useState(8);
  const [cornerIntensity, setCornerIntensity] = useState(0.99);
  const [falloff, setFalloff] = useState(0.50);
  const [centerQuietRadius, setCenterQuietRadius] = useState(0.40);
  const [centerSoftness, setCenterSoftness] = useState(0.20);
  const [organicJitter, setOrganicJitter] = useState(0.00);
  const [seed, setSeed] = useState('pattern-001');
  
  const [colors, setColors] = useState([
    '#1141FF', // Blue
    '#DEB5A4', // Glove
    '#CEDC9E', // Grass
    '#EAC9ED', // Gum
    '#F5E5A3', // Mustard
    '#F3EFFE', // Mound
    '#D4E4FF'  // Sky
  ]);

  const canvasRef = useRef(null);
  const [dotCount, setDotCount] = useState(0);

  const generatePattern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // Background
    if (transparent) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Seeded random
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

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Normalized position 0-1
        let nx = cols > 1 ? x / (cols - 1) : 0.5;
        let ny = rows > 1 ? y / (rows - 1) : 0.5;

        // Organic jitter
        if (organicJitter > 0) {
          nx += (rand() - 0.5) * organicJitter * 0.1;
          ny += (rand() - 0.5) * organicJitter * 0.1;
        }

        // Distance from each corner (0 to 1, normalized by diagonal)
        const d1 = Math.sqrt(nx * nx + ny * ny) / Math.sqrt(2);
        const d2 = Math.sqrt((1-nx) * (1-nx) + ny * ny) / Math.sqrt(2);
        const d3 = Math.sqrt(nx * nx + (1-ny) * (1-ny)) / Math.sqrt(2);
        const d4 = Math.sqrt((1-nx) * (1-nx) + (1-ny) * (1-ny)) / Math.sqrt(2);
        
        // Use minimum distance to nearest corner
        const minDist = Math.min(d1, d2, d3, d4);

        // Corner value with falloff curve
        // Higher falloff = wider spread from corners
        const cornerValue = Math.pow(1 - minDist, 1 + falloff * 3);

        // Distance from center
        const distCenter = Math.sqrt((nx - 0.5) * (nx - 0.5) + (ny - 0.5) * (ny - 0.5)) * 2;
        
        // Center quiet zone with soft edges
        let centerFactor = 1;
        if (distCenter < centerQuietRadius) {
          centerFactor = 0; // Fully quiet
        } else if (distCenter < centerQuietRadius + centerSoftness) {
          // Smoothstep interpolation for soft edge
          const t = (distCenter - centerQuietRadius) / Math.max(0.01, centerSoftness);
          centerFactor = t * t * (3 - 2 * t);
        }

        // Final probability combines corner intensity, falloff, and center quiet
        const probability = cornerIntensity * cornerValue * centerFactor;

        if (rand() < probability) {
          // Pick color with clustering based on position
          const colorSeed = Math.floor(nx * 17 + ny * 23 + rand() * 5);
          const color = colors[colorSeed % colors.length];
          
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

  useEffect(() => {
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
    // Regenerate for SVG
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
        const distCenter = Math.sqrt((nx-0.5)*(nx-0.5) + (ny-0.5)*(ny-0.5)) * 2;
        
        let centerFactor = 1;
        if (distCenter < centerQuietRadius) {
          centerFactor = 0;
        } else if (distCenter < centerQuietRadius + centerSoftness) {
          const t = (distCenter - centerQuietRadius) / Math.max(0.01, centerSoftness);
          centerFactor = t * t * (3 - 2 * t);
        }

        const probability = cornerIntensity * cornerValue * centerFactor;

        if (rand() < probability) {
          const colorSeed = Math.floor(nx * 17 + ny * 23 + rand() * 5);
          const color = colors[colorSeed % colors.length];
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <div className="w-full lg:w-[380px] bg-zinc-900 border-r border-zinc-800 p-6 overflow-y-auto">
        <div className="space-y-5">
          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Width (px)</label>
              <input type="number" value={width} onChange={e => setWidth(+e.target.value || 0)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 rounded text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Height (px)</label>
              <input type="number" value={height} onChange={e => setHeight(+e.target.value || 0)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 rounded text-sm" />
            </div>
          </div>

          {/* Background */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Background Color</label>
            <div className="flex gap-2">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} disabled={transparent}
                className="w-12 h-9 rounded border border-zinc-700 cursor-pointer" />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">#</span>
                <input type="text" value={bgColor.replace('#', '')} onChange={e => setBgColor('#' + e.target.value)} disabled={transparent}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 pl-7 pr-3 py-2 rounded text-sm font-mono uppercase" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)}
                className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-zinc-400">Transparent background</span>
            </label>
          </div>

          {/* Dot Colors */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Dot Colors</label>
              <button onClick={addColor} className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded">
                + Add
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {colors.map((color, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="color" value={color} onChange={e => updateColor(i, e.target.value)}
                    className="w-10 h-9 rounded border border-zinc-700 cursor-pointer" />
                  <div className="flex-1 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">#</span>
                    <input type="text" value={color.replace('#', '')}
                      onChange={e => updateColor(i, '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                      maxLength={6}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 pl-6 pr-2 py-2 rounded text-xs font-mono uppercase" />
                  </div>
                  {colors.length > 1 && (
                    <button onClick={() => removeColor(i)} className="text-zinc-500 hover:text-zinc-300 text-xl w-6 h-6">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Grid spacing</label><span className="text-sm text-zinc-400">{gridSpacing}</span></div>
            <input type="range" value={gridSpacing} onChange={e => setGridSpacing(+e.target.value)} min="10" max="50" className="w-full accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Dot size</label><span className="text-sm text-zinc-400">{dotSize}</span></div>
            <input type="range" value={dotSize} onChange={e => setDotSize(+e.target.value)} min="2" max="20" className="w-full accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Corner intensity</label><span className="text-sm text-zinc-400">{cornerIntensity.toFixed(2)}</span></div>
            <input type="range" value={cornerIntensity} onChange={e => setCornerIntensity(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Falloff (tight → wide)</label><span className="text-sm text-zinc-400">{falloff.toFixed(2)}</span></div>
            <input type="range" value={falloff} onChange={e => setFalloff(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Center quiet radius</label><span className="text-sm text-zinc-400">{centerQuietRadius.toFixed(2)}</span></div>
            <input type="range" value={centerQuietRadius} onChange={e => setCenterQuietRadius(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Center softness</label><span className="text-sm text-zinc-400">{centerSoftness.toFixed(2)}</span></div>
            <input type="range" value={centerSoftness} onChange={e => setCenterSoftness(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-blue-500" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><label className="text-sm text-zinc-400">Organic jitter</label><span className="text-sm text-zinc-400">{organicJitter.toFixed(2)}</span></div>
            <input type="range" value={organicJitter} onChange={e => setOrganicJitter(+e.target.value)} min="0" max="1" step="0.01" className="w-full accent-blue-500" />
          </div>

          {/* Seed */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Seed</label>
            <input type="text" value={seed} onChange={e => setSeed(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 rounded text-sm font-mono" />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={generatePattern} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm">Regenerate</button>
            <button onClick={randomSeed} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm">Random seed</button>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <button onClick={downloadSVG} className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm">Download SVG</button>
            <button onClick={downloadPNG} className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm">Download PNG</button>
          </div>

          <p className="text-zinc-500 text-sm text-center">{width} × {height}px • {dotCount} dots</p>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <canvas ref={canvasRef} className="border border-zinc-800 rounded shadow-2xl" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    </div>
  );
}

// Dot Billboard Text Tool
function DotBillboardTool() {
  const [words, setWords] = useState(['HELLO', 'WORLD']);
  const [inputText, setInputText] = useState('HELLO WORLD');
  const [dotSize, setDotSize] = useState(12);
  const [spacing, setSpacing] = useState(4);
  const [dotColor, setDotColor] = useState('#9CA3B0');
  const [backgroundColor, setBackgroundColor] = useState('#0A0A0A');
  const [scrollSpeed, setScrollSpeed] = useState(80);
  const [isPlaying, setIsPlaying] = useState(true);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const scrollOffsetRef = useRef(0);

  // Simple 5x7 dot matrix font
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
      xOffset += 6; // 5 + 1 space between chars
    }
    
    return dots;
  };

  const handleTextUpdate = () => {
    const newWords = inputText.trim().split(/\s+/).filter(w => w.length > 0);
    setWords(newWords.length > 0 ? newWords : ['HELLO']);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cellSize = dotSize + spacing;
    
    // Viewport dimensions
    const viewportCols = 30;
    const viewportRows = 7;
    canvas.width = viewportCols * cellSize;
    canvas.height = viewportRows * cellSize;

    // Generate full scrolling text
    const fullText = words.join('   ') + '   ';
    const allDots = textToDots(fullText);
    
    // Calculate total width
    const maxX = Math.max(...allDots.map(d => d.x), 0);
    const totalWidth = (maxX + 1) * cellSize;

    const animate = () => {
      if (isPlaying) {
        scrollOffsetRef.current = (scrollOffsetRef.current + scrollSpeed / 60) % totalWidth;
      }

      // Clear
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw dots
      ctx.fillStyle = dotColor;
      allDots.forEach(dot => {
        let x = dot.x * cellSize - scrollOffsetRef.current;
        
        // Wrap around
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full lg:w-[380px] h-full bg-zinc-900 border-r border-zinc-800 p-6 overflow-y-auto flex-shrink-0">
        <div className="space-y-5">
          {/* Text Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Text</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleTextUpdate()}
              placeholder="Type text here..."
              className="bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 rounded text-sm font-mono uppercase"
            />
            <button
              onClick={handleTextUpdate}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              Update Text
            </button>
          </div>

          {/* Dot Size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Dot size</label>
              <span className="text-sm text-zinc-400">{dotSize}</span>
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

          {/* Spacing */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Spacing</label>
              <span className="text-sm text-zinc-400">{spacing}</span>
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

          {/* Scroll Speed */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">Scroll speed</label>
              <span className="text-sm text-zinc-400">{scrollSpeed}</span>
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

          {/* Colors */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Dot color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={dotColor}
                onChange={(e) => setDotColor(e.target.value)}
                className="w-12 h-9 rounded border border-zinc-700 cursor-pointer"
              />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">#</span>
                <input
                  type="text"
                  value={dotColor.replace('#', '')}
                  onChange={(e) => setDotColor('#' + e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 pl-7 pr-3 py-2 rounded text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400">Background color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-9 rounded border border-zinc-700 cursor-pointer"
              />
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">#</span>
                <input
                  type="text"
                  value={backgroundColor.replace('#', '')}
                  onChange={(e) => setBackgroundColor('#' + e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 pl-7 pr-3 py-2 rounded text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Play/Pause */}
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  Play
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto bg-zinc-950">
        <div className="border-4 border-zinc-800 rounded overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

// Baseball Idiom Generator Tool
function BallparkifyTool() {
  const [currentIdiom, setCurrentIdiom] = useState(null);
  const [idiomHistory, setIdiomHistory] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const baseballIdioms = [
    { phrase: "Knocked it out of the park", meaning: "Achieved great success" },
    { phrase: "Hit a home run", meaning: "Accomplished something perfectly" },
    { phrase: "Stepped up to the plate", meaning: "Took responsibility or accepted a challenge" },
    { phrase: "Threw a curveball", meaning: "Surprised someone with something unexpected" },
    { phrase: "Playing hardball", meaning: "Being tough or uncompromising" },
    { phrase: "Touch all the bases", meaning: "Cover all necessary points" },
    { phrase: "Swing for the fences", meaning: "Attempt something ambitious" },
    { phrase: "In the big leagues", meaning: "At a high professional level" },
    { phrase: "Cover all the bases", meaning: "Take care of everything" },
    { phrase: "Three strikes and you're out", meaning: "Failed after three attempts" },
    { phrase: "Whole new ballgame", meaning: "Completely different situation" },
    { phrase: "Right off the bat", meaning: "Immediately from the start" },
    { phrase: "Play ball", meaning: "Get started, begin" },
    { phrase: "Out in left field", meaning: "Unusual or unconventional" },
    { phrase: "Ballpark figure", meaning: "Rough estimate" },
    { phrase: "Bush league", meaning: "Amateurish or unprofessional" },
    { phrase: "Called out", meaning: "Criticized or exposed" },
    { phrase: "Caught looking", meaning: "Surprised or unprepared" },
    { phrase: "Come out of left field", meaning: "Completely unexpected" },
    { phrase: "Rain check", meaning: "Postponement to another time" },
    { phrase: "Step up your game", meaning: "Improve your performance" },
    { phrase: "Throw in the towel", meaning: "Give up or quit" },
    { phrase: "Heavy hitter", meaning: "Powerful or influential person" },
    { phrase: "On deck", meaning: "Next in line, waiting" },
    { phrase: "Grand slam", meaning: "Major accomplishment" },
    { phrase: "Pinch hit", meaning: "Substitute for someone" },
    { phrase: "Screwball", meaning: "Eccentric or odd person" },
    { phrase: "Monday morning quarterback", meaning: "Someone who criticizes after the fact" },
    { phrase: "Southpaw", meaning: "Left-handed person" },
    { phrase: "Can of corn", meaning: "Something easy to accomplish" },
    { phrase: "Go to bat for someone", meaning: "Support or defend someone" },
    { phrase: "In someone's wheelhouse", meaning: "Within someone's area of expertise" },
    { phrase: "Swing and a miss", meaning: "Failed attempt" },
    { phrase: "Strike out", meaning: "Fail completely" },
    { phrase: "Hit it out of the park", meaning: "Exceed expectations" },
    { phrase: "Bases loaded", meaning: "High-pressure situation" },
    { phrase: "Bottom of the ninth", meaning: "Last chance" },
    { phrase: "Leadoff", meaning: "First or opening" },
    { phrase: "Rookie mistake", meaning: "Beginner's error" },
    { phrase: "Bench warmer", meaning: "Substitute who rarely plays" },
    { phrase: "Full count", meaning: "Critical moment, decision point" },
    { phrase: "Double header", meaning: "Two events back-to-back" },
    { phrase: "Rain delay", meaning: "Temporary postponement" },
    { phrase: "Seventh inning stretch", meaning: "Mid-point break" },
    { phrase: "Clear the bases", meaning: "Resolve all pending issues" },
    { phrase: "Wild pitch", meaning: "Unpredictable action" },
    { phrase: "Bunt", meaning: "Small, safe action" },
    { phrase: "Steal a base", meaning: "Take an opportunity" },
    { phrase: "Safe at home", meaning: "Successfully completed" },
    { phrase: "Tag out", meaning: "Catch someone in the act" },
    { phrase: "Foul ball", meaning: "Mistake or incorrect action" },
    { phrase: "Fair ball", meaning: "Legitimate or valid" },
    { phrase: "Infield fly", meaning: "Easy catch, simple task" },
    { phrase: "Passed ball", meaning: "Missed opportunity" },
    { phrase: "Sacrifice fly", meaning: "Help others at your own expense" },
    { phrase: "Inside pitch", meaning: "Personal or close to home" },
    { phrase: "Bean ball", meaning: "Intentional provocation" },
    { phrase: "Throw smoke", meaning: "Perform exceptionally" },
    { phrase: "Ace in the hole", meaning: "Secret advantage" },
    { phrase: "In the bullpen", meaning: "Ready and waiting" },
    { phrase: "Relief pitcher", meaning: "Someone who helps in difficult situations" },
    { phrase: "Closer", meaning: "Someone who finishes things" },
    { phrase: "Starting lineup", meaning: "Original team or plan" },
    { phrase: "Batting cleanup", meaning: "Handling important matters" },
    { phrase: "Suicide squeeze", meaning: "Risky but potentially rewarding move" },
    { phrase: "Pick off", meaning: "Catch someone off guard" },
    { phrase: "Hit the cutoff man", meaning: "Take the intermediate step" },
    { phrase: "Play pepper", meaning: "Warm up, practice" },
    { phrase: "Chest protector", meaning: "Defensive measure" },
    { phrase: "Chin music", meaning: "Intimidation" },
    { phrase: "Ducks on the pond", meaning: "Opportunities available" },
    { phrase: "Frozen rope", meaning: "Direct, powerful action" },
    { phrase: "Hot corner", meaning: "Position of pressure or attention" },
    { phrase: "Mendoza line", meaning: "Minimum acceptable standard" },
    { phrase: "No-hitter", meaning: "Perfect performance" },
    { phrase: "Perfect game", meaning: "Flawless execution" },
    { phrase: "Shut out", meaning: "Complete victory" },
    { phrase: "Walk-off", meaning: "Decisive final action" },
    { phrase: "Texas leaguer", meaning: "Lucky success" },
    { phrase: "Dying quail", meaning: "Weak but successful attempt" },
    { phrase: "Rope", meaning: "Solid hit or success" },
    { phrase: "Tater", meaning: "Home run, big win" },
    { phrase: "Baltimore chop", meaning: "Unconventional success" },
    { phrase: "Eephus pitch", meaning: "Unconventional approach" },
    { phrase: "Knuckle sandwich", meaning: "Confrontation" },
    { phrase: "Meatball", name: "Easy opportunity" },
    { phrase: "Uncle Charlie", meaning: "Curveball, surprise" },
    { phrase: "Yakker", meaning: "Sharp curve, tough challenge" },
    { phrase: "Green light", meaning: "Permission to proceed freely" },
    { phrase: "Hit and run", meaning: "Quick, coordinated action" },
    { phrase: "Load the bases", meaning: "Set up for major opportunity" },
    { phrase: "Clear the dugout", meaning: "Major confrontation or effort" },
    { phrase: "Rhubarb", meaning: "Argument or fight" },
    { phrase: "Around the horn", meaning: "Through all the steps" },
    { phrase: "Tools of ignorance", meaning: "Catcher's gear, essential equipment" },
    { phrase: "Warning track power", meaning: "Close but not quite enough" },
    { phrase: "Cup of coffee", meaning: "Brief stint or trial" },
    { phrase: "Five-tool player", meaning: "Complete package, well-rounded" },
    { phrase: "Rubber game", meaning: "Tiebreaker, decisive match" },
    { phrase: "Tape measure shot", meaning: "Exceptionally impressive feat" },
  ];

  const generateIdiom = () => {
    let newIdiom;
    // Avoid showing the same idiom twice in a row
    do {
      newIdiom = baseballIdioms[Math.floor(Math.random() * baseballIdioms.length)];
    } while (currentIdiom && newIdiom.phrase === currentIdiom.phrase && baseballIdioms.length > 1);
    
    setCurrentIdiom(newIdiom);
    setIdiomHistory([newIdiom, ...idiomHistory.slice(0, 4)]); // Keep last 5
  };

  // Generate initial idiom on mount
  useState(() => {
    if (!currentIdiom) {
      generateIdiom();
    }
  }, []);

  const copyToClipboard = () => {
    if (currentIdiom) {
      navigator.clipboard.writeText(currentIdiom.phrase);
      setCopyFeedback(true);
    }
  };

  useEffect(() => {
    if (!copyFeedback) return;
    const t = setTimeout(() => setCopyFeedback(false), 2500);
    return () => clearTimeout(t);
  }, [copyFeedback]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">⚾ Baseball Idiom Generator</h2>
          <p className="text-zinc-400">Discover random baseball slang and sayings</p>
        </div>

        {/* Main Idiom Display */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-zinc-700 rounded p-12 text-center shadow-2xl">
          {currentIdiom ? (
            <>
              <div className="text-5xl mb-4">⚾</div>
              <h3 className="text-4xl font-bold text-zinc-100 mb-4">
                "{currentIdiom.phrase}"
              </h3>
              <p className="text-lg text-zinc-400 italic">
                {currentIdiom.meaning}
              </p>
            </>
          ) : (
            <p className="text-zinc-500">Click below to generate an idiom</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={generateIdiom}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors text-lg flex items-center justify-center gap-3 w-full"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="1 4 1 10 7 10"/>
              <polyline points="23 20 23 14 17 14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            Generate New Idiom
          </button>
          {currentIdiom && (
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded font-medium transition-colors flex items-center justify-center gap-2 w-full"
            >
              {copyFeedback ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        {/* Recently Shown */}
        {idiomHistory.length > 1 && (
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Recently Shown:</h3>
            <div className="space-y-2">
              {idiomHistory.slice(1).map((idiom, index) => (
                <div key={index} className="text-sm text-zinc-500 flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <div>
                    <span className="text-zinc-400">"{idiom.phrase}"</span>
                    <span className="text-zinc-600"> — {idiom.meaning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="text-center text-sm text-zinc-600">
          {baseballIdioms.length} baseball idioms in the collection
        </div>
      </div>
    </div>
  );
}

// Landing Page Component
function LandingPage({ onSelectTool }) {
  const tools = [
    {
      id: 'icon',
      name: 'Dot Matrix Icon',
      description: 'Convert images into 24x24 dot matrix icons with customizable colors and threshold controls.',
      icon: (
        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      icon: (
        <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <line x1="7" y1="10" x2="7" y2="14"/>
          <line x1="12" y1="10" x2="12" y2="14"/>
          <line x1="17" y1="10" x2="17" y2="14"/>
        </svg>
      ),
      features: ['Scrolling animation', 'Custom text', 'Speed controls']
    },
    {
      id: 'ballparkify',
      name: 'Baseball Idioms',
      description: 'Generate random baseball idioms and slang from a collection of 100+ classic phrases.',
      icon: (
        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3c-2 2-2 7 0 9s7 0 9 0"/>
          <path d="M3 12c2 2 7 2 9 0s0-7 0-9"/>
        </svg>
      ),
      features: ['100+ idioms', 'Random generation', 'Copy to clipboard']
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ballpark Design Tools
            </h1>
            <p className="text-xl text-zinc-400">
              A collection of generative dot matrix tools for designers
            </p>
          </div>
        </div>
      </header>

      {/* Tools Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group bg-zinc-900 border border-zinc-800 rounded p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-200 text-left"
            >
              {/* Icon */}
              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-200">
                {tool.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-zinc-100 mb-2 group-hover:text-blue-400 transition-colors">
                {tool.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                {tool.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {tool.features.map((feature, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded border border-zinc-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-sm text-zinc-500 group-hover:text-blue-400 transition-colors">
                <span>Open tool</span>
                <svg className="w-3 h-3 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-zinc-600">
          <p>Created with ⚾ by Ballpark</p>
        </div>
      </main>
    </div>
  );
}

// Main App
export default function App() {
  const [currentTool, setCurrentTool] = useState('home');

  const toolInfo = {
    home: {
      title: 'Ballpark Design Tools',
      description: 'Tool Directory',
      icon: (
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    icon: {
      title: 'Dot Matrix Icon',
      description: '24x24 icon generator',
      icon: (
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <line x1="7" y1="10" x2="7" y2="14"/>
          <line x1="12" y1="10" x2="12" y2="14"/>
          <line x1="17" y1="10" x2="17" y2="14"/>
        </svg>
      )
    },
    ballparkify: {
      title: 'Baseball Idioms',
      description: 'Random baseball slang',
      icon: (
        <svg className="w-3 h-3 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 3c-2 2-2 7 0 9s7 0 9 0"/>
          <path d="M3 12c2 2 7 2 9 0s0-7 0-9"/>
        </svg>
      )
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {currentTool !== 'home' && (
        <header className="border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HamburgerMenu currentTool={currentTool} onToolChange={setCurrentTool} />
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                {toolInfo[currentTool].icon}
              </div>
              <div>
                <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
                  {toolInfo[currentTool].title}
                </h1>
                <p className="text-xs text-zinc-500">
                  {toolInfo[currentTool].description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentTool('home')}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </button>
          </div>
        </header>
      )}

      {currentTool === 'home' ? <LandingPage onSelectTool={setCurrentTool} /> :
       currentTool === 'icon' ? <DotMatrixIconTool /> : 
       currentTool === 'art' ? <DotMatrixArtTool /> : 
       currentTool === 'pattern' ? <DotPatternGeneratorTool /> :
       currentTool === 'billboard' ? <DotBillboardTool /> :
       <BallparkifyTool />}
    </div>
  );
}
