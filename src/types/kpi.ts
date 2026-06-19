/**
 * Tipos del Sistema KPI / Productividad (FASE 1)
 *
 * Este archivo es el CONTRATO DE DATOS. La UI se construye sobre estos tipos
 * con datos mock; cuando se implemente el backend (Strapi `api::kpi.tarea-diseno`),
 * el schema y los endpoints deben encajar exactamente con estas formas.
 *
 * Modelo KPI (revisado): la eficiencia NO se mide por rechazos sino por
 * CUMPLIMIENTO DE FECHAS DE ENTREGA. Cada tarea tiene una fecha de entrega
 * comprometida; si se reprograma, queda un registro con motivo. La eficiencia
 * del arquitecto se deriva de las reprogramaciones y la desviación final.
 */

export type EstadoTarea = "PENDIENTE" | "EN_PROCESO" | "COMPLETADA";

export type Eficiencia = "ALTA" | "MEDIA" | "BAJA";

/** Clasificación de la tarea: ligada a un cliente o trabajo interno. */
export type TipoTarea = "CLIENTE" | "INDEPENDIENTE";

/** Las 3 columnas del tablero, en orden. */
export const ESTADOS_TAREA: EstadoTarea[] = [
  "PENDIENTE",
  "EN_PROCESO",
  "COMPLETADA",
];

/** Etiquetas legibles por estado (para columnas y badges). */
export const ESTADO_LABEL: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADA: "Completada",
};

/** Arquitecto asignado (subconjunto del User de Strapi). */
export interface Arquitecto {
  id: number;
  name: string;
}

/** Cliente (User de Strapi con rol client). */
export interface Cliente {
  id: number;
  name: string;
}

/** Hito de un proyecto (destino de publicación). */
export interface HitoOpcion {
  id: number;
  nombre: string;
  proyectoId: number;
  proyectoNombre: string;
}

/** Proyecto y su cliente asociado. */
export interface ProyectoOpcion {
  id: number;
  nombre: string;
  clienteId: number;
  clienteNombre: string;
}

/** Archivo asociado a una tarea. */
export interface Archivo {
  id: string; // UUID o id único
  nombre: string; // nombre original
  tamaño: number; // bytes
  ruta?: string; // URL o path (mock: puede ser data-uri o ruta local)
  subidoEn: string; // ISO — fecha de carga
}

/** Registro de que una tarea ya fue publicada en un hito (visible al cliente). */
export interface PublicacionHito {
  hitoId: number;
  hitoNombre: string;
  fecha: string; // ISO
  /** IDs de archivos adjuntos a la tarea que se publicaron. */
  archivoIds: string[];
}

/**
 * Registro de un cambio en la fecha de entrega (reprogramación).
 * Alimenta el indicador de cumplimiento de fechas (load time).
 */
export interface CambioEntrega {
  fechaAnterior?: string; // ISO — la fecha que estaba comprometida
  fechaNueva: string; // ISO — la nueva fecha comprometida
  motivo: string; // razón obligatoria del cambio
  registradoEn: string; // ISO — cuándo se hizo el cambio
}

/** Categoría del rechazo/retrabajo (según lo indicado por el cliente). */
export type MotivoRechazo =
  | "BRIEF_POCO_CLARO" // el brief no estaba claro
  | "NO_CUMPLE_EXPECTATIVAS" // no cumplió las expectativas
  | "OTRO";

export const MOTIVO_RECHAZO_LABEL: Record<MotivoRechazo, string> = {
  BRIEF_POCO_CLARO: "Brief poco claro",
  NO_CUMPLE_EXPECTATIVAS: "No cumple expectativas",
  OTRO: "Otro",
};

/** Archivo de la biblioteca del proyecto (preexistente, reutilizable en tareas). */
export interface ArchivoProyecto {
  id: string;
  nombre: string;
  tamaño: number;
  ruta?: string;
  subidoEn: string; // ISO
  proyectoId: number;
  etiquetas?: string[];
}

/**
 * Registro de un rechazo / retrabajo (rediseño): cuántas veces volvió un
 * diseño y por qué. Alimenta la tasa de rechazo/retrabajo.
 */
export interface Rechazo {
  motivo: string; // descripción obligatoria
  categoria: MotivoRechazo;
  registradoEn: string; // ISO
}

/**
 * Tarea de diseño: subunidad interna medible para KPI.
 * En el backend será `api::kpi.tarea-diseno`.
 */
export interface TareaDiseno {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  tipo: TipoTarea;

  // Relaciones (solo si tipo === "CLIENTE"). Independientes no tienen cliente/proyecto.
  clienteId?: number;
  clienteNombre?: string;
  proyectoId?: number;
  proyectoNombre?: string;
  /** Hito con el que se relaciona (opcional; el destino final se elige al publicar). */
  hitoId?: number;
  hitoNombre?: string;

  arquitectos: Arquitecto[];

  // --- Tiempos y entrega (núcleo del KPI) ---
  fechaRequerimiento?: string; // ISO — cuándo llegó el brief/requerimiento (inicio del load time)
  fechaInicio?: string; // ISO — se setea al pasar a EN_PROCESO
  fechaEntregaEstimada?: string; // ISO — fecha comprometida actual
  fechaEntregaOriginal?: string; // ISO — primera fecha comprometida (para medir desviación)
  fechaCompletacion?: string; // ISO — entrega real (al pasar a COMPLETADA)
  /** Historial de reprogramaciones de la fecha de entrega. */
  historialEntregas: CambioEntrega[];

  // --- Rechazos / retrabajo (segunda dimensión del KPI) ---
  contadorRechazos: number; // nº de veces que volvió el diseño
  historialRechazos: Rechazo[];

  /** Archivos adjuntos a la tarea. */
  archivos: Archivo[];

  notasInternas?: string;

  /** Si la tarea ya se llevó a un hito visible al cliente. */
  publicacion?: PublicacionHito;

  // Orden dentro de su columna (para el drag & drop).
  orden: number;
}

/**
 * Tarea enriquecida con los KPI derivados. Hoy se calculan en el front
 * (ver src/lib/kpi.ts); en el backend los hará un lifecycle hook.
 */
export interface TareaConKpi extends TareaDiseno {
  tiempoTotalDias?: number; // fechaCompletacion - fechaInicio (o hoy si en proceso)
  /** Load time: días desde el requerimiento hasta la entrega final (completadas). */
  loadTimeDias?: number;
  reprogramaciones: number; // historialEntregas.length
  /** Días de desviación de la entrega real vs. la fecha comprometida original. */
  diasDesviacion?: number; // >0 = tarde; <=0 = a tiempo
  /** Días restantes hasta la fecha estimada (negativo = vencida). Solo no-completadas. */
  diasRestantes?: number;
  /** EN_PROCESO y con fecha estimada ya vencida. */
  enRiesgo: boolean;
  eficiencia?: Eficiencia; // combina rechazos + reprogramaciones + puntualidad
}

/** Métricas agregadas por arquitecto (vista de dashboard). */
export interface KpiArquitecto {
  arquitectoId: number;
  nombre: string;
  tareasTotales: number;
  tareasCompletadas: number;
  tareasEnProceso: number;
  loadTimePromedioDias: number; // promedio requerimiento→entrega (completadas)
  totalReprogramaciones: number;
  totalRechazos: number;
  tasaRetrabajo: number; // % de completadas que tuvieron ≥1 rechazo
  entregasATiempo: number; // completadas sin desviación
  eficienciaPromedio: Eficiencia;
}

/** Resumen global para las tarjetas de stats superiores. */
export interface KpiResumen {
  totalTareas: number;
  completadas: number;
  enProceso: number;
  pendientes: number;
  loadTimePromedioDias: number; // promedio requerimiento→entrega
  totalReprogramaciones: number;
  totalRechazos: number;
  tasaRetrabajo: number; // % de completadas con ≥1 rechazo
  tareasEnRiesgo: number; // en proceso y vencidas
  tasaEntregaATiempo: number; // % de completadas entregadas a tiempo
}

/** Payload para crear/editar una tarea desde el modal. */
export interface TareaFormValues {
  titulo: string;
  descripcion?: string;
  tipo: TipoTarea;
  /** Requerido si tipo === "CLIENTE". */
  proyectoId?: number;
  /** Hito relacionado (opcional). */
  hitoId?: number;
  arquitectoIds: number[];
  /** Fecha de entrega comprometida (ISO). */
  fechaEntregaEstimada?: string;
  notasInternas?: string;
}

/** Payload para reprogramar la fecha de entrega de una tarea. */
export interface ReprogramarValues {
  fechaNueva: string; // ISO
  motivo: string;
}

/** Payload para registrar un rechazo / retrabajo. */
export interface RechazoValues {
  categoria: MotivoRechazo;
  motivo: string;
}

/** Payload para publicar una tarea en un hito (visible al cliente). */
export interface PublicarHitoValues {
  hitoId: number;
  descripcionAvance: string;
  /** IDs de archivos ya adjuntos a la tarea a llevar al hito. */
  archivoIds: string[];
}

/** Filtro de clasificación del tablero. */
export interface FiltroTareas {
  vista: "TODAS" | "CLIENTE" | "INDEPENDIENTE";
  /** Cliente seleccionado cuando vista === "CLIENTE". */
  clienteId?: number;
}
