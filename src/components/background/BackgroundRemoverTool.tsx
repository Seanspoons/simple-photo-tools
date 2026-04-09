import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { FloatingMessage } from '../FloatingMessage';
import { UploadPanel } from '../UploadPanel';
import { loadImageAsset } from '../../utils/imageLoader';
import { ImageAsset } from '../../types';

type BackgroundRemoverConfirmAction = 'clear' | null;

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

export function BackgroundRemoverTool() {
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BackgroundRemoverConfirmAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    'Background remover is ready for upload.'
  );
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (imageAsset?.objectUrl) {
        URL.revokeObjectURL(imageAsset.objectUrl);
      }
    };
  }, [imageAsset]);

  useEffect(() => {
    if (!imageAsset || !previewCanvasRef.current) {
      return;
    }

    const previewSize = getPreviewSize(imageAsset.width, imageAsset.height);
    renderPreview(
      previewCanvasRef.current,
      imageAsset.image,
      previewSize.width,
      previewSize.height
    );
  }, [imageAsset]);

  const imageSummary = useMemo(() => {
    if (!imageAsset) {
      return 'Choose a photo to remove the background.';
    }

    return `${imageAsset.name} • ${imageAsset.width} × ${imageAsset.height}px`;
  }, [imageAsset]);

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
      setStatusMessage('Image ready. Background removal will be added next.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The image could not be loaded.');
      setStatusMessage(null);
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
              Start with one photo. The model and full cutout workflow will load right in your
              browser.
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
                {imageAsset ? 'Coming next' : 'Waiting for photo'}
              </span>
            </div>
            <p className="panel-description">
              The in-browser model pipeline, loading states, and cutout controls will be wired in
              next. This scaffold keeps the tool aligned with the existing suite layout first.
            </p>
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

            <div className="preview-shell background-remover-preview-shell">
              {imageAsset ? (
                <div className="background-remover-preview-frame">
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
              Transparent PNG export and background fill options will be added with the processing
              pipeline.
            </p>
            <div className="export-action-row">
              <button type="button" className="primary-button" disabled>
                Download PNG
              </button>
              <button type="button" className="secondary-button" disabled>
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
