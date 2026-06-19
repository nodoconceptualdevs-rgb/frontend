"use client";

import React, { useEffect, useMemo } from "react";
import { Modal, Input, Select, Checkbox } from "antd";
import { useForm, Controller } from "react-hook-form";
import { Send, Eye, FileStack } from "lucide-react";
import type {
  Archivo,
  HitoOpcion,
  PublicarHitoValues,
  TareaConKpi,
} from "@/types/kpi";

interface PublicarHitoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PublicarHitoValues) => Promise<void> | void;
  tarea: TareaConKpi | null;
  hitos: HitoOpcion[];
  archivosAdjuntos: Archivo[];
}

function formatearTamaño(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function PublicarHitoModal({
  open,
  onClose,
  onSubmit,
  tarea,
  hitos,
  archivosAdjuntos,
}: PublicarHitoModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PublicarHitoValues>({
    defaultValues: { hitoId: undefined, descripcionAvance: "", archivoIds: [] },
  });

  const hitosProyecto = useMemo(
    () =>
      tarea?.proyectoId
        ? hitos.filter((h) => h.proyectoId === tarea.proyectoId)
        : [],
    [hitos, tarea?.proyectoId],
  );

  const archivoIdsSeleccionados = watch("archivoIds");

  useEffect(() => {
    if (!open || !tarea) return;
    reset({
      hitoId: tarea.publicacion?.hitoId ?? tarea.hitoId,
      descripcionAvance: tarea.descripcion ?? "",
      archivoIds: tarea.publicacion?.archivoIds ?? archivosAdjuntos.map((a) => a.id),
    });
  }, [open, tarea, archivosAdjuntos, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    onClose();
  });

  const yaPublicada = Boolean(tarea?.publicacion);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={
        <span className="inline-flex items-center gap-1.5">
          <Send size={14} />
          {yaPublicada ? "Actualizar hito" : "Publicar en hito"}
        </span>
      }
      cancelText="Cancelar"
      confirmLoading={isSubmitting}
      okButtonProps={{
        style: { background: "#ef4444", borderColor: "#ef4444" },
      }}
      destroyOnHidden
      width={560}
      title={
        <span className="text-base font-bold text-gray-900">
          Llevar tarea a un hito
        </span>
      }
    >
      {tarea && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Contexto de la tarea */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
              {tarea.clienteNombre} · {tarea.proyectoNombre}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {tarea.titulo}
            </p>
          </div>

          {/* Aviso visible-al-cliente */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <Eye size={15} className="mt-0.5 flex-shrink-0" />
            <span>
              Lo que publiques aquí será <strong>visible para el cliente</strong>{" "}
              en el seguimiento del proyecto (descripción del avance y archivos
              del hito).
            </span>
          </div>

          {/* Hito destino */}
          <Field label="Hito destino" error={errors.hitoId?.message}>
            <Controller
              name="hitoId"
              control={control}
              rules={{ required: "Selecciona el hito destino" }}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Selecciona el hito"
                  className="w-full"
                  options={hitosProyecto.map((h) => ({
                    value: h.id,
                    label: h.nombre,
                  }))}
                />
              )}
            />
          </Field>

          {/* Descripción del avance */}
          <Field
            label="Descripción del avance (visible al cliente)"
            error={errors.descripcionAvance?.message}
          >
            <Controller
              name="descripcionAvance"
              control={control}
              rules={{ required: "Escribe la descripción del avance" }}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={4}
                  placeholder="Describe el avance que verá el cliente…"
                />
              )}
            />
          </Field>

          {/* Archivos a publicar */}
          <Field label="Archivos a publicar">
            {archivosAdjuntos.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p>
                  Esta tarea no tiene archivos adjuntos. Ve al cuerpo de la
                  tarea para agregar archivos antes de publicar.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {archivosAdjuntos.map((archivo) => (
                  <label
                    key={archivo.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <Controller
                      name="archivoIds"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value.includes(archivo.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...field.value, archivo.id]
                              : field.value.filter((id) => id !== archivo.id);
                            field.onChange(newIds);
                          }}
                        />
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {archivo.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatearTamaño(archivo.tamaño)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <FileStack size={12} />
              {archivoIdsSeleccionados.length} archivo
              {archivoIdsSeleccionados.length !== 1 ? "s" : ""} seleccionado
              {archivoIdsSeleccionados.length !== 1 ? "s" : ""}
            </div>
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
