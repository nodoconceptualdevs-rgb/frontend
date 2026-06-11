/**
 * Tipos del Sistema de Inventario de Materiales
 *
 * Flujo: Factura de Compra → Ítems → Stock en Catálogo de Materiales
 *
 * El modelo central es:
 * - MaterialCatalogo: catálogo único, evita duplicados
 * - FacturaCompra: documento de entrada, con N ítems
 * - LineaFactura: cada ítem referencia MaterialCatalogo
 *
 * Cuando se aprueba una factura, sus ítems incrementan el stock del catálogo.
 */

// --- Enumeraciones ---

export type CategoriaItem = string;

// --- Catálogos ---

export interface Categoria {
  id: number;
  nombre: string; // "ESTRUCTURA", "ACABADOS", etc.
  etiqueta: string; // "Estructura", "Acabados", etc. (label legible)
}

export type EstadoFactura =
  | "BORRADOR"
  | "APROBADA"
  | "PAGADA"
  | "ANULADA";

export const ESTADO_FACTURA_LABEL: Record<EstadoFactura, string> = {
  BORRADOR: "Borrador",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

export type EstadoStock = "NORMAL" | "BAJO" | "CRITICO" | "SIN_STOCK";

export const ESTADO_STOCK_LABEL: Record<EstadoStock, string> = {
  NORMAL: "Normal",
  BAJO: "Bajo",
  CRITICO: "Crítico",
  SIN_STOCK: "Sin stock",
};

// --- Historial de Precios ---

export interface HistorialPrecio {
  fecha: string; // ISO
  precio: number;
  cantidad?: number; // cantidad comprada en esa transacción (opcional)
}

// --- Catálogo de Materiales ---

export interface MaterialCatalogo {
  id: number;
  nombre: string; // "Cemento Portland", "Acero corrugado #3"
  categoria: CategoriaItem;
  unidad: string; // "bolsa", "tonelada", "m³", "unidad", etc.
  stockActual: number;
  stockMinimo?: number; // opcional: si no se define, no hay alarma
  precioPromedio: number; // promedio ponderado de compras
  ultimaCompra?: string; // ISO
  historialPrecios?: HistorialPrecio[]; // historial de precios con fechas
  proyectoId?: number; // opcional: proyecto al que está asignado
  proyectoNombre?: string; // desnormalizado
  obraId?: number; // opcional: obra específica al que está asignado
  obraNombre?: string; // desnormalizado
}

export interface MaterialConEstado extends MaterialCatalogo {
  estadoStock: EstadoStock; // calculado
  valorTotalStock: number; // stockActual * precioPromedio
}

// --- Líneas de Factura ---

export interface LineaFactura {
  id: string; // uuid local
  materialId: number;
  materialNombre: string; // desnormalizado
  unidad: string; // desnormalizado del material
  cantidad: number;
  precioUnitario: number;
  subtotal: number; // cantidad * precioUnitario
}

export interface LineaFacturaFormValues {
  materialId: number;
  cantidad: number;
  precioUnitario: number;
}

// --- Facturas de Compra ---

export interface FacturaCompra {
  id: number;
  numero: string; // "F-001-2026"
  proveedorNombre: string;
  proveedorRut?: string;
  fecha: string; // ISO
  fechaRecepcion?: string; // ISO
  estado: EstadoFactura;
  proyectoId?: number;
  proyectoNombre?: string;
  obraId?: number;
  obraNombre?: string;
  items: LineaFactura[];
  subtotal: number;
  impuesto?: number; // % ej: 19
  total: number;
  notas?: string;
  archivoPdf?: string; // URL Cloudinary
}

export interface FacturaFormValues {
  numero: string;
  proveedorNombre: string;
  proveedorRut?: string;
  fecha: string;
  fechaRecepcion?: string;
  proyectoId?: number;
  obraId?: number;
  items: LineaFacturaFormValues[];
  impuesto?: number;
  notas?: string;
}

// --- Resumen para Dashboard ---

export interface InventarioResumen {
  totalFacturas: number;
  montoPagado: number;
  montoPendiente: number;
  totalMateriales: number;
  materialesBajoMinimo: number;
  valorTotalStock: number;
}

// --- Unidades de Medida ---

export interface UnidadDeMedida {
  id: number;
  nombre: string; // "bolsa", "tonelada", "m³", "unidad", etc.
  abreviatura: string; // "bol", "ton", "m³", "u", etc.
}

// --- Herramientas ---

export interface Herramienta {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: string; // "Mano de obra", "Equipo pesado", etc.
  fechaAdquisicion?: string; // ISO
  estado: "DISPONIBLE" | "EN_USO" | "MANTENIMIENTO" | "DESCARTADA";
  ultimoUsoDatos?: {
    fecha: string; // ISO
    obraId: number;
    obraNombre: string;
  };
}

export interface HerramientaFormValues {
  nombre: string;
  descripcion?: string;
  categoria: string;
  fechaAdquisicion?: string;
  estado: Herramienta["estado"];
}

// --- Filtros ---

export interface FiltroFacturas {
  estado?: EstadoFactura | "TODAS";
}
