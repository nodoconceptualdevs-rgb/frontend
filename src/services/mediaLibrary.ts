import api from "@/lib/api";

export interface MediaFile {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, { url: string; width: number; height: number }> | null;
  hash: string;
  ext: string;
  mime: string;
  size: number; // en KB
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaFilter = 'all' | 'image' | 'video' | 'file';

/**
 * Obtener todos los archivos de la Media Library de Strapi
 */
export async function getMediaFiles(): Promise<MediaFile[]> {
  const res = await api.get<MediaFile[]>("/upload/files", {
    params: {
      sort: "createdAt:desc",
    },
  });
  return res.data;
}

/**
 * Subir un archivo a la Media Library de Strapi (se guarda en Cloudinary)
 */
export async function uploadMediaFile(file: File): Promise<MediaFile[]> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await api.post<MediaFile[]>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Eliminar un archivo de la Media Library
 */
export async function deleteMediaFile(fileId: number): Promise<void> {
  await api.delete(`/upload/files/${fileId}`);
}

/**
 * Filtrar archivos por tipo MIME
 */
export function filterByType(files: MediaFile[], filter: MediaFilter): MediaFile[] {
  if (filter === "all") return files;
  if (filter === "image") return files.filter((f) => f.mime.startsWith("image/"));
  if (filter === "video") return files.filter((f) => f.mime.startsWith("video/"));
  // 'file' = todo lo que no es imagen ni video
  return files.filter((f) => !f.mime.startsWith("image/") && !f.mime.startsWith("video/"));
}

/**
 * Buscar archivos por nombre
 */
export function searchFiles(files: MediaFile[], query: string): MediaFile[] {
  if (!query.trim()) return files;
  const q = query.toLowerCase();
  return files.filter((f) => f.name.toLowerCase().includes(q));
}

/**
 * Formatear tamaño de archivo (Strapi devuelve KB)
 */
export function formatSize(sizeInKB: number): string {
  if (sizeInKB < 1) return `${Math.round(sizeInKB * 1024)} B`;
  if (sizeInKB < 1024) return `${sizeInKB.toFixed(1)} KB`;
  return `${(sizeInKB / 1024).toFixed(1)} MB`;
}

/**
 * Obtener URL de thumbnail de un archivo
 */
export function getThumbnailUrl(file: MediaFile): string {
  if (file.formats?.thumbnail?.url) return file.formats.thumbnail.url;
  if (file.formats?.small?.url) return file.formats.small.url;
  return file.url;
}

/**
 * Determinar categoría visual del archivo
 */
export function getFileCategory(mime: string): "imagen" | "video" | "documento" {
  if (mime.startsWith("image/")) return "imagen";
  if (mime.startsWith("video/")) return "video";
  return "documento";
}
