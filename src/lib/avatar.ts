const AVATAR_COLORS = [
  'bg-[#c2703d]',
  'bg-[#8a9b6e]',
  'bg-[#c2943a]',
  'bg-[#9b7ebd]',
  'bg-[#c06a58]',
  'bg-[#6fa3a0]',
  'bg-[#b08355]',
  'bg-[#7d8ca3]',
];

export function avatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i += 1) {
    hash = (hash * 31 + nickname.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function avatarInitial(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return '?';
  return trimmed[0].toUpperCase();
}

/** Returns the display avatar: custom pic if set, else null (caller renders letter avatar). */
export function resolveAvatarUrl(avatarUrl: string | undefined): string | null {
  const url = (avatarUrl ?? '').trim();
  return url ? url : null;
}

export function isLikelyImageUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith('data:image/')) return true;
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return true;
  } catch {
    return false;
  }
}

const MAX_AVATAR_PX = 128;
const MAX_AVATAR_BYTES = 150 * 1024;

/**
 * Resizes an uploaded image to a small square data URL so it fits in localStorage.
 * Throws when the file is not an image or is too big even after compression.
 */
export function processImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Please upload an image file (JPG/PNG/WebP).'));
  }
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const scale = Math.min(1, MAX_AVATAR_PX / Math.max(img.width, img.height, 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot process the image in this browser.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        // Try jpeg first, fall back to png (for transparency).
        let dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (dataUrl.length > MAX_AVATAR_BYTES && file.type === 'image/png') {
          dataUrl = canvas.toDataURL('image/png');
        }
        if (dataUrl.length > MAX_AVATAR_BYTES * 4) {
          reject(new Error('Image is still too large after resizing. Try a smaller one.'));
          return;
        }
        resolve(dataUrl);
      } catch {
        reject(new Error('Cannot process the image. Try a different file.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Cannot read the image file.'));
    };
    img.src = objectUrl;
  });
}
