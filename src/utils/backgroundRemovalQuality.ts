import { removeImageBackground } from './backgroundRemoval';

export type BackgroundRemovalMode = 'photo' | 'graphic';

export interface BackgroundRemovalRefinementSettings {
  edgeSoftness: number;
  edgeCleanup: number;
  thresholdBias: number;
}

export interface BackgroundRemovalResult {
  blob: Blob;
}

export async function processBackgroundRemoval(
  image: Blob | File,
  mode: BackgroundRemovalMode,
  refinement: BackgroundRemovalRefinementSettings,
  progress?: (key: string, current: number, total: number) => void
): Promise<BackgroundRemovalResult> {
  void mode;
  void refinement;

  const blob = await removeImageBackground(image, progress);
  return { blob };
}
