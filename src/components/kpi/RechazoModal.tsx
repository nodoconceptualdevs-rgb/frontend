"use client";

import React, { useEffect } from "react";
import { Modal, Input, Select } from "antd";
import { useForm, Controller } from "react-hook-form";
import { RotateCcw, History } from "lucide-react";
import type {
  MotivoRechazo,
  RechazoValues,
  TareaConKpi,
} from "@/types/kpi";
import { MOTIVO_RECHAZO_LABEL } from "@/types/kpi";

interface RechazoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RechazoValues) => Promise<void> | void;
  tarea: TareaConKpi | null;
}

const CATEGORIAS: { value: MotivoRechazo; label: string }[] = [
  { value: "BRIEF_POCO_CLARO", label: MOTIVO_RECHAZO_LABEL.BRIEF_POCO_CLARO },
  {
    value: "NO_CUMPLE_EXPECTATIVAS",
    label: MOTIVO_RECHAZO_LABEL.NO_CUMPLE_EXPECTATIVAS,
  },
  { value: "OTRO", label: MOTIVO_RECHAZO_LABEL.OTRO },
];

export default function RechazoModal({
  open,
  onClose,
  onSubmit,
  tarea,
}: RechazoModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RechazoValues>({
    defaultValues: { categoria: "NO_CUMPLE_EXPECTATIVAS", motivo: "" },
  });

  useEffect(() => {
    if (open) reset({ categoria: "NO_CUMPLE_EXPECTATIVAS", motivo: "" });
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onClose();
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={
        <span className="inline-flex items-center gap-1.5">
          <RotateCcw size={14} /> Registrar rechazo
        </span>
      }
      cancelText="Cancelar"
      confirmLoading={isSubmitting}
      okButtonProps={{
        style: { background: "#ef4444", borderColor: "#ef4444" },
      }}
      destroyOnHidden
      width={500}
      title={
        <span className="text-base font-bold text-gray-900">
          Registrar rechazo / retrabajo
        </span>
      }
    >
      {tarea && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-900">{tarea.titulo}</p>
            {tarea.contadorRechazos > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-500">
                <History size={12} />
                {tarea.contadorRechazos} rechazo(s) previo(s)
              </p>
            )}
          </div>

          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            Esto cuenta como <strong>retrabajo (rediseño)</strong>: la tarea
            vuelve a “En proceso” y baja la eficiencia del arquitecto.
          </p>

          {/* Categoría */}
          <Field label="Motivo principal" error={errors.categoria?.message}>
            <Controller
              name="categoria"
              control={control}
              rules={{ required: "Selecciona un motivo" }}
              render={({ field }) => (
                <Select {...field} className="w-full" options={CATEGORIAS} />
              )}
            />
          </Field>

          {/* Detalle */}
          <Field label="Detalle del rechazo" error={errors.motivo?.message}>
            <Controller
              name="motivo"
              control={control}
              rules={{
                required: "Describe por qué se rechazó",
                minLength: { value: 5, message: "Describe brevemente el motivo" },
              }}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={3}
                  placeholder="Ej: El cliente no aprobó la distribución propuesta…"
                />
              )}
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
