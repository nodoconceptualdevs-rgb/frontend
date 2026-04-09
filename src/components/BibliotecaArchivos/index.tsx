"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getMediaFiles,
  deleteMediaFile,
  uploadMediaFile,
  filterByType,
  searchFiles,
  getThumbnailUrl,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  filterByTag,
  uploadMediaFileWithTags,
  moveFileToTag,
  getFileTag,
  addFileToTag,
  type MediaFile,
  type MediaFilter,
  type MediaTag,
} from "@/services/mediaLibrary";
import { alerts } from "@/lib/alerts";
import { rotateAndUploadImage } from "@/lib/cloudinary";
import { FILTERS } from "./utils/helpers";
import {
  IconX,
  IconSearch,
  IconGrid,
  IconList,
  IconUpload,
} from "./utils/icons";
import FileCardGrid from "./components/FileCardGrid";
import FileCardList from "./components/FileCardList";
import PreviewModal from "./components/modals/PreviewModal";
import DeleteConfirmModal from "./components/modals/DeleteConfirmModal";
import CreateTagModal from "./components/modals/CreateTagModal";
import EditTagModal from "./components/modals/EditTagModal";
import TagSelectorModal from "./components/modals/TagSelectorModal";
import TagsSidebar from "./components/TagsSidebar";

// ─── Types ───────────────────────────────────────────────────────────
interface BibliotecaArchivosProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (files: MediaFile[]) => void;
  maxSelection?: number;
  defaultFilter?: MediaFilter;
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
  const [imageRotations, setImageRotations] = useState<Record<number, number>>(
    {},
  );
  const [uploadingRotations, setUploadingRotations] = useState<Set<number>>(
    new Set(),
  );
  const uploadRef = useRef<HTMLInputElement>(null);

  // Tags state
  const [allTags, setAllTags] = useState<MediaTag[]>([]);
  const [currentTag, setCurrentTag] = useState<number | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [draggedFile, setDraggedFile] = useState<MediaFile | null>(null);
  const [editingTag, setEditingTag] = useState<MediaTag | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<number | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const files = await getMediaFiles();
      setAllFiles(files);
    } catch {
      alerts.error("Error al cargar archivos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch {
      alerts.error("Error al cargar tags");
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadFiles();
      loadTags();
      setSelected(new Set());
      setQuery("");
      setFilter(defaultFilter);
      setCurrentTag(null);
    }
  }, [visible, loadFiles, loadTags, defaultFilter]);

  const currentTagObject = allTags.find((t) => t.id === currentTag);

  const filteredByTag = currentTag
    ? currentTagObject
      ? filterByTag(allFiles, currentTagObject)
      : allFiles
    : currentTag === -1
      ? allFiles.filter((file) => {
          const isInAnyTag = allTags.some((tag) =>
            (tag.files || []).includes(file.id),
          );
          return !isInAnyTag;
        })
      : allFiles;

  const filtered = searchFiles(filterByType(filteredByTag, filter), query);
  const selectedFiles = allFiles.filter((f) => selected.has(f.id));

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
    setShowTagSelector(true);
  };

  const handleUploadWithTags = async () => {
    const files = uploadRef.current?.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        const uploadedFiles = await uploadMediaFileWithTags(
          file,
          selectedTagIds,
        );
        // Asignar el tag a cada archivo subido
        if (
          uploadedFiles &&
          uploadedFiles.length > 0 &&
          selectedTagIds.length > 0
        ) {
          for (const uploadedFile of uploadedFiles) {
            // Solo asignar al primer tag si no está ya asignado
            const fileTag = getFileTag(uploadedFile.id, allTags);
            if (!fileTag) {
              await addFileToTag(selectedTagIds[0], uploadedFile.id);
            }
          }
        }
        uploadedCount++;
      }
      alerts.success(`${uploadedCount} archivo(s) subido(s) con tags`);
      await loadFiles();
      await loadTags();
      setShowTagSelector(false);
      setSelectedTagIds([]);
    } catch {
      alerts.error("Error al subir archivos");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      alerts.error("Ingresa un nombre para el tag");
      return;
    }
    if (allTags.some((t) => t.name === newTagName.trim())) {
      alerts.error("Este tag ya existe");
      return;
    }

    try {
      await createTag(newTagName.trim());
      await loadTags();
      setShowCreateTag(false);
      setNewTagName("");
      alerts.success(`Tag "${newTagName}" creado`);
    } catch {
      alerts.error("Error al crear tag");
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
    const file = allFiles.find((f) => f.id === fileId);
    if (!file || !file.mime.startsWith("image/")) return;

    const angle = ((imageRotations[fileId] || 0) + 90) % 360;
    setImageRotations((prev) => ({ ...prev, [fileId]: angle }));

    if (angle === 0) {
      setUploadingRotations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      return;
    }

    try {
      setUploadingRotations((prev) => new Set(prev).add(fileId));
      const rotatedFile = await rotateAndUploadImage(
        file.url,
        angle,
        file.name,
      );
      const uploadedFiles = await uploadMediaFile(rotatedFile);
      const uploadedFile = uploadedFiles[0];

      if (!uploadedFile) throw new Error("No se recibió el archivo subido");

      setAllFiles((prev) =>
        prev.map((f) => (f.id === fileId ? uploadedFile : f)),
      );
      setImageRotations((prev) => {
        const newRotations = { ...prev };
        delete newRotations[fileId];
        return newRotations;
      });
      setSelected((prev) => {
        if (prev.has(fileId)) {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          newSet.add(uploadedFile.id);
          return newSet;
        }
        return prev;
      });

      alerts.success("Imagen rotada y guardada");
    } catch {
      alerts.error("Error al rotar imagen");
      setImageRotations((prev) => ({
        ...prev,
        [fileId]: ((prev[fileId] || 0) - 90 + 360) % 360,
      }));
    } finally {
      setUploadingRotations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleDragStart = (file: MediaFile) => {
    setDraggedFile(file);
  };

  const handleDropOnTag = async (tagId: number) => {
    if (!draggedFile) return;

    try {
      // Si el archivo arrastrado está seleccionado, mover todos los seleccionados
      const filesToMove = selected.has(draggedFile.id)
        ? selectedFiles
        : [draggedFile];

      const tag = allTags.find((t) => t.id === tagId);

      // Mover todos los archivos
      for (const file of filesToMove) {
        const currentFileTag = getFileTag(file.id, allTags);
        await moveFileToTag(file.id, currentFileTag?.id || null, tagId);
      }

      await Promise.all([loadTags(), loadFiles()]);

      const count = filesToMove.length;
      alerts.success(
        count === 1
          ? `Archivo movido a "${tag?.name || "tag"}"`
          : `${count} archivos movidos a "${tag?.name || "tag"}"`,
      );
    } catch (error) {
      console.error("Error al mover archivo(s):", error);
      alerts.error("Error al mover archivo(s)");
    } finally {
      setDraggedFile(null);
    }
  };

  const handleConfirm = () => {
    if (selected.size === 0) {
      alerts.error("Selecciona al menos un archivo");
      return;
    }
    onSelect(selectedFiles);
    onClose();
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleEditTag = (tag: MediaTag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editTagName.trim()) {
      alerts.error("Ingresa un nombre válido");
      return;
    }
    if (
      allTags.some(
        (t) => t.id !== editingTag.id && t.name === editTagName.trim(),
      )
    ) {
      alerts.error("Ya existe un tag con ese nombre");
      return;
    }

    try {
      await updateTag(editingTag.id, editTagName.trim());
      await loadTags();
      setEditingTag(null);
      setEditTagName("");
      alerts.success("Tag actualizado");
    } catch {
      alerts.error("Error al actualizar tag");
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    setConfirmDeleteTag(tagId);
  };

  const confirmDeleteTagAction = async () => {
    if (confirmDeleteTag === null) return;

    try {
      await deleteTag(confirmDeleteTag);
      await loadTags();
      if (currentTag === confirmDeleteTag) {
        setCurrentTag(null);
      }
      setConfirmDeleteTag(null);
      alerts.success("Tag eliminado");
    } catch {
      alerts.error("Error al eliminar tag");
    }
  };

  if (!visible) return null;

  const totalImages = allFiles.filter((f) =>
    f.mime.startsWith("image/"),
  ).length;
  const totalVideos = allFiles.filter((f) =>
    f.mime.startsWith("video/"),
  ).length;
  const totalDocs = allFiles.filter(
    (f) => !f.mime.startsWith("image/") && !f.mime.startsWith("video/"),
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 pb-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Biblioteca de Archivos
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {allFiles.length} archivos &middot; {totalImages} imágenes
              &middot; {totalVideos} videos &middot; {totalDocs} documentos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <IconX />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
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

          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
            >
              <IconGrid />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
            >
              <IconList />
            </button>
          </div>

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

        {/* Content with Tags Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg
                  className="animate-spin h-10 w-10 text-red-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-sm text-gray-500">Cargando biblioteca...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  className="w-16 h-16 text-gray-200 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 font-medium">
                  No se encontraron archivos
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Sube archivos o cambia los filtros
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((file) => (
                  <FileCardGrid
                    key={file.id}
                    file={file}
                    isSelected={selected.has(file.id)}
                    imageRotation={imageRotations[file.id] || 0}
                    isRotating={uploadingRotations.has(file.id)}
                    fileTag={getFileTag(file.id, allTags)}
                    onSelect={() => toggleSelect(file.id)}
                    onRotate={() => handleRotate(file.id)}
                    onPreview={() => setPreviewFile(file)}
                    onDelete={() => setConfirmDelete(file.id)}
                    onDragStart={() => handleDragStart(file)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((file) => (
                  <FileCardList
                    key={file.id}
                    file={file}
                    isSelected={selected.has(file.id)}
                    imageRotation={imageRotations[file.id] || 0}
                    fileTag={getFileTag(file.id, allTags)}
                    onSelect={() => toggleSelect(file.id)}
                    onPreview={() => setPreviewFile(file)}
                    onDelete={() => setConfirmDelete(file.id)}
                    onDragStart={() => handleDragStart(file)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Tags Sidebar */}
          <TagsSidebar
            allTags={allTags}
            currentTag={currentTag}
            allFilesCount={allFiles.length}
            onTagSelect={setCurrentTag}
            onCreateTag={() => setShowCreateTag(true)}
            onTagDrop={handleDropOnTag}
            onEditTag={handleEditTag}
            onDeleteTag={handleDeleteTag}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="text-sm text-gray-500">
            {selected.size > 0 ? (
              <span className="font-medium text-gray-700">
                {selected.size} archivo{selected.size !== 1 ? "s" : ""}{" "}
                seleccionado{selected.size !== 1 ? "s" : ""}
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

      {/* Modals */}
      <PreviewModal
        file={previewFile}
        imageRotation={imageRotations[previewFile?.id || 0] || 0}
        onClose={() => setPreviewFile(null)}
      />

      <DeleteConfirmModal
        visible={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
      />

      <CreateTagModal
        visible={showCreateTag}
        tagName={newTagName}
        onTagNameChange={setNewTagName}
        onCreate={handleCreateTag}
        onClose={() => {
          setShowCreateTag(false);
          setNewTagName("");
        }}
      />

      <EditTagModal
        visible={editingTag !== null}
        tagName={editTagName}
        onTagNameChange={setEditTagName}
        onUpdate={handleUpdateTag}
        onClose={() => {
          setEditingTag(null);
          setEditTagName("");
        }}
      />

      <DeleteConfirmModal
        visible={confirmDeleteTag !== null}
        onClose={() => setConfirmDeleteTag(null)}
        onConfirm={confirmDeleteTagAction}
      />

      <TagSelectorModal
        visible={showTagSelector}
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        uploading={uploading}
        onTagToggle={handleTagToggle}
        onUpload={handleUploadWithTags}
        onClose={() => {
          setShowTagSelector(false);
          setSelectedTagIds([]);
        }}
      />
    </div>
  );
}
