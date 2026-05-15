/**
 * Utilidades para trabajar con URLs de media de Strapi
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

/** Obtiene la URL base del backend (sin /api) */
function getBackendBaseUrl(): string {
  return API_URL.replace(/\/api\/?$/, "");
}

// Importamos la función fixCloudinaryURL desde el archivo de utilidades
import { fixCloudinaryURL, isBytescaleURL } from "./cloudinary";

/**
 * Modifica una URL para que sea utilizable en componentes img sin problemas de CORS
 * - Para imágenes de Bytescale, las devuelve directamente
 * - Para imágenes de Cloudinary (legacy), arregla la URL
 * - Para imágenes de localhost, devuelve la ruta relativa
 * - Para otras imágenes, las devuelve tal cual
 */
export function getStrapiMediaUrl(
  url: string | null | undefined,
  fallback: string = "/placeholder.jpg",
): string {
  if (!url) return fallback;

  // Si es URL de Bytescale, devolver directamente
  if (isBytescaleURL(url)) {
    return url;
  }

  // Si es URL de Cloudinary (legacy), arreglarla
  if (url.includes("cloudinary")) {
    return fixCloudinaryURL(url);
  }

  // URL absoluta (no Cloudinary ni Bytescale)
  if (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.includes("localhost:1337") &&
    !url.includes("127.0.0.1:1337")
  ) {
    return url;
  }

  // Para localhost, extraer solo la ruta relativa
  if (url.includes("localhost:1337") || url.includes("127.0.0.1:1337")) {
    const parts = url.split("/uploads/");
    if (parts.length > 1) {
      return `/uploads/${parts[1]}`;
    }
  }

  // URL relativa de Strapi
  if (url.startsWith("/")) {
    if (process.env.NODE_ENV === "development") {
      return url;
    }
    return `${getBackendBaseUrl()}${url}`;
  }

  return url;
}
