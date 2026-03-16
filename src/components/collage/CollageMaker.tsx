import { useEffect, useMemo, useRef, useState } from 'react';
import { CollageSettings, ImageAsset } from '../../types';
import {
  createDownloadFilename,
  exportCanvasToBlob,
  shareImageIfPossible,
  triggerDownload
} from '../../utils/exportImage';
import { loadImageAsset } from '../../utils/imageLoader';
import { getCollageOutputSize, renderCollage } from '../../utils/collage/renderCollage';
import { CollageControls } from './CollageControls';
import { CollagePreview } from './CollagePreview';
import { CollageUploadPanel } from './CollageUploadPanel';

const MAX_IMAGES = 20;

const DEFAULT_COLLAGE_SETTINGS: CollageSettings = {
  layoutMode: 'uniform',
  sizePreset: 'instagram-square',
  columns: 2,
  gap: 12,
  backgroundColor: '#ffffff',
  fitMode: 'cover',
  cornerRadius: 0,
  exportFormat: 'jpeg',
  featuredStyle: 'feature-top'
};

export function CollageMaker() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [settings, setSettings] = useState<CollageSettings>(DEFAULT_COLLAGE_SETTINGS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const imagesRef = useRef<ImageAsset[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  const imageSummary = useMemo(() => {
    if (images.length === 0) {
      return 'Add at least 2 photos to start building a collage.';
    }

    if (images.length === 1) {
      return 'Add one more photo to turn this into a collage.';
    }

    return `${images.length} photos ready for your collage.`;
  }, [images.length]);

  const canBuildCollage = images.length >= 2;
  const previewHelperText =
    settings.layoutMode === 'featured'
      ? 'The first photo becomes the main image. Use “Use as Main Photo” below to switch it.'
      : 'Uniform Grid keeps all photos evenly balanced.';

  useEffect(() => {
    setCanNativeShare('share' in navigator && 'canShare' in navigator);
  }, []);

  useEffect(() => {
    if (!canBuildCollage || !previewCanvasRef.current) {
      return;
    }

    const outputSize = getCollageOutputSize(settings);
    const maxPreviewWidth = 960;
    const scale = Math.min(maxPreviewWidth / outputSize.width, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderCollage(previewCanvasRef.current, images, settings, {
      width: Math.round(outputSize.width * scale * dpr),
      height: Math.round(outputSize.height * scale * dpr)
    });
  }, [canBuildCollage, images, settings]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.objectUrl));
    };
  }, []);

  const handleFilesSelect = async (selectedFiles: FileList | File[]) => {
    const nextFiles = Array.from(selectedFiles);
    const roomRemaining = MAX_IMAGES - images.length;

    if (roomRemaining <= 0) {
      setErrorMessage('You can add up to 20 photos in one collage.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage('Adding photos...');

    try {
      const filesToLoad = nextFiles.slice(0, roomRemaining);
      const loadedImages = await Promise.all(filesToLoad.map((file) => loadImageAsset(file)));

      setImages((current) => [...current, ...loadedImages]);
      setStatusMessage(`${images.length + loadedImages.length} photos ready.`);

      if (nextFiles.length > roomRemaining) {
        setErrorMessage(`Only the first ${roomRemaining} additional photos were added.`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Some photos could not be loaded.');
      setStatusMessage(null);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSettingsChange = <K extends keyof CollageSettings>(
    key: K,
    value: CollageSettings[K]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_COLLAGE_SETTINGS);
    setStatusMessage('Collage settings reset.');
  };

  const handleClearPhotos = () => {
    setImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.objectUrl));
      return [];
    });
    setErrorMessage(null);
    setStatusMessage('Ready for a new collage.');
  };

  const handleRemoveImage = (index: number) => {
    setImages((current) => {
      const nextImages = [...current];
      const [removed] = nextImages.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.objectUrl);
      }

      return nextImages;
    });
    setStatusMessage('Photo removed.');
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const nextImages = [...current];
      const [selected] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, selected);
      return nextImages;
    });
    setStatusMessage('Photo order updated.');
  };

  const handleSetFeatured = (index: number) => {
    setImages((current) => {
      if (index <= 0 || index >= current.length) {
        return current;
      }

      const nextImages = [...current];
      const [selected] = nextImages.splice(index, 1);
      nextImages.unshift(selected);
      return nextImages;
    });
    setStatusMessage('Featured photo updated.');
  };

  const handleExport = async (format: 'jpeg' | 'png', action: 'download' | 'share') => {
    if (!canBuildCollage || !exportCanvasRef.current) {
      setErrorMessage('Add at least 2 photos before saving.');
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage('Getting your collage ready...');

    try {
      renderCollage(exportCanvasRef.current, images, settings);
      const blob = await exportCanvasToBlob(exportCanvasRef.current, format, 0.94);
      const filename = createDownloadFilename('collage', format).replace('-watermarked', '');

      if (action === 'share') {
        const shared = await shareImageIfPossible(blob, filename);
        if (shared) {
          setStatusMessage('Collage ready to save or share.');
          return;
        }
      }

      triggerDownload(blob, filename);
      setStatusMessage(`${filename} is ready.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The collage could not be exported.');
      setStatusMessage(null);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <section className="hero">
        <div className="hero-copy-block">
          <div>
            <p className="eyebrow">Collage Maker</p>
            <h1>Build a simple collage from your photos.</h1>
            <p className="hero-copy">
              Add multiple photos, choose a layout, preview the collage, and save it at high
              quality right in your browser.
            </p>
          </div>
        </div>
        <div className="hero-card">
          <p className="hero-stat-label">Your collage</p>
          <p className="hero-stat">{imageSummary}</p>
          <p className="helper-text">
            Start with 2 to 20 photos. Uniform grid and featured layouts are both ready to use.
          </p>
        </div>
      </section>

      {errorMessage ? <div className="message error-message">{errorMessage}</div> : null}
      {statusMessage ? <div className="message status-message">{statusMessage}</div> : null}

      <section className="layout-grid">
        <div className="left-column">
          <CollageUploadPanel
            onFilesSelect={handleFilesSelect}
            disabled={isBusy}
            imageCount={images.length}
          />
          <CollagePreview
            canvasRef={previewCanvasRef}
            hasImages={images.length > 0}
            imageCount={images.length}
            canBuild={canBuildCollage}
            helperText={previewHelperText}
          />
        </div>

        <div className="right-column">
          <CollageControls
            settings={settings}
            disabled={isBusy}
            onChange={handleSettingsChange}
            onReset={handleReset}
          />

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2>Photos</h2>
              </div>
            </div>
            {images.length > 0 ? (
              <div className="thumb-list">
                {images.map((image, index) => (
                  <div key={image.objectUrl} className="thumb-card">
                    <img src={image.objectUrl} alt={image.name} className="thumb-image" />
                    <p className="thumb-label">{image.name}</p>
                    <div className="thumb-actions">
                      <button
                        type="button"
                        className="thumb-action-button"
                        onClick={() => handleMoveImage(index, -1)}
                        disabled={index === 0 || isBusy}
                      >
                        Move Earlier
                      </button>
                      <button
                        type="button"
                        className="thumb-action-button"
                        onClick={() => handleMoveImage(index, 1)}
                        disabled={index === images.length - 1 || isBusy}
                      >
                        Move Later
                      </button>
                      <button
                        type="button"
                        className="thumb-action-button"
                        onClick={() => handleSetFeatured(index)}
                        disabled={index === 0 || isBusy}
                      >
                        Use as Main Photo
                      </button>
                      <button
                        type="button"
                        className="thumb-action-button is-danger"
                        onClick={() => handleRemoveImage(index)}
                        disabled={isBusy}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper-text">Add a few photos and they will appear here.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 5</p>
                <h2>Export</h2>
              </div>
            </div>
            <div className="export-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => handleExport('jpeg', 'download')}
                disabled={!canBuildCollage || isBusy}
              >
                Save JPEG
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleExport('png', 'download')}
                disabled={!canBuildCollage || isBusy}
              >
                Save PNG
              </button>
              {canNativeShare ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleExport('jpeg', 'share')}
                  disabled={!canBuildCollage || isBusy}
                >
                  Share / Save to Photos
                </button>
              ) : null}
              <button
                type="button"
                className="ghost-button"
                onClick={handleClearPhotos}
                disabled={images.length === 0 || isBusy}
              >
                Start a New Collage
              </button>
            </div>
            <p className="helper-text">Collages export at the full preset size in either layout mode.</p>
          </section>
        </div>
      </section>

      <canvas ref={exportCanvasRef} className="sr-only" aria-hidden="true" />
    </>
  );
}
