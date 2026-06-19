"use client";

import React, { useEffect } from "react";
import { Modal, Input, DatePicker } from "antd";
import dayjs from "dayjs";
import { useForm, Controller } from "react-hook-form";
import { CalendarClock, History } from "lucide-react";
import type { ReprogramarValues, TareaConKpi } from "@/types/kpi";
import { fmtFecha } from "@/lib/kpi";

interface ReprogramarModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ReprogramarValues) => Promise<void> | void;
  tarea: TareaConKpi | null;
}

export default function ReprogramarModal({
  open,
  onClose,
  onSubmit,
  tarea,
}: ReprogramarModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReprogramarValues>({
    defaultValues: { fechaNueva: "", motivo: "" },
  });

  useEffect(() => {
    if (open) reset({ fechaNueva: "", motivo: "" });
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
          <CalendarClock size={14} /> Reprogramar
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
          Reprogramar fecha de entrega
        </span>
      }
    >
      {tarea && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Contexto */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-900">{tarea.titulo}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={12} />
                Fecha actual: <strong>{fmtFecha(tarea.fechaEntregaEstimada)}</strong>
              </span>
              {tarea.reprogramaciones > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <History size={12} />
                  {tarea.reprogramaciones} reprogramación(es) previa(s)
                </span>
              )}
            </p>
          </div>

          {/* Aviso de impacto en KPI */}
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Reprogramar deja un <strong>registro con motivo</strong> y afecta la
            eficiencia del arquitecto. Úsalo solo cuando la fecha comprometida
            cambie realmente.
          </p>

          {/* Nueva fecha */}
          <Field label="Nueva fecha de entrega" error={errors.fechaNueva?.message}>
            <Controller
              name="fechaNueva"
              control={control}
              rules={{ required: "Selecciona la nueva fecha" }}
              render={({ field }) => (
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Selecciona fecha"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(d) =>
                    field.onChange(d ? d.toISOString() : "")
                  }
                />
              )}
            />
          </Field>

          {/* Motivo obligatorio */}
          <Field label="Motivo del cambio" error={errors.motivo?.message}>
            <Controller
              name="motivo"
              control={control}
              rules={{
                required: "El motivo es obligatorio",
                minLength: { value: 5, message: "Describe brevemente el motivo" },
              }}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={3}
                  placeholder="Ej: El cliente solicitó cambios que extienden el plazo…"
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
