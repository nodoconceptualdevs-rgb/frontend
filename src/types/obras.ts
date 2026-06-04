// ─── Estado Obra ──────────────────────────────────────────────────────────────

export type EstadoObra = "PREPARACION" | "EN_CURSO" | "PAUSADA" | "COMPLETADA";

export const ESTADO_OBRA_LABEL: Record<EstadoObra, string> = {
  PREPARACION: "En preparación",
  EN_CURSO: "En curso",
  PAUSADA: "Pausada",
  COMPLETADA: "Completada",
};

export const ESTADO_OBRA_COLOR: Record<EstadoObra, string> = {
  PREPARACION: "default",
  EN_CURSO: "processing",
  PAUSADA: "warning",
  COMPLETADA: "success",
};

// ─── Estado Stock (reutilizado de inventario) ──────────────────────────────────

export type EstadoStock = "NORMAL" | "BAJO" | "CRITICO" | "SIN_STOCK";

// ─── Catálogo de Personal ─────────────────────────────────────────────────────

export interface Personal {
  id: number;
  nombre: string;
  cargo: string;
  costoPorHora: number;
}

export interface PersonalFormValues {
  nombre: string;
  cargo: string;
  costoPorHora: number;
}

// ─── Partida (Budget Line Item) ───────────────────────────────────────────────

export interface Partida {
  id: number;
  obraId: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadPresupuestada: number;
  precioUnitario: number;
  montoPresupuestado: number;
  cantidadEjecutada: number;
  montoEjecutado: number;
  avancePorcentaje: number;
}

export interface PartidaFormValues {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadPresupuestada: number;
  precioUnitario: number;
}

// ─── Líneas de Reporte Diario ─────────────────────────────────────────────────

export interface LineaPersonal {
  id: string;
  personalId: number;
  personalNombre: string;
  cargo: string;
  horasTrabajadas: number;
  costoPorHora: number;
  subtotal: number;
}

export interface LineaMaterial {
  id: string;
  materialId: number;
  materialNombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// ─── Reporte Diario ───────────────────────────────────────────────────────────

export interface ReporteDiario {
  id: number;
  obraId: number;
  obraNombre: string;
  partidaId: number;
  partidaCodigo: string;
  partidaDescripcion: string;
  fecha: string;
  avanceLogrado: number;
  observaciones?: string;
  personal: LineaPersonal[];
  materiales: LineaMaterial[];
  costoManoObra: number;
  costoMateriales: number;
  costoTotal: number;
  creadoEn: string;
}

export interface ReporteFormValues {
  obraId: number;
  partidaId: number;
  fecha: string;
  avanceLogrado: number;
  observaciones?: string;
  personal: {
    personalId: number;
    horasTrabajadas: number;
  }[];
  materiales: {
    materialId: number;
    cantidad: number;
    precioUnitario: number;
  }[];
}

// ─── Obra ─────────────────────────────────────────────────────────────────────

export interface Obra {
  id: number;
  nombre: string;
  proyectoId: number;
  proyectoNombre: string;
  capatazId?: number;
  capatazNombre?: string;
  estado: EstadoObra;
  fechaInicio: string;
  fechaFinPlanificada: string;
  fechaFinReal?: string;
  presupuestoTotal: number;
  presupuestoConsumido: number;
  partidas: Partida[];
  reportes: ReporteDiario[];
  notas?: string;
  creadoEn: string;
}

export interface ObraFormValues {
  nombre: string;
  proyectoId: number;
  capatazId?: number;
  estado: EstadoObra;
  fechaInicio: string;
  fechaFinPlanificada: string;
  presupuestoTotal: number;
  notas?: string;
}

// ─── Resumen para listado / dashboard ──────────────────────────────────────────

export interface ObrasResumen {
  totalObras: number;
  enCurso: number;
  completadas: number;
  pausadas: number;
  presupuestoTotal: number;
  presupuestoConsumido: number;
  reportesEstaSemanita: number;
}

// ─── Material disponible (para selector en ReporteModal) ────────────────────────

export interface MaterialDisponible {
  materialId: number;
  materialNombre: string;
  unidad: string;
  stockActual: number;
  precioPromedio: number;
  estadoStock: EstadoStock;
}

// ─── Valuación Final ──────────────────────────────────────────────────────────

export interface ValuacionPartida {
  partidaId: number;
  codigo: string;
  descripcion: string;
  montoPresupuestado: number;
  montoEjecutado: number;
  variacion: number;
  avancePorcentaje: number;
}

export interface ValuacionFinal {
  obraId: number;
  presupuestoTotal: number;
  costoReal: number;
  variacionTotal: number;
  porcentajeEjecucion: number;
  diasPlanificados: number;
  diasTranscurridos: number;
  totalReportes: number;
  totalPersonalRegistros: number;
  totalMaterialesConsumo: number;
  partidas: ValuacionPartida[];
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

export interface FiltroObras {
  estado?: EstadoObra | "TODAS";
  proyectoId?: number;
}
