interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          ¿Eliminar archivo?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Esta acción es permanente y no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
