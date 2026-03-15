import { ImageAsset } from '../types';
import { convertHeicToJpeg, isHeicFile } from './heicConversion';

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  ''
]);

function loadHtmlImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The selected image could not be decoded.'));
    image.src = objectUrl;
  });
}

export async function loadImageAsset(file: File): Promise<ImageAsset> {
  if (!SUPPORTED_MIME_TYPES.has(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('Please choose a JPEG, PNG, WebP, HEIC, or HEIF image.');
  }

  const convertedFile = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
  const objectUrl = URL.createObjectURL(convertedFile);

  try {
    const image = await loadHtmlImage(objectUrl);
    return {
      file: convertedFile,
      objectUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: file.name,
      mimeType: convertedFile.type,
      wasConverted: convertedFile !== file
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
