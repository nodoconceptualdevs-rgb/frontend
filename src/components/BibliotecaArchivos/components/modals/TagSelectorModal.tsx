import type { MediaTag } from "@/services/mediaLibrary";

interface TagSelectorModalProps {
  visible: boolean;
  allTags: MediaTag[];
  selectedTagIds: number[];
  uploading: boolean;
  onTagToggle: (tagId: number) => void;
  onUpload: () => void;
  onClose: () => void;
  onSelectNone: () => void;
}

export default function TagSelectorModal({
  visible,
  allTags,
  selectedTagIds,
  uploading,
  onTagToggle,
  onUpload,
  onClose,
  onSelectNone,
}: TagSelectorModalProps) {
  if (!visible) return null;

  const isNoneSelected = selectedTagIds.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Seleccionar Categoría
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona una categoría para los archivos a subir.
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {/* Opción Sin categoría */}
          <label
            className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
              isNoneSelected
                ? "bg-red-50 border border-red-200"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="tag-selector"
              checked={isNoneSelected}
              onChange={onSelectNone}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span
              className={`text-sm ${isNoneSelected ? "text-red-700 font-medium" : "text-gray-500 italic"}`}
            >
              Sin categoría
            </span>
          </label>

          {allTags.map((tag) => (
            <label
              key={tag.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                selectedTagIds.includes(tag.id)
                  ? "bg-red-50 border border-red-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="tag-selector"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => onTagToggle(tag.id)}
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">{tag.name}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onUpload}
            disabled={uploading}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition"
          >
            {uploading ? "Subiendo..." : "Subir"}
          </button>
        </div>
      </div>
    </div>
  );
}
