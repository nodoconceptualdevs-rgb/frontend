import type { MediaTag } from "@/services/mediaLibrary";

interface TagSelectorModalProps {
  visible: boolean;
  allTags: MediaTag[];
  selectedTagIds: number[];
  uploading: boolean;
  onTagToggle: (tagId: number) => void;
  onUpload: () => void;
  onClose: () => void;
}

export default function TagSelectorModal({
  visible,
  allTags,
  selectedTagIds,
  uploading,
  onTagToggle,
  onUpload,
  onClose,
}: TagSelectorModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Seleccionar Tags
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {allTags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => onTagToggle(tag.id)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
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
