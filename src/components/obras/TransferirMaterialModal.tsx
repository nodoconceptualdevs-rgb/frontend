"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, InputNumber, Input, Button } from "antd";
import { ArrowRightLeft } from "lucide-react";
import toast from "react-hot-toast";

const NODO_VALUE = "NODO";

interface MaterialParaTransferir {
  materialId: number;
  materialNombre: string;
  unidad: string;
  stockActual: number;
}

interface TransferirMaterialModalProps {
  open: boolean;
  material: MaterialParaTransferir | null;
  otrasObras: { id: number; nombre: string }[];
  /** true cuando el origen ya es Nodo (ej. transferir desde el Inventario
   * General): oculta esa opción de la lista de destinos, ya que no tiene
   * sentido transferir de Nodo a Nodo. */
  ocultarNodoComoDestino?: boolean;
  onClose: () => void;
  onSubmit: (input: { materialId: number; cantidad: number; obraDestinoId?: number; nota?: string }) => Promise<void>;
}

export default function TransferirMaterialModal({
  open,
  material,
  otrasObras,
  ocultarNodoComoDestino = false,
  onClose,
  onSubmit,
}: TransferirMaterialModalProps) {
  const [destino, setDestino] = useState<string | undefined>(undefined);
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setDestino(ocultarNodoComoDestino ? undefined : NODO_VALUE);
      setCantidad(null);
      setNota("");
    }
  }, [open, material, ocultarNodoComoDestino]);

  const handleSubmit = async () => {
    if (!material) return;
    if (!destino) {
      toast.error("Elegí un destino");
      return;
    }
    if (!cantidad || cantidad <= 0) {
      toast.error("Indica una cantidad válida");
      return;
    }
    if (cantidad > material.stockActual) {
      toast.error(`Solo hay ${material.stockActual} ${material.unidad} disponibles`);
      return;
    }

    setGuardando(true);
    try {
      await onSubmit({
        materialId: material.materialId,
        cantidad,
        obraDestinoId: destino !== NODO_VALUE && destino ? Number(destino) : undefined,
        nota: nota.trim() || undefined,
      });
      onClose();
    } catch {
      // el error ya se notifica en el llamador
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <ArrowRightLeft size={18} />
          Transferir material
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      {material && (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-900">{material.materialNombre}</p>
            <p className="text-xs text-gray-500">
              Disponible: {material.stockActual} {material.unidad}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cantidad a transferir</label>
            <InputNumber
              value={cantidad}
              onChange={setCantidad}
              min={0.01}
              max={material.stockActual}
              step={1}
              className="w-full"
              placeholder={`Máximo ${material.stockActual} ${material.unidad}`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Destino</label>
            <Select
              value={destino}
              onChange={setDestino}
              placeholder="Selecciona un destino"
              className="w-full"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={[
                ...(ocultarNodoComoDestino ? [] : [{ value: NODO_VALUE, label: "Inventario General de Nodo" }]),
                ...otrasObras.map((o) => ({ value: String(o.id), label: o.nombre })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nota (opcional)</label>
            <Input.TextArea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              placeholder="Ej: sobrante al cierre de la obra"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} className="w-1/2" disabled={guardando}>
              Cancelar
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={guardando} className="w-1/2">
              Transferir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
