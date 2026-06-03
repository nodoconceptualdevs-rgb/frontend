"use client";

import React, { useMemo, useState } from "react";
import {
  Timer,
  RotateCcw,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  History,
} from "lucide-react";
import type { TareaConKpi } from "@/types/kpi";
import { calcularKpiPorArquitecto, calcularResumen } from "@/lib/kpi";
import KpiStatCard from "./KpiStatCard";
import ArquitectoKpiTable from "./ArquitectoKpiTable";
import { Modal } from "antd";

interface KpiDashboardProps {
  tareas: TareaConKpi[];
  arquitectoIdFiltro?: number;
  arquitectos?: Array<{ id: number; name: string }>;
}

// Componente de tarjeta de tarea
function TareaCard({ tarea, onDetalle }: { tarea: TareaConKpi; onDetalle: (tarea: TareaConKpi) => void }) {
  const estadoConfig = {
    PENDIENTE: { bg: "bg-gray-50", border: "border-gray-200", icon: Clock, color: "text-gray-600", label: "Pendiente" },
    EN_PROCESO: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertCircle, color: "text-amber-600", label: "En proceso" },
    COMPLETADA: { bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, color: "text-emerald-600", label: "Completada" },
  };
  const config = estadoConfig[tarea.estado];
  const EstadoIcon = config.icon;

  // Calcular fecha de creación aproximada (restar días trabajados de la fecha original)
  const fechaCreacion = tarea.fechaEntregaOriginal && tarea.tiempoTotalDias
    ? new Date(new Date(tarea.fechaEntregaOriginal).getTime() - (tarea.tiempoTotalDias * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div
      onClick={() => onDetalle(tarea)}
      className={`rounded-lg border ${config.border} ${config.bg} transition-all cursor-pointer hover:shadow-lg hover:scale-105`}
    >
      {/* Card Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <EstadoIcon size={20} className={`mt-0.5 flex-shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-base">{tarea.titulo}</h4>
                <p className={`text-xs font-semibold mt-1 ${config.color}`}>{config.label}</p>
              </div>
            </div>
          </div>
          {tarea.enRiesgo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 flex-shrink-0">
              ⚠️ En riesgo
            </span>
          )}
        </div>

        {/* Info principal 3x2 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Cliente</p>
            <p className="text-sm font-bold text-gray-900 truncate">{tarea.clienteNombre || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Proyecto</p>
            <p className="text-sm font-bold text-gray-900 truncate">{tarea.proyectoNombre || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Hito</p>
            <p className="text-sm font-bold text-gray-900 truncate">{tarea.hitoNombre || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Eficiencia</p>
            <p className={`text-sm font-bold ${tarea.eficiencia === "Alta" ? "text-emerald-600" : tarea.eficiencia === "Media" ? "text-amber-600" : tarea.eficiencia === "Baja" ? "text-red-600" : "text-gray-400"}`}>
              {tarea.eficiencia || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Días Trabajados</p>
            <p className="text-sm font-bold text-gray-900">{tarea.tiempoTotalDias ?? "—"}d</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase">Días Restantes</p>
            <p className={`text-sm font-bold ${tarea.diasRestantes === null ? "text-gray-400" : tarea.diasRestantes < 0 ? "text-red-600" : tarea.diasRestantes < 3 ? "text-amber-600" : "text-gray-600"}`}>
              {tarea.diasRestantes ?? "—"}d
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200 text-xs">
          <div>
            <p className="font-semibold text-gray-600">Original</p>
            <p className="text-gray-700">
              {tarea.fechaEntregaOriginal
                ? new Date(tarea.fechaEntregaOriginal).toLocaleDateString("es-MX")
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Estimada</p>
            <p className="text-gray-700">
              {tarea.fechaEntregaEstimada
                ? new Date(tarea.fechaEntregaEstimada).toLocaleDateString("es-MX")
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Completada</p>
            <p className={tarea.fechaCompletacion ? "text-emerald-600 font-bold" : "text-gray-500"}>
              {tarea.fechaCompletacion
                ? new Date(tarea.fechaCompletacion).toLocaleDateString("es-MX")
                : "—"}
            </p>
          </div>
        </div>

        {/* Metadata: Created, Rechazos, Reprogramaciones */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2 rounded bg-gray-100">
            <Clock size={14} className="text-gray-600" />
            <div>
              <p className="font-semibold text-gray-700">Creada</p>
              <p className="text-gray-600 text-xs">
                {fechaCreacion
                  ? fechaCreacion.toLocaleDateString("es-MX")
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-red-50">
            <MessageSquare size={14} className="text-red-600" />
            <div>
              <p className="font-semibold text-red-700">Rechazos</p>
              <p className="text-red-600 font-bold text-sm">{tarea.contadorRechazos || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-blue-50">
            <RotateCcw size={14} className="text-blue-600" />
            <div>
              <p className="font-semibold text-blue-700">Reprogramas</p>
              <p className="text-blue-600 font-bold text-sm">{(tarea as any).contadorReprogramaciones || 0}</p>
            </div>
          </div>
        </div>

        {/* Click hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-blue-600 font-semibold">Click para ver detalles completos →</p>
        </div>
      </div>
    </div>
  );
}

export default function KpiDashboard({
  tareas,
  arquitectoIdFiltro,
  arquitectos = [],
}: KpiDashboardProps) {
  // Estado para filtro de tareas por estado
  const [estadoFiltro, setEstadoFiltro] = useState<"COMPLETADA" | "EN_PROCESO" | "PENDIENTE" | "TODAS">("COMPLETADA");

  const resumen = useMemo(() => calcularResumen(tareas), [tareas]);
  const porArquitecto = useMemo(
    () => calcularKpiPorArquitecto(tareas),
    [tareas],
  );

  // Obtener datos del arquitecto seleccionado
  const arquitectoSeleccionado = useMemo(() => {
    if (!arquitectoIdFiltro) return null;
    return arquitectos.find((a) => a.id === arquitectoIdFiltro);
  }, [arquitectoIdFiltro, arquitectos]);

  const datosArquitectoSeleccionado = useMemo(() => {
    if (!arquitectoIdFiltro) return null;
    return porArquitecto.find((a) => a.arquitectoId === arquitectoIdFiltro);
  }, [arquitectoIdFiltro, porArquitecto]);

  // Tareas del arquitecto seleccionado
  const tareasArquitecto = useMemo(() => {
    if (!arquitectoIdFiltro) return [];
    let filtered = tareas.filter((t) =>
      t.arquitectos.some((a) => a.id === arquitectoIdFiltro),
    );
    // Filtrar por estado
    if (estadoFiltro !== "TODAS") {
      filtered = filtered.filter((t) => t.estado === estadoFiltro);
    }
    return filtered;
  }, [arquitectoIdFiltro, tareas, estadoFiltro]);

  const total = resumen.totalTareas || 1;
  const distribucion = [
    { label: "Pendientes", valor: resumen.pendientes, color: "bg-gray-400" },
    { label: "En proceso", valor: resumen.enProceso, color: "bg-amber-500" },
    { label: "Completadas", valor: resumen.completadas, color: "bg-emerald-500" },
  ];

  // Estado para modal de detalles de tarea
  const [tareaDetalleModal, setTareaDetalleModal] = useState<TareaConKpi | null>(null);

  // Vista cuando hay arquitecto seleccionado
  if (arquitectoSeleccionado && datosArquitectoSeleccionado) {
    return (
      <>
        <div className="flex flex-col gap-5">
          {/* Título personalizado */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 font-semibold text-amber-700">
                {arquitectoSeleccionado.name.charAt(0)}
              </span>
              Reporte Detallado: {arquitectoSeleccionado.name}
            </h2>
          </div>

        {/* Tarjetas de stats personalizadas */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiStatCard
            label="Tareas asignadas"
            value={datosArquitectoSeleccionado.tareas}
            icon={Timer}
            tono="ambar"
            hint={`${datosArquitectoSeleccionado.completadas} completadas`}
          />
          <KpiStatCard
            label="Tiempo promedio"
            value={datosArquitectoSeleccionado.loadTimePromedioDias}
            sufijo="días"
            icon={Timer}
            tono="ambar"
            hint="Load time promedio"
          />
          <KpiStatCard
            label="Entregas a tiempo"
            value={datosArquitectoSeleccionado.tasaEntregaATiempo}
            sufijo="%"
            icon={CalendarCheck}
            tono="esmeralda"
            hint="Puntualidad"
          />
          <KpiStatCard
            label="Tasa de retrabajo"
            value={datosArquitectoSeleccionado.tasaRetrabajo}
            sufijo="%"
            icon={RotateCcw}
            tono="rojo"
            hint={`${datosArquitectoSeleccionado.rechazos} rechazos`}
          />
        </div>

        {/* Distribución personal */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
            Estado de sus tareas
          </h3>

          <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-gray-400 h-full transition-all"
              style={{
                width: `${((datosArquitectoSeleccionado.tareas - datosArquitectoSeleccionado.enProceso - datosArquitectoSeleccionado.completadas) / datosArquitectoSeleccionado.tareas) * 100}%`,
              }}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{
                width: `${(datosArquitectoSeleccionado.enProceso / datosArquitectoSeleccionado.tareas) * 100}%`,
              }}
            />
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{
                width: `${(datosArquitectoSeleccionado.completadas / datosArquitectoSeleccionado.tareas) * 100}%`,
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-600">Pendientes</span>
              <span className="text-sm font-bold text-gray-900">
                {datosArquitectoSeleccionado.tareas -
                  datosArquitectoSeleccionado.enProceso -
                  datosArquitectoSeleccionado.completadas}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600">En proceso</span>
              <span className="text-sm font-bold text-gray-900">
                {datosArquitectoSeleccionado.enProceso}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Completadas</span>
              <span className="text-sm font-bold text-gray-900">
                {datosArquitectoSeleccionado.completadas}
              </span>
            </div>
          </div>
        </div>

          {/* Listado de tareas del arquitecto */}
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-900">
                Tareas de {arquitectoSeleccionado.name}
              </h3>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as any)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none mr-4"
              >
                <option value="COMPLETADA">Completadas</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="TODAS">Todas</option>
              </select>
            </div>

            {tareasArquitecto.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">No hay tareas asignadas a este arquitecto en este periodo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tareasArquitecto.map((tarea) => (
                  <TareaCard
                    key={tarea.id}
                    tarea={tarea}
                    onDetalle={setTareaDetalleModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de detalles */}
        {tareaDetalleModal && (
          <Modal
            title={null}
            open={!!tareaDetalleModal}
            onCancel={() => setTareaDetalleModal(null)}
            footer={null}
            width="90vw"
            style={{ maxWidth: "1000px" }}
            destroyOnHidden
            centered
          >
            <div className="space-y-6 pt-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{tareaDetalleModal.titulo}</h2>
                <p className="text-gray-600 mt-2">{tareaDetalleModal.descripcion}</p>
              </div>

              {/* Detalles principales */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Cliente</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{tareaDetalleModal.clienteNombre || "—"}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Proyecto</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{tareaDetalleModal.proyectoNombre || "—"}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Estado</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{tareaDetalleModal.estado}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Eficiencia</p>
                  <p className={`text-lg font-bold mt-1 ${tareaDetalleModal.eficiencia === "Alta" ? "text-emerald-600" : tareaDetalleModal.eficiencia === "Media" ? "text-amber-600" : "text-red-600"}`}>
                    {tareaDetalleModal.eficiencia || "—"}
                  </p>
                </div>
              </div>

              {/* Rechazos */}
              {tareaDetalleModal.historialRechazos && tareaDetalleModal.historialRechazos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Rechazos ({tareaDetalleModal.contadorRechazos})</h3>
                  <div className="space-y-3">
                    {tareaDetalleModal.historialRechazos.map((rechazo, idx) => (
                      <div key={idx} className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-bold text-red-700">
                            {rechazo.categoria === "BRIEF_POCO_CLARO"
                              ? "Brief poco claro"
                              : rechazo.categoria === "NO_CUMPLE_EXPECTATIVAS"
                                ? "No cumple expectativas"
                                : "Otro"}
                          </p>
                          <p className="text-sm font-semibold text-red-600">
                            {new Date(rechazo.registradoEn).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <p className="text-gray-700">{rechazo.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reprogramaciones */}
              {(tareaDetalleModal as any).historialReprogramaciones && (tareaDetalleModal as any).historialReprogramaciones.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Reprogramaciones ({(tareaDetalleModal as any).contadorReprogramaciones})</h3>
                  <div className="space-y-3">
                    {(tareaDetalleModal as any).historialReprogramaciones.map((reprog: any, idx: number) => (
                      <div key={idx} className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-bold text-blue-700">Reprogramación #{idx + 1}</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {new Date(reprog.registradoEn).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-blue-600 font-semibold">Fecha anterior</p>
                            <p className="text-sm text-gray-700">{new Date(reprog.fechaAnterior).toLocaleDateString("es-MX")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold">Nueva fecha</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(reprog.fechaNueva).toLocaleDateString("es-MX")}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mt-2">{reprog.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </>
    );
  }

  // Vista general (sin arquitecto seleccionado)
  return (
    <div className="flex flex-col gap-5">
      {/* Tarjetas de stats — las dos dimensiones que pide el cliente */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiStatCard
          label="Tiempo de entrega"
          value={resumen.loadTimePromedioDias}
          sufijo="días"
          icon={Timer}
          tono="ambar"
          hint="Load time: requerimiento → entrega"
        />
        <KpiStatCard
          label="Entregas a tiempo"
          value={resumen.tasaEntregaATiempo}
          sufijo="%"
          icon={CalendarCheck}
          tono="esmeralda"
          hint="Sobre tareas completadas"
        />
        <KpiStatCard
          label="Tasa de retrabajo"
          value={resumen.tasaRetrabajo}
          sufijo="%"
          icon={RotateCcw}
          tono="rojo"
          hint={`${resumen.totalRechazos} rechazos en total`}
        />
        <KpiStatCard
          label="En riesgo"
          value={resumen.tareasEnRiesgo}
          icon={CalendarX}
          tono="rojo"
          hint="En proceso y vencidas"
        />
      </div>

      {/* Distribución + reprogramaciones */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
            Distribución del trabajo
          </h3>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            {distribucion.map((d) => (
              <div
                key={d.label}
                className={`${d.color} h-full transition-all`}
                style={{ width: `${(d.valor / total) * 100}%` }}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {distribucion.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${d.color}`} />
                <span className="text-sm text-gray-600">{d.label}</span>
                <span className="text-sm font-bold text-gray-900">{d.valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">
            Señales de eficiencia
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <RotateCcw size={18} />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none text-gray-900">
                  {resumen.totalRechazos}
                </p>
                <p className="text-xs text-gray-400">rechazos / retrabajo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CalendarX size={18} />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none text-gray-900">
                  {resumen.totalReprogramaciones}
                </p>
                <p className="text-xs text-gray-400">reprogramaciones de fecha</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla por arquitecto - solo si no hay selección */}
      <ArquitectoKpiTable filas={porArquitecto} />
    </div>
  );
}
