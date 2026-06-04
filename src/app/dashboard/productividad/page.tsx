"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, Segmented, Modal, Empty, Spin } from "antd";
import toast from "react-hot-toast";
import {
  LayoutGrid,
  BarChart3,
  Building2,
  Wrench,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import KanbanBoard from "@/components/kpi/KanbanBoard";
import KpiDashboard from "@/components/kpi/KpiDashboard";
import TareaModal from "@/components/kpi/TareaModal";
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
  agregarArchivosATarea,
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
} from "@/services/kpi";

export default function GerenteProductividadPage() {
  const { user } = useAuth();
  const [tareas, setTareas] = useState<TareaConKpi[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoOpcion[]>([]);
  const [hitos, setHitos] = useState<HitoOpcion[]>([]);
  const [arquitectos, setArquitectos] = useState<Arquitecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtro, setFiltro] = useState<FiltroTareas>({ vista: "TODAS" });
  // Filtro fijo al ID del gerente logueado
  const arquitectoIdFiltro = user?.id;

  // Periodo para la vista de métricas
  const [hoyIso] = useState(() => new Date().toISOString());
  const [granularidad, setGranularidad] = useState<Granularidad>("MES");
  const [anchorIso, setAnchorIso] = useState(() => new Date().toISOString());
  const [rangoInicioIso, setRangoInicioIso] = useState<string | null>(null);
  const [rangoFinIso, setRangoFinIso] = useState<string | null>(null);

  // Modales
  const [tareaModalOpen, setTareaModalOpen] = useState(false);
  const [publicarOpen, setPublicarOpen] = useState(false);
  const [tareaPublicar, setTareaPublicar] = useState<TareaConKpi | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [tareaDetalle, setTareaDetalle] = useState<TareaConKpi | null>(null);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [tareaRechazo, setTareaRechazo] = useState<TareaConKpi | null>(null);

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

        // Agregar datos dummy para demostración
        const tareasDummy: TareaConKpi[] = a.length > 0 ? [
          {
            id: 1001,
            titulo: "Diseño de planos estructurales - Casa García",
            descripcion: "Elaboración de planos estructurales para proyecto residencial con área de 450 m². Incluye fundaciones, columnas, vigas y losa de entrepiso.",
            tipo: "CLIENTE",
            estado: "COMPLETADA",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Casa García",
            proyectoId: p[0]?.id || 1,
            proyectoNombre: p[0]?.name || "Residencial García",
            hitoId: h[0]?.id || 1,
            hitoNombre: h[0]?.nombre || "Planos Estructurales",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 4, 15).toISOString(),
            fechaEntregaEstimada: new Date(2026, 4, 15).toISOString(),
            fechaCompletacion: new Date(2026, 5, 1).toISOString(),
            tiempoTotalDias: 17,
            diasRestantes: -1,
            eficiencia: "Alta",
            contadorRechazos: 0,
            enRiesgo: false,
            historialRechazos: [],
            archivos: [],
            historialEntregas: [],
          } as any,
          {
            id: 1002,
            titulo: "Planos técnicos de instalaciones - Proyecto Comercial",
            descripcion: "Diseño completo de instalaciones eléctricas, sanitarias y HVAC para centro comercial de 3 pisos. Incluye cálculos de carga, diagramas unifilares y especificaciones técnicas.",
            tipo: "CLIENTE",
            estado: "EN_PROCESO",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Proyecto Comercial",
            proyectoId: p[0]?.id || 1,
            proyectoNombre: p[0]?.name || "Centro Comercial Moderno",
            hitoId: h[0]?.id || 1,
            hitoNombre: h[0]?.nombre || "Instalaciones",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 5, 20).toISOString(),
            fechaEntregaEstimada: new Date(2026, 5, 25).toISOString(),
            fechaCompletacion: null,
            tiempoTotalDias: 5,
            diasRestantes: 3,
            eficiencia: "Media",
            contadorRechazos: 1,
            enRiesgo: false,
            historialRechazos: [
              {
                id: "r1",
                categoria: "NO_CUMPLE_EXPECTATIVAS",
                motivo: "Los cálculos de carga eléctrica no consideraban la ampliación futura del local. Se requiere recalcular con margen del 30%.",
                registradoEn: new Date(2026, 5, 10).toISOString(),
              },
            ],
            archivos: [],
            contadorReprogramaciones: 1,
            historialReprogramaciones: [
              {
                id: "rep1",
                fechaAnterior: new Date(2026, 5, 20).toISOString(),
                fechaNueva: new Date(2026, 5, 25).toISOString(),
                motivo: "El cliente solicitó cambios en el diagrama de distribución después de revisar el espacio físicamente.",
                registradoEn: new Date(2026, 5, 12).toISOString(),
              },
            ],
          } as any,
          {
            id: 1003,
            titulo: "Renderizado 3D - Fachada Principal",
            descripcion: "Visualización 3D fotorrealista de la fachada principal con diferentes propuestas de materialidad. Incluye variantes de colores y texturas.",
            tipo: "CLIENTE",
            estado: "PENDIENTE",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Cliente ABC",
            proyectoId: p[0]?.id || 1,
            proyectoNombre: p[0]?.name || "Edificio Corporativo",
            hitoId: h[0]?.id || 1,
            hitoNombre: h[0]?.nombre || "Presentación",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 6, 10).toISOString(),
            fechaEntregaEstimada: new Date(2026, 6, 12).toISOString(),
            fechaCompletacion: null,
            tiempoTotalDias: 0,
            diasRestantes: 8,
            eficiencia: null,
            contadorRechazos: 0,
            enRiesgo: false,
            historialRechazos: [],
            archivos: [],
            historialEntregas: [],
          } as any,
          {
            id: 1004,
            titulo: "Memoria descriptiva técnica",
            descripcion: "Documento técnico que describe todos los aspectos del proyecto: ubicación, dimensiones, materiales, sistemas constructivos, normativa aplicable y justificación de decisiones de diseño.",
            tipo: "CLIENTE",
            estado: "COMPLETADA",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Cliente XYZ",
            proyectoId: p[1]?.id || 2,
            proyectoNombre: p[1]?.name || "Vivienda Unifamiliar",
            hitoId: h[1]?.id || 2,
            hitoNombre: h[1]?.nombre || "Documentación",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 4, 22).toISOString(),
            fechaEntregaEstimada: new Date(2026, 4, 22).toISOString(),
            fechaCompletacion: new Date(2026, 4, 21).toISOString(),
            tiempoTotalDias: 8,
            diasRestantes: 0,
            eficiencia: "Alta",
            contadorRechazos: 2,
            enRiesgo: false,
            historialRechazos: [
              {
                id: "r2",
                categoria: "BRIEF_POCO_CLARO",
                motivo: "Faltaban especificaciones sobre sistemas de ahorro energético. Se requiere agregar detalles de aislamiento e instalaciones solares.",
                registradoEn: new Date(2026, 4, 15).toISOString(),
              },
              {
                id: "r3",
                categoria: "NO_CUMPLE_EXPECTATIVAS",
                motivo: "El formato de presentación no coincidía con la plantilla estándar de la firma. Se requería reformatear según guía de identidad.",
                registradoEn: new Date(2026, 4, 18).toISOString(),
              },
            ],
            archivos: [],
            contadorReprogramaciones: 2,
            historialReprogramaciones: [
              {
                id: "rep2",
                fechaAnterior: new Date(2026, 4, 22).toISOString(),
                fechaNueva: new Date(2026, 4, 25).toISOString(),
                motivo: "Primera reprogramación por cambios en especificaciones de energías renovables requeridas por el cliente.",
                registradoEn: new Date(2026, 4, 16).toISOString(),
              },
              {
                id: "rep3",
                fechaAnterior: new Date(2026, 4, 25).toISOString(),
                fechaNueva: new Date(2026, 4, 21).toISOString(),
                motivo: "Se adelantó la entrega al completar los ajustes de formato más rápido de lo estimado. El cliente estaba disponible para revisión anticipada.",
                registradoEn: new Date(2026, 4, 19).toISOString(),
              },
            ],
          } as any,
          {
            id: 1005,
            titulo: "Modelado BIM completo",
            descripcion: "Desarrollo del modelo BIM (Building Information Modeling) con todas las disciplinas integradas: arquitectura, estructura, instalaciones. Incluye análisis de coordinación y detección de conflictos.",
            tipo: "CLIENTE",
            estado: "EN_PROCESO",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Proyecto BIM",
            proyectoId: p[0]?.id || 1,
            proyectoNombre: p[0]?.name || "Centro de Convenciones",
            hitoId: h[0]?.id || 1,
            hitoNombre: h[0]?.nombre || "Modelo BIM",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 6, 5).toISOString(),
            fechaEntregaEstimada: new Date(2026, 6, 10).toISOString(),
            fechaCompletacion: null,
            tiempoTotalDias: 8,
            diasRestantes: 7,
            eficiencia: "Media",
            contadorRechazos: 0,
            enRiesgo: true,
            historialRechazos: [],
            archivos: [],
            historialEntregas: [],
          } as any,
          {
            id: 1006,
            titulo: "Cálculo estructural - Pasarela peatonal",
            descripcion: "Análisis y cálculo de cargas, esfuerzos y deformaciones de una pasarela peatonal de 45 metros de luz. Incluye análisis de viento y sismo según normativa.",
            tipo: "CLIENTE",
            estado: "COMPLETADA",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Municipalidad",
            proyectoId: p[0]?.id || 1,
            proyectoNombre: p[0]?.name || "Proyecto Vial",
            hitoId: h[0]?.id || 1,
            hitoNombre: h[0]?.nombre || "Estructura",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 3, 30).toISOString(),
            fechaEntregaEstimada: new Date(2026, 4, 5).toISOString(),
            fechaCompletacion: new Date(2026, 4, 3).toISOString(),
            tiempoTotalDias: 20,
            diasRestantes: 0,
            eficiencia: "Alta",
            contadorRechazos: 1,
            enRiesgo: false,
            historialRechazos: [
              {
                id: "r4",
                categoria: "NO_CUMPLE_EXPECTATIVAS",
                motivo: "Faltaba incluir análisis de fatiga en las conexiones soldadas. Se requería verificación adicional con especialista.",
                registradoEn: new Date(2026, 3, 28).toISOString(),
              },
            ],
            archivos: [],
            contadorReprogramaciones: 1,
            historialReprogramaciones: [
              {
                id: "rep4",
                fechaAnterior: new Date(2026, 3, 30).toISOString(),
                fechaNueva: new Date(2026, 4, 5).toISOString(),
                motivo: "El cliente solicita incluir variante de materiales más económicos. Se requiere recalcular con acero de menor especificación.",
                registradoEn: new Date(2026, 3, 24).toISOString(),
              },
            ],
          } as any,
          {
            id: 1007,
            titulo: "Especificaciones técnicas de materiales",
            descripcion: "Documento con especificaciones detalladas de todos los materiales a usar en el proyecto, incluyendo calidades, proveedores, certificados y garantías.",
            tipo: "CLIENTE",
            estado: "EN_PROCESO",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Contratista General",
            proyectoId: p[0]?.id || 1,
            proyectoNombre: p[0]?.name || "Obra Comercial",
            hitoId: h[0]?.id || 1,
            hitoNombre: h[0]?.nombre || "Especificaciones",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 6, 15).toISOString(),
            fechaEntregaEstimada: new Date(2026, 6, 18).toISOString(),
            fechaCompletacion: null,
            tiempoTotalDias: 7,
            diasRestantes: 16,
            eficiencia: "Media",
            contadorRechazos: 0,
            enRiesgo: false,
            historialRechazos: [],
            archivos: [],
            historialEntregas: [],
          } as any,
          {
            id: 1008,
            titulo: "Presentación ejecutiva para cliente",
            descripcion: "Presentación en PowerPoint con renders, cronograma, presupuesto y propuesta comercial para presentación ante junta directiva del cliente.",
            tipo: "CLIENTE",
            estado: "COMPLETADA",
            clienteId: c[0]?.id || 1,
            clienteNombre: c[0]?.name || "Empresa Privada",
            proyectoId: p[1]?.id || 2,
            proyectoNombre: p[1]?.name || "Centro Empresarial",
            hitoId: h[1]?.id || 2,
            hitoNombre: h[1]?.nombre || "Presentación",
            arquitectos: [{ id: a[0].id, name: a[0].name }],
            fechaEntregaOriginal: new Date(2026, 5, 5).toISOString(),
            fechaEntregaEstimada: new Date(2026, 5, 7).toISOString(),
            fechaCompletacion: new Date(2026, 5, 6).toISOString(),
            tiempoTotalDias: 5,
            diasRestantes: 0,
            eficiencia: "Alta",
            contadorRechazos: 3,
            enRiesgo: false,
            historialRechazos: [
              {
                id: "r5",
                categoria: "BRIEF_POCO_CLARO",
                motivo: "No estaba clara la paleta de colores corporativa a usar. Se requería coordinación con departamento de branding.",
                registradoEn: new Date(2026, 4, 28).toISOString(),
              },
              {
                id: "r6",
                categoria: "NO_CUMPLE_EXPECTATIVAS",
                motivo: "Los renders no mostraban suficiente detalle de los espacios interiores. Se pidió agregar más vistas de áreas comunes.",
                registradoEn: new Date(2026, 5, 1).toISOString(),
              },
              {
                id: "r7",
                categoria: "NO_CUMPLE_EXPECTATIVAS",
                motivo: "El cronograma no incluía holguras realistas. Se pidió ajustar tiempos según experiencia previa en proyectos similares.",
                registradoEn: new Date(2026, 5, 3).toISOString(),
              },
            ],
            archivos: [],
            contadorReprogramaciones: 3,
            historialReprogramaciones: [
              {
                id: "rep5",
                fechaAnterior: new Date(2026, 5, 5).toISOString(),
                fechaNueva: new Date(2026, 5, 7).toISOString(),
                motivo: "Primera coordinación con branding para ajustar colores. Retrasó 2 días pero mejoró aceptación del cliente.",
                registradoEn: new Date(2026, 4, 29).toISOString(),
              },
              {
                id: "rep6",
                fechaAnterior: new Date(2026, 5, 7).toISOString(),
                fechaNueva: new Date(2026, 5, 10).toISOString(),
                motivo: "Se requirieron renders adicionales de interiores. Retrasó 3 días pero cliente quedó muy satisfecho.",
                registradoEn: new Date(2026, 5, 2).toISOString(),
              },
              {
                id: "rep7",
                fechaAnterior: new Date(2026, 5, 10).toISOString(),
                fechaNueva: new Date(2026, 5, 6).toISOString(),
                motivo: "Se adelantó la entrega al terminar los ajustes de cronograma antes de lo esperado.",
                registradoEn: new Date(2026, 5, 4).toISOString(),
              },
            ],
          } as any,
        ] : [];

        // Asegurar que todas las tareas tengan historialEntregas
        const tareasConHistorial = t.map((tarea) => ({
          ...tarea,
          historialEntregas: (tarea as any).historialEntregas || [],
        }));

        // Combinar tareas reales con dummy
        const todasLasTareas = [...tareasConHistorial, ...tareasDummy];

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

    // Filtro fijo al arquitecto/gerente logueado
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

  const handleNueva = () => {
    setTareaModalOpen(true);
  };

  const handleEditar = (t: TareaConKpi) => {
    setTareaDetalle(t);
    setDetalleOpen(true);
  };

  const handleGuardar = async (values: TareaFormValues) => {
    await createTarea(values);
    toast.success("Tarea creada");
    await refrescar();
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
    Modal.confirm({
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

  const handleAgregarArchivos = async (
    archivos: import("@/types/kpi").Archivo[],
  ) => {
    if (!tareaDetalle) return;
    const id = tareaDetalle.id;
    await agregarArchivosATarea(id, archivos);
    toast.success(`${archivos.length} archivo(s) agregado(s)`);
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === id) ?? null);
  };

  const handleEliminarArchivo = async (archivoId: string) => {
    if (!tareaDetalle) return;
    const id = tareaDetalle.id;
    await eliminarArchivoDeTarea(id, archivoId);
    toast.success("Archivo eliminado");
    const data = await getTareas();
    setTareas(data);
    setTareaDetalle(data.find((t) => t.id === id) ?? null);
  };

  // --- Barra de filtros (sin selector de arquitecto) ---
  const FiltroBar = (
    <div className="flex flex-col gap-4">
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
      <div className="border-b border-gray-200 bg-white px-4 py-6 sm:px-6 md:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Productividad</h1>
        <p className="mt-1 text-sm text-gray-600">
          {tareas.length} tareas · {tareas.filter((t) => t.estado === "COMPLETADA").length} completadas
        </p>
      </div>

      <main className="px-4 py-4 sm:px-6 md:px-8 md:py-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : (
          <Tabs items={tabItems} defaultActiveKey="tablero" />
        )}
      </main>

      {/* Modales */}
      <TareaModal
        open={tareaModalOpen}
        onClose={() => setTareaModalOpen(false)}
        onSubmit={handleGuardar}
        tarea={null}
        proyectos={proyectos}
        hitos={hitos}
        arquitectos={arquitectos}
      />
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
        onGuardarEdicion={handleGuardarEdicion}
        onConfirmarReprogramar={handleConfirmarReprogramarDetalle}
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
        onAgregarArchivos={handleAgregarArchivos}
        onEliminarArchivo={handleEliminarArchivo}
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
