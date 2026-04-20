/**
 * Utilidades para trabajar con URLs de archivos (Bytescale / legacy Cloudinary)
 * Migrado de Cloudinary a Bytescale
 */

import { determinarTipoDesdeURL } from "./fileUtils";

/**
 * Detecta si una URL es de Bytescale
 */
export function isBytescaleURL(url: string): boolean {
  return url?.includes("upcdn.io") || url?.includes("bytescale.com") || false;
}

/**
 * Detecta si una URL es de Cloudinary (legacy)
 */
export function isCloudinaryURL(url: string): boolean {
  return url?.includes("cloudinary.com") || false;
}

/**
 * Detecta si es una URL gestionada (Bytescale o Cloudinary legacy)
 */
function isManagedURL(url: string): boolean {
  return isBytescaleURL(url) || isCloudinaryURL(url);
}

/**
 * Optimiza una URL de imagen
 * - Para Bytescale: usa parámetros de query de transformación
 * - Para Cloudinary legacy: usa transformaciones de URL
 * - Para otras URLs: devuelve tal cual
 */
export function optimizeCloudinaryImage(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | number;
    format?: "auto" | "jpg" | "png" | "webp";
    crop?: "fill" | "fit" | "limit" | "scale";
  } = {},
): string {
  if (!url) return url;

  const {
    width = 800,
    height,
    quality = "auto",
    format = "auto",
    crop = "limit",
  } = options;

  // Bytescale URL
  if (isBytescaleURL(url)) {
    const separator = url.includes("?") ? "&" : "?";
    const params = [`w=${width}`];
    if (height) params.push(`h=${height}`);
    params.push(`fit=${crop === "fill" ? "crop" : "max"}`);
    if (format !== "auto") params.push(`f=${format}`);
    // Reemplazar /raw/ por /image/ para transformaciones
    let transformUrl = url.replace("/raw/", "/image/");
    return `${transformUrl}${separator}${params.join("&")}`;
  }

  // Cloudinary legacy
  if (isCloudinaryURL(url)) {
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    const transformations = [
      `c_${crop}`,
      `w_${width}`,
      height ? `h_${height}` : null,
      `q_${quality}`,
      `f_${format}`,
    ]
      .filter(Boolean)
      .join(",");
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
  }

  return url;
}

/**
 * Optimiza una URL de video
 */
export function optimizeCloudinaryVideo(
  url: string,
  options: {
    quality?: "auto" | "low" | "medium" | "high";
  } = {},
): string {
  if (!url) return url;

  // Bytescale no necesita transformación especial para video
  if (isBytescaleURL(url)) return url;

  // Cloudinary legacy
  if (isCloudinaryURL(url)) {
    const { quality = "auto" } = options;
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/q_${quality}/${parts[1]}`;
  }

  return url;
}

/**
 * Genera una thumbnail de un PDF
 */
export function getCloudinaryPDFThumbnail(
  url: string,
  options: {
    page?: number;
    width?: number;
    height?: number;
  } = {},
): string {
  if (!url) return url;

  const { page = 1, width = 400, height = 600 } = options;

  // Bytescale: no soporta thumbnails de PDF nativamente, devolver un placeholder o la URL original
  if (isBytescaleURL(url)) {
    // Intentar usar el endpoint de imagen con page (si soportado)
    // Por ahora devolver la URL original - el frontend mostrará ícono de PDF
    return url;
  }

  // Cloudinary legacy
  if (isCloudinaryURL(url)) {
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    const transformations = `pg_${page},c_limit,w_${width},h_${height},f_jpg,q_auto`;
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
  }

  return url;
}

/**
 * Detecta el tipo de archivo desde la URL
 */
export function getFileTypeFromURL(
  url: string,
): "image" | "video" | "pdf" | "other" {
  if (!url) return "other";
  const tipo = determinarTipoDesdeURL(url);
  switch (tipo) {
    case "imagen":
      return "image";
    case "video":
      return "video";
    case "documento":
      return url.toLowerCase().endsWith(".pdf") ? "pdf" : "other";
    default:
      return "other";
  }
}

/**
 * Obtiene una URL directa de descarga
 */
export function getCloudinaryDownloadURL(
  url: string,
  filename?: string,
): string {
  if (!url) return url;

  // Bytescale: agregar ?download=true o Content-Disposition
  if (isBytescaleURL(url)) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}download=true`;
  }

  // Cloudinary legacy
  if (isCloudinaryURL(url)) {
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    const transformations = filename
      ? `fl_attachment:${encodeURIComponent(filename)}`
      : "fl_attachment";
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
  }

  return url;
}

/**
 * Arregla URLs que pueden venir malformadas del backend
 */
export function fixCloudinaryURL(url: string): string {
  if (!url) return url;
  url = url.trim();

  // Si es URL de Bytescale, asegurar protocolo
  if (isBytescaleURL(url)) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return url;
  }

  // Cloudinary legacy
  if (url.includes("cloudinary.com") || url.includes("cloudinary")) {
    if (url.includes("/upload/")) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      return url;
    }

    const cloudinaryMatch = url.match(
      /res\.cloudinary\.com\/([^\/]+)\/([^\/]+)\/(.+)/,
    );
    if (cloudinaryMatch) {
      const [, cloudName, type, rest] = cloudinaryMatch;
      if (!rest.includes("upload")) {
        return `https://res.cloudinary.com/${cloudName}/${type}/upload/${rest}`;
      }
    }

    const simpleMatch = url.match(
      /cloudinary\.com\/([^\/]+)\/([^\/]+)\/v\d+\/(.+)/,
    );
    if (simpleMatch) {
      const [, cloudName, type, publicId] = simpleMatch;
      return `https://res.cloudinary.com/${cloudName}/${type}/upload/${publicId}`;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return url;
  }

  // URL genérica
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("/")
  ) {
    url = "https://" + url;
  }

  return url;
}

/**
 * Arregla URLs de PDFs
 */
export function fixCloudinaryPDFUrl(url: string): string {
  if (!url) return url;
  url = url.trim();

  if (isBytescaleURL(url)) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return url;
  }

  if (!url.includes("cloudinary.com")) return url;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
}

/**
 * Genera URL de descarga para PDFs
 */
export function getCloudinaryPDFDownloadUrl(
  url: string,
  filename: string,
): string {
  if (!url) return url;

  // Bytescale
  if (isBytescaleURL(url)) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}download=true`;
  }

  // Cloudinary legacy
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("fl_attachment")) return url;
  const parts = url.split("/upload/");
  if (parts.length === 2) {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${parts[0]}/upload/fl_attachment:${cleanFilename}/${parts[1]}`;
  }
  return url;
}

/**
 * Rota una imagen usando transformaciones de URL
 */
export function rotateCloudinaryImage(url: string, angle: number): string {
  if (!url) return url;

  const validAngles = [90, 180, 270];
  if (!validAngles.includes(angle)) return url;

  // Bytescale: usar parámetro de rotación
  if (isBytescaleURL(url)) {
    let transformUrl = url.replace("/raw/", "/image/");
    const separator = transformUrl.includes("?") ? "&" : "?";
    return `${transformUrl}${separator}rotate=${angle}`;
  }

  // Cloudinary legacy
  if (isCloudinaryURL(url)) {
    const parts = url.split("/upload/");
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/a_${angle}/${parts[1]}`;
  }

  return url;
}

/**
 * Rota una imagen usando Canvas y la devuelve como File para re-subir
 */
export async function rotateAndUploadImage(
  imageUrl: string,
  angle: number,
  filename: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("No se pudo obtener el contexto del canvas"));
          return;
        }

        let newWidth = img.width;
        let newHeight = img.height;

        if (angle === 90 || angle === 270) {
          newWidth = img.height;
          newHeight = img.width;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.save();

        if (angle === 90) {
          ctx.translate(newWidth / 2, newHeight / 2);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        } else if (angle === 180) {
          ctx.translate(newWidth / 2, newHeight / 2);
          ctx.rotate(Math.PI);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        } else if (angle === 270) {
          ctx.translate(newWidth / 2, newHeight / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        }

        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo convertir el canvas a blob"));
              return;
            }

            const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
            const extension = filename.split(".").pop() || "jpg";
            const newFilename = `${nameWithoutExt}_rotated_${angle}.${extension}`;

            const file = new File([blob], newFilename, { type: blob.type });
            resolve(file);
          },
          "image/jpeg",
          0.95,
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = imageUrl;
  });
}
