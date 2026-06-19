"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, Select, Segmented, App, Empty, Spin } from "antd";
import toast from "react-hot-toast";
import {
  Plus,
  LayoutGrid,
  BarChart3,
  Building2,
  Wrench,
  Users,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import KanbanBoard from "@/components/kpi/KanbanBoard";
import KpiDashboard from "@/components/kpi/KpiDashboard";
import PublicarHitoModal from "@/components/kpi/PublicarHitoModal";
import TareaDetalleModal from "@/components/kpi/TareaDetalleModal";
import RechazoModal from "@/components/kpi/RechazoModal";
import PeriodoSelector from "@/components/kpi/PeriodoSelector";
import {
  type Granularidad,
  rangoPeriodo,
  rangoPersonalizado,
  tareaEnRango,
} from "@/lib/periodo";
import type {
  Arquitecto,
  Cliente,
  EstadoTarea,
  FiltroTareas,
  HitoOpcion,
  ProyectoOpcion,
  PublicarHitoValues,
  RechazoValues,
  ReprogramarValues,
  TareaConKpi,
  TareaFormValues,
} from "@/types/kpi";
import {
  asignarArchivosAHito,
  createTarea,
  eliminarArchivoDeTarea,
  eliminarTarea,
  getArquitectos,
  getClientes,
  getHitos,
  getProyectos,
  getTareas,
  publicarEnHito,
  registrarRechazo,
  reprogramarEntrega,
  reordenarColumna,
  updateEstadoTarea,
  updateTarea,
  uploadABibliotecaProyecto,
} from "@/services/kpi";

export default function ProductividadPage() {
  const { modal } = App.useApp();
  const [tareas, setTareas] = useState<TareaConKpi[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoOpcion[]>([]);
  const [hitos, setHitos] = useState<HitoOpcion[]>([]);
  const [arquitectos, setArquitectos] = useState<Arquitecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtro, setFiltro] = useState<FiltroTareas>({ vista: "TODAS" });
  const [arquitectoIdFiltro, setArquitectoIdFiltro] = useState<number | undefined>();

  // Periodo para la vista de métricas (día / semana / mes + navegación).
  const [hoyIso] = useState(() => new Date().toISOString());
  const [granularidad, setGranularidad] = useState<Granularidad>("TODOS");
  const [anchorIso, setAnchorIso] = useState(() => new Date().toISOString());
  const [rangoInicioIso, setRangoInicioIso] = useState<string | null>(null);
  const [rangoFinIso, setRangoFinIso] = useState<string | null>(null);

  // Modales
  const [publicarOpen, setPublicarOpen] = useState(false);
  const [tareaPublicar, setTareaPublicar] = useState<TareaConKpi | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [tareaDetalle, setTareaDetalle] = useState<TareaConKpi | null>(null);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [tareaRechazo, setTareaRechazo] = useState<TareaConKpi | null>(null);
  const [bibliotecaVersion, setBibliotecaVersion] = useState(0);

  const refrescar = useCallback(async () => {
    const data = await getTareas();
    setTareas(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [t, p, h, a, c] = await Promise.all([
          getTareas(),
          getProyectos(),
          getHitos(),
          getArquitectos(),
          getClientes(),
        ]);

        // Asegurar que todas las tareas tengan historialEntregas
        const tareasConHistorial = t.map((tarea) => ({
          ...tarea,
          historialEntregas: (tarea as any).historialEntregas || [],
        }));

        // Combinar tareas reales con dummy
        const todasLasTareas = [...tareasConHistorial];

        setTareas(todasLasTareas);
        setProyectos(p);
        setHitos(h);
        setArquitectos(a);
        setClientes(c);
      } catch {
        toast.error("No se pudieron cargar las tareas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Filtrado ---
  const tareasFiltradas = useMemo(() => {
    let resultado = tareas;

    if (filtro.vista === "INDEPENDIENTE") {
      resultado = resultado.filter((t) => t.tipo === "INDEPENDIENTE");
    } else if (filtro.vista === "CLIENTE") {
      resultado = resultado.filter(
        (t) =>
          t.tipo === "CLIENTE" &&
          (!filtro.clienteId || t.clienteId === filtro.clienteId),
      );
    }

    if (arquitectoIdFiltro) {
      resultado = resultado.filter((t) =>
        t.arquitectos.some((a) => a.id === arquitectoIdFiltro),
      );
    }

    return resultado;
  }, [tareas, filtro, arquitectoIdFiltro]);

  // Tareas dentro del periodo seleccionado (para la vista de métricas).
  const tareasPeriodo = useMemo(() => {
    if (granularidad === "TODOS") return tareasFiltradas;
    if (granularidad === "RANGO") {
      if (!rangoInicioIso || !rangoFinIso) return tareasFiltradas;
      const rango = rangoPersonalizado(rangoInicioIso, rangoFinIso);
      return tareasFiltradas.filter((t) => tareaEnRango(t, rango));
    }
    const rango = rangoPeriodo(granularidad, anchorIso);
    return tareasFiltradas.filter((t) => tareaEnRango(t, rango));
  }, [tareasFiltradas, granularidad, anchorIso, rangoInicioIso, rangoFinIso]);

  // --- Handlers de tablero ---
  const handleMover = useCallback(
    async (id: number, estado: EstadoTarea, orden: number) => {
      await updateEstadoTarea(id, estado, orden);
      await refrescar();
    },
    [refrescar],
  );

  const handleReordenar = useCallback(
    async (estado: EstadoTarea, ids: number[]) => {
      await reordenarColumna(estado, ids);
    },
    [],
  );

  // --- Acciones de tarjeta ---
  const handleVerDetalle = (t: TareaConKpi) => {
    setTareaDetalle(t);
    setDetalleOpen(true);
  };

  const handleNueva = async () => {
    try {
      // Crear tarea con valores mínimos
      const nuevaTarea = await createTarea({
        titulo: "Nueva tarea",
        descripcion: "",
        tipo: "INDEPENDIENTE",
        proyectoId: undefined,
        hitoId: undefined,
        arquitectoIds: [],
        fechaEntregaEstimada: undefined,
        notasInternas: "",
      });

      // Abrir modal de edición con la tarea recién creada
      setTareaDetalle(nuevaTarea);
      setDetalleOpen(true);

      // Refrescar lista de tareas
      await refrescar();
    } catch (error) {
      toast.error("Error al crear la tarea");
    }
  };

  const handleEditar = (t: TareaConKpi) => {
    setTareaDetalle(t);
    setDetalleOpen(true);
  };

  const handleGuardarEdicion = async (tareaId: number, values: TareaFormValues) => {
    await updateTarea(tareaId, values);
    toast.success("Tarea actualizada");
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === tareaId) ?? null);
  };

  const handleReprogramar = (t: TareaConKpi) => {
    setTareaDetalle(t);
    setDetalleOpen(true);
  };

  const handleConfirmarReprogramarDetalle = async (tareaId: number, values: ReprogramarValues) => {
    await reprogramarEntrega(tareaId, values);
    toast.success("Fecha de entrega reprogramada");
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === tareaId) ?? null);
  };

  const handleCambiarEstado = async (tareaId: number, nuevoEstado: EstadoTarea) => {
    await updateEstadoTarea(tareaId, nuevoEstado, 0);
    toast.success("Estado actualizado");
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === tareaId) ?? null);
  };

  const handleGuardarArquitectos = async (tareaId: number, arquitectoIds: number[]) => {
    await updateTarea(tareaId, {
      titulo: tareaDetalle?.titulo || "",
      descripcion: tareaDetalle?.descripcion,
      tipo: tareaDetalle?.tipo || "CLIENTE",
      proyectoId: tareaDetalle?.proyectoId,
      hitoId: tareaDetalle?.hitoId,
      arquitectoIds,
      fechaEntregaEstimada: tareaDetalle?.fechaEntregaEstimada,
    });
    toast.success("Arquitectos actualizado");
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === tareaId) ?? null);
  };

  const handleRechazo = (t: TareaConKpi) => {
    setTareaRechazo(t);
    setRechazoOpen(true);
  };

  const handleConfirmRechazo = async (values: RechazoValues) => {
    if (!tareaRechazo) return;
    await registrarRechazo(tareaRechazo.id, values);
    await refrescar();
    toast("Rechazo registrado — vuelve a En proceso", { icon: "↩️" });
  };

  const handleConfirmarRechazoDetalle = async (tareaId: number, values: RechazoValues) => {
    await registrarRechazo(tareaId, values);
    toast("Rechazo registrado — vuelve a En proceso", { icon: "↩️" });
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === tareaId) ?? null);
  };

  const handlePublicar = (t: TareaConKpi) => {
    setTareaPublicar(t);
    setPublicarOpen(true);
  };

  const handleConfirmPublicar = async (values: PublicarHitoValues) => {
    if (!tareaPublicar) return;
    await publicarEnHito(tareaPublicar.id, values);
    await refrescar();
    toast.success("Tarea publicada en el hito (visible al cliente)");
  };

  const handleEliminar = (t: TareaConKpi) => {
    modal.confirm({
      title: "Eliminar tarea",
      content: `¿Seguro que deseas eliminar "${t.titulo}"?`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        await eliminarTarea(t.id);
        await refrescar();
        toast.success("Tarea eliminada");
      },
    });
  };

  const handleSubirABiblioteca = async (files: File[]) => {
    if (!tareaDetalle?.proyectoId) return;
    await uploadABibliotecaProyecto(tareaDetalle.proyectoId, files);
    toast.success(`${files.length} archivo(s) subido(s) a la biblioteca`);
    setBibliotecaVersion((v) => v + 1);
  };

  const handlePublicarAvance = async (
    hitoId: number,
    archivoIds: string[],
    descripcion: string,
  ) => {
    if (!tareaDetalle) return;
    const idsNum = archivoIds.map(Number).filter(Boolean);
    await asignarArchivosAHito(hitoId, idsNum, descripcion);
    await publicarEnHito(tareaDetalle.id, {
      hitoId,
      descripcionAvance: descripcion,
      archivoIds,
    });
    toast.success("Avance publicado en el hito");
  };

  const handleEliminarArchivo = async (archivoId: string) => {
    if (!tareaDetalle) return;
    const id = tareaDetalle.id;
    await eliminarArchivoDeTarea(id, parseInt(archivoId, 10));
    toast.success("Archivo eliminado");
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === id) ?? null);
  };

  // --- Barra de filtros ---
  const FiltroBar = (
    <div className="flex flex-col gap-4">
      {/* Selector principal de arquitecto */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">
          📊 Seleccionar Arquitecto
        </label>
        <Select
          allowClear
          placeholder="Elige un arquitecto para ver su reporte detallado"
          className="w-full"
          size="large"
          value={arquitectoIdFiltro}
          onChange={setArquitectoIdFiltro}
          options={arquitectos.map((a) => ({ value: a.id, label: a.name }))}
          style={{ minHeight: "40px" }}
        />
      </div>

      {/* Filtros adicionales */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={filtro.vista}
          onChange={(v) =>
            setFiltro({ vista: v as FiltroTareas["vista"], clienteId: undefined })
          }
          options={[
            {
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} /> Todas
                </span>
              ),
              value: "TODAS",
            },
            {
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} /> Por cliente
                </span>
              ),
              value: "CLIENTE",
            },
            {
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Wrench size={14} /> Independientes
                </span>
              ),
              value: "INDEPENDIENTE",
            },
          ]}
        />

        {filtro.vista === "CLIENTE" && (
          <Select
            allowClear
            placeholder="Todos los clientes"
            className="min-w-[220px]"
            value={filtro.clienteId}
            onChange={(clienteId) =>
              setFiltro((f) => ({ ...f, clienteId }))
            }
            options={clientes.map((c) => ({ value: c.id, label: c.name }))}
          />
        )}
      </div>
    </div>
  );

  const tabItems = [
    {
      key: "tablero",
      label: (
        <span className="inline-flex items-center gap-2">
          <LayoutGrid size={16} /> Tablero
        </span>
      ),
      children: (
        <div className="flex flex-col gap-5">
          {FiltroBar}
          {tareasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16">
              <Empty description="No hay tareas en esta vista" />
            </div>
          ) : (
            <KanbanBoard
              tareas={tareasFiltradas}
              onMover={handleMover}
              onReordenar={handleReordenar}
              onVerDetalle={handleVerDetalle}
              onEditar={handleEditar}
              onReprogramar={handleReprogramar}
              onRechazo={handleRechazo}
              onPublicar={handlePublicar}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      ),
    },
    {
      key: "metricas",
      label: (
        <span className="inline-flex items-center gap-2">
          <BarChart3 size={16} /> Métricas
        </span>
      ),
      children: (
        <div className="flex flex-col gap-5">
          {FiltroBar}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <PeriodoSelector
              granularidad={granularidad}
              anchorIso={anchorIso}
              rangoInicioIso={rangoInicioIso}
              rangoFinIso={rangoFinIso}
              onGranularidad={setGranularidad}
              onAnchor={setAnchorIso}
              onRango={(ini, fin) => {
                setRangoInicioIso(ini);
                setRangoFinIso(fin);
              }}
              hoyIso={hoyIso}
            />
            <p className="mt-2 text-xs text-gray-400">
              {granularidad === "TODOS"
                ? "Todos los reportes históricos"
                : granularidad === "RANGO" && (!rangoInicioIso || !rangoFinIso)
                  ? "Selecciona un rango de fechas (mostrando todo mientras tanto)"
                  : "Métricas de tareas con entrega (o vencimiento) en este periodo"}{" "}
              — {tareasPeriodo.length} tarea
              {tareasPeriodo.length !== 1 ? "s" : ""}.
            </p>
          </div>
          <KpiDashboard
            tareas={tareasPeriodo}
            arquitectoIdFiltro={arquitectoIdFiltro}
            arquitectos={arquitectos}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        titulo="Productividad"
        subtitulo={`${tareas.length} tareas · ${tareas.filter((t) => t.estado === "COMPLETADA").length} completadas`}
      />

      <main className="px-4 py-4 sm:px-6 md:px-8 md:py-8">
        {/* Acción principal */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="hidden text-sm text-gray-500 sm:block">
            Monitorea tareas, mide el cumplimiento de entregas de cada arquitecto
            y publica avances a los hitos del cliente.
          </p>
          <button
            type="button"
            onClick={handleNueva}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <Plus size={18} />
            Nueva tarea
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : (
          <Tabs items={tabItems} defaultActiveKey="tablero" />
        )}
      </main>

      {/* Modales */}
      <PublicarHitoModal
        open={publicarOpen}
        onClose={() => setPublicarOpen(false)}
        onSubmit={handleConfirmPublicar}
        tarea={tareaPublicar}
        hitos={hitos}
        archivosAdjuntos={tareaPublicar?.archivos ?? []}
      />
      <TareaDetalleModal
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        tarea={tareaDetalle}
        hitos={hitos}
        arquitectos={arquitectos}
        proyectos={proyectos}
        bibliotecaVersion={bibliotecaVersion}
        onGuardarEdicion={handleGuardarEdicion}
        onConfirmarReprogramar={handleConfirmarReprogramarDetalle}
        onConfirmarRechazo={handleConfirmarRechazoDetalle}
        onCambiarEstado={handleCambiarEstado}
        onGuardarArquitectos={handleGuardarArquitectos}
        onReprogramar={(t) => {
          setTareaDetalle(t);
        }}
        onPublicar={(t) => {
          setDetalleOpen(false);
          handlePublicar(t);
        }}
        onRechazo={(t) => {
          setDetalleOpen(false);
          handleRechazo(t);
        }}
        onSubirABiblioteca={handleSubirABiblioteca}
        onPublicarAvance={handlePublicarAvance}
        onEliminarArchivo={handleEliminarArchivo}
        isAdmin={true}
      />
      <RechazoModal
        open={rechazoOpen}
        onClose={() => setRechazoOpen(false)}
        onSubmit={handleConfirmRechazo}
        tarea={tareaRechazo}
      />
    </div>
  );
}
