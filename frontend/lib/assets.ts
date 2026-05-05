const R2 = 'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public';

export const Assets = {
  // Images
  logo: `${R2}/logo-pithi-digital-transparent.png`,
  footerLogo: `${R2}/footer-logo-pithi-digital-transparent.png`,
  webLogo: `${R2}/web-logo-transparent.png`,
  heroBackground: `${R2}/1main-thumbnail.jpg`,
  mainThumbnail: `${R2}/main-thumbnail.jpg`,
  mainThumbnail1: `${R2}/1main-thumbnail.jpg`,
  frame: `${R2}/frame.png`,
  guestNameFrame: `${R2}/guest-name-frame-20260503.png`,
  map: `${R2}/map.png`,
  badgeFrame: `${R2}/badge-frame.svg`,
  decorativeDivider: `${R2}/decorative-divider.png`,
  underlineKbach: `${R2}/underline-kbach-1.png`,
  loadingMascot: `${R2}/loading-mascot.png`,
  /** Subtle repeating pattern (Balinese-style); upload via `backend/scripts/upload-public-to-r2.ts` */
  balinesePattern: `${R2}/photo/balinese-pattern-3_735187-47.avif`,
  gallerySample1: `${R2}/gallery-sample-1-20260429.png`,
  gallerySample2: `${R2}/gallery-sample-2-20260429.png`,
  gallerySample3: `${R2}/gallery-sample-3-20260429.png`,
  gallerySample4: `${R2}/gallery-sample-4-20260429.png`,
  gallerySample5: `${R2}/gallery-sample-5-20260429.png`,
  gallerySample6: `${R2}/gallery-sample-6-20260429.png`,
  khqrSampleAbaPay: `${R2}/khqr-sample-aba-pay.png`,

  // Audio
  weddingMusic: `${R2}/audio/wedding.mp3`,
} as const;

export const SAMPLE_GALLERY_IMAGES = [
  Assets.gallerySample6,
  Assets.gallerySample2,
  Assets.gallerySample3,
  Assets.gallerySample1,
  Assets.gallerySample5,
  Assets.gallerySample4,
] as const;

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getSeededGalleryImages(seed: string, count: number = SAMPLE_GALLERY_IMAGES.length): string[] {
  const list = [...SAMPLE_GALLERY_IMAGES];
  if (list.length === 0) {
    return [];
  }

  const normalizedSeed = seed && seed.trim().length > 0 ? seed : 'default';
  const start = hashSeed(normalizedSeed) % list.length;
  const rotated = [...list.slice(start), ...list.slice(0, start)];
  return rotated.slice(0, Math.max(1, Math.min(count, rotated.length)));
}

export function getSeededCoverImage(seed: string): string {
  return getSeededGalleryImages(seed, 1)[0] || Assets.mainThumbnail1;
}
