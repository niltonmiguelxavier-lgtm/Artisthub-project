import { storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '../lib/firebase';

export interface AudioUploadResult {
  url: string;
  format: 'mp3' | 'wav';
  sizeBytes: number;
  fileName: string;
  duration?: number;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onProgress?: (percent: number) => void;
}

/**
 * Validates audio format (MP3, WAV) and max size (25MB).
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string; format: 'mp3' | 'wav' } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  const isMp3 = extension === 'mp3' || mimeType.includes('mpeg') || mimeType.includes('mp3');
  const isWav = extension === 'wav' || mimeType.includes('wav') || mimeType.includes('wave');

  if (!isMp3 && !isWav) {
    return {
      valid: false,
      error: 'Formato de áudio inválido. Por favor seleciona um ficheiro em formato MP3 ou WAV.',
      format: 'mp3',
    };
  }

  // 25 MB in bytes
  const MAX_SIZE = 25 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `O ficheiro de áudio excede o limite máximo de 25MB (tamanho atual: ${sizeInMb}MB).`,
      format: isMp3 ? 'mp3' : 'wav',
    };
  }

  return {
    valid: true,
    format: isMp3 ? 'mp3' : 'wav',
  };
}

/**
 * Validates image format (JPG, PNG, WEBP) and max size (5MB).
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  const validExts = ['jpg', 'jpeg', 'png', 'webp'];
  const isImageMime = mimeType.startsWith('image/');
  const hasValidExt = extension ? validExts.includes(extension) : false;

  if (!isImageMime && !hasValidExt) {
    return {
      valid: false,
      error: 'Formato de imagem inválido. Apenas ficheiros JPG, PNG ou WEBP são suportados.',
    };
  }

  // 5 MB in bytes
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `A imagem excede o tamanho máximo de 5MB (tamanho atual: ${sizeInMb}MB).`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image client-side using an off-screen HTML5 Canvas.
 * Reduces storage usage and speeds up load times while preserving clarity.
 */
export async function compressImage(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate resized dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: return original file as blob
        resolve(file);
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP with fallback to JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // If WebP is unsupported, fallback to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) resolve(jpegBlob);
                else resolve(file);
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível processar a imagem selecionada.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Detects duration in seconds for an audio file.
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(Math.round(audio.duration) || 0);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
    } catch {
      resolve(0);
    }
  });
}

/**
 * Uploads an audio file to Firebase Storage with real-time progress.
 * Target path: /artists/{artistId}/tracks/{trackId}/audio.{ext}
 */
export async function uploadAudioFile(
  file: File,
  artistId: string,
  trackId: string,
  onProgress?: (percent: number) => void
): Promise<AudioUploadResult> {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Ficheiro de áudio inválido.');
  }

  const duration = await getAudioDuration(file);
  const storagePath = `artists/${artistId}/tracks/${trackId}/audio.${validation.format}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: validation.format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      customMetadata: {
        artistId,
        trackId,
        originalName: file.name,
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        }
      },
      (error) => {
        console.error('Firebase Storage audio upload error:', error);
        let errorMsg = 'Falha ao carregar ficheiro de áudio no Firebase Storage.';
        if (error.code === 'storage/unauthorized') {
          errorMsg = 'Permissão negada. Apenas o artista proprietário pode carregar ficheiros nesta pasta.';
        } else if (error.code === 'storage/quota-exceeded') {
          errorMsg = 'Limite de armazenamento do Firebase excedido.';
        } else if (error.code === 'storage/canceled') {
          errorMsg = 'Upload cancelado.';
        }
        reject(new Error(errorMsg));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadUrl,
            format: validation.format,
            sizeBytes: file.size,
            fileName: file.name,
            duration,
          });
        } catch (err) {
          reject(new Error('Erro ao obter o link permanente de download do áudio.'));
        }
      }
    );
  });
}

/**
 * Compresses and uploads an image (Cover art, Avatar, Profile Cover) to Firebase Storage.
 * Structured paths:
 * - /artists/{artistId}/cover.webp
 * - /artists/{artistId}/avatar.webp
 * - /artists/{artistId}/tracks/{trackId}/cover.webp
 */
export async function uploadImage(
  file: File,
  storagePath: string,
  options: ImageUploadOptions = {}
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Ficheiro de imagem inválido.');
  }

  const { maxWidth = 1400, maxHeight = 1400, quality = 0.85, onProgress } = options;

  let compressedBlob: Blob;
  try {
    compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);
  } catch (e) {
    console.warn('Image compression fallback to original file:', e);
    compressedBlob = file;
  }

  // Ensure path extension aligns with webp/jpeg
  const normalizedPath = storagePath.includes('.') ? storagePath : `${storagePath}.webp`;
  const storageRef = ref(storage, normalizedPath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
      contentType: compressedBlob.type || 'image/webp',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        }
      },
      (error) => {
        console.error('Firebase Storage image upload error:', error);
        let errorMsg = 'Falha ao carregar imagem.';
        if (error.code === 'storage/unauthorized') {
          errorMsg = 'Permissão negada. Apenas o artista pode carregar imagens no seu perfil.';
        }
        reject(new Error(errorMsg));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(new Error('Erro ao obter URL da imagem.'));
        }
      }
    );
  });
}

/**
 * Safely deletes a file from Firebase Storage given its URL or relative path.
 * Will not throw if the file does not exist or is an external URL.
 */
export async function deleteStorageFile(urlOrPath: string): Promise<boolean> {
  if (!urlOrPath) return true;

  // If it's a SoundHelix demo, seed URL, or external placeholder, no storage deletion needed
  if (!urlOrPath.includes('firebasestorage') && !urlOrPath.startsWith('artists/')) {
    return true;
  }

  try {
    const fileRef = urlOrPath.startsWith('http') ? ref(storage, urlOrPath) : ref(storage, urlOrPath);
    await deleteObject(fileRef);
    return true;
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      // File was already removed, that's okay
      return true;
    }
    console.warn('Storage file deletion note:', error?.message || error);
    return false;
  }
}

/**
 * Deletes all associated media for a track (audio and cover) from Firebase Storage.
 */
export async function deleteTrackMedia(
  artistId: string,
  trackId: string,
  audioUrl?: string,
  coverUrl?: string
): Promise<void> {
  const promises: Promise<any>[] = [];

  if (audioUrl) {
    promises.push(deleteStorageFile(audioUrl));
  } else {
    // Attempt deleting standard structured path
    promises.push(deleteStorageFile(`artists/${artistId}/tracks/${trackId}/audio.mp3`));
    promises.push(deleteStorageFile(`artists/${artistId}/tracks/${trackId}/audio.wav`));
  }

  if (coverUrl) {
    promises.push(deleteStorageFile(coverUrl));
  } else {
    promises.push(deleteStorageFile(`artists/${artistId}/tracks/${trackId}/cover.webp`));
  }

  await Promise.allSettled(promises);
}
