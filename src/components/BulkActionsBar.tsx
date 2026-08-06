import React, { useState } from "react";
import { Modal, Button, Spin } from "antd";
import { Trash2, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onConfirmDelete: () => Promise<void>;
  isLoading?: boolean;
  itemLabel?: string; // "partidas", "materiales", etc.
  extraActions?: React.ReactNode; // botones adicionales antes de Cancelar/Eliminar
}

export default function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onConfirmDelete,
  isLoading = false,
  itemLabel = "items",
  extraActions,
}: BulkActionsBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    console.log("🎬 Iniciando confirmación de eliminación");
    setConfirming(true);
    try {
      console.log("🚀 Llamando a onConfirmDelete");
      await onConfirmDelete();
      console.log("✅ Eliminación completada");
      setModalOpen(false);
    } catch (error) {
      console.error("❌ Error durante la eliminación:", error);
    } finally {
      setConfirming(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {selectedCount} {itemLabel} seleccionado{selectedCount > 1 ? "s" : ""}
              </span>
              {selectedCount < totalCount && (
                <button
                  onClick={onSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Seleccionar todos ({totalCount})
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {extraActions}
            <button
              onClick={onClearSelection}
              disabled={confirming || isLoading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              onClick={() => setModalOpen(true)}
              disabled={confirming || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
            >
              <Trash2 size={18} />
              Eliminar seleccionados
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={
          <span className="flex items-center gap-2 text-lg font-bold text-red-600">
            <span aria-hidden>⚠️</span> Confirmar eliminación masiva
          </span>
        }
        open={modalOpen}
        onCancel={() => !confirming && setModalOpen(false)}
        footer={null}
        closable={!confirming}
      >
        <div className="py-4 space-y-6">
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <p className="text-red-900 font-medium">
              Eliminarás {selectedCount} {itemLabel}
            </p>
            <p className="text-red-700 text-sm mt-2">
              Esta acción no se puede deshacer. Por favor, confirma que deseas continuar.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setModalOpen(false)}
              disabled={confirming}
              className="flex-1 px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <Spin size="small" />
                  Eliminando...
                </>
              ) : (
                "Confirmar eliminación"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
