import { getFileCategory } from "@/services/mediaLibrary";
import type { MediaFilter } from "@/services/mediaLibrary";

// ─── Constants ───────────────────────────────────────────────────────
export const FILTERS: { key: MediaFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "image", label: "Imágenes" },
  { key: "video", label: "Videos" },
  { key: "file", label: "Documentos" },
];

export function getCategoryColor(mime: string): string {
  const cat = getFileCategory(mime);
  if (cat === "imagen") return "bg-blue-100 text-blue-600";
  if (cat === "video") return "bg-purple-100 text-purple-600";
  return "bg-emerald-100 text-emerald-600";
}

export function getExtBadgeColor(ext: string): string {
  const e = ext.replace(".", "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e))
    return "bg-blue-500";
  if (["mp4", "mov", "webm", "avi"].includes(e)) return "bg-purple-500";
  if (["pdf"].includes(e)) return "bg-red-500";
  if (["doc", "docx"].includes(e)) return "bg-blue-700";
  if (["xls", "xlsx"].includes(e)) return "bg-green-600";
  return "bg-gray-500";
}
