import { useEffect, useMemo, useRef, useState } from 'react';
import { PreviewCanvas } from './components/PreviewCanvas';
import { UploadPanel } from './components/UploadPanel';
import { WatermarkControls } from './components/WatermarkControls';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from './constants';
import { createDownloadFilename, exportCanvasToBlob, shareImageIfPossible, triggerDownload } from './utils/exportImage';
import { loadImageAsset } from './utils/imageLoader';
import { renderWatermarkedImage } from './utils/renderWatermark';
import { ExportFormat, ImageAsset, WatermarkSettings } from './types';

function loadStoredSettings(): WatermarkSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as WatermarkSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getPreviewSize(width: number, height: number): { width: number; height: number } {
  const maxWidth = 960;
  const maxHeight = 720;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

export default function App() {
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [settings, setSettings] = useState<WatermarkSettings>(loadStoredSettings);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jpeg');
  const [previewMode, setPreviewMode] = useState<'after' | 'before'>('after');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!imageAsset || !previewCanvasRef.current) {
      return;
    }

    const previewCanvas = previewCanvasRef.current;
    const previewSize = getPreviewSize(imageAsset.width, imageAsset.height);
    if (previewMode === 'before') {
      previewCanvas.width = previewSize.width;
      previewCanvas.height = previewSize.height;
      const context = previewCanvas.getContext('2d');
      if (!context) {
        return;
      }

      context.clearRect(0, 0, previewSize.width, previewSize.height);
      context.drawImage(imageAsset.image, 0, 0, previewSize.width, previewSize.height);
      return;
    }

    renderWatermarkedImage({
      canvas: previewCanvas,
      image: imageAsset.image,
      width: previewSize.width,
      height: previewSize.height,
      settings
    });
  }, [imageAsset, previewMode, settings]);

  useEffect(() => {
    return () => {
      if (imageAsset?.objectUrl) {
        URL.revokeObjectURL(imageAsset.objectUrl);
      }
    };
  }, [imageAsset]);

  const imageSummary = useMemo(() => {
    if (!imageAsset) {
      return 'Choose a photo to start. Everything stays on this device.';
    }

    return `${imageAsset.name} • ${imageAsset.width} × ${imageAsset.height}px`;
  }, [imageAsset]);

  const handleFileSelect = async (file: File) => {
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage('Loading image...');

    try {
      const nextAsset = await loadImageAsset(file);
      setImageAsset((current) => {
        if (current?.objectUrl) {
          URL.revokeObjectURL(current.objectUrl);
        }

        return nextAsset;
      });
      setPreviewMode('after');
      setStatusMessage(nextAsset.wasConverted ? 'HEIC converted locally and ready.' : 'Image ready.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The photo could not be loaded.');
      setStatusMessage(null);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSettingChange = <K extends keyof WatermarkSettings>(
    key: K,
    value: WatermarkSettings[K]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setStatusMessage('Watermark settings reset.');
  };

  const runExport = async (format: ExportFormat, action: 'download' | 'share') => {
    if (!imageAsset || !exportCanvasRef.current) {
      setErrorMessage('Upload a photo before exporting.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(action === 'share' ? 'Preparing share image...' : 'Preparing download...');

    try {
      renderWatermarkedImage({
        canvas: exportCanvasRef.current,
        image: imageAsset.image,
        width: imageAsset.width,
        height: imageAsset.height,
        settings
      });

      const blob = await exportCanvasToBlob(exportCanvasRef.current, format, 0.94);
      const filename = createDownloadFilename(imageAsset.name, format);

      if (action === 'share') {
        const shared = await shareImageIfPossible(blob, filename);
        if (!shared) {
          triggerDownload(blob, filename);
          setStatusMessage('Sharing is unavailable here, so the image was downloaded instead.');
          return;
        }

        setStatusMessage('Shared successfully.');
        return;
      }

      triggerDownload(blob, filename);
      setStatusMessage(`Downloaded ${filename}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The image could not be exported.');
      setStatusMessage(null);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <main className="app">
        <section className="hero">
          <div>
            <p className="eyebrow">Private photo watermarking</p>
            <h1>Watermark photos locally, even offline.</h1>
            <p className="hero-copy">
              Upload a photo, adjust the text watermark, and download a full-resolution file. Your
              image stays in the browser and is never uploaded to a server.
            </p>
          </div>
          <div className="hero-card">
            <p className="hero-stat-label">Current image</p>
            <p className="hero-stat">{imageSummary}</p>
            <p className="helper-text">
              Supported formats: JPEG, PNG, WebP, HEIC, and HEIF. HEIC is converted locally before
              preview and export.
            </p>
          </div>
        </section>

        {errorMessage ? <div className="message error-message">{errorMessage}</div> : null}
        {statusMessage ? <div className="message status-message">{statusMessage}</div> : null}

        <section className="layout-grid">
          <div className="left-column">
            <UploadPanel
              onFileSelect={handleFileSelect}
              disabled={isBusy}
              fileName={imageAsset?.name}
            />
            <PreviewCanvas
              canvasRef={previewCanvasRef}
              hasImage={Boolean(imageAsset)}
              beforeAfterMode={previewMode}
              dimensions={imageAsset ? { width: imageAsset.width, height: imageAsset.height } : undefined}
              wasConverted={imageAsset?.wasConverted}
            />
          </div>

          <div className="right-column">
            <WatermarkControls
              settings={settings}
              exportFormat={exportFormat}
              beforeAfterMode={previewMode}
              disabled={isBusy}
              onSettingChange={handleSettingChange}
              onExportFormatChange={setExportFormat}
              onBeforeAfterChange={setPreviewMode}
              onReset={handleReset}
            />

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Step 4</p>
                  <h2>Export</h2>
                </div>
              </div>

              <div className="export-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => runExport('jpeg', 'download')}
                  disabled={!imageAsset || isBusy}
                >
                  Download JPEG
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => runExport('png', 'download')}
                  disabled={!imageAsset || isBusy}
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => runExport(exportFormat, 'share')}
                  disabled={!imageAsset || isBusy}
                >
                  Share on device
                </button>
              </div>

              <p className="helper-text">
                Export keeps the original pixel dimensions. JPEG uses high quality by default.
              </p>
            </section>
          </div>
        </section>
      </main>

      <canvas ref={exportCanvasRef} className="sr-only" aria-hidden="true" />
    </div>
  );
}
