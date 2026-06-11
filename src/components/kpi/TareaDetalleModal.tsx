"use client";

import React, { useEffect, useState } from "react";
import { Modal, Avatar, Select, Button, Input, DatePicker } from "antd";
import dayjs from "dayjs";
import { useForm, Controller } from "react-hook-form";
import {
  Wrench,
  CalendarX,
  Send,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  X,
  ChevronDown,
} from "lucide-react";
import type {
  Archivo,
  ArchivoProyecto,
  Arquitecto,
  EstadoTarea,
  HitoOpcion,
  RechazoValues,
  ReprogramarValues,
  TareaConKpi,
  TareaFormValues,
} from "@/types/kpi";
import { ESTADO_LABEL } from "@/types/kpi";
import { fmtFecha } from "@/lib/kpi";
import { getBibliotecaProyecto } from "@/services/kpi";
import ArchivoUploader from "./ArchivoUploader";
import BibliotecaSelector from "./BibliotecaSelector";

interface TareaDetalleModalProps {
  open: boolean;
  onClose: () => void;
  tarea: TareaConKpi | null;
  hitos: HitoOpcion[];
  arquitectos: Arquitecto[];
  onGuardarEdicion: (id: number, values: TareaFormValues) => Promise<void>;
  onConfirmarReprogramar: (id: number, values: ReprogramarValues) => Promise<void>;
  onCambiarEstado: (id: number, nuevoEstado: EstadoTarea) => Promise<void>;
  onGuardarArquitectos: (id: number, arquitectoIds: number[]) => Promise<void>;
  onReprogramar: (t: TareaConKpi) => void;
  onPublicar: (t: TareaConKpi) => void;
  onRechazo: (t: TareaConKpi) => void;
  onAgregarArchivos?: (archivos: Archivo[]) => Promise<void> | void;
  onEliminarArchivo?: (archivoId: string) => Promise<void> | void;
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
  onGuardarEdicion,
  onConfirmarReprogramar,
  onCambiarEstado,
  onGuardarArquitectos,
  onReprogramar,
  onPublicar,
  onRechazo,
  onAgregarArchivos,
  onEliminarArchivo,
}: TareaDetalleModalProps) {
  const [archivosProyecto, setArchivosProyecto] = useState<ArchivoProyecto[]>([]);
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [mostrarReprogramar, setMostrarReprogramar] = useState(true);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [openRechazos, setOpenRechazos] = useState(false);
  const [openReprogramaciones, setOpenReprogramaciones] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Set<string>>(new Set());
  const [arquitectosSeleccionados, setArquitectosSeleccionados] = useState<number[]>([]);
  const [guardandoArquitectos, setGuardandoArquitectos] = useState(false);
  const [comentarios, setComentarios] = useState<
    Array<{ id: string; autor: string; texto: string; fecha: string }>
  >([
    {
      id: "c1",
      autor: "Juan Pérez",
      texto: "Iniciada la tarea. Se está trabajando en los materiales.",
      fecha: "2 jun 2026, 10:30",
    },
    {
      id: "c2",
      autor: "María González",
      texto: "Revisadas las texturas. Se requieren ajustes en la paleta de colores.",
      fecha: "2 jun 2026, 14:15",
    },
  ]);

  // Inline edit state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [editandoDesc, setEditandoDesc] = useState(false);
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
    setEditandoTitulo(false);
    setEditandoDesc(false);
    setMostrarReprogramar(true);
    setMostrarRechazo(false);
    setArchivosSeleccionados(new Set());
    setArquitectosSeleccionados(tarea.arquitectos.map((a) => a.id));
    reprogramarForm.reset({ fechaNueva: "", motivo: "" });
    rechazoForm.reset({ categoria: "BRIEF_POCO_CLARO", motivo: "" });

    if (tarea.proyectoId) {
      setCargandoBiblioteca(true);
      getBibliotecaProyecto(tarea.proyectoId)
        .then(setArchivosProyecto)
        .catch(() => setArchivosProyecto([]))
        .finally(() => setCargandoBiblioteca(false));
    }
  }, [open, tarea]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tarea) return null;

  const esIndependiente = tarea.tipo === "INDEPENDIENTE";
  const estadoColor = ESTADO_COLOR[tarea.estado];

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
        tipo: tarea.tipo,
        proyectoId: tarea.proyectoId,
        hitoId: tarea.hitoId,
        arquitectoIds: tarea.arquitectos.map((a) => a.id),
        fechaEntregaEstimada: tarea.fechaEntregaEstimada,
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
        tipo: tarea.tipo,
        proyectoId: tarea.proyectoId,
        hitoId: tarea.hitoId,
        arquitectoIds: tarea.arquitectos.map((a) => a.id),
        fechaEntregaEstimada: tarea.fechaEntregaEstimada,
      });
      setEditandoDesc(false);
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
    await onRechazo(tarea);
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

  const enviarComentario = () => {
    const texto = nuevoComentario.trim();
    if (!texto) return;
    setComentarios((prev) => [
      ...prev,
      {
        id: `c${prev.length + 1}`,
        autor: "Tú",
        texto,
        fecha: new Date().toLocaleString("es"),
      },
    ]);
    setNuevoComentario("");
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
            {esIndependiente ? (
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

            {!esIndependiente && (
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

            {/* Archivos */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Archivos ({archivosSeleccionados.size} seleccionado{archivosSeleccionados.size !== 1 ? 's' : ''})
              </h3>
              <div className="flex flex-col gap-3">
                {/* Enviar archivos a hito — ARRIBA */}
                {archivosSeleccionados.size > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-amber-900">
                      Enviar {archivosSeleccionados.size} archivo{archivosSeleccionados.size !== 1 ? 's' : ''} a hito:
                    </p>
                    <div className="flex gap-2">
                      <Select
                        placeholder="Selecciona hito"
                        className="flex-1"
                        options={hitos
                          .filter((h) => h.proyectoId === tarea.proyectoId)
                          .map((h) => ({ value: h.id, label: h.nombre }))}
                      />
                      <Button
                        type="primary"
                        onClick={() => onPublicar(tarea)}
                        style={{ background: "#ef4444", borderColor: "#ef4444" }}
                      >
                        Enviar
                      </Button>
                    </div>
                    <button
                      onClick={() => setArchivosSeleccionados(new Set())}
                      className="mt-2 w-full text-xs text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      Limpiar selección
                    </button>
                  </div>
                )}

                {tarea.archivos.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {tarea.archivos.map((archivo) => (
                      <label
                        key={archivo.id}
                        className="flex cursor-pointer items-center gap-3 rounded py-2 px-2 hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={archivosSeleccionados.has(archivo.id)}
                          onChange={(e) => {
                            const nuevos = new Set(archivosSeleccionados);
                            if (e.target.checked) {
                              nuevos.add(archivo.id);
                            } else {
                              nuevos.delete(archivo.id);
                            }
                            setArchivosSeleccionados(nuevos);
                          }}
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">
                            {archivo.nombre}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(archivo.tamaño / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onEliminarArchivo?.(archivo.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Eliminar
                        </button>
                      </label>
                    ))}
                  </div>
                )}

                <ArchivoUploader
                  archivos={tarea.archivos}
                  onAgregar={onAgregarArchivos || (() => {})}
                  onEliminar={onEliminarArchivo || (() => {})}
                  compact
                />
                <BibliotecaSelector
                  archivosDisponibles={archivosProyecto}
                  archivosYaAdjuntos={tarea.archivos.map((a) => a.id)}
                  onAdjuntar={onAgregarArchivos || (() => {})}
                  isLoading={cargandoBiblioteca}
                />
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                § Comentarios / Actividad
              </h3>
              <div className="flex max-h-52 flex-col gap-2.5 overflow-y-auto pr-1">
                {comentarios.map((c) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700">{c.autor}</p>
                      <p className="text-xs text-gray-400">{c.fecha}</p>
                    </div>
                    <p className="text-xs text-gray-600">{c.texto}</p>
                  </div>
                ))}
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

            {/* Fechas de entrega */}
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

          {/* RESCHEDULE PANEL */}
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

          {/* RECHAZO PANEL */}
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

          {/* ACTION TOGGLE */}
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
        </div>
      </div>
    </Modal>
  );
}
