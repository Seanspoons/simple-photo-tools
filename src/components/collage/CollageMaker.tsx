import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';
import {
  COLLAGE_PRESETS_STORAGE_KEY,
  COLLAGE_SETTINGS_STORAGE_KEY
} from '../../constants';
import { CollageSavedPreset, CollageSettings, ImageAsset } from '../../types';
import {
  createDownloadFilename,
  exportCanvasToBlob,
  shareImageIfPossible,
  triggerDownload
} from '../../utils/exportImage';
import {
  clearCollageDraft,
  loadCollageDraft,
  saveCollageDraft
} from '../../utils/collage/draftStorage';
import { loadImageAsset } from '../../utils/imageLoader';
import {
  getCollageLayoutCells,
  getCollageLayoutMetrics,
  getCollageOutputSize,
  getRenderedImageRect,
  renderCollage
} from '../../utils/collage/renderCollage';
import { CollageControls } from './CollageControls';
import { CollagePreview } from './CollagePreview';
import { CollageUploadPanel } from './CollageUploadPanel';

const MAX_IMAGES = 20;

const DEFAULT_COLLAGE_SETTINGS: CollageSettings = {
  sizePreset: 'instagram-square',
  columns: 3,
  gap: 12,
  backgroundColor: '#ffffff',
  fitMode: 'cover',
  cornerRadius: 0,
  exportFormat: 'jpeg',
  featuredSpan: '1x1'
};

function loadStoredCollagePresets(): CollageSavedPreset[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(COLLAGE_PRESETS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as CollageSavedPreset[];
  } catch {
    return [];
  }
}

function loadStoredCollageSettings(): CollageSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_COLLAGE_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(COLLAGE_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_COLLAGE_SETTINGS;
    }

    return { ...DEFAULT_COLLAGE_SETTINGS, ...JSON.parse(raw) } as CollageSettings;
  } catch {
    return DEFAULT_COLLAGE_SETTINGS;
  }
}

function getRecommendedColumns(imageCount: number): number {
  if (imageCount <= 4) {
    return 2;
  }

  if (imageCount <= 9) {
    return 3;
  }

  if (imageCount <= 16) {
    return 4;
  }

  return 5;
}

function getRecommendedSettings(
  imageCount: number,
  currentSettings: CollageSettings
): CollageSettings {
  const nextColumns = getRecommendedColumns(imageCount);
  const shouldUseHighRes = imageCount >= 10;
  const shouldFeatureMainPhoto = currentSettings.sizePreset === 'story' || imageCount >= 7;

  return {
    ...currentSettings,
    columns: nextColumns,
    sizePreset: shouldUseHighRes ? 'high-res-square' : currentSettings.sizePreset,
    featuredSpan:
      shouldFeatureMainPhoto && currentSettings.featuredSpan === '1x1'
        ? '2x2'
        : currentSettings.featuredSpan
  };
}

export function CollageMaker() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [settings, setSettings] = useState<CollageSettings>(loadStoredCollageSettings);
  const [savedPresets, setSavedPresets] = useState<CollageSavedPreset[]>(loadStoredCollagePresets);
  const [presetName, setPresetName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [canPreviewDrag, setCanPreviewDrag] = useState(false);
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
  const previewSize = useMemo(() => {
    const outputSize = getCollageOutputSize(settings);
    const maxPreviewWidth = 960;
    const scale = Math.min(maxPreviewWidth / outputSize.width, 1);
    const dpr =
      typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    return {
      width: Math.round(outputSize.width * scale * dpr),
      height: Math.round(outputSize.height * scale * dpr)
    };
  }, [settings]);
  const previewCells = useMemo(
    () => getCollageLayoutCells(images.length, settings, previewSize),
    [images.length, previewSize, settings]
  );
  const previewDropzones = useMemo(
    () =>
      previewCells.map((cell, index) => {
        const image = images[index];
        if (!image) {
          return cell;
        }

        return getRenderedImageRect(cell, image.width, image.height, settings.fitMode);
      }),
    [images, previewCells, settings.fitMode]
  );
  const layoutMetrics = useMemo(
    () => getCollageLayoutMetrics(images.length, settings),
    [images.length, settings]
  );
  const layoutAdvice = useMemo(() => {
    if (!canBuildCollage) {
      return { message: null, actions: [] as Array<{ label: string; apply: () => void }> };
    }

    if (layoutMetrics.cellSize < 150) {
      return {
        message:
          'This layout will make each photo quite small. Try fewer columns, less spacing, or a larger output size.',
        actions: [
          {
            label: 'Use fewer columns',
            apply: () =>
              setSettings((current) => ({
                ...current,
                columns: Math.max(2, current.columns - 1)
              }))
          },
          {
            label: 'Use High Res',
            apply: () =>
              setSettings((current) => ({
                ...current,
                sizePreset: 'high-res-square'
              }))
          }
        ]
      };
    }

    if (
      settings.sizePreset === 'story' &&
      settings.featuredSpan === '1x1' &&
      layoutMetrics.gridHeight < layoutMetrics.outputHeight * 0.68
    ) {
      return {
        message:
          'This story layout leaves a lot of background space. A larger main photo often looks better here.',
        actions: [
          {
            label: 'Make main photo larger',
            apply: () =>
              setSettings((current) => ({
                ...current,
                featuredSpan: '2x2'
              }))
          }
        ]
      };
    }

    return { message: null, actions: [] as Array<{ label: string; apply: () => void }> };
  }, [canBuildCollage, layoutMetrics, settings.featuredSpan, settings.sizePreset]);
  const previewHelperText =
    settings.featuredSpan === '1x1'
      ? 'Square grid mode keeps all tiles the same size.'
      : 'The first photo becomes the main photo. Use “Use as Main Photo” below to switch it.';

  useEffect(() => {
    setCanNativeShare('share' in navigator && 'canShare' in navigator);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 921px) and (pointer: fine)');
    const updateInteractivePreview = () => setCanPreviewDrag(mediaQuery.matches);
    updateInteractivePreview();
    mediaQuery.addEventListener('change', updateInteractivePreview);

    return () => {
      mediaQuery.removeEventListener('change', updateInteractivePreview);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COLLAGE_PRESETS_STORAGE_KEY, JSON.stringify(savedPresets));
  }, [savedPresets]);

  useEffect(() => {
    window.localStorage.setItem(COLLAGE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let isCancelled = false;

    async function restoreDraft() {
      try {
        const draft = await loadCollageDraft();
        if (!draft || isCancelled) {
          setHasLoadedDraft(true);
          return;
        }

        const restoredImages = await Promise.all(draft.files.map((file) => loadImageAsset(file)));
        if (isCancelled) {
          restoredImages.forEach((image) => URL.revokeObjectURL(image.objectUrl));
          return;
        }

        setSettings(draft.settings);
        setImages(restoredImages);
        setStatusMessage(restoredImages.length > 0 ? 'Restored your last collage.' : null);
      } catch {
        if (!isCancelled) {
          setErrorMessage('Your last collage could not be restored.');
        }
      } finally {
        if (!isCancelled) {
          setHasLoadedDraft(true);
        }
      }
    }

    void restoreDraft();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canBuildCollage || !previewCanvasRef.current) {
      return;
    }

    renderCollage(previewCanvasRef.current, images, settings, {
      width: previewSize.width,
      height: previewSize.height
    });
  }, [canBuildCollage, images, previewSize.height, previewSize.width, settings]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    setSelectedImageIndex((current) => {
      if (images.length === 0) {
        return 0;
      }

      return Math.min(current, images.length - 1);
    });
  }, [images.length]);

  useEffect(() => {
    if (!hasLoadedDraft) {
      return;
    }

    void saveCollageDraft(
      settings,
      images.map((image) => image.file)
    );
  }, [hasLoadedDraft, images, settings]);

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
      const nextImageCount = images.length + loadedImages.length;

      setImages((current) => [...current, ...loadedImages]);
      setSettings((current) => getRecommendedSettings(nextImageCount, current));
      setStatusMessage(`${nextImageCount} photos ready.`);

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

  const handleAutoArrange = () => {
    if (images.length === 0) {
      setStatusMessage('Add photos first, then Auto arrange can help.');
      return;
    }

    setSettings((current) => getRecommendedSettings(images.length, current));
    setStatusMessage('Applied a suggested layout.');
  };

  const handleReset = () => {
    setSettings(DEFAULT_COLLAGE_SETTINGS);
    setStatusMessage('Collage settings reset.');
  };

  const handleSavePreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) {
      setErrorMessage('Add a name before saving this collage look.');
      return;
    }

    const nextPreset: CollageSavedPreset = {
      id: `collage-preset-${Date.now()}`,
      name: trimmedName,
      settings
    };

    setSavedPresets((current) => [...current, nextPreset]);
    setPresetName('');
    setErrorMessage(null);
    setStatusMessage(`Saved "${trimmedName}".`);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = savedPresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    setSettings(preset.settings);
    setErrorMessage(null);
    setStatusMessage(`Applied "${preset.name}".`);
  };

  const handleDeletePreset = (presetId: string) => {
    const preset = savedPresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    setSavedPresets((current) => current.filter((entry) => entry.id !== presetId));
    setErrorMessage(null);
    setStatusMessage(`Removed "${preset.name}".`);
  };

  const handleClearPhotos = () => {
    setImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.objectUrl));
      return [];
    });
    void clearCollageDraft();
    setErrorMessage(null);
    setStatusMessage('Ready for a new collage.');
    setShowClearModal(false);
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
    setSelectedImageIndex((current) => Math.max(0, Math.min(current, images.length - 2)));
    setStatusMessage('Photo removed.');
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    reorderImages(index, index + direction);
    setStatusMessage('Photo order updated.');
  };

  const handleSetFeatured = (index: number) => {
    reorderImages(index, 0);
    setStatusMessage('Featured photo updated.');
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const nextImages = [...current];
      const [selected] = nextImages.splice(fromIndex, 1);
      nextImages.splice(toIndex, 0, selected);
      return nextImages;
    });
  };

  const swapImages = (fromIndex: number, toIndex: number) => {
    setImages((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const nextImages = [...current];
      [nextImages[fromIndex], nextImages[toIndex]] = [nextImages[toIndex], nextImages[fromIndex]];
      return nextImages;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    setDropTargetIndex(index);
    setSelectedImageIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    setDropTargetIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      handleDragEnd();
      return;
    }

    reorderImages(draggedIndex, index);
    setSelectedImageIndex(index);
    setStatusMessage('Photo order updated.');
    handleDragEnd();
  };

  const handlePreviewDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      handleDragEnd();
      return;
    }

    swapImages(draggedIndex, index);
    setSelectedImageIndex(index);
    setStatusMessage('Preview order updated.');
    handleDragEnd();
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
            Start with 2 to 20 photos. Build a square grid, or make the first photo larger than the rest.
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
            exportFrameNote="Everything inside this frame exports exactly as shown."
            previewCells={previewDropzones}
            previewCornerRadius={settings.fitMode === 'cover' ? settings.cornerRadius : 0}
            previewImageUrls={images.map((image) => image.objectUrl)}
            isInteractive={canPreviewDrag && canBuildCollage && !isBusy}
            selectedIndex={selectedImageIndex}
            draggedIndex={draggedIndex}
            dropTargetIndex={dropTargetIndex}
            onTileSelect={setSelectedImageIndex}
            onTileDragStart={handleDragStart}
            onTileDragEnter={handleDragEnter}
            onTileDrop={handlePreviewDrop}
            onTileDragEnd={handleDragEnd}
          />
        </div>

        <div className="right-column">
          <CollageControls
            settings={settings}
            presetName={presetName}
            savedPresets={savedPresets}
            layoutWarning={layoutAdvice.message}
            warningActions={layoutAdvice.actions.map((action) => ({
              label: action.label,
              onClick: () => {
                action.apply();
                setStatusMessage(`${action.label} applied.`);
              }
            }))}
            disabled={isBusy}
            onPresetNameChange={setPresetName}
            onSavePreset={handleSavePreset}
            onApplyPreset={handleApplyPreset}
            onDeletePreset={handleDeletePreset}
            onAutoArrange={handleAutoArrange}
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
            <p className="helper-text panel-description">
              On desktop, drag photos right in the preview. On mobile, use the move buttons below.
              The first photo is your main photo.
            </p>
            {images.length > 0 ? (
              <>
                <div className="thumb-list" role="list" aria-label="Collage photos">
                  {images.map((image, index) => (
                    <button
                      key={image.objectUrl}
                      type="button"
                      className={`thumb-card ${selectedImageIndex === index ? 'is-selected' : ''} ${
                        draggedIndex === index ? 'is-dragging' : ''
                      } ${dropTargetIndex === index && draggedIndex !== index ? 'is-drop-target' : ''}`}
                      draggable={!isBusy}
                      onClick={() => setSelectedImageIndex(index)}
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                    >
                      <img src={image.objectUrl} alt={image.name} className="thumb-image" />
                      <div className="thumb-meta">
                        <span className="thumb-order">
                          {index === 0 ? 'Main photo' : `Photo ${index + 1}`}
                        </span>
                        <span className="thumb-drag-hint">Drag to reorder</span>
                      </div>
                      <p className="thumb-label">{image.name}</p>
                    </button>
                  ))}
                </div>
                <div className="arrange-panel" aria-live="polite">
                  <div>
                    <p className="eyebrow">Selected photo</p>
                    <p className="arrange-title">
                      {images[selectedImageIndex]?.name ?? 'Choose a photo'}
                    </p>
                  </div>
                  <div className="arrange-actions">
                    <button
                      type="button"
                      className="thumb-action-button"
                      onClick={() => handleMoveImage(selectedImageIndex, -1)}
                      disabled={selectedImageIndex === 0 || isBusy}
                    >
                      Move Left
                    </button>
                    <button
                      type="button"
                      className="thumb-action-button"
                      onClick={() => handleMoveImage(selectedImageIndex, 1)}
                      disabled={selectedImageIndex === images.length - 1 || isBusy}
                    >
                      Move Right
                    </button>
                    <button
                      type="button"
                      className="thumb-action-button"
                      onClick={() => handleSetFeatured(selectedImageIndex)}
                      disabled={selectedImageIndex === 0 || isBusy}
                    >
                      Make Main
                    </button>
                    <button
                      type="button"
                      className="thumb-action-button is-danger"
                      onClick={() => handleRemoveImage(selectedImageIndex)}
                      disabled={isBusy}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="helper-text panel-description">Add a few photos and they will appear here.</p>
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
                onClick={() => setShowClearModal(true)}
                disabled={images.length === 0 || isBusy}
              >
                Start a New Collage
              </button>
            </div>
            <p className="helper-text panel-description panel-description-tight">
              Collages export at the full preset size in either layout mode.
            </p>
          </section>
        </div>
      </section>

      <canvas ref={exportCanvasRef} className="sr-only" aria-hidden="true" />
      <ConfirmModal
        open={showClearModal}
        title="Start a new collage?"
        message="This will remove the current collage photos and preview. Your collage layout settings will stay."
        confirmLabel="Start New Collage"
        onConfirm={handleClearPhotos}
        onCancel={() => setShowClearModal(false)}
      />
    </>
  );
}
