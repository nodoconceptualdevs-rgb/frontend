"use client";

import React, { useEffect, useState } from "react";
import { Modal, Select, Button, Input, DatePicker, Tooltip, Spin } from "antd";
import dayjs from "dayjs";
import { useForm, Controller } from "react-hook-form";
import {
  Wrench,
  CalendarX,
  Send,
  AlertCircle,
  CalendarClock,
  ChevronDown,
  Trash2,
  Upload,
} from "lucide-react";
import BibliotecaArchivos from "@/components/BibliotecaArchivos";
import ArchivosTareaCard from "./ArchivosTareaCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import type {
  ArchivoProyecto,
  Arquitecto,
  EstadoTarea,
  HitoOpcion,
  ProyectoOpcion,
  RechazoValues,
  ReprogramarValues,
  TareaConKpi,
  TareaFormValues,
} from "@/types/kpi";
import { ESTADO_LABEL } from "@/types/kpi";
import { fmtFecha } from "@/lib/kpi";
import {
  getBibliotecaProyecto,
  getComentarios,
  agregarComentario,
  eliminarComentario,
  getHitosConContenido,
} from "@/services/kpi";
import type { HitoConContenido } from "@/services/kpi";

interface Comentario {
  id: number;
  contenido: string;
  autor: { id: number; name: string } | null;
  createdAt: string;
}

interface TareaDetalleModalProps {
  open: boolean;
  onClose: () => void;
  tarea: TareaConKpi | null;
  hitos: HitoOpcion[];
  arquitectos: Arquitecto[];
  proyectos?: ProyectoOpcion[];
  onGuardarEdicion: (id: number, values: TareaFormValues) => Promise<void>;
  onConfirmarReprogramar: (id: number, values: ReprogramarValues) => Promise<void>;
  onConfirmarRechazo?: (id: number, values: RechazoValues) => Promise<void>;
  onCambiarEstado: (id: number, nuevoEstado: EstadoTarea) => Promise<void>;
  onGuardarArquitectos: (id: number, arquitectoIds: number[]) => Promise<void>;
  onReprogramar: (t: TareaConKpi) => void;
  onPublicar: (t: TareaConKpi) => void;
  onRechazo: (t: TareaConKpi) => void;
  onSubirABiblioteca?: (files: File[]) => Promise<void>;
  onPublicarAvance?: (hitoId: number, archivoIds: string[], descripcion: string) => Promise<void>;
  onEliminarArchivo?: (archivoId: string) => Promise<void> | void;
  bibliotecaVersion?: number;
  isAdmin?: boolean;
}

const ESTADO_COLOR: Record<EstadoTarea, { bg: string; text: string; dot: string }> = {
  PENDIENTE: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  EN_PROCESO: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  COMPLETADA: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

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
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export default function TareaDetalleModal({
  open,
  onClose,
  tarea,
  hitos,
  arquitectos,
  proyectos = [],
  onGuardarEdicion,
  onConfirmarReprogramar,
  onConfirmarRechazo,
  onCambiarEstado,
  onGuardarArquitectos,
  onReprogramar,
  onPublicar,
  onRechazo,
  onSubirABiblioteca,
  onPublicarAvance,
  onEliminarArchivo,
  bibliotecaVersion = 0,
  isAdmin = false,
}: TareaDetalleModalProps) {
  const { user } = useAuth();
  const [archivosProyecto, setArchivosProyecto] = useState<ArchivoProyecto[]>([]);
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(false);
  const [hitosProyecto, setHitosProyecto] = useState<HitoConContenido[]>([]);
  const [cargandoHitos, setCargandoHitos] = useState(false);
  const [hitoExpandido, setHitoExpandido] = useState<number | null>(null);
  const [hitoPublicarId, setHitoPublicarId] = useState<number | undefined>();
  const [descripcionAvance, setDescripcionAvance] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dragOverHito, setDragOverHito] = useState<number | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [mostrarReprogramar, setMostrarReprogramar] = useState(true);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [openRechazos, setOpenRechazos] = useState(false);
  const [openReprogramaciones, setOpenReprogramaciones] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Set<string>>(new Set());
  const [arquitectosSeleccionados, setArquitectosSeleccionados] = useState<number[]>([]);
  const [guardandoArquitectos, setGuardandoArquitectos] = useState(false);
  const [mostrarBibliotecaModal, setMostrarBibliotecaModal] = useState(false);

  // Inline edit state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<"CLIENTE" | "INDEPENDIENTE">("CLIENTE");
  const [proyectoId, setProyectoId] = useState<number | undefined>();
  const [fechaEntrega, setFechaEntrega] = useState<string | undefined>();
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [editandoDesc, setEditandoDesc] = useState(false);
  const [editandoTipo, setEditandoTipo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Form para reschedule
  const reprogramarForm = useForm<ReprogramarValues>({
    defaultValues: { fechaNueva: "", motivo: "" },
  });

  // Form para rechazo
  const rechazoForm = useForm<RechazoValues>({
    defaultValues: { categoria: "BRIEF_POCO_CLARO", motivo: "" },
  });

  useEffect(() => {
    if (!open || !tarea) return;

    setTitulo(tarea.titulo);
    setDescripcion(tarea.descripcion || "");
    setTipo(tarea.tipo);
    setProyectoId(tarea.proyectoId);
    setFechaEntrega(tarea.fechaEntregaEstimada);
    setEditandoTitulo(false);
    setEditandoDesc(false);
    setEditandoTipo(false);
    setMostrarReprogramar(!!tarea.fechaEntregaEstimada);
    setMostrarRechazo(false);
    // Cargar archivos que ya están guardados en la tarea
    const archivosGuardados = tarea.archivos?.map((a) => String(a.id)) || [];
    setArchivosSeleccionados(new Set(archivosGuardados));
    console.log("📋 Archivos ya guardados en la tarea:", archivosGuardados);
    setArquitectosSeleccionados(tarea.arquitectos.map((a) => a.id));
    setHitoPublicarId(tarea.hitoId ?? undefined);
    setDescripcionAvance("");
    setHitoExpandido(null);
    reprogramarForm.reset({ fechaNueva: "", motivo: "" });
    rechazoForm.reset({ categoria: "BRIEF_POCO_CLARO", motivo: "" });

    if (tarea.proyectoId) {
      setCargandoBiblioteca(true);
      getBibliotecaProyecto(tarea.proyectoId)
        .then(setArchivosProyecto)
        .catch(() => setArchivosProyecto([]))
        .finally(() => setCargandoBiblioteca(false));

      setCargandoHitos(true);
      getHitosConContenido(tarea.proyectoId)
        .then(setHitosProyecto)
        .catch(() => setHitosProyecto([]))
        .finally(() => setCargandoHitos(false));
    }

    setCargandoComentarios(true);
    getComentarios(tarea.id)
      .then(setComentarios)
      .catch(() => setComentarios([]))
      .finally(() => setCargandoComentarios(false));
  }, [open, tarea, bibliotecaVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tarea) return null;

  const esIndependiente = tipo === "INDEPENDIENTE";
  const estadoColor = ESTADO_COLOR[tarea.estado];
  const tieneFechaEntrega = !!tarea.fechaEntregaEstimada;

  const guardarTitulo = async () => {
    if (titulo.trim() === tarea.titulo) {
      setEditandoTitulo(false);
      return;
    }
    try {
      setGuardando(true);
      await onGuardarEdicion(tarea.id, {
        titulo: titulo.trim() || tarea.titulo,
        descripcion,
        tipo,
        proyectoId: tipo === "CLIENTE" ? proyectoId : undefined,
        hitoId: tarea.hitoId,
        arquitectoIds: tarea.arquitectos.map((a) => a.id),
        fechaEntregaEstimada: fechaEntrega,
      });
      setEditandoTitulo(false);
    } finally {
      setGuardando(false);
    }
  };

  const guardarDescripcion = async () => {
    if (descripcion === tarea.descripcion) {
      setEditandoDesc(false);
      return;
    }
    try {
      setGuardando(true);
      await onGuardarEdicion(tarea.id, {
        titulo,
        descripcion,
        tipo,
        proyectoId: tipo === "CLIENTE" ? proyectoId : undefined,
        hitoId: tarea.hitoId,
        arquitectoIds: tarea.arquitectos.map((a) => a.id),
        fechaEntregaEstimada: fechaEntrega,
      });
      setEditandoDesc(false);
    } finally {
      setGuardando(false);
    }
  };

  const guardarTipo = async (nuevoTipo: "CLIENTE" | "INDEPENDIENTE") => {
    if (nuevoTipo === tarea.tipo && (nuevoTipo === "INDEPENDIENTE" || proyectoId === tarea.proyectoId)) {
      return;
    }
    try {
      setGuardando(true);
      setTipo(nuevoTipo);
      await onGuardarEdicion(tarea.id, {
        titulo,
        descripcion,
        tipo: nuevoTipo,
        proyectoId: nuevoTipo === "CLIENTE" ? proyectoId : undefined,
        hitoId: tarea.hitoId,
        arquitectoIds: tarea.arquitectos.map((a) => a.id),
        fechaEntregaEstimada: fechaEntrega,
      });
    } catch (error) {
      console.error("Error guardando tipo:", error);
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarReprog = reprogramarForm.handleSubmit(async (values) => {
    await onConfirmarReprogramar(tarea.id, values);
    setMostrarReprogramar(false);
    reprogramarForm.reset();
  });

  const handleConfirmarRechazo = rechazoForm.handleSubmit(async (values) => {
    if (onConfirmarRechazo) {
      await onConfirmarRechazo(tarea.id, values);
    } else {
      await onRechazo(tarea);
    }
    setMostrarRechazo(false);
    rechazoForm.reset({ categoria: "BRIEF_POCO_CLARO", motivo: "" });
  });

  const handleCambiarArquitectos = async (ids: number[]) => {
    setArquitectosSeleccionados(ids);
    setGuardandoArquitectos(true);
    try {
      await onGuardarArquitectos(tarea!.id, ids);
    } finally {
      setGuardandoArquitectos(false);
    }
  };

  const enviarComentario = async () => {
    const texto = nuevoComentario.trim();
    if (!texto) return;
    try {
      await agregarComentario(tarea.id, texto);
      setNuevoComentario("");
      const fresh = await getComentarios(tarea.id);
      setComentarios(fresh);
    } catch (error) {
      console.error("Error enviando comentario:", error);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      title={null}
      destroyOnHidden={true}
      centered
      styles={{
        body: {
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "20px 24px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        },
        content: {
          maxHeight: "95vh",
        },
      }}
      wrapClassName="hide-scrollbar"
    >
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3">
          {/* ── HEADER ── */}
          <div className="border-b border-gray-200 pb-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${estadoColor.bg} ${estadoColor.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${estadoColor.dot}`} />
              {ESTADO_LABEL[tarea.estado]}
            </span>
            {tipo === "INDEPENDIENTE" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                <Wrench size={12} /> Independiente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                {tarea.clienteNombre}
              </span>
            )}
            {tarea.enRiesgo && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                <CalendarX size={12} /> En riesgo
              </span>
            )}
            </div>

            {/* Título editable inline */}
            {editandoTitulo ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onBlur={guardarTitulo}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") guardarTitulo();
                    if (e.key === "Escape") {
                      setTitulo(tarea.titulo);
                      setEditandoTitulo(false);
                    }
                  }}
                  className="flex-1 rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2 text-2xl font-bold text-gray-900 outline-none focus:border-amber-500"
                  disabled={guardando}
                />
              </div>
            ) : (
              <h1
                onClick={() => setEditandoTitulo(true)}
                className="cursor-text text-3xl font-bold text-gray-900 leading-tight hover:bg-gray-50 rounded px-1 py-1 transition-colors"
              >
                {titulo}
              </h1>
            )}

            {tipo === "CLIENTE" && (
              <p className="mt-1 text-sm text-gray-500">
                {tarea.proyectoNombre}
                {tarea.hitoNombre ? ` · ${tarea.hitoNombre}` : ""}
              </p>
            )}
          </div>

          {/* ── KPI ROW ── */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Estado", value: ESTADO_LABEL[tarea.estado], bg: "bg-blue-50" },
              {
                label: "Días en curso",
                value: tarea.tiempoTotalDias != null ? `${tarea.tiempoTotalDias}d` : "—",
                bg: "bg-amber-50",
              },
              { label: "Eficiencia", value: tarea.eficiencia ?? "—", bg: "bg-gray-50" },
              { label: "Rechazos", value: tarea.contadorRechazos ?? 0, bg: "bg-red-50" },
              {
                label: "Entrega",
                value: tarea.diasRestantes != null ? `${tarea.diasRestantes}d` : "—",
                bg: "bg-green-50",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className={`rounded-lg border border-gray-200 p-2 text-center ${kpi.bg}`}
              >
                <p className="mb-0.5 text-xs font-semibold text-gray-500">{kpi.label}</p>
                <p className="text-base font-bold text-gray-900">{String(kpi.value)}</p>
              </div>
            ))}
          </div>

          {/* ── CONTENT ── */}
          <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
            {/* Descripción editable inline */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Descripción
              </h3>
              {editandoDesc ? (
                <div className="flex gap-2">
                  <Input.TextArea
                    autoFocus
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    onBlur={guardarDescripcion}
                    rows={4}
                    placeholder="Detalle de lo que se debe producir…"
                    disabled={guardando}
                  />
                </div>
              ) : (
                <p
                  onClick={() => setEditandoDesc(true)}
                  className="cursor-text text-sm leading-relaxed text-gray-700 hover:bg-gray-50 rounded px-2 py-2 transition-colors"
                >
                  {descripcion || (
                    <span className="italic text-gray-400">Sin descripción (click para editar)</span>
                  )}
                </p>
              )}
            </div>

            {/* Biblioteca — Disponible para TODOS los tipos de tarea */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                    📚 {tarea.proyectoId ? "Biblioteca del Proyecto" : "Archivos"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(tarea.archivos?.length ?? 0)} archivo{(tarea.archivos?.length ?? 0) !== 1 ? "s" : ""} en la tarea
                  </p>
                </div>
                <button
                  onClick={() => setMostrarBibliotecaModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 text-xs font-semibold text-red-600 hover:from-red-100 hover:to-red-200 transition-all border border-red-200"
                >
                  <Upload size={14} /> Abrir Biblioteca
                </button>
              </div>

              {/* Archivos guardados en la tarea - arrastrables a hitos */}
              <ArchivosTareaCard
                tarea={tarea}
                draggedFile={draggedFile}
                onDragStart={(archivoIds) => {
                  setDraggedFile(archivoIds[0] || null);
                  setArchivosSeleccionados(new Set(archivoIds));
                }}
                onDragEnd={() => setDraggedFile(null)}
              />
            </div>

            {/* Modal de Biblioteca Archivos */}
            <BibliotecaArchivos
              visible={mostrarBibliotecaModal}
              onClose={() => setMostrarBibliotecaModal(false)}
              onSelect={async (files) => {
                const archivoIds = files.map((f) => f.id);

                try {
                  await api.put(`/tareas-diseno/${tarea.id}`, {
                    data: { archivos: archivoIds },
                  });
                  toast.success(`${files.length} archivo(s) agregado(s) a la tarea`);
                  // Refrescar la tarea para que aparezcan los archivos
                  if (tarea.proyectoId) {
                    const archivosActualizados = await getBibliotecaProyecto(tarea.proyectoId);
                    setArchivosProyecto(archivosActualizados);
                  }
                } catch (error) {
                  toast.error("Error al guardar los archivos");
                }

                setMostrarBibliotecaModal(false);
              }}
              maxSelection={50}
            />

            {/* Hitos del proyecto — Con Drop Zones para Drag-and-Drop */}
            {tarea.proyectoId && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                    🎯 Hitos del Proyecto
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Arrastra archivos aquí para publicar avances</p>
                </div>

                {cargandoHitos ? (
                  <div className="flex justify-center py-6"><Spin size="small" /></div>
                ) : hitosProyecto.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8 text-center">
                    <p className="text-sm font-medium text-gray-600 mb-1">Este proyecto no tiene hitos</p>
                    <p className="text-xs text-gray-400">Los hitos aparecerán aquí una vez creados en el proyecto</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {hitosProyecto.map((hito) => {
                      const totalArchivos =
                        (hito.contenido?.galeria_fotos?.length ?? 0) +
                        (hito.contenido?.documentacion?.length ?? 0);
                      const esActual = hito.id === tarea.hitoId;
                      const isDragOver = dragOverHito === hito.id && draggedFile !== null;

                      return (
                        <div
                          key={hito.id}
                          onDragOver={(e) => {
                            if (draggedFile) {
                              e.preventDefault();
                              setDragOverHito(hito.id);
                            }
                          }}
                          onDragLeave={() => setDragOverHito(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedFile) {
                              setHitoPublicarId(hito.id);
                              setHitoExpandido(hito.id);
                              const next = new Set(archivosSeleccionados);
                              next.add(draggedFile);
                              setArchivosSeleccionados(next);
                              setDragOverHito(null);
                              setDraggedFile(null);
                            }
                          }}
                          className={`rounded-lg border-2 p-3.5 transition-all cursor-default group ${
                            isDragOver
                              ? 'border-emerald-400 bg-emerald-50/60 shadow-md scale-[1.01] ring-2 ring-emerald-200'
                              : esActual
                                ? 'border-amber-200 bg-amber-50/50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:bg-gray-50/20'
                          }`}
                        >
                          {/* Header del hito */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                className={`h-3 w-3 rounded-full shrink-0 ${
                                  hito.estado_completado ? 'bg-emerald-500' : 'bg-amber-400'
                                }`}
                              />
                              <p className="text-sm font-semibold text-gray-800 truncate">{hito.nombre}</p>
                              {esActual && (
                                <span className="inline-block text-[10px] font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5 shrink-0">
                                  asignado
                                </span>
                              )}
                              {hito.estado_completado && (
                                <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                                  completado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-medium text-gray-500">
                                {totalArchivos} {totalArchivos === 1 ? 'archivo' : 'archivos'}
                              </span>
                              <button
                                onClick={() => setHitoExpandido(hitoExpandido === hito.id ? null : hito.id)}
                                className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {hitoExpandido === hito.id ? '▼' : '▶'}
                              </button>
                            </div>
                          </div>

                          {/* Contenido expandido */}
                          {hitoExpandido === hito.id && (
                            <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
                              {hito.contenido?.descripcion_avance && (
                                <p className="text-xs text-gray-600 italic bg-blue-50 rounded p-2 border-l-2 border-blue-300">
                                  "{hito.contenido.descripcion_avance}"
                                </p>
                              )}
                              {totalArchivos === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">
                                  Arrastra un archivo aquí para agregarlo a este hito
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    {totalArchivos} archivo{totalArchivos !== 1 ? 's' : ''} publicado{totalArchivos !== 1 ? 's' : ''}:
                                  </p>
                                  {[
                                    ...(hito.contenido?.galeria_fotos || []),
                                    ...(hito.contenido?.documentacion || []),
                                  ].map((f) => {
                                    const esImagen = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.nombre || '');
                                    return (
                                      <div key={f.id} className="flex items-center gap-2 text-xs bg-white border border-gray-200 rounded-lg p-2 hover:border-gray-300 transition-colors">
                                        {/* Miniatura o ícono */}
                                        {esImagen && f.url ? (
                                          <img
                                            src={f.url}
                                            alt={f.nombre}
                                            className="w-8 h-8 rounded object-cover flex-shrink-0 border border-gray-200"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-gray-400 text-base">📄</span>
                                          </div>
                                        )}
                                        <span className="text-gray-700 truncate flex-1 font-medium">{f.nombre}</span>
                                        {f.url && (
                                          <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-blue-600 hover:text-blue-700 shrink-0 font-semibold hover:underline"
                                          >
                                            Ver
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Indicador de drop zone activo */}
                          {isDragOver && (
                            <div className="absolute inset-0 rounded-lg bg-emerald-400/10 border-emerald-400 flex items-center justify-center pointer-events-none">
                              <span className="text-xs font-bold text-emerald-600">Suelta aquí</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Panel de confirmación — visible cuando selecciona archivos */}
                {archivosSeleccionados.size > 0 && hitoPublicarId && (
                  <div className="rounded-lg border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-3.5 space-y-2.5 sticky bottom-0 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-xs font-semibold text-emerald-900">
                        Publicar {archivosSeleccionados.size} archivo{archivosSeleccionados.size !== 1 ? 's' : ''} en
                      </p>
                      <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded text-xs font-semibold truncate">
                        {hitosProyecto.find((h) => h.id === hitoPublicarId)?.nombre || 'hito'}
                      </span>
                    </div>
                    <Input.TextArea
                      rows={2}
                      placeholder="Descripción del avance (visible al cliente)..."
                      value={descripcionAvance}
                      onChange={(e) => setDescripcionAvance(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        loading={publicando}
                        disabled={!onPublicarAvance}
                        onClick={async () => {
                          if (!hitoPublicarId || !onPublicarAvance) return;
                          setPublicando(true);
                          try {
                            await onPublicarAvance(hitoPublicarId, [...archivosSeleccionados], descripcionAvance);

                            // Refrescar los hitos para mostrar los archivos publicados
                            if (tarea.proyectoId) {
                              console.log("🔄 Recargando hitos después de publicar...");
                              const hitosActualizados = await getHitosConContenido(tarea.proyectoId);
                              setHitosProyecto(hitosActualizados);
                            }

                            setArchivosSeleccionados(new Set());
                            setDescripcionAvance("");
                            setHitoPublicarId(undefined);
                          } finally {
                            setPublicando(false);
                          }
                        }}
                        style={{ background: '#10b981', borderColor: '#10b981' }}
                        className="flex-1 text-xs font-semibold"
                      >
                        ✨ Publicar Avance
                      </Button>
                      <button
                        onClick={() => {
                          setArchivosSeleccionados(new Set());
                          setDescripcionAvance("");
                          setHitoPublicarId(undefined);
                        }}
                        className="text-xs text-emerald-600 px-3 font-semibold hover:text-emerald-700 hover:bg-emerald-100/50 rounded transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comentarios */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Comentarios / Actividad
              </h3>
              <div className="flex max-h-52 flex-col gap-2.5 overflow-y-auto pr-1">
                {cargandoComentarios ? (
                  <div className="flex justify-center py-4">
                    <Spin size="small" />
                  </div>
                ) : comentarios.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4">Sin comentarios aún</p>
                ) : (
                  comentarios.map((c) => (
                    <div key={c.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">{c.autor?.name || "Anónimo"}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                          {c.autor?.id === user?.id && (
                            <button
                              onClick={async () => {
                                await eliminarComentario(c.id);
                                setComentarios((prev) => prev.filter((x) => x.id !== c.id));
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{c.contenido}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") enviarComentario();
                  }}
                  placeholder="Agregar comentario..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none"
                />
                <button
                  onClick={enviarComentario}
                  className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-4 border-l border-gray-200 pl-6 sticky top-0 h-fit">
          {/* Cambiar estado */}
          <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Estado
              </h3>
              <Select
                value={tarea.estado}
                onChange={(valor) => onCambiarEstado(tarea.id, valor as EstadoTarea)}
                className="w-full"
                options={[
                  { value: "PENDIENTE", label: "Pendiente" },
                  { value: "EN_PROCESO", label: "En proceso" },
                  { value: "COMPLETADA", label: "Completada" },
                ]}
              />
          </div>

          {/* Tipo y Proyecto (Solo Admin) */}
          {isAdmin && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Tipo y Proyecto
              </h3>
              <div className="flex flex-col gap-3">
                {/* Tipo */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Tipo</label>
                  <Select
                    value={tipo}
                    onChange={(value) => guardarTipo(value as "CLIENTE" | "INDEPENDIENTE")}
                    options={[
                      { value: "CLIENTE", label: "Cliente" },
                      { value: "INDEPENDIENTE", label: "Independiente" },
                    ]}
                    className="w-full"
                    disabled={guardando}
                  />
                </div>

                {/* Proyecto (solo si es CLIENTE) */}
                {tipo === "CLIENTE" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">Proyecto</label>
                    <Select
                      value={proyectoId}
                      onChange={async (value) => {
                        setProyectoId(value);
                        try {
                          setGuardando(true);
                          await onGuardarEdicion(tarea.id, {
                            titulo,
                            descripcion,
                            tipo,
                            proyectoId: value,
                            hitoId: tarea.hitoId,
                            arquitectoIds: tarea.arquitectos.map((a) => a.id),
                            fechaEntregaEstimada: fechaEntrega,
                          });
                        } catch (error) {
                          console.error("Error guardando proyecto:", error);
                        } finally {
                          setGuardando(false);
                        }
                      }}
                      placeholder="Selecciona proyecto"
                      options={proyectos.map((p) => ({
                        value: p.id,
                        label: `${p.nombre} · ${p.clienteNombre}`,
                      }))}
                      className="w-full"
                      disabled={guardando}
                    />
                  </div>
                )}

                {/* Fecha de entrega */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">Fecha de entrega</label>
                  <Tooltip
                    title={tarea.fechaEntregaEstimada ? "Fecha bloqueada. Usa Reprogramar para cambiarla." : ""}
                    placement="bottom"
                  >
                    <DatePicker
                      value={fechaEntrega ? dayjs(fechaEntrega) : null}
                      onChange={async (date) => {
                        const nuevaFecha = date ? date.toISOString() : undefined;
                        setFechaEntrega(nuevaFecha);
                        try {
                          setGuardando(true);
                          await onGuardarEdicion(tarea.id, {
                            titulo,
                            descripcion,
                            tipo,
                            proyectoId: tipo === "CLIENTE" ? proyectoId : undefined,
                            hitoId: tarea.hitoId,
                            arquitectoIds: tarea.arquitectos.map((a) => a.id),
                            fechaEntregaEstimada: nuevaFecha,
                          });
                        } catch (error) {
                          console.error("Error guardando fecha:", error);
                        } finally {
                          setGuardando(false);
                        }
                      }}
                      className="w-full"
                      disabled={guardando || !!tarea.fechaEntregaEstimada}
                      placeholder="Selecciona fecha"
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Arquitectos */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              § Arquitectos ({arquitectosSeleccionados.length})
            </h3>
            <Select
              mode="multiple"
              placeholder="Asigna arquitectos"
              value={arquitectosSeleccionados}
              onChange={handleCambiarArquitectos}
              disabled={guardandoArquitectos}
              className="w-full"
              options={arquitectos.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
            />
          </div>

          {/* Historial de rechazos */}
          <div>
            <button
              onClick={() => setOpenRechazos(!openRechazos)}
              className="flex w-full items-center justify-between"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Rechazos ({tarea.contadorRechazos || 0})
              </h3>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${openRechazos ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openRechazos ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
            >
              {tarea.historialRechazos && tarea.historialRechazos.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {tarea.historialRechazos.map((rechazo, idx) => {
                      const colorMap: Record<string, { bg: string; border: string; dot: string; text: string }> = {
                        BRIEF_POCO_CLARO: {
                          bg: "bg-red-50",
                          border: "border-red-200",
                          dot: "bg-red-400",
                          text: "text-red-700",
                        },
                        NO_CUMPLE_EXPECTATIVAS: {
                          bg: "bg-orange-50",
                          border: "border-orange-200",
                          dot: "bg-orange-400",
                          text: "text-orange-700",
                        },
                        OTRO: {
                          bg: "bg-pink-50",
                          border: "border-pink-200",
                          dot: "bg-pink-400",
                          text: "text-pink-700",
                        },
                      };
                      const colors = colorMap[rechazo.categoria] || colorMap.OTRO;
                      const categoryLabel = {
                        BRIEF_POCO_CLARO: "Brief poco claro",
                        NO_CUMPLE_EXPECTATIVAS: "No cumple",
                        OTRO: "Otro",
                      }[rechazo.categoria];

                      return (
                        <div
                          key={idx}
                          className={`rounded-lg border ${colors.border} ${colors.bg} p-2.5 relative`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${colors.dot} mt-1 flex-shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${colors.text}`}>
                                {categoryLabel}
                              </p>
                              <p className={`text-xs ${colors.text} opacity-75 mt-0.5 line-clamp-2`}>
                                {rechazo.motivo}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(rechazo.registradoEn).toLocaleDateString("es", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin rechazos registrados</p>
                )}
            </div>
          </div>

          {/* Reprogramaciones */}
          <div>
            <button
              onClick={() => setOpenReprogramaciones(!openReprogramaciones)}
              className="flex w-full items-center justify-between"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Reprogramaciones ({tarea.historialEntregas?.length || 0})
              </h3>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${openReprogramaciones ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openReprogramaciones ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
            >
              {tarea.historialEntregas && tarea.historialEntregas.length > 0 ? (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-80 pr-1">
                  {tarea.historialEntregas.map((cambio, idx) => (
                    <div key={idx} className="rounded-lg border border-sky-200 bg-sky-50 p-2.5">
                      <div className="flex items-start gap-2">
                        <CalendarClock size={12} className="text-sky-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {cambio.fechaAnterior && (
                              <>
                                <span className="text-xs text-gray-400 line-through">
                                  {fmtFecha(cambio.fechaAnterior)}
                                </span>
                                <span className="text-[10px] text-gray-400">→</span>
                              </>
                            )}
                            <span className="text-xs font-semibold text-sky-700">
                              {fmtFecha(cambio.fechaNueva)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{cambio.motivo}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(cambio.registradoEn).toLocaleDateString("es", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Sin reprogramaciones registradas</p>
              )}
            </div>
          </div>

            {/* Fechas de entrega - solo si hay fecha */}
            {tieneFechaEntrega && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  § Fechas de entrega
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: "Original",
                      fecha: tarea.fechaEntregaOriginal,
                      highlight: false,
                    },
                    {
                      label: "Estimada",
                      fecha: tarea.fechaEntregaEstimada,
                      highlight: mostrarReprogramar,
                    },
                    {
                      label: "Entrega real",
                      fecha: tarea.fechaCompletacion,
                      highlight: tarea.estado === "COMPLETADA",
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className={`rounded-lg p-2.5 text-xs transition-colors duration-200 ${
                        f.highlight ? "border border-sky-200 bg-sky-50" : "bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-400">{f.label}</p>
                      <p className="mt-0.5 font-semibold text-gray-800">
                        {f.fecha ? fmtFecha(f.fecha) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* RESCHEDULE PANEL - solo si hay fecha */}
          {tieneFechaEntrega && (
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mostrarReprogramar ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50/40 p-4">
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Reprogramar deja un <strong>registro con motivo</strong> y afecta la eficiencia.
                </p>

                <Field
                  label="Nueva fecha de entrega"
                  error={reprogramarForm.formState.errors.fechaNueva?.message}
                >
                  <Controller
                    name="fechaNueva"
                    control={reprogramarForm.control}
                    rules={{ required: "Selecciona la nueva fecha" }}
                    render={({ field }) => (
                      <DatePicker
                        className="w-full"
                        format="DD/MM/YYYY"
                        placeholder="Selecciona fecha"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                      />
                    )}
                  />
                </Field>

                <Field
                  label="Motivo del cambio"
                  error={reprogramarForm.formState.errors.motivo?.message}
                >
                  <Controller
                    name="motivo"
                    control={reprogramarForm.control}
                    rules={{
                      required: "El motivo es obligatorio",
                      minLength: { value: 5, message: "Describe brevemente el motivo" },
                    }}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        rows={2}
                        placeholder="Ej: El cliente solicitó cambios que extienden el plazo…"
                      />
                    )}
                  />
                </Field>

                <Button
                  block
                  type="primary"
                  loading={reprogramarForm.formState.isSubmitting}
                  onClick={handleConfirmarReprog}
                  icon={<CalendarClock size={14} />}
                  style={{ background: "#ef4444", borderColor: "#ef4444" }}
                >
                  Confirmar reprogramar
                </Button>
              </div>
            </div>
          )}

          {/* RECHAZO PANEL - solo si hay fecha */}
          {tieneFechaEntrega && (
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mostrarRechazo ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/40 p-4">
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  Registrar rechazo vuelve la tarea a <strong>En proceso</strong> y afecta la eficiencia.
                </p>

                <Field
                  label="Detalle del rechazo"
                  error={rechazoForm.formState.errors.motivo?.message}
                >
                  <Controller
                    name="motivo"
                    control={rechazoForm.control}
                    rules={{
                      required: "Describe el rechazo",
                      minLength: {
                        value: 5,
                        message: "Describe brevemente el rechazo",
                      },
                    }}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        rows={2}
                        placeholder="Ej: Los colores no coinciden con la paleta del cliente…"
                      />
                    )}
                  />
                </Field>

                <Button
                  block
                  type="primary"
                  loading={rechazoForm.formState.isSubmitting}
                  onClick={handleConfirmarRechazo}
                  danger
                >
                  Confirmar rechazo
                </Button>
              </div>
            </div>
          )}

          {/* ACTION TOGGLE - Solo para admin y si hay fecha */}
          {isAdmin && tieneFechaEntrega && (
            <div className="pt-4">
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-gray-100 p-1 w-full">
                <button
                  onClick={() => {
                    setMostrarReprogramar(!mostrarReprogramar);
                    setMostrarRechazo(false);
                  }}
                  className={`
                    px-4 py-2.5 rounded-md font-semibold text-xs transition-all duration-200 ease-out
                    ${mostrarReprogramar
                      ? "bg-red-500 text-white shadow-md scale-100"
                      : "bg-transparent text-gray-600 hover:text-gray-900 scale-95"
                    }
                  `}
                >
                  <CalendarClock size={14} className="inline mr-1.5 -mt-0.5" />
                  Reprogramar
                </button>
                <button
                  onClick={() => {
                    setMostrarRechazo(!mostrarRechazo);
                    setMostrarReprogramar(false);
                  }}
                  className={`
                    px-4 py-2.5 rounded-md font-semibold text-xs transition-all duration-200 ease-out
                    ${mostrarRechazo
                      ? "bg-red-500 text-white shadow-md scale-100"
                      : "bg-transparent text-gray-600 hover:text-gray-900 scale-95"
                    }
                  `}
                >
                  <AlertCircle size={14} className="inline mr-1.5 -mt-0.5" />
                  Rechazo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
