"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Input, Select, Segmented } from "antd";
import { useForm, Controller } from "react-hook-form";
import { Building2, Wrench } from "lucide-react";
import type {
  Arquitecto,
  HitoOpcion,
  ProyectoOpcion,
  TareaConKpi,
  TareaFormValues,
  TipoTarea,
} from "@/types/kpi";

interface TareaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TareaFormValues) => Promise<void> | void;
  /** Tarea a editar; si no se pasa, es creación. */
  tarea?: TareaConKpi | null;
  proyectos: ProyectoOpcion[];
  hitos: HitoOpcion[];
  arquitectos: Arquitecto[];
}

const VALORES_INICIALES: TareaFormValues = {
  titulo: "",
  descripcion: "",
  tipo: "CLIENTE",
  proyectoId: undefined,
  hitoId: undefined,
  arquitectoIds: [],
  fechaEntregaEstimada: undefined,
  notasInternas: "",
};

export default function TareaModal({
  open,
  onClose,
  onSubmit,
  tarea,
  proyectos,
  hitos,
  arquitectos,
}: TareaModalProps) {
  const esEdicion = Boolean(tarea);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TareaFormValues>({ defaultValues: VALORES_INICIALES });

  const tipo = watch("tipo");
  const proyectoId = watch("proyectoId");

  useEffect(() => {
    if (!open) return;
    if (tarea) {
      reset({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion ?? "",
        tipo: tarea.tipo,
        proyectoId: tarea.proyectoId,
        hitoId: tarea.hitoId,
        arquitectoIds: tarea.arquitectos.map((a) => a.id),
        fechaEntregaEstimada: tarea.fechaEntregaEstimada,
        notasInternas: tarea.notasInternas ?? "",
      });
    } else {
      reset(VALORES_INICIALES);
    }
  }, [open, tarea, reset]);

  const hitosProyecto = useMemo(
    () => hitos.filter((h) => h.proyectoId === proyectoId),
    [hitos, proyectoId],
  );

  function onTipoChange(value: TipoTarea) {
    setValue("tipo", value);
    if (value === "INDEPENDIENTE") {
      setValue("proyectoId", undefined);
      setValue("hitoId", undefined);
    }
  }

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onClose();
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={esEdicion ? "Guardar cambios" : "Crear tarea"}
      cancelText="Cancelar"
      confirmLoading={isSubmitting}
      title={
        <span className="text-base font-bold text-gray-900">
          {esEdicion ? "Editar tarea" : "Nueva tarea"}
        </span>
      }
      okButtonProps={{
        style: { background: "#ef4444", borderColor: "#ef4444" },
      }}
      destroyOnHidden
      width={720}
    >
      <div className="mt-4 flex flex-col gap-4">
        {/* Tipo */}
        <Field label="Clasificación">
          <Segmented
            value={tipo}
            onChange={(v) => onTipoChange(v as TipoTarea)}
            options={[
              {
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} /> De cliente
                  </span>
                ),
                value: "CLIENTE",
              },
              {
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Wrench size={14} /> Independiente
                  </span>
                ),
                value: "INDEPENDIENTE",
              },
            ]}
            block
          />
        </Field>

        {/* Proyecto (solo cliente) */}
        {tipo === "CLIENTE" && (
          <Field label="Proyecto / Cliente" error={errors.proyectoId?.message}>
            <Controller
              name="proyectoId"
              control={control}
              rules={{
                validate: (v) =>
                  tipo === "CLIENTE" && !v ? "Selecciona un proyecto" : true,
              }}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Selecciona proyecto"
                  className="w-full"
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("hitoId", undefined);
                  }}
                  options={proyectos.map((p) => ({
                    value: p.id,
                    label: `${p.nombre} · ${p.clienteNombre}`,
                  }))}
                />
              )}
            />
          </Field>
        )}

        {/* Titulo */}
        <Field label="Titulo" error={errors.titulo?.message}>
          <Controller
            name="titulo"
            control={control}
            rules={{ required: "El titulo es obligatorio" }}
            render={({ field }) => (
              <Input {...field} placeholder="Ej: Render 3D de fachada principal" />
            )}
          />
        </Field>

        <Field label="Descripcion">
          <Controller
            name="descripcion"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={3}
                placeholder="Detalle de lo que se debe producir"
              />
            )}
          />
        </Field>

        <Field label="Arquitectos">
          <Controller
            name="arquitectoIds"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="multiple"
                placeholder="Selecciona arquitectos"
                className="w-full"
                options={arquitectos.map((a) => ({
                  value: a.id,
                  label: a.name,
                }))}
              />
            )}
          />
        </Field>
      </div>
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
