/**
 * Utilidades para trabajar con URLs de media de Strapi
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-2ce7.up.railway.app/api";

/** Obtiene la URL base del backend (sin /api) */
function getBackendBaseUrl(): string {
  return API_URL.replace(/\/api\/?$/, "");
}

// Importamos la función fixCloudinaryURL desde el archivo de utilidades de Cloudinary
import { fixCloudinaryURL } from './cloudinary';

/**
 * Modifica una URL para que sea utilizable en componentes img sin problemas de CORS
 * - Para imágenes de localhost, devuelve la ruta relativa (quitando localhost:1337)
 * - Para imágenes de Cloudinary, arregla la URL
 * - Para otras imágenes, las devuelve tal cual
 */
export function getStrapiMediaUrl(
  url: string | null | undefined,
  fallback: string = "/placeholder.jpg"
): string {
  if (!url) return fallback;
  
  // Si es URL de Cloudinary, arreglarla
  if (url.includes('cloudinary')) {
    console.log('Procesando URL de Cloudinary:', url);
    return fixCloudinaryURL(url);
  }
  
  // URL absoluta (no Cloudinary)
  if ((url.startsWith("http://") || url.startsWith("https://")) && 
      !url.includes('localhost:1337') && 
      !url.includes('127.0.0.1:1337')) {
    return url;
  }
  
  // Para localhost, extraer solo la ruta relativa
  if (url.includes('localhost:1337') || url.includes('127.0.0.1:1337')) {
    // Ejemplo: http://localhost:1337/uploads/image.jpg → /uploads/image.jpg
    const parts = url.split('/uploads/');
    if (parts.length > 1) {
      return `/uploads/${parts[1]}`;
    }
  }
  
  // URL relativa de Strapi
  if (url.startsWith("/")) {
    // Para desarrollo se usa la ruta relativa (corrige problemas de CORS)
    if (process.env.NODE_ENV === 'development') {
      return url; // Ya es relativo como /uploads/imagen.jpg
    }
    // Para producción se usa la URL completa
    return `${getBackendBaseUrl()}${url}`;
  }
  
  return url;
}
