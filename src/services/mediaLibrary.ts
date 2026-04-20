import api from "@/lib/api";

export interface MediaFile {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: Record<
    string,
    { url: string; width: number; height: number }
  > | null;
  hash: string;
  ext: string;
  mime: string;
  size: number; // en KB
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
  folder?: StrapiFolder | null;
  // Tags para organización (almacenados en alternativeText como JSON)
  tags?: string[];
}

export interface StrapiFolder {
  id: number;
  name: string;
  path: string;
  pathId: number;
  parent?: StrapiFolder | null;
  children?: StrapiFolder[];
  createdAt: string;
  updatedAt: string;
}

export type MediaFilter = "all" | "image" | "video" | "file";

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
 * Subir un archivo a la Media Library de Strapi (se guarda en Bytescale)
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
export function filterByType(
  files: MediaFile[],
  filter: MediaFilter,
): MediaFile[] {
  if (filter === "all") return files;
  if (filter === "image")
    return files.filter((f) => f.mime.startsWith("image/"));
  if (filter === "video")
    return files.filter((f) => f.mime.startsWith("video/"));
  // 'file' = todo lo que no es imagen ni video
  return files.filter(
    (f) => !f.mime.startsWith("image/") && !f.mime.startsWith("video/"),
  );
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
export function getFileCategory(
  mime: string,
): "imagen" | "video" | "documento" {
  if (mime.startsWith("image/")) return "imagen";
  if (mime.startsWith("video/")) return "video";
  return "documento";
}

/**
 * Obtener estructura de carpetas - Strapi v5 no expone endpoint público
 * Por ahora retornamos array vacío y deshabilitamos carpetas
 */
export async function getFolderStructure(): Promise<StrapiFolder[]> {
  // Strapi v5 no tiene endpoint público para carpetas
  // Las carpetas solo están disponibles en el admin panel
  return [];
}

/**
 * Obtener archivos - sin filtro de carpeta
 */
export async function getMediaFilesByFolder(
  folderId?: number,
): Promise<MediaFile[]> {
  // Por ahora obtenemos todos los archivos sin filtrar por carpeta
  const res = await api.get<MediaFile[]>("/upload/files", {
    params: { sort: "createdAt:desc" },
  });
  return res.data;
}

/**
 * Crear carpeta - No disponible en API pública de Strapi v5
 */
export async function createFolder(
  name: string,
  parentId?: number,
): Promise<StrapiFolder> {
  throw new Error(
    "La creación de carpetas solo está disponible desde el admin panel de Strapi",
  );
}

/**
 * Subir archivo - sin asignar a carpeta
 */
export async function uploadMediaFileToFolder(
  file: File,
  folderId?: number,
): Promise<MediaFile[]> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await api.post<MediaFile[]>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

/**
 * Mover archivo - No disponible en API pública de Strapi v5
 */
export async function moveFileToFolder(
  fileId: number,
  folderId: number | null,
): Promise<void> {
  throw new Error(
    "Mover archivos entre carpetas solo está disponible desde el admin panel de Strapi",
  );
}

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE TAGS CON BACKEND
// ═══════════════════════════════════════════════════════════════════

export interface MediaTag {
  id: number;
  name: string;
  files: number[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtener todos los tags desde el backend
 */
export async function getAllTags(): Promise<MediaTag[]> {
  const res = await api.get<{ data: MediaTag[] }>("/media-tags");
  return res.data.data || [];
}

/**
 * Crear un nuevo tag
 */
export async function createTag(name: string): Promise<MediaTag> {
  const res = await api.post<{ data: MediaTag }>("/media-tags", { name });
  return res.data.data;
}

/**
 * Actualizar nombre de un tag
 */
export async function updateTag(
  tagId: number,
  name: string,
): Promise<MediaTag> {
  const res = await api.put<{ data: MediaTag }>(`/media-tags/${tagId}`, {
    name,
  });
  return res.data.data;
}

/**
 * Eliminar un tag
 */
export async function deleteTag(tagId: number): Promise<void> {
  await api.delete(`/media-tags/${tagId}`);
}

/**
 * Obtener archivos de un tag específico
 */
export async function getFilesByTag(tagId: number): Promise<MediaFile[]> {
  const res = await api.get<MediaFile[]>(`/media-tags/${tagId}/files`);
  return res.data;
}

/**
 * Agregar archivo a un tag
 */
export async function addFileToTag(
  tagId: number,
  fileId: number,
): Promise<MediaTag> {
  const res = await api.post<{ data: MediaTag }>(`/media-tags/${tagId}/files`, {
    fileId,
  });
  return res.data.data;
}

/**
 * Remover archivo de un tag
 */
export async function removeFileFromTag(
  tagId: number,
  fileId: number,
): Promise<MediaTag> {
  const res = await api.delete<{ data: MediaTag }>(
    `/media-tags/${tagId}/files?fileId=${fileId}`,
  );
  return res.data.data;
}

/**
 * Filtrar archivos por tag (usando el array de files del tag)
 */
export function filterByTag(files: MediaFile[], tag: MediaTag): MediaFile[] {
  const fileIds = tag.files || [];
  return files.filter((file) => fileIds.includes(file.id));
}

/**
 * Filtrar archivos sin tags
 */
export async function filterUntagged(
  files: MediaFile[],
  allTags: MediaTag[],
): Promise<MediaFile[]> {
  const allTaggedFileIds = new Set<number>();
  allTags.forEach((tag) => {
    (tag.files || []).forEach((fileId) => allTaggedFileIds.add(fileId));
  });
  return files.filter((file) => !allTaggedFileIds.has(file.id));
}

/**
 * Subir archivo y asignarlo a UN SOLO tag (el primero de la lista)
 */
export async function uploadMediaFileWithTags(
  file: File,
  tagIds: number[],
): Promise<MediaFile[]> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await api.post<MediaFile[]>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const uploadedFile = res.data[0];
  // Solo asignar al primer tag (1 imagen = 1 tag)
  if (uploadedFile && tagIds.length > 0) {
    await addFileToTag(tagIds[0], uploadedFile.id);
  }

  return res.data;
}

/**
 * Mover archivo de un tag a otro (remover del anterior y agregar al nuevo)
 */
export async function moveFileToTag(
  fileId: number,
  fromTagId: number | null,
  toTagId: number,
): Promise<void> {
  // Remover del tag anterior si existe
  if (fromTagId !== null) {
    await removeFileFromTag(fromTagId, fileId);
  }

  // Agregar al nuevo tag
  await addFileToTag(toTagId, fileId);
}

/**
 * Obtener el tag de un archivo (solo puede tener uno)
 */
export function getFileTag(
  fileId: number,
  allTags: MediaTag[],
): MediaTag | null {
  return allTags.find((tag) => (tag.files || []).includes(fileId)) || null;
}
