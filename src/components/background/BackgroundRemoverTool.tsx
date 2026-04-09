import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { FloatingMessage } from '../FloatingMessage';
import { UploadPanel } from '../UploadPanel';
import { loadImageAsset } from '../../utils/imageLoader';
import { preloadBackgroundRemoval, removeImageBackground } from '../../utils/backgroundRemoval';
import { ImageAsset } from '../../types';

type BackgroundRemoverConfirmAction = 'clear' | null;
type BackgroundPreviewMode = 'before' | 'after';
type ModelStatus = 'loading' | 'ready' | 'error';

interface LoadedBlobImage {
  image: HTMLImageElement;
  objectUrl: string;
}

function getPreviewSize(width: number, height: number): { width: number; height: number } {
  const maxWidth = 960;
  const maxHeight = 720;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function renderPreview(canvas: HTMLCanvasElement, image: HTMLImageElement, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('The browser could not prepare the preview.');
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
}

function formatModelAssetLabel(key: string): string {
  if (key.includes('model')) {
    return 'Downloading model';
  }

  if (key.includes('wasm')) {
    return 'Preparing runtime';
  }

  if (key.includes('worker')) {
    return 'Starting worker';
  }

  return 'Preparing model';
}

function loadBlobImage(blob: Blob): Promise<LoadedBlobImage> {
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The cutout preview could not be prepared.'));
    };
    image.src = objectUrl;
  });
}

export function BackgroundRemoverTool() {
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultPreview, setResultPreview] = useState<LoadedBlobImage | null>(null);
  const [previewMode, setPreviewMode] = useState<BackgroundPreviewMode>('after');
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');
  const [modelStage, setModelStage] = useState('Preparing model in your browser...');
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BackgroundRemoverConfirmAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>('Loading background remover...');
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function prepareModel() {
      try {
        setModelStatus('loading');
        setModelStage('Preparing model in your browser...');
        setModelProgress(null);
        await preloadBackgroundRemoval((key, current, total) => {
          if (isCancelled) {
            return;
          }

          setModelStage(`${formatModelAssetLabel(key)}...`);
          setModelProgress(total > 0 ? current / total : null);
        });

        if (isCancelled) {
          return;
        }

        setModelStatus('ready');
        setModelStage('Model ready in your browser.');
        setModelProgress(1);
        setStatusMessage('Background remover is ready.');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setModelStatus('error');
        setModelStage('The background remover could not load.');
        setModelProgress(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'The background remover could not load in this browser.'
        );
        setStatusMessage(null);
      }
    }

    void prepareModel();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageAsset?.objectUrl) {
        URL.revokeObjectURL(imageAsset.objectUrl);
      }
    };
  }, [imageAsset]);

  useEffect(() => {
    return () => {
      if (resultPreview?.objectUrl) {
        URL.revokeObjectURL(resultPreview.objectUrl);
      }
    };
  }, [resultPreview]);

  useEffect(() => {
    const activeImage = previewMode === 'before' ? imageAsset?.image ?? null : resultPreview?.image ?? null;
    if (!activeImage || !previewCanvasRef.current) {
      return;
    }

    const previewSize = getPreviewSize(activeImage.naturalWidth, activeImage.naturalHeight);
    renderPreview(previewCanvasRef.current, activeImage, previewSize.width, previewSize.height);
  }, [imageAsset, previewMode, resultPreview]);

  const imageSummary = useMemo(() => {
    if (!imageAsset) {
      return 'Choose a photo to remove the background.';
    }

    return `${imageAsset.name} • ${imageAsset.width} × ${imageAsset.height}px`;
  }, [imageAsset]);

  const canRunRemoval = imageAsset !== null && modelStatus === 'ready' && !isBusy;

  const handleFileSelect = async (file: File) => {
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage('Opening image...');

    try {
      const nextAsset = await loadImageAsset(file);
      setImageAsset((current) => {
        if (current?.objectUrl) {
          URL.revokeObjectURL(current.objectUrl);
        }

        return nextAsset;
      });
      setResultBlob(null);
      setResultPreview((current) => {
        if (current?.objectUrl) {
          URL.revokeObjectURL(current.objectUrl);
        }

        return null;
      });
      setPreviewMode('before');
      setStatusMessage(
        modelStatus === 'ready'
          ? 'Image ready. Remove the background when you are ready.'
          : 'Image ready. The model is still preparing in your browser.'
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The image could not be loaded.');
      setStatusMessage(null);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageAsset) {
      setErrorMessage('Choose a photo before removing the background.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage('Removing background...');

    try {
      const nextBlob = await removeImageBackground(imageAsset.file, (key, current, total) => {
        setModelStage(`${formatModelAssetLabel(key)}...`);
        setModelProgress(total > 0 ? current / total : null);
      });
      const nextPreview = await loadBlobImage(nextBlob);

      setResultPreview((current) => {
        if (current?.objectUrl) {
          URL.revokeObjectURL(current.objectUrl);
        }

        return nextPreview;
      });
      setResultBlob(nextBlob);
      setPreviewMode('after');
      setStatusMessage('Background removed. Review the transparent cutout.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The background could not be removed from this image.'
      );
      setStatusMessage('Your original photo is still ready to try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleChooseAnotherPhoto = () => {
    setConfirmAction(null);
    setImageAsset((current) => {
      if (current?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }

      return null;
    });
    setResultPreview((current) => {
      if (current?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }

      return null;
    });
    setResultBlob(null);
    setPreviewMode('after');
    setStatusMessage('Ready for another image.');
  };

  return (
    <>
      <section className="hero">
        <div className="hero-copy-block">
          <div>
            <p className="eyebrow">Background Remover</p>
            <h1>Remove photo backgrounds directly in your browser.</h1>
            <p className="hero-copy">
              Create transparent cutouts without uploading your image. No accounts. No server
              processing. Private by default.
            </p>
            <div className="hero-tags" aria-label="Background remover highlights">
              <span className="hero-tag">Transparent cutouts</span>
              <span className="hero-tag">Private in browser</span>
              <span className="hero-tag">PNG download</span>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <p className="hero-stat-label">Your photo</p>
          <p className="hero-stat">{imageSummary}</p>
          <div className="tip-note" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">
              Start with one photo. The model runs entirely in your browser and keeps your image on
              your device.
            </p>
          </div>
        </div>
      </section>

      {errorMessage || statusMessage ? (
        <div className="floating-message-stack">
          {errorMessage ? (
            <FloatingMessage
              tone="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          ) : null}
          {statusMessage ? (
            <FloatingMessage
              tone="status"
              message={statusMessage}
              onDismiss={() => setStatusMessage(null)}
            />
          ) : null}
        </div>
      ) : null}

      <section className="layout-grid">
        <div className="left-column">
          <UploadPanel
            onFileSelect={handleFileSelect}
            disabled={isBusy}
            fileName={imageAsset?.name}
          />

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2>Remove the background</h2>
              </div>
              <span className="dimension-badge">
                {modelStatus === 'ready'
                  ? 'Model ready'
                  : modelStatus === 'error'
                    ? 'Load failed'
                    : 'Preparing model'}
              </span>
            </div>
            <p className="panel-description">
              {modelStatus === 'ready'
                ? 'The background remover is ready in your browser. Run it when your photo is in place.'
                : 'The first run downloads the model into your browser cache. It usually takes longer once, then gets faster.'}
            </p>

            {modelStatus !== 'ready' ? (
              <div className="background-remover-stage-card" aria-live="polite">
                <p className="background-remover-stage-title">{modelStage}</p>
                <div className="background-remover-loading-bars" aria-hidden="true">
                  <span className="background-remover-loading-bar" />
                  <span className="background-remover-loading-bar is-delay-1" />
                  <span className="background-remover-loading-bar is-delay-2" />
                </div>
                <p className="helper-text">
                  {modelProgress !== null
                    ? `${Math.round(modelProgress * 100)}% ready`
                    : 'Preparing browser runtime and model files'}
                </p>
              </div>
            ) : null}

            <div className="export-action-row">
              <button
                type="button"
                className="primary-button"
                onClick={handleRemoveBackground}
                disabled={!canRunRemoval}
              >
                {isBusy ? 'Removing Background...' : 'Remove Background'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmAction('clear')}
                disabled={!imageAsset || isBusy}
              >
                Choose Another Photo
              </button>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="panel preview-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Review result</h2>
              </div>
              {imageAsset ? (
                <span className="dimension-badge">
                  {imageAsset.width} × {imageAsset.height}px
                </span>
              ) : null}
            </div>

            <div className="preview-compare-bar" aria-label="Preview comparison">
              <span className="preview-compare-label">View</span>
              <div className="preview-compare-toggle" role="tablist" aria-label="Preview comparison">
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewMode === 'after'}
                  className={`preview-compare-button ${previewMode === 'after' ? 'is-active' : ''}`}
                  onClick={() => setPreviewMode('after')}
                  disabled={!resultBlob}
                >
                  Cutout
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewMode === 'before'}
                  className={`preview-compare-button ${previewMode === 'before' ? 'is-active' : ''}`}
                  onClick={() => setPreviewMode('before')}
                  disabled={!imageAsset}
                >
                  Original
                </button>
              </div>
            </div>

            <div className="preview-shell background-remover-preview-shell">
              {imageAsset ? (
                <div className="background-remover-preview-frame">
                  {isBusy && previewMode === 'after' ? (
                    <div className="background-remover-overlay-note">
                      <p>Processing cutout...</p>
                    </div>
                  ) : null}
                  <canvas
                    ref={previewCanvasRef}
                    className="preview-canvas"
                    aria-label="Background remover preview"
                  />
                </div>
              ) : (
                <div className="preview-placeholder">
                  <p>Your cutout preview will appear here after you choose a photo.</p>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2>Download</h2>
              </div>
            </div>
            <p className="panel-description panel-description-tight">
              Transparent PNG export is the next step. This phase focuses on the in-browser model
              pipeline and live cutout preview.
            </p>
            <div className="export-action-row">
              <button type="button" className="primary-button" disabled>
                Download PNG
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmAction('clear')}
                disabled={!imageAsset || isBusy}
              >
                Choose Another Photo
              </button>
            </div>
          </section>
        </div>
      </section>

      <ConfirmModal
        open={confirmAction === 'clear'}
        title="Choose another photo?"
        message="This will clear the current background remover preview."
        confirmLabel="Choose Another Photo"
        cancelLabel="Keep Photo"
        onConfirm={handleChooseAnotherPhoto}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
