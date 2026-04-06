"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
  filterByType,
  searchFiles,
  formatSize,
  getThumbnailUrl,
  getFileCategory,
  type MediaFile,
  type MediaFilter,
} from "@/services/mediaLibrary";
import { alerts } from "@/lib/alerts";
import { rotateCloudinaryImage, rotateAndUploadImage } from "@/lib/cloudinary";

// ─── Types ───────────────────────────────────────────────────────────
interface BibliotecaArchivosProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (files: MediaFile[]) => void;
  maxSelection?: number;
  /** Filtro inicial de tipo de archivo */
  defaultFilter?: MediaFilter;
}

// ─── Icon helpers (SVG inline, sin dependencias externas) ────────────
const IconImage = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconVideo = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const IconDoc = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconUpload = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconGrid = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const IconList = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconRotate = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 019 20.49" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────
const FILTERS: { key: MediaFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "image", label: "Imágenes" },
  { key: "video", label: "Videos" },
  { key: "file", label: "Documentos" },
];

function getCategoryIcon(mime: string) {
  const cat = getFileCategory(mime);
  if (cat === "imagen") return <IconImage />;
  if (cat === "video") return <IconVideo />;
  return <IconDoc />;
}

function getCategoryColor(mime: string) {
  const cat = getFileCategory(mime);
  if (cat === "imagen") return "bg-blue-100 text-blue-600";
  if (cat === "video") return "bg-purple-100 text-purple-600";
  return "bg-emerald-100 text-emerald-600";
}

function getExtBadgeColor(ext: string) {
  const e = ext.replace(".", "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(e)) return "bg-blue-500";
  if (["mp4", "mov", "webm", "avi"].includes(e)) return "bg-purple-500";
  if (["pdf"].includes(e)) return "bg-red-500";
  if (["doc", "docx"].includes(e)) return "bg-blue-700";
  if (["xls", "xlsx"].includes(e)) return "bg-green-600";
  return "bg-gray-500";
}

// ─── Component ───────────────────────────────────────────────────────
export default function BibliotecaArchivos({
  visible,
  onClose,
  onSelect,
  maxSelection = 10,
  defaultFilter = "all",
}: BibliotecaArchivosProps) {
  const [allFiles, setAllFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<MediaFilter>(defaultFilter);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [imageRotations, setImageRotations] = useState<Record<number, number>>({});
  const [uploadingRotations, setUploadingRotations] = useState<Set<number>>(new Set());
  const uploadRef = useRef<HTMLInputElement>(null);

  // ── Fetch files on open ──
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const files = await getMediaFiles();
      setAllFiles(files);
    } catch {
      alerts.error("Error al cargar la biblioteca de archivos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadFiles();
      setSelected(new Set());
      setQuery("");
      setFilter(defaultFilter);
    }
  }, [visible, loadFiles, defaultFilter]);

  // ── Derived data ──
  const filtered = searchFiles(filterByType(allFiles, filter), query);
  const selectedFiles = allFiles.filter((f) => selected.has(f.id));

  // ── Handlers ──
  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= maxSelection) {
          alerts.error(`Máximo ${maxSelection} archivos`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        await uploadMediaFile(file);
        uploadedCount++;
      }
      alerts.success(`${uploadedCount} archivo(s) subido(s)`);
      await loadFiles();
    } catch {
      alerts.error("Error al subir archivo(s)");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMediaFile(id);
      setAllFiles((prev) => prev.filter((f) => f.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setConfirmDelete(null);
      alerts.success("Archivo eliminado");
    } catch {
      alerts.error("Error al eliminar archivo");
    }
  };

  const handleRotate = async (fileId: number) => {
    const file = allFiles.find(f => f.id === fileId);
    if (!file || !file.mime.startsWith('image/')) return;

    const angle = ((imageRotations[fileId] || 0) + 90) % 360;
    
    // Update visual rotation immediately
    setImageRotations(prev => ({
      ...prev,
      [fileId]: angle
    }));

    // If angle is 0, don't upload (back to original)
    if (angle === 0) {
      setUploadingRotations(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      return;
    }

    try {
      // Mark as uploading
      setUploadingRotations(prev => new Set(prev).add(fileId));
      
      // Rotate and upload the image permanently
      const rotatedFile = await rotateAndUploadImage(file.url, angle, file.name);
      const uploadedFiles = await uploadMediaFile(rotatedFile);
      const uploadedFile = uploadedFiles[0]; // Get the first (and only) uploaded file
      
      if (!uploadedFile) {
        throw new Error('No se recibió el archivo subido');
      }
      
      // Update the file in allFiles with the new uploaded file
      setAllFiles(prev => prev.map(f => 
        f.id === fileId ? uploadedFile : f
      ));
      
      // Clear rotation state since the file is now permanently rotated
      setImageRotations(prev => {
        const newRotations = { ...prev };
        delete newRotations[fileId];
        return newRotations;
      });
      
      // Update selection if this file was selected
      setSelected(prev => {
        if (prev.has(fileId)) {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          newSet.add(uploadedFile.id);
          return newSet;
        }
        return prev;
      });
      
      alerts.success('Imagen rotada y guardada permanentemente');
      
    } catch (error) {
      console.error('Error rotando imagen:', error);
      alerts.error('Error al rotar la imagen permanentemente');
      
      // Revert visual rotation on error
      setImageRotations(prev => ({
        ...prev,
        [fileId]: ((prev[fileId] || 0) - 90 + 360) % 360
      }));
    } finally {
      setUploadingRotations(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const getDisplayUrl = (file: MediaFile): string => {
    const angle = imageRotations[file.id] || 0;
    const baseUrl = getThumbnailUrl(file);
    if (angle === 0) return baseUrl;
    return rotateCloudinaryImage(baseUrl, angle);
  };

  const getRotatedUrl = (file: MediaFile): string => {
    const angle = imageRotations[file.id] || 0;
    if (angle === 0) return file.url;
    return rotateCloudinaryImage(file.url, angle);
  };

  const handleConfirm = () => {
    if (selected.size === 0) {
      alerts.error("Selecciona al menos un archivo");
      return;
    }
    onSelect(selectedFiles);
    onClose();
  };

  // ── Don't render if not visible ──
  if (!visible) return null;

  // ── Stats ──
  const totalImages = allFiles.filter((f) => f.mime.startsWith("image/")).length;
  const totalVideos = allFiles.filter((f) => f.mime.startsWith("video/")).length;
  const totalDocs = allFiles.filter(
    (f) => !f.mime.startsWith("image/") && !f.mime.startsWith("video/")
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden mx-4">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Biblioteca de Archivos
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {allFiles.length} archivos &middot; {totalImages} imágenes &middot; {totalVideos} videos &middot; {totalDocs} documentos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <IconX />
          </button>
        </div>

        {/* ─── Toolbar ─── */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  filter === f.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View mode */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              <IconGrid />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              <IconList />
            </button>
          </div>

          {/* Upload button */}
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-sm">
            <IconUpload />
            {uploading ? "Subiendo..." : "Subir Archivo"}
            <input
              ref={uploadRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.glb,.gltf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="animate-spin h-10 w-10 text-red-600 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-500">Cargando biblioteca...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 font-medium">No se encontraron archivos</p>
              <p className="text-sm text-gray-400 mt-1">Sube archivos o cambia los filtros de búsqueda</p>
              <label className="cursor-pointer mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                <IconUpload />
                Subir primer archivo
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.glb,.gltf"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          ) : viewMode === "grid" ? (
            /* ─── Grid View ─── */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((file) => {
                const isSelected = selected.has(file.id);
                const isImage = file.mime.startsWith("image/");

                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {isImage ? (
                        <img
                          src={getDisplayUrl(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(file.mime)}`}>
                            {getCategoryIcon(file.mime)}
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded ${getExtBadgeColor(file.ext)}`}>
                            {file.ext.replace(".", "").toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                            <IconCheck />
                          </div>
                        </div>
                      )}

                      {/* Rotation badge */}
                      {isImage && imageRotations[file.id] > 0 && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded shadow">
                          {imageRotations[file.id]}°
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isImage && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRotate(file.id); }}
                            disabled={uploadingRotations.has(file.id)}
                            className={`p-1.5 rounded-lg shadow transition ${
                              uploadingRotations.has(file.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white/90 hover:bg-white text-gray-600'
                            }`}
                            title={uploadingRotations.has(file.id) ? 'Rotando...' : 'Rotar 90° permanentemente'}
                          >
                            {uploadingRotations.has(file.id) ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <IconRotate />
                            )}
                          </button>
                        )}
                        {isImage && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                            className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-white text-gray-600 transition"
                          >
                            <IconEye />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(file.id); }}
                          className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-red-50 text-red-500 transition"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-gray-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatSize(file.size)} &middot; {new Date(file.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── List View ─── */
            <div className="space-y-2">
              {filtered.map((file) => {
                const isSelected = selected.has(file.id);
                const isImage = file.mime.startsWith("image/");

                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`group flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "border-red-500 bg-red-50/50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 relative">
                      {isImage ? (
                        <img
                          src={getDisplayUrl(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${getCategoryColor(file.mime)}`}>
                          {getCategoryIcon(file.mime)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
                            <IconCheck />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded ${getExtBadgeColor(file.ext)}`}>
                          {file.ext.replace(".", "").toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatSize(file.size)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(file.createdAt).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isImage && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                        >
                          <IconEye />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(file.id); }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="text-sm text-gray-500">
            {selected.size > 0 ? (
              <span className="font-medium text-gray-700">
                {selected.size} archivo{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
              </span>
            ) : (
              "Haz click en los archivos para seleccionarlos"
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm"
            >
              Agregar al Hito ({selected.size})
            </button>
          </div>
        </div>
      </div>

      {/* ─── Preview Modal ─── */}
      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={() => setPreviewFile(null)} />
          <div className="relative max-w-4xl max-h-[85vh] mx-4">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition"
            >
              <IconX />
            </button>
            <img
              src={previewFile.mime.startsWith('image/') ? getDisplayUrl(previewFile) : previewFile.url}
              alt={previewFile.name}
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-xl">
              <p className="text-white text-sm font-medium truncate">{previewFile.name}</p>
              <p className="text-white/70 text-xs">
                {formatSize(previewFile.size)}
                {previewFile.width && previewFile.height && ` · ${previewFile.width}×${previewFile.height}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar archivo?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción es permanente. El archivo será eliminado de Cloudinary y no podrá recuperarse.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
