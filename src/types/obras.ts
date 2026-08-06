import type { Usuario } from "./proyecto.types";

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
  esExtra: boolean; // true = obra extra, no estaba en presupuesto original
  partidaOriginalId?: number; // only set when esExtra === true
}

export interface PartidaFormValues {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadPresupuestada: number;
  precioUnitario: number;
  esExtra?: boolean;
  partidaOriginalId?: number;
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
  montoAplicado: number;
  observaciones?: string;
  personal: LineaPersonal[];
  materiales: LineaMaterial[];
  costoManoObra: number;
  costoMateriales: number;
  costoTotal: number;
  creadoEn: string;
  valuacionId?: number;  // undefined = pendiente, número = concretado en esa valuación
  imagenes?: {
    id: number;
    name: string;
    url: string;
    mime: string;
    size: number;
  }[];
}

export interface ReporteFormValues {
  obraId: number;
  partidaId: number;
  fecha: string;
  montoAplicado: number;
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
  imagenesArchivos?: File[];
  existingImageIds?: number[];
}

// ─── Precio Historial ────────────────────────────────────────────────────────

export interface PrecioHistorial {
  id: number;
  precio: number;
  fecha_inicio: string;
  fecha_fin: string | null;
}

// ─── Obra ─────────────────────────────────────────────────────────────────────

export interface Obra {
  id: number;
  documentId?: string;
  nombre: string;
  proyectoId?: number;
  proyectoNombre?: string;
  gerentes?: Usuario[];
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
  proyectoId?: number;
  gerentesIds?: number[];
  capatazId?: number | null;
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

// ─── Valuación Documental (snapshot por corte) ────────────────────────────────

export interface ValuacionLineaPartida {
  partidaId: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  esExtra: boolean;
  cantidadPresupuestada: number;   // 0 para obras extras
  precioUnitario: number;
  montoPresupuestado: number;      // 0 para obras extras
  cantidadEjecutada: number;
  montoEjecutado: number;
  aumento?: number;                // cantidad adicional ejecutada sobre el presupuesto
  montoAumento?: number;
  disminucion?: number;            // cantidad no ejecutada del presupuesto
  montoDisminucion?: number;
}

export interface ValuacionDoc {
  id: number;
  obraId: number;
  numero: number;
  fecha: string;                   // ISO – fecha de concreción
  lineas: ValuacionLineaPartida[];
  totalPresupuesto: number;
  totalEjecutado: number;
  totalAumentos: number;
  totalDisminuciones: number;
  totalExtras: number;
  presupuestoModificado: number;   // base + aumentos − disminuciones + extras
  notas?: string;
}

export interface ValuacionFormValues {
  notas?: string;
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
