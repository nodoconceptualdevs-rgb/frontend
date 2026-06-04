import React, { useState, useEffect } from "react";
import { Modal, Input, InputNumber, Select, Spin } from "antd";
import type { Partida, PartidaFormValues } from "@/types/obras";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  obraId: number;
  partida: Partida | null;
  onClose: () => void;
  onSubmit: (values: PartidaFormValues) => Promise<void>;
}

export default function PartidaModal({
  open,
  obraId,
  partida,
  onClose,
  onSubmit,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<PartidaFormValues>>({
    codigo: "",
    descripcion: "",
    unidad: "",
    cantidadPresupuestada: 0,
    precioUnitario: 0,
  });

  useEffect(() => {
    if (partida) {
      setForm({
        codigo: partida.codigo,
        descripcion: partida.descripcion,
        unidad: partida.unidad,
        cantidadPresupuestada: partida.cantidadPresupuestada,
        precioUnitario: partida.precioUnitario,
      });
    } else {
      setForm({
        codigo: "",
        descripcion: "",
        unidad: "",
        cantidadPresupuestada: 0,
        precioUnitario: 0,
      });
    }
  }, [partida, open]);

  const handleSubmit = async () => {
    if (!form.codigo) {
      toast.error("El código es requerido");
      return;
    }
    if (!form.descripcion) {
      toast.error("La descripción es requerida");
      return;
    }
    if (!form.unidad) {
      toast.error("La unidad es requerida");
      return;
    }
    if (!form.cantidadPresupuestada || form.cantidadPresupuestada === 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    if (!form.precioUnitario || form.precioUnitario === 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(form as PartidaFormValues);
    } finally {
      setLoading(false);
    }
  };

  const montoPresupuestado =
    (form.cantidadPresupuestada || 0) * (form.precioUnitario || 0);

  return (
    <Modal
      title={partida ? "Editar Partida" : "Nueva Partida"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={partida ? "Actualizar" : "Crear"}
      cancelText="Cancelar"
      width={600}
      confirmLoading={loading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Código *
          </label>
          <Input
            placeholder="Ej: 01.01"
            value={form.codigo || ""}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descripción *
          </label>
          <Input.TextArea
            placeholder="Descripción de la partida"
            value={form.descripcion || ""}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Unidad *
            </label>
            <Input
              placeholder="Ej: m³, m², ton"
              value={form.unidad || ""}
              onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cantidad *
            </label>
            <InputNumber
              value={form.cantidadPresupuestada}
              onChange={(val) =>
                setForm({ ...form, cantidadPresupuestada: val || 0 })
              }
              min={0}
              step={0.1}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Precio Unitario *
          </label>
          <InputNumber
            value={form.precioUnitario}
            onChange={(val) =>
              setForm({ ...form, precioUnitario: val || 0 })
            }
            formatter={(value) =>
              `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, ""))}
            style={{ width: "100%" }}
            min={0}
            step={1000}
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">
            Monto Presupuestado:{" "}
            <span className="font-bold text-blue-600">
              ${montoPresupuestado.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              })}
            </span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
