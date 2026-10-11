/**
 * Image optimization & compression utility for RestoMaster POS.
 * Resizes and compresses uploaded dish & branding photos before storing in state, LocalStorage, or SQLite.
 * Reduces 5MB-15MB high-resolution camera photos down to ~20KB-45KB WebP/JPEG thumbnails (99%+ reduction),
 * preventing storage exhaustion and eliminating UI lag/freezing.
 */

export const compressImageFile = (
  file: File | Blob,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.78
): Promise<string> => {
  return new Promise((resolve) => {
    // If not an image, return empty string safely
    if (file.type && !file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!dataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width <= 0 || height <= 0) {
            resolve(dataUrl);
            return;
          }

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // 1. Try WebP first for ultra-compact file size (~20-35KB)
          try {
            const webpData = canvas.toDataURL('image/webp', quality);
            if (webpData.startsWith('data:image/webp')) {
              resolve(webpData);
              return;
            }
          } catch (e) {}

          // 2. Fallback to JPEG
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Optimizes an existing base64 string or data URL.
 * Compresses only if the base64 string exceeds 45KB.
 */
export const compressDataUrl = (
  dataUrl: string,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.78
): Promise<string> => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl || '');
  }
  // If already compact (<45KB), return as is
  if (dataUrl.length < 45000) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch (e) {}

        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};
