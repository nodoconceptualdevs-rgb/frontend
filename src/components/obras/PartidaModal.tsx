import React, { useState, useEffect } from "react";
import { Modal, Input, InputNumber, Switch } from "antd";
import type { Partida, PartidaFormValues } from "@/types/obras";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  obraId: number;
  partida: Partida | null;
  defaultEsExtra?: boolean;
  onClose: () => void;
  onSubmit: (values: PartidaFormValues) => Promise<void>;
}

export default function PartidaModal({
  open,
  obraId,
  partida,
  defaultEsExtra = false,
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
    esExtra: defaultEsExtra,
  });

  useEffect(() => {
    if (partida) {
      setForm({
        codigo: partida.codigo,
        descripcion: partida.descripcion,
        unidad: partida.unidad,
        cantidadPresupuestada: partida.cantidadPresupuestada,
        precioUnitario: partida.precioUnitario,
        esExtra: partida.esExtra,
      });
    } else {
      setForm({
        codigo: "",
        descripcion: "",
        unidad: "",
        cantidadPresupuestada: 0,
        precioUnitario: 0,
        esExtra: defaultEsExtra,
      });
    }
  }, [partida, open, defaultEsExtra]);

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
    if (!form.esExtra && (!form.cantidadPresupuestada || form.cantidadPresupuestada === 0)) {
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

  const esExtra = form.esExtra ?? false;

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <span>{partida ? "Editar Partida" : "Nueva Partida"}</span>
          {esExtra && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">
              OBRA EXTRA
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={partida ? "Actualizar" : "Crear"}
      cancelText="Cancelar"
      width={600}
      confirmLoading={loading}
    >
      <div className="space-y-4 pt-2">
        {/* Toggle obra extra */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${esExtra ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <div>
            <p className="text-sm font-semibold text-gray-800">Obra Extra</p>
            <p className="text-xs text-gray-500">Partida no contemplada en el presupuesto original</p>
          </div>
          <Switch
            checked={esExtra}
            onChange={(checked) => setForm({ ...form, esExtra: checked })}
            style={{ backgroundColor: esExtra ? "#16a34a" : undefined }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Código *
          </label>
          <Input
            placeholder={esExtra ? "Ej: OE-01" : "Ej: 01.01"}
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
              {esExtra ? "Cantidad Estimada" : "Cantidad *"}
            </label>
            <InputNumber
              value={form.cantidadPresupuestada}
              onChange={(val) =>
                setForm({ ...form, cantidadPresupuestada: val || 0 })
              }
              min={0}
              step={0.1}
              style={{ width: "100%" }}
              placeholder={esExtra ? "0 (opcional)" : "0"}
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

        <div className={`p-4 rounded-lg border ${esExtra ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
          <p className="text-sm text-gray-600">
            {esExtra ? "Monto Estimado" : "Monto Presupuestado"}:{" "}
            <span className={`font-bold ${esExtra ? "text-green-700" : "text-blue-600"}`}>
              ${montoPresupuestado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </span>
          </p>
          {esExtra && (
            <p className="text-xs text-green-600 mt-1">Esta partida aparecerá en la columna "Obras Extras" de las valuaciones</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
