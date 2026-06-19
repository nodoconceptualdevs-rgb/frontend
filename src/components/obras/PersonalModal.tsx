import React, { useState, useEffect } from "react";
import { Modal, Input, InputNumber, Select } from "antd";
import type { Personal, PersonalFormValues } from "@/types/obras";
import toast from "react-hot-toast";

const CARGOS_PREDEFINIDOS = [
  "Capataz",
  "Albañil",
  "Fierrero",
  "Electricista",
  "Plomero",
  "Ayudante",
];

interface Props {
  open: boolean;
  personal: Personal | null;
  onClose: () => void;
  onSubmit: (values: PersonalFormValues) => Promise<void>;
}

export default function PersonalModal({
  open,
  personal,
  onClose,
  onSubmit,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<PersonalFormValues>>({
    nombre: "",
    cargo: "",
    costoPorHora: 0,
  });

  useEffect(() => {
    if (personal) {
      setForm({
        nombre: personal.nombre,
        cargo: personal.cargo,
        costoPorHora: personal.costoPorHora,
      });
    } else {
      setForm({
        nombre: "",
        cargo: "",
        costoPorHora: 0,
      });
    }
  }, [personal, open]);

  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!form.cargo) {
      toast.error("El cargo es requerido");
      return;
    }
    if (!form.costoPorHora || form.costoPorHora === 0) {
      toast.error("El costo debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(form as PersonalFormValues);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={personal ? "Editar Personal" : "Agregar Personal"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={personal ? "Actualizar" : "Agregar"}
      cancelText="Cancelar"
      width={500}
      confirmLoading={loading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre *
          </label>
          <Input
            placeholder="Nombre completo"
            value={form.nombre || ""}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cargo *
          </label>
          <Select
            placeholder="Seleccionar o escribir cargo"
            value={form.cargo}
            onChange={(val) => setForm({ ...form, cargo: val })}
            options={CARGOS_PREDEFINIDOS.map((c) => ({
              label: c,
              value: c,
            }))}
            mode="combobox"
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Costo por Hora *
          </label>
          <InputNumber
            value={form.costoPorHora}
            onChange={(val) =>
              setForm({ ...form, costoPorHora: val || 0 })
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
      </div>
    </Modal>
  );
}
