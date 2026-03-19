/**
 * Image Optimization Utilities
 *
 * Helpers for optimized image loading.
 */

import { ImageProps } from 'next/image';

// Blur placeholder for images
export const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f1f5f9" offset="20%" />
      <stop stop-color="#e2e8f0" offset="50%" />
      <stop stop-color="#f1f5f9" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f1f5f9" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export function getBlurDataUrl(width: number, height: number): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;
}

// Optimized image props
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
  } = {}
): Partial<ImageProps> {
  const { width = 800, height = 600, priority = false, quality = 75 } = options;

  return {
    src,
    alt,
    width,
    height,
    quality,
    priority,
    placeholder: 'blur' as const,
    blurDataURL: getBlurDataUrl(width, height),
    loading: priority ? undefined : ('lazy' as const),
  };
}

// Responsive image sizes
export const imageSizes = {
  thumbnail: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  hero: '100vw',
  fullWidth: '100vw',
  halfWidth: '(max-width: 768px) 100vw, 50vw',
};

// Device pixel ratio aware sizes
export function getResponsiveSizes(baseWidth: number): string {
  return `${baseWidth}px, (min-resolution: 2dppx) ${baseWidth * 2}px`;
}
