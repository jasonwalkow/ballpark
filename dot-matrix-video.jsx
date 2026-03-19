const { useState: useVideoState, useRef: useVideoRef, useEffect: useVideoEffect, useCallback: useVideoCallback } = React;

const MIN_DOT_SIZE = 0.5;
const MAX_DOT_SIZE = 3.5;
const GAMMA_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  // Gamma-corrected brightness curve for smoother perceived contrast
  GAMMA_LUT[i] = Math.pow(i / 255, 2.2) * 255;
}

function getSpacing(detail) {
  // detail: 1..7 (higher detail => tighter spacing)
  return Math.max(2, Math.round(8 * (11 - detail) / 10));
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const DotMatrixVideoTool = () => {
  const [videoUrl, setVideoUrl] = useVideoState(null);
  const [isVideoReady, setIsVideoReady] = useVideoState(false);
  const [isPlaying, setIsPlaying] = useVideoState(false);
  const [mediaType, setMediaType] = useVideoState(null); // 'video' | 'gif'

  // Default values tuned to match the "packed blue dots" preview.
  const [threshold, setThreshold] = useVideoState(97);
  const [detailLevel, setDetailLevel] = useVideoState(4);
  const [brightness, setBrightness] = useVideoState(23);
  const [contrast, setContrast] = useVideoState(100);
  const [invertDots, setInvertDots] = useVideoState(true);
  const [renderMode, setRenderMode] = useVideoState('dotMatrix'); // dotMatrix | binaryDither
  const [dotColor, setDotColor] = useVideoState('#FFFFFF');
  const [bgColor, setBgColor] = useVideoState('#1141FF');
  const [aspectRatio, setAspectRatio] = useVideoState('original'); // original | 1:1 | 4:3 | 16:9 | 9:16 | 21:9
  const [zoom, setZoom] = useVideoState(1.0);
  const [gifReloadToken, setGifReloadToken] = useVideoState(0);
  const zoomRef = useVideoRef(zoom);

  const [isRecording, setIsRecording] = useVideoState(false);
  const [downloadUrl, setDownloadUrl] = useVideoState(null);
  const [supportedMimeType, setSupportedMimeType] = useVideoState(() => {
    try {
      if (typeof MediaRecorder === 'undefined') return null;
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) return 'video/webm; codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) return 'video/webm; codecs=vp8';
      return 'video/webm';
    } catch (e) {
      return null;
    }
  });

  const videoRef = useVideoRef(null);
  const gifImgRef = useVideoRef(null);
  const canvasRef = useVideoRef(null);
  const tempCanvasRef = useVideoRef(null);
  const outCtxRef = useVideoRef(null);
  const tempCtxRef = useVideoRef(null);

  const frameRequestIdRef = useVideoRef(null);
  const lastFrameTimeRef = useVideoRef(0);

  const mediaTypeRef = useVideoRef(mediaType);
  useVideoEffect(() => {
    mediaTypeRef.current = mediaType;
  }, [mediaType]);

  const grayscaleDataRef = useVideoRef(null);
  const ditherDataRef = useVideoRef(null);

  const mediaRecorderRef = useVideoRef(null);
  const recordedChunksRef = useVideoRef([]);
  const ignoreRecordingResultRef = useVideoRef(false);

  // Auto-recording for "upload -> processed -> download".
  const autoProcessingRef = useVideoRef(false);
  const autoStopTimerRef = useVideoRef(null);

  const objectUrlRef = useVideoRef(null);
  const lastDownloadUrlRef = useVideoRef(null);
  const hasLoadedDefaultRef = useVideoRef(false);

  const settingsRef = useVideoRef({
    threshold,
    detailLevel,
    brightness,
    contrast,
    invertDots,
    renderMode,
    dotColor,
    bgColor,
  });

  useVideoEffect(() => {
    settingsRef.current = {
      threshold,
      detailLevel,
      brightness,
      contrast,
      invertDots,
      renderMode,
      dotColor,
      bgColor,
    };
  }, [threshold, detailLevel, brightness, contrast, invertDots, renderMode, dotColor, bgColor]);

  useVideoEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // If the user changes settings, the previously generated download is no longer valid.
  // Clear the download so the next download always matches the current preview settings.
  useVideoEffect(() => {
    if (!videoUrl) return;
    if (!downloadUrl) return;
    if (isRecording) return;

    if (lastDownloadUrlRef.current) {
      try {
        URL.revokeObjectURL(lastDownloadUrlRef.current);
      } catch (e) {}
      lastDownloadUrlRef.current = null;
    }
    setDownloadUrl(null);
  }, [
    threshold,
    detailLevel,
    brightness,
    contrast,
    invertDots,
    renderMode,
    dotColor,
    bgColor,
    zoom,
    aspectRatio,
  ]);

  const parseAspectRatio = (value) => {
    if (value === 'original') return null;
    const parts = value.split(':');
    if (parts.length !== 2) return null;
    const w = Number(parts[0]);
    const h = Number(parts[1]);
    if (!w || !h) return null;
    return w / h;
  };

  const resizeOutputDimensions = useVideoCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentMedia = mediaTypeRef.current;
    let videoW = 0;
    let videoH = 0;
    if (currentMedia === 'video') {
      const videoEl = videoRef.current;
      videoW = videoEl ? videoEl.videoWidth || 0 : 0;
      videoH = videoEl ? videoEl.videoHeight || 0 : 0;
    } else if (currentMedia === 'gif') {
      const gifEl = gifImgRef.current;
      videoW = gifEl ? gifEl.naturalWidth || 0 : 0;
      videoH = gifEl ? gifEl.naturalHeight || 0 : 0;
    }
    if (videoW <= 0 || videoH <= 0) return;

    const maxWidth = 1280;
    const maxHeight = 720;

    let targetWidth = 2;
    let targetHeight = 2;

    const selected = aspectRatio;
    if (selected === 'original') {
      const scaleFactor = Math.min(maxWidth / videoW, maxHeight / videoH);
      targetWidth = Math.max(2, Math.round(videoW * scaleFactor));
      targetHeight = Math.max(2, Math.round(videoH * scaleFactor));
    } else {
      const ratio = parseAspectRatio(selected);
      const maxRatio = maxWidth / maxHeight;
      if (ratio && ratio >= maxRatio) {
        targetWidth = maxWidth;
        targetHeight = Math.max(2, Math.round(targetWidth / ratio));
      } else {
        targetHeight = maxHeight;
        targetWidth = Math.max(2, Math.round(targetHeight * (ratio || (videoW / videoH))));
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    outCtxRef.current = canvas.getContext('2d', { alpha: false });

    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
    }
    tempCanvasRef.current.width = targetWidth;
    tempCanvasRef.current.height = targetHeight;
    tempCtxRef.current = tempCanvasRef.current.getContext('2d', { alpha: false, willReadFrequently: true });

    // Force dot buffers to regenerate for the new frame size.
    grayscaleDataRef.current = null;
    ditherDataRef.current = null;
  }, [aspectRatio, videoRef, canvasRef]);

  const stopFrameLoop = useVideoCallback(() => {
    if (frameRequestIdRef.current) {
      cancelAnimationFrame(frameRequestIdRef.current);
      frameRequestIdRef.current = null;
    }
  }, []);

  const convertToDotMatrix = useVideoCallback((sourceWidth, sourceHeight) => {
    const tempCtx = tempCtxRef.current;
    const outCtx = outCtxRef.current;
    const settings = settingsRef.current;
    if (!tempCtx || !outCtx) return;

    const imageData = tempCtx.getImageData(0, 0, sourceWidth, sourceHeight);
    const pixels = new Uint32Array(imageData.data.buffer);

    // Allocate grayscale buffer if needed.
    if (!grayscaleDataRef.current || grayscaleDataRef.current.length !== pixels.length) {
      grayscaleDataRef.current = new Float32Array(pixels.length);
    }
    const grayscaleData = grayscaleDataRef.current;

    const brightnessAdj = settings.brightness * 2.55;
    const contrastFactor = (100 + settings.contrast) / 100;
    const coefR = 0.2126;
    const coefG = 0.7152;
    const coefB = 0.0722;

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      const r = pixel & 0xff;
      const g = (pixel >> 8) & 0xff;
      const b = (pixel >> 16) & 0xff;

      let value =
        (GAMMA_LUT[r] * coefR) +
        (GAMMA_LUT[g] * coefG) +
        (GAMMA_LUT[b] * coefB);

      value += brightnessAdj;
      value = ((value - 127.5) * contrastFactor) + 127.5;
      grayscaleData[i] = clamp(value, 0, 255);
    }

    const spacing = getSpacing(settings.detailLevel);

    outCtx.fillStyle = settings.dotColor;

    if (settings.renderMode === 'binaryDither') {
      // Allocate dither buffer if needed.
      if (!ditherDataRef.current || ditherDataRef.current.length !== grayscaleData.length) {
        ditherDataRef.current = new Float32Array(grayscaleData.length);
      }
      const ditherData = ditherDataRef.current;
      ditherData.set(grayscaleData);

      const currentThreshold = settings.threshold;
      const width = sourceWidth;
      const height = sourceHeight;

      // Floyd–Steinberg dithering.
      // Store 0 for "dot" and 255 for "no dot" (so we can draw with strict equality).
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = ditherData[idx];

          const shouldDot = settings.invertDots ? oldVal > currentThreshold : oldVal < currentThreshold;
          const newVal = shouldDot ? 0 : 255;
          ditherData[idx] = newVal;

          const error = oldVal - newVal;
          if (x + 1 < width) ditherData[idx + 1] += error * (7 / 16);
          if (x > 0 && y + 1 < height) ditherData[idx - 1 + width] += error * (3 / 16);
          if (y + 1 < height) ditherData[idx + width] += error * (5 / 16);
          if (x + 1 < width && y + 1 < height) ditherData[idx + 1 + width] += error * (1 / 16);
        }
      }

      const radius = MAX_DOT_SIZE / 2;
      for (let y = 0; y < height; y += spacing) {
        const offset = y * width;
        for (let x = 0; x < width; x += spacing) {
          if (ditherData[offset + x] === 0) {
            outCtx.beginPath();
            outCtx.arc(x, y, radius, 0, Math.PI * 2);
            outCtx.fill();
          }
        }
      }
    } else {
      // Dot Matrix rendering mode (non-dither).
      const width = sourceWidth;
      const height = sourceHeight;
      const currentThreshold = settings.threshold;
      const dotRange = MAX_DOT_SIZE - MIN_DOT_SIZE;

      for (let y = 0; y < height; y += spacing) {
        const offset = y * width;
        for (let x = 0; x < width; x += spacing) {
          const bright = grayscaleData[offset + x];
          const shouldDot = settings.invertDots ? bright > currentThreshold : bright < currentThreshold;
          if (!shouldDot) continue;

          const intensity = settings.invertDots ? bright / 255 : 1 - bright / 255;
          const dotSize = MIN_DOT_SIZE + intensity * dotRange;
          const radius = dotSize / 2;

          outCtx.beginPath();
          outCtx.arc(x, y, radius, 0, Math.PI * 2);
          outCtx.fill();
        }
      }
    }
  }, []);

  const updateCanvas = useVideoCallback(() => {
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCtxRef.current;
    const outCtx = outCtxRef.current;
    if (!canvas || !tempCanvas || !tempCtx || !outCtx) return;

    const width = tempCanvas.width;
    const height = tempCanvas.height;
    const settings = settingsRef.current;

    const currentMedia = mediaTypeRef.current;
    let sourceEl = null;
    let sourceW = 0;
    let sourceH = 0;
    if (currentMedia === 'video') {
      const videoEl = videoRef.current;
      if (!videoEl) return;
      sourceEl = videoEl;
      sourceW = videoEl.videoWidth || 0;
      sourceH = videoEl.videoHeight || 0;
    } else if (currentMedia === 'gif') {
      const gifEl = gifImgRef.current;
      if (!gifEl) return;
      sourceEl = gifEl;
      sourceW = gifEl.naturalWidth || gifEl.width || 0;
      sourceH = gifEl.naturalHeight || gifEl.height || 0;
    } else {
      return;
    }
    if (!sourceEl || !sourceW || !sourceH) return;

    outCtx.fillStyle = settings.bgColor;
    outCtx.fillRect(0, 0, width, height);

    // Draw current video frame into an offscreen canvas (cover + zoom), then read pixels from there.
    tempCtx.clearRect(0, 0, width, height);

    const scale = Math.max(width / sourceW, height / sourceH) * zoomRef.current;
    const scaledW = sourceW * scale;
    const scaledH = sourceH * scale;
    const dx = (width - scaledW) / 2;
    const dy = (height - scaledH) / 2;

    tempCtx.drawImage(sourceEl, dx, dy, scaledW, scaledH);
    convertToDotMatrix(width, height);
  }, [convertToDotMatrix]);

  const startFrameLoop = useVideoCallback(() => {
    const currentMedia = mediaTypeRef.current;
    if (currentMedia === 'video' && !videoRef.current) return;
    if (currentMedia === 'gif' && !gifImgRef.current) return;

    stopFrameLoop();
    lastFrameTimeRef.current = performance.now();

    const processFrame = (timestamp) => {
      const current = mediaTypeRef.current;
      // GIFs have their own frame timing; don't over-throttle capture.
      const targetFrameTime = current === 'gif' ? 0 : 1000 / 30; // 30 FPS for video
      if (current === 'video') {
        const v = videoRef.current;
        if (!v || v.paused || (v.ended && !v.loop)) {
          frameRequestIdRef.current = null;
          return;
        }
      } else if (current === 'gif') {
        if (!gifImgRef.current) {
          frameRequestIdRef.current = null;
          return;
        }
      } else {
        frameRequestIdRef.current = null;
        return;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed >= targetFrameTime) {
        lastFrameTimeRef.current = timestamp;
        updateCanvas();
      }

      frameRequestIdRef.current = requestAnimationFrame(processFrame);
    };

    frameRequestIdRef.current = requestAnimationFrame(processFrame);
  }, [stopFrameLoop, updateCanvas]);

  useVideoEffect(() => {
    if (mediaTypeRef.current !== 'video') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handlePlay = () => {
      setIsPlaying(true);
      startFrameLoop();
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopFrameLoop();
      updateCanvas();
    };
    const handleEnded = () => {
      // With looping enabled, the next frame will be available immediately.
      // Don't tear down the frame loop just because `ended` fired.
      if (videoEl.loop) {
        updateCanvas();
        return;
      }
      setIsPlaying(false);
      stopFrameLoop();
      updateCanvas();
    };

    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handleEnded);

    return () => {
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handleEnded);
    };
  }, [startFrameLoop, stopFrameLoop, updateCanvas, videoUrl, mediaType]);

  // If the user tweaks settings while paused, update a single frame after a short debounce.
  useVideoEffect(() => {
    const videoEl = videoRef.current;
    if (!isVideoReady) return;

    // For video: only update when the video is paused.
    // For GIF: use the tool's play state.
    if (mediaTypeRef.current === 'video') {
      if (!videoEl || !videoEl.paused) return;
    } else if (mediaTypeRef.current === 'gif') {
      if (isPlaying) return;
    }

    const t = setTimeout(() => updateCanvas(), 150);
    return () => clearTimeout(t);
  }, [
    threshold,
    detailLevel,
    brightness,
    contrast,
    invertDots,
    renderMode,
    dotColor,
    bgColor,
    zoom,
    aspectRatio,
    isVideoReady,
    isPlaying,
    updateCanvas,
  ]);

  // Aspect ratio changes affect the output canvas resolution/cropping.
  useVideoEffect(() => {
    if (!videoUrl || !isVideoReady) return;
    resizeOutputDimensions();
    updateCanvas();
  }, [aspectRatio, resizeOutputDimensions, updateCanvas, videoUrl, isVideoReady]);

  const cleanupVideo = useVideoCallback(() => {
    stopFrameLoop();
    if (autoStopTimerRef.current) {
      try {
        clearTimeout(autoStopTimerRef.current);
      } catch (e) {}
      autoStopTimerRef.current = null;
    }
    autoProcessingRef.current = false;
    ignoreRecordingResultRef.current = true;
    setMediaType(null);

    const videoEl = videoRef.current;
    if (videoEl) {
      try {
        videoEl.pause();
      } catch (e) {}

      if (videoEl.src) {
        try {
          videoEl.removeAttribute('src');
          videoEl.load();
        } catch (e) {}
      }
    }

    const gifEl = gifImgRef.current;
    if (gifEl) {
      try {
        gifEl.src = '';
      } catch (e) {}
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    setIsRecording(false);
    recordedChunksRef.current = [];

    if (lastDownloadUrlRef.current) {
      try {
        URL.revokeObjectURL(lastDownloadUrlRef.current);
      } catch (e) {}
      lastDownloadUrlRef.current = null;
    }
    setDownloadUrl(null);

    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch (e) {}
      objectUrlRef.current = null;
    }

    setVideoUrl(null);
    setIsVideoReady(false);
    setIsPlaying(false);
    grayscaleDataRef.current = null;
    ditherDataRef.current = null;
  }, [stopFrameLoop]);

  useVideoEffect(() => {
    if (!videoUrl) return;
    if (mediaType !== 'video') return;

    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    if (!videoEl || !canvas) return;

    const handleLoadedMetadata = () => {
      // Always loop by default so users can immediately scrub settings.
      videoEl.loop = true;

      // Resize output/canvas based on the current aspect ratio selection.
      resizeOutputDimensions();

      setIsVideoReady(true);
      updateCanvas();
      // User selected a file via interaction, so autoplay should generally work.
      videoEl.play().catch(() => {});
    };

    videoEl.src = videoUrl;
    videoEl.load();

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [videoUrl, updateCanvas, mediaType]);

  // Preload an example clip on first entry so the tool isn't blank.
  useVideoEffect(() => {
    if (hasLoadedDefaultRef.current) return;
    if (videoUrl || mediaType) return;

    hasLoadedDefaultRef.current = true;
    setMediaType('video');
    setVideoUrl('/videos/homerun.mp4');
  }, [videoUrl, mediaType]);

  // GIF: load an <img> and drive frame rendering from it.
  useVideoEffect(() => {
    if (!videoUrl) return;
    if (mediaType !== 'gif') return;

    const gifEl = gifImgRef.current;
    if (!gifEl) return;

    const onLoad = () => {
      resizeOutputDimensions();
      setIsVideoReady(true);
      updateCanvas();
      setIsPlaying(true);
      startFrameLoop();
    };

    // If already decoded/available, run immediately.
    if (gifEl.complete && (gifEl.naturalWidth || gifEl.width)) {
      onLoad();
      return;
    }

    gifEl.addEventListener('load', onLoad);
    return () => gifEl.removeEventListener('load', onLoad);
  }, [videoUrl, mediaType, gifReloadToken, resizeOutputDimensions, updateCanvas, startFrameLoop]);

  const handlePickVideo = useVideoCallback((file) => {
    if (!file) return;

    const fileType = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const isGif = fileType === 'image/gif' || name.endsWith('.gif');
    const isVideo = fileType.startsWith('video/');

    if (!isGif && !isVideo) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File too large. Please select a file up to 20MB.');
      return;
    }

    cleanupVideo();

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setMediaType(isGif ? 'gif' : 'video');
    setVideoUrl(url);
  }, [cleanupVideo]);

  const startRecording = useVideoCallback(() => {
    if (!canvasRef.current) return;
    if (!supportedMimeType) return;
    const existing = mediaRecorderRef.current;
    if (existing && existing.state === 'recording') return;

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30);
    recordedChunksRef.current = [];
    ignoreRecordingResultRef.current = false;

    const recorder = new MediaRecorder(stream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: 2500000,
    });

    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      setIsRecording(false);
      const chunks = recordedChunksRef.current;
      recordedChunksRef.current = [];

      if (ignoreRecordingResultRef.current) return;

      const blob = new Blob(chunks, { type: 'video/webm' });
      if (lastDownloadUrlRef.current) {
        try {
          URL.revokeObjectURL(lastDownloadUrlRef.current);
        } catch (e) {}
      }
      lastDownloadUrlRef.current = URL.createObjectURL(blob);
      setDownloadUrl(lastDownloadUrlRef.current);
    };

    try {
      // If we aren't playing yet, ensure canvas updates while recording.
      const v = videoRef.current;
      if (v && v.paused) v.play().catch(() => {});
    } catch (e) {}

    recorder.start(500);
  }, [supportedMimeType]);

  const stopRecording = useVideoCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    try {
      if (recorder.state === 'recording') recorder.stop();
    } catch (e) {}
  }, []);

  const recordProcessedNow = useVideoCallback(() => {
    if (!canvasRef.current) return;
    if (!supportedMimeType) return;
    if (isRecording) return;

    // Clear any prior output so the download always matches current settings.
    if (lastDownloadUrlRef.current) {
      try {
        URL.revokeObjectURL(lastDownloadUrlRef.current);
      } catch (e) {}
      lastDownloadUrlRef.current = null;
    }
    setDownloadUrl(null);

    // Clear any pending stop timer.
    if (autoStopTimerRef.current) {
      try {
        clearTimeout(autoStopTimerRef.current);
      } catch (e) {}
      autoStopTimerRef.current = null;
    }

    const currentMedia = mediaTypeRef.current;

    // Ensure the canvas is actively rendering frames while we record.
    if (currentMedia === 'video') {
      const v = videoRef.current;
      if (v) {
        try {
          v.loop = false;
          v.currentTime = 0;
          v.play().catch(() => {});
        } catch (e) {}
      }
      setIsPlaying(true);
      startFrameLoop();
      updateCanvas();
    } else if (currentMedia === 'gif') {
      setIsPlaying(true);
      startFrameLoop();
      updateCanvas();
    } else {
      return;
    }

    startRecording();

    const stopAfterMs = (() => {
      if (currentMedia === 'gif') return 4500;

      const v = videoRef.current;
      const d = v && Number.isFinite(v.duration) ? v.duration : NaN;
      if (!Number.isFinite(d) || d <= 0) return 12000;

      const durationMs = d * 1000 + 400;
      return Math.min(durationMs, 5 * 60 * 1000); // 5 minutes max
    })();

    autoStopTimerRef.current = setTimeout(() => {
      stopRecording();
      setIsPlaying(false);
      stopFrameLoop();
      autoStopTimerRef.current = null;
    }, stopAfterMs);
  }, [
    supportedMimeType,
    isRecording,
    startFrameLoop,
    stopFrameLoop,
    startRecording,
    stopRecording,
    updateCanvas,
  ]);

  // Auto-process: start MediaRecorder right after the dot-matrix canvas is ready.
  useVideoEffect(() => {
    if (!videoUrl || !isVideoReady) return;
    if (!supportedMimeType) return;
    if (autoProcessingRef.current) return;

    // Only trigger once per upload.
    autoProcessingRef.current = true;

    if (autoStopTimerRef.current) {
      try {
        clearTimeout(autoStopTimerRef.current);
      } catch (e) {}
      autoStopTimerRef.current = null;
    }

    // For video, record a single pass (not looping forever).
    if (mediaType === 'video') {
      const v = videoRef.current;
      if (v) {
        try {
          v.loop = false;
          v.currentTime = 0;
        } catch (e) {}
        try {
          v.play().catch(() => {});
        } catch (e) {}
      }
    }

    // For GIF, frame rendering is already driven by the tool's play state.
    if (mediaType === 'gif') {
      setIsPlaying(true);
      startFrameLoop();
    }

    startRecording();

    const stopAfterMs = (() => {
      if (mediaType === 'gif') return 4500;

      // For video: stop based on duration (plus a small buffer).
      const v = videoRef.current;
      const d = v && Number.isFinite(v.duration) ? v.duration : NaN;
      if (!Number.isFinite(d) || d <= 0) return 12000;

      // Cap to avoid runaway recordings for very long clips.
      const durationMs = d * 1000 + 400;
      return Math.min(durationMs, 5 * 60 * 1000); // 5 minutes max
    })();

    autoStopTimerRef.current = setTimeout(() => {
      stopRecording();
      setIsPlaying(false);
      stopFrameLoop();
    }, stopAfterMs);

    return () => {
      if (autoStopTimerRef.current) {
        try {
          clearTimeout(autoStopTimerRef.current);
        } catch (e) {}
        autoStopTimerRef.current = null;
      }
    };
  }, [videoUrl, isVideoReady, mediaType, supportedMimeType, startFrameLoop, stopFrameLoop, startRecording, stopRecording]);

  const fileInputRef = useVideoRef(null);

  const VideoDropzone = ({ onFile }) => {
    const [isDragging, setIsDragging] = useVideoState(false);

    const processDrop = useVideoCallback((e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) onFile(file);
    }, [onFile]);

    return (
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDrop={processDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        className={`relative flex flex-col items-center justify-center w-full aspect-square rounded border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragging ? 'border-bp-blue bg-bp-eyeblack' : 'border-bp-chalk/70 hover:border-bp-blue hover:bg-bp-eyeblack'
        }`}
      >
        <div className="flex flex-col items-center gap-4 text-bp-chalk">
          <div className="relative">
            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-bp-chalk">Drop a video or GIF here</span>
            <span className="text-xs text-bp-chalk">or click to browse (max 20MB)</span>
          </div>
        </div>
      </button>
    );
  };

  const onPlayPause = () => {
    const currentMedia = mediaTypeRef.current;
    if (currentMedia === 'gif') {
      if (isPlaying) {
        setIsPlaying(false);
        stopFrameLoop();
      } else {
        setIsPlaying(true);
        startFrameLoop();
      }
      updateCanvas();
      return;
    }

    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const onSeek = (deltaSeconds) => {
    if (mediaTypeRef.current === 'gif') return;
    const v = videoRef.current;
    if (!v) return;
    try {
      const next = clamp(v.currentTime + deltaSeconds, 0, v.duration || Number.POSITIVE_INFINITY);
      v.currentTime = next;
      if (v.paused) updateCanvas();
    } catch (e) {}
  };

  const onReplay = () => {
    if (mediaTypeRef.current === 'gif') {
      setGifReloadToken((t) => t + 1);
      setIsPlaying(true);
      startFrameLoop();
      setTimeout(() => updateCanvas(), 50);
      return;
    }

    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = 0;
      if (!v.paused) {
        updateCanvas();
      } else {
        v.play().catch(() => {});
      }
    } catch (e) {}
  };

  const hasVideoSource = Boolean(videoUrl);
  const hasVideo = isVideoReady;

  return (
    <div className="flex flex-col md:flex-row md:h-screen min-h-screen overflow-hidden bg-bp-eyeblack relative z-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/gif"
        className="sr-only"
        aria-label="Upload a video or GIF"
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          if (file) handlePickVideo(file);
          // Allow picking the same file again.
          if (e.target) e.target.value = '';
        }}
      />
      {/* Generation zone */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto bg-bp-eyeblack">
        {!hasVideoSource ? (
          <div className="max-w-md mx-auto flex flex-col items-center gap-8">
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl text-bp-chalk">Turn any video or GIF into dot matrix</h2>
              <p className="text-sm text-bp-chalk">
                Upload a clip, dial in threshold and detail, and we'll generate a processed download automatically.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <VideoDropzone onFile={handlePickVideo} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full h-full">
            <div className="rounded border border-bp-blue p-6 sm:p-10 flex items-center justify-center min-h-[420px] h-full bg-bp-eyeblack overflow-auto">
              <canvas ref={canvasRef} className="max-w-full h-auto rounded shadow-2xl relative z-10" />
              {/* Hidden video element drives the frame processing */}
              <video ref={videoRef} className="hidden" />
              {mediaType === 'gif' && (
                <img
                  key={gifReloadToken}
                  ref={gifImgRef}
                  src={videoUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute pointer-events-none"
                  style={{ left: 0, top: 0, width: 16, height: 16, opacity: 0.2, zIndex: 0, display: 'block' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full md:w-[380px] h-full bg-bp-eyeblack border-l border-bp-eyeblack/60 p-6 overflow-y-auto flex-shrink-0">
        <div className="flex flex-col h-full">
          <section className="sticky top-0 z-10 bg-bp-eyeblack mb-6 border-b border-bp-eyeblack/60 pb-4">
            <h1 className="text-lg md:text-2xl text-bp-blue font-normal mb-1">Dot Matrix Video</h1>
            <p className="text-xs text-bp-chalk text-justify">
              Upload a video or GIF; it will be converted frame-by-frame and prepared for download automatically.
            </p>
          </section>

          {!hasVideo ? (
            <div className="bg-bp-chalk/5 rounded px-3 py-2 text-bp-chalk/80">
              Upload a video or GIF to enable controls and start processing.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <h2 className="text-sm text-bp-chalk">Rendering</h2>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-bp-chalk">Threshold</label>
                  <span className="text-xs font-mono text-bp-chalk">{threshold}</span>
                </div>
                <input type="range" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} min="0" max="255" step="1" className="w-full accent-bp-blue" />
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-bp-chalk">Detail Level</label>
                  <span className="text-xs font-mono text-bp-chalk">{detailLevel}</span>
                </div>
                <input type="range" value={detailLevel} onChange={(e) => setDetailLevel(parseInt(e.target.value))} min="1" max="7" step="1" className="w-full accent-bp-blue" />
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-bp-chalk">Brightness</label>
                  <span className="text-xs font-mono text-bp-chalk">{brightness}</span>
                </div>
                <input type="range" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} min="-100" max="100" step="1" className="w-full accent-bp-blue" />
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-bp-chalk">Contrast</label>
                  <span className="text-xs font-mono text-bp-chalk">{contrast}</span>
                </div>
                <input type="range" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} min="-100" max="100" step="1" className="w-full accent-bp-blue" />
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm text-bp-chalk">Invert dots</label>
                  <span className="text-xs text-bp-chalk/80">Flip dot thresholding</span>
                </div>
                <label className="relative inline-block w-11 h-6">
                  <input type="checkbox" checked={invertDots} onChange={(e) => setInvertDots(e.target.checked)} className="sr-only peer" />
                  <span className="absolute cursor-pointer inset-0 bg-bp-eyeblack rounded-full peer-checked:bg-bp-blue transition-colors"></span>
                  <span className="absolute left-1 top-1 bg-bp-chalk w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-bp-chalk"></span>
                </label>
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-2">
                <label className="text-sm text-bp-chalk">Rendering Mode</label>
                <select value={renderMode} onChange={(e) => setRenderMode(e.target.value)} className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm">
                  <option value="dotMatrix">Dot Matrix</option>
                  <option value="binaryDither">Binary Dithering</option>
                </select>
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-2">
                <label className="text-sm text-bp-chalk">Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="bg-bp-chalk/5 text-bp-chalk px-3 py-2 rounded text-sm">
                  <option value="original">Original</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="21:9">21:9 Ultra Wide</option>
                </select>
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-bp-chalk">Zoom</label>
                  <span className="text-xs font-mono text-bp-chalk">{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  min="1"
                  max="3"
                  step="0.05"
                  className="w-full accent-bp-blue"
                />
              </div>

              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm text-bp-chalk">Dot color</label>
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

              <h2 className="text-sm text-bp-chalk">Playback</h2>
              <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onSeek(-10)}
                    disabled={mediaType === 'gif' || isRecording}
                    className="flex-1 px-3 py-2 bg-bp-blue text-bp-chalk rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -10s
                  </button>
                  <button
                    onClick={onPlayPause}
                    disabled={isRecording}
                    className="flex-1 px-3 py-2 bg-bp-blue text-bp-chalk rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={() => onSeek(10)}
                    disabled={mediaType === 'gif' || isRecording}
                    className="flex-1 px-3 py-2 bg-bp-blue text-bp-chalk rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +10s
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onReplay}
                    disabled={isRecording}
                    className="flex-1 px-3 py-2 bg-bp-blue text-bp-chalk rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    disabled={isRecording}
                    className="flex-1 px-3 py-2 bg-bp-eyeblack border border-bp-blue/60 text-bp-chalk rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload new
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto sticky bottom-0 z-10 bg-bp-eyeblack pt-4 flex flex-col gap-4">
            <div className="bg-bp-chalk/5 rounded px-3 py-2 flex flex-col gap-3">
              <h2 className="text-sm text-bp-chalk">Download</h2>

              {!supportedMimeType ? (
                <p className="text-xs text-bp-chalk/80 leading-relaxed">
                  Downloading isn’t supported in this browser. You can still preview the dot-matrix frames.
                </p>
              ) : downloadUrl ? (
                <a
                  href={downloadUrl}
                  download="dot-matrix-video.webm"
                  className="px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm text-center"
                >
                  Download Processed Video
                </a>
              ) : (
                <button
                  type="button"
                  onClick={recordProcessedNow}
                  disabled={isRecording}
                  className="px-4 py-2 bg-bp-blue text-bp-chalk rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRecording ? 'Processing…' : 'Download Processed Video'}
                </button>
              )}
            </div>

            <div className="bg-bp-chalk/5 rounded px-3 py-2">
              <p className="text-xs text-bp-chalk leading-relaxed">
                Upload a new video or GIF to start over. Everything runs inside your browser.
              </p>
              <button
                onClick={cleanupVideo}
                className="mt-3 text-sm text-bp-blue hover:text-bp-chalk cursor-pointer transition-colors"
              >
                Reset tool
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

