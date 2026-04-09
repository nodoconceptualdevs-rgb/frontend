interface CreateTagModalProps {
  visible: boolean;
  tagName: string;
  onTagNameChange: (name: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export default function CreateTagModal({
  visible,
  tagName,
  onTagNameChange,
  onCreate,
  onClose,
}: CreateTagModalProps) {
  if (!visible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onCreate();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo Tag</h3>
        <input
          type="text"
          placeholder="Nombre del tag"
          value={tagName}
          onChange={(e) => onTagNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
          autoFocus
        />
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={!tagName.trim()}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Crear Tag
          </button>
        </div>
      </div>
    </div>
  );
}
