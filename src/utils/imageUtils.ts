/**
 * Utilities for client-side image compression, resizing, and URL validation
 * for category icons in MisFinanzas.
 */

export interface ProcessedImage {
  dataUrl: string;
  blob: Blob;
  sizeBytes: number;
}

/**
 * Checks if a string represents an image URL (http, https, data URI, blob)
 */
export function isImageUrl(str?: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Resizes and crops an image file to a square thumbnail (e.g., 140x140px)
 * to keep payload tiny (~5KB to 15KB) while looking sharp on all displays.
 */
export async function compressAndResizeImage(
  file: File,
  targetSize = 140,
  quality = 0.82
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo contiene datos de imagen dañados o no soportados.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo inicializar el procesador gráfico del navegador.'));
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Center-crop to square
          const minDim = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minDim) / 2;
          const sy = (img.naturalHeight - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

          // Attempt WebP, fallback to JPEG
          let format = 'image/webp';
          let dataUrl = canvas.toDataURL(format, quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            format = 'image/jpeg';
            dataUrl = canvas.toDataURL(format, quality);
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('No se pudo comprimir la imagen.'));
                return;
              }
              resolve({
                dataUrl,
                blob,
                sizeBytes: blob.size,
              });
            },
            format,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates that an image URL can be loaded successfully by the browser.
 */
export async function validateImageUrl(url: string, timeoutMs = 8000): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const img = new Image();

    const cleanup = () => {
      resolved = true;
      img.onload = null;
      img.onerror = null;
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        cleanup();
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!resolved) {
        clearTimeout(timer);
        cleanup();
        // Check reasonable dimensions
        resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        clearTimeout(timer);
        cleanup();
        resolve(false);
      }
    };

    // Attempt loading with crossOrigin anonymous for CORS test, but allow generic load
    img.src = trimmed;
  });
}
