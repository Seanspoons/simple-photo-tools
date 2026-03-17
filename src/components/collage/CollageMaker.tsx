import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../ConfirmModal';
import {
  MAX_COLLAGE_IMAGES,
  COLLAGE_PRESETS_STORAGE_KEY,
  COLLAGE_SETTINGS_STORAGE_KEY
} from '../../constants';
import { CollageSavedPreset, CollageSettings, CollageTile, ImageAsset } from '../../types';
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
  getCollageLayoutMetrics,
  getCollageOutputSize,
  getCollagePackedTiles,
  renderCollage
} from '../../utils/collage/renderCollage';
import { CollageControls } from './CollageControls';
import { CollagePreview } from './CollagePreview';
import { CollageUploadPanel } from './CollageUploadPanel';

type CollageConfirmAction = 'clear' | 'reset' | null;

const DEFAULT_COLLAGE_SETTINGS: CollageSettings = {
  sizePreset: 'instagram-square',
  columns: 3,
  gap: 12,
  backgroundColor: '#ffffff',
  fitMode: 'cover',
  cornerRadius: 0,
  exportFormat: 'jpeg'
};

function createCollageTile(image: ImageAsset): CollageTile {
  return {
    ...image,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    colSpan: 1,
    rowSpan: 1
  };
}

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

  return {
    ...currentSettings,
    columns: nextColumns,
    sizePreset: shouldUseHighRes ? 'high-res-square' : currentSettings.sizePreset
  };
}

export function CollageMaker() {
  const [tiles, setTiles] = useState<CollageTile[]>([]);
  const [settings, setSettings] = useState<CollageSettings>(loadStoredCollageSettings);
  const [savedPresets, setSavedPresets] = useState<CollageSavedPreset[]>(loadStoredCollagePresets);
  const [presetName, setPresetName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [confirmAction, setConfirmAction] = useState<CollageConfirmAction>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [canPreviewDrag, setCanPreviewDrag] = useState(false);
  const imagesRef = useRef<CollageTile[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  const imageSummary = useMemo(() => {
    if (tiles.length === 0) {
      return 'Add at least 2 photos to start building a collage.';
    }

    if (tiles.length === 1) {
      return 'Add one more photo to turn this into a collage.';
    }

    return `${tiles.length} photos ready for your collage.`;
  }, [tiles.length]);

  const canBuildCollage = tiles.length >= 2;
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
  const packedPreviewTiles = useMemo(
    () => getCollagePackedTiles(tiles, settings, previewSize),
    [tiles, settings, previewSize]
  );
  const layoutMetrics = useMemo(() => getCollageLayoutMetrics(tiles, settings), [tiles, settings]);
  const previewMetrics = useMemo(
    () => getCollageLayoutMetrics(tiles, settings, previewSize),
    [tiles, settings, previewSize]
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

    return { message: null, actions: [] as Array<{ label: string; apply: () => void }> };
  }, [canBuildCollage, layoutMetrics]);
  const previewHelperText = canPreviewDrag
    ? 'Drag a tile to reorder it. Drag a handle to make it bigger or smaller.'
    : 'Use the photo actions below to reorder or resize a selected tile.';

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

        const restoredTiles = restoredImages.map((image, index) => {
          const storedTile = draft.tileStates[index];
          return {
            ...createCollageTile(image),
            id: storedTile?.id ?? `${Date.now()}-${index}`,
            colSpan: storedTile?.colSpan ?? 1,
            rowSpan: storedTile?.rowSpan ?? 1
          };
        });

        setSettings(draft.settings);
        setTiles(restoredTiles);
        setStatusMessage(restoredTiles.length > 0 ? 'Restored your last collage.' : null);
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

    renderCollage(previewCanvasRef.current, tiles, settings, {
      width: previewSize.width,
      height: previewSize.height
    });
  }, [canBuildCollage, previewSize.height, previewSize.width, settings, tiles]);

  useEffect(() => {
    imagesRef.current = tiles;
  }, [tiles]);

  useEffect(() => {
    setSelectedImageIndex((current) => {
      if (tiles.length === 0) {
        return null;
      }

      if (current === null) {
        return null;
      }

      return Math.min(current, tiles.length - 1);
    });
  }, [tiles.length]);

  useEffect(() => {
    if (!hasLoadedDraft) {
      return;
    }

    void saveCollageDraft(
      settings,
      tiles.map((tile) => tile.file),
      tiles.map((tile) => ({
        id: tile.id,
        colSpan: tile.colSpan,
        rowSpan: tile.rowSpan
      }))
    );
  }, [hasLoadedDraft, settings, tiles]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.objectUrl));
    };
  }, []);

  const handleFilesSelect = async (selectedFiles: FileList | File[]) => {
    const nextFiles = Array.from(selectedFiles);
    const roomRemaining = MAX_COLLAGE_IMAGES - tiles.length;

    if (roomRemaining <= 0) {
      setErrorMessage(`You can add up to ${MAX_COLLAGE_IMAGES} photos in one collage.`);
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage('Adding photos...');

    try {
      const filesToLoad = nextFiles.slice(0, roomRemaining);
      const loadedImages = await Promise.all(filesToLoad.map((file) => loadImageAsset(file)));
      const nextImageCount = tiles.length + loadedImages.length;
      const loadedTiles = loadedImages.map((image) => createCollageTile(image));

      setTiles((current) => [...current, ...loadedTiles]);
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
    if (tiles.length === 0) {
      setStatusMessage('Add photos first, then Auto arrange can help.');
      return;
    }

    setSettings((current) => getRecommendedSettings(tiles.length, current));
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
    setTiles((current) => {
      current.forEach((tile) => URL.revokeObjectURL(tile.objectUrl));
      return [];
    });
    void clearCollageDraft();
    setErrorMessage(null);
    setStatusMessage('Ready for a new collage.');
    setSelectedImageIndex(null);
    setConfirmAction(null);
  };

  const handleConfirmReset = () => {
    handleReset();
    setConfirmAction(null);
  };

  const handleRemoveImage = (index: number) => {
    setTiles((current) => {
      const nextTiles = [...current];
      const [removed] = nextTiles.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.objectUrl);
      }

      return nextTiles;
    });
    setSelectedImageIndex((current) => {
      if (current === null) {
        return null;
      }

      return Math.max(0, Math.min(current, tiles.length - 2));
    });
    setStatusMessage('Photo removed.');
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    reorderImages(index, index + direction);
    setStatusMessage('Photo order updated.');
  };

  const handleResizeTile = (index: number, colSpan: number, rowSpan: number) => {
    setTiles((current) =>
      current.map((tile, currentIndex) =>
        currentIndex === index
          ? {
              ...tile,
              colSpan,
              rowSpan
            }
          : tile
      )
    );
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setTiles((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const nextTiles = [...current];
      const [selected] = nextTiles.splice(fromIndex, 1);
      nextTiles.splice(toIndex, 0, selected);
      return nextTiles;
    });
  };

  const swapImages = (fromIndex: number, toIndex: number) => {
    setTiles((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const nextTiles = [...current];
      [nextTiles[fromIndex], nextTiles[toIndex]] = [nextTiles[toIndex], nextTiles[fromIndex]];
      return nextTiles;
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
    if (canPreviewDrag) {
      setSelectedImageIndex(null);
    }
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
      renderCollage(exportCanvasRef.current, tiles, settings);
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
          <div className="tip-note" role="note">
            <span className="tip-note-icon" aria-hidden="true">
              i
            </span>
            <p className="helper-text">
              Add 2 to {MAX_COLLAGE_IMAGES} photos. Start with simple tiles, then resize any photo
              directly in the preview.
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? <div className="message error-message">{errorMessage}</div> : null}
      {statusMessage ? <div className="message status-message">{statusMessage}</div> : null}

      <section className="layout-grid collage-layout-grid">
        <div className="left-column">
          <CollageUploadPanel
            onFilesSelect={handleFilesSelect}
            disabled={isBusy}
            imageCount={tiles.length}
          />
          <div className="preview-sticky-wrap">
            <CollagePreview
              canvasRef={previewCanvasRef}
              hasImages={tiles.length > 0}
              imageCount={tiles.length}
              canBuild={canBuildCollage}
              helperText={previewHelperText}
              exportFrameNote="Everything inside this frame exports exactly as shown."
              previewCells={packedPreviewTiles}
              previewMetrics={previewMetrics}
              gap={settings.gap}
              previewCornerRadius={settings.fitMode === 'cover' ? settings.cornerRadius : 0}
              previewImageUrls={tiles.map((tile) => tile.objectUrl)}
              isInteractive={canPreviewDrag && canBuildCollage && !isBusy}
              selectedIndex={selectedImageIndex ?? undefined}
              draggedIndex={draggedIndex}
              dropTargetIndex={dropTargetIndex}
              onTileSelect={setSelectedImageIndex}
              onTileDragStart={handleDragStart}
              onTileDragEnter={handleDragEnter}
              onTileDrop={handlePreviewDrop}
              onTileDragEnd={handleDragEnd}
              onTileResize={handleResizeTile}
            />
          </div>
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
            onReset={() => setConfirmAction('reset')}
          />

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2>Photos</h2>
              </div>
            </div>
            <p className="helper-text panel-description">
              {canPreviewDrag
                ? 'Drag tiles in the preview to reorder them. Use the resize handles in the preview to change tile size.'
                : 'Choose a photo, then use the actions below to reorder it, resize it, or remove it.'}
            </p>
            {tiles.length > 0 ? (
              <>
                <div className="thumb-list" role="list" aria-label="Collage photos">
                  {tiles.map((tile, index) => (
                    <div
                      key={tile.id}
                      className={`thumb-card ${selectedImageIndex === index ? 'is-selected' : ''} ${
                        draggedIndex === index ? 'is-dragging' : ''
                      } ${dropTargetIndex === index && draggedIndex !== index ? 'is-drop-target' : ''}`}
                    >
                      <button
                        type="button"
                        className="thumb-select-button"
                        draggable={!isBusy}
                        onClick={() => setSelectedImageIndex(index)}
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                      >
                        <img src={tile.objectUrl} alt={tile.name} className="thumb-image" />
                      </button>
                      <button
                        type="button"
                        className="thumb-hover-button thumb-remove-button"
                        onClick={() => handleRemoveImage(index)}
                        disabled={isBusy}
                        aria-label={`Remove ${tile.name}`}
                      >
                        ×
                      </button>
                      <div className="thumb-meta">
                        <span className="thumb-order">{`Photo ${index + 1}`}</span>
                        <span className="thumb-drag-hint">
                          {canPreviewDrag ? 'Preview drag' : 'Actions below'}
                        </span>
                      </div>
                      <p className="thumb-label">{tile.name}</p>
                    </div>
                  ))}
                </div>
                {!canPreviewDrag && selectedImageIndex !== null && tiles[selectedImageIndex] ? (
                  <div className="mobile-photo-toolbar" aria-live="polite">
                    <p className="mobile-photo-toolbar-title">
                      {tiles[selectedImageIndex].name}
                    </p>
                    <div className="mobile-photo-toolbar-actions">
                      <button
                        type="button"
                        className="thumb-inline-button"
                        onClick={() => handleResizeTile(selectedImageIndex, 1, 1)}
                        disabled={isBusy}
                      >
                        1×1
                      </button>
                      <button
                        type="button"
                        className="thumb-inline-button"
                        onClick={() => handleResizeTile(selectedImageIndex, 2, 1)}
                        disabled={isBusy}
                      >
                        2×1
                      </button>
                      <button
                        type="button"
                        className="thumb-inline-button"
                        onClick={() => handleResizeTile(selectedImageIndex, 1, 2)}
                        disabled={isBusy}
                      >
                        1×2
                      </button>
                      <button
                        type="button"
                        className="thumb-inline-button"
                        onClick={() => handleResizeTile(selectedImageIndex, 2, 2)}
                        disabled={isBusy}
                      >
                        2×2
                      </button>
                      <button
                        type="button"
                        className="thumb-inline-button"
                        onClick={() => handleMoveImage(selectedImageIndex, -1)}
                        disabled={selectedImageIndex === 0 || isBusy}
                      >
                        Move Up
                      </button>
                      <button
                        type="button"
                        className="thumb-inline-button"
                        onClick={() => handleMoveImage(selectedImageIndex, 1)}
                        disabled={selectedImageIndex === tiles.length - 1 || isBusy}
                      >
                        Move Down
                      </button>
                      <button
                        type="button"
                        className="thumb-inline-button is-danger"
                        onClick={() => handleRemoveImage(selectedImageIndex)}
                        disabled={isBusy}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
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
                onClick={() => setConfirmAction('clear')}
                disabled={tiles.length === 0 || isBusy}
              >
                Start a New Collage
              </button>
            </div>
            <div className="tip-note panel-description panel-description-tight" role="note">
              <span className="tip-note-icon" aria-hidden="true">
                i
              </span>
              <p className="helper-text">Collages export at the full preset size exactly as arranged.</p>
            </div>
          </section>
        </div>
      </section>

      <canvas ref={exportCanvasRef} className="sr-only" aria-hidden="true" />
      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction === 'reset' ? 'Reset this collage?' : 'Start a new collage?'}
        message={
          confirmAction === 'reset'
            ? 'This will reset your current collage settings back to the defaults. Your photos and saved looks will stay.'
            : 'This will remove the current collage photos and preview. Your collage layout settings will stay.'
        }
        confirmLabel={confirmAction === 'reset' ? 'Reset Collage' : 'Start New Collage'}
        onConfirm={confirmAction === 'reset' ? handleConfirmReset : handleClearPhotos}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
