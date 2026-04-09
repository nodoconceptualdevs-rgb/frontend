/**
 * Loader personalizado para imágenes locales en Next.js
 */

import type { ImageLoaderProps } from 'next/image';

/**
 * Loader personalizado para imágenes locales (localhost:1337)
 * Bypass la optimización de Next.js para estas imágenes
 */
export default function localImageLoader({ src }: ImageLoaderProps): string {
  // Si es una URL local (localhost:1337), devolverla tal cual
  if (src.includes('localhost:1337') || src.includes('127.0.0.1:1337')) {
    return src;
  }

  // Para otras URLs, usar el comportamiento predeterminado
  return src;
}
