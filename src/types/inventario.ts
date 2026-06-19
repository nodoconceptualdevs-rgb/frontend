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
  documentId?: string;
  codigo?: string; // ej: "MAT-001"
  nombre: string; // "Cemento Portland", "Acero corrugado #3"
  categoria: string | CategoriaItem;
  unidad: string; // "bolsa", "tonelada", "m³", "unidad", etc.
  stockActual: number;
  stockMinimo?: number; // opcional: si no se define, no hay alarma
  precioPromedio: number; // promedio ponderado de compras
  ultimaCompra?: string; // ISO
  historialPrecios?: HistorialPrecio[]; // historial de precios con fechas
  proyectoId?: number; // opcional: proyecto al que está asignado
  proyectoNombre?: string; // desnormalizado
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
  documentId: string;
  numero: string; // "F-001-2026"
  proveedorNombre: string;
  proveedorRut?: string;
  proveedorId?: number;
  fecha: string; // ISO
  fechaRecepcion?: string; // ISO
  estado: EstadoFactura;
  proyectoId?: number;
  proyectoNombre?: string;
  obraId?: number;
  items: LineaFactura[];
  subtotal: number;
  impuesto?: number; // % ej: 19
  total: number;
  notas?: string;
  archivoPdf?: string; // URL Cloudinary
  inhabilitada?: boolean; // si está deshabilitada/inactiva
}

export interface FacturaFormValues {
  numero: string;
  proveedorNombre: string;
  proveedorRut?: string;
  proveedorId?: number;
  fecha: string;
  fechaRecepcion?: string;
  proyectoId?: number;
  proyectoNombre?: string;
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
  documentId?: string; // Para operaciones DELETE
  codigo?: string;
  nombre: string;
  descripcion?: string;
  categoria: string; // "Mano de obra", "Equipo pesado", etc.
  fechaAdquisicion?: string; // ISO
  estado: "DISPONIBLE" | "EN_USO" | "MANTENIMIENTO" | "DESCARTADA";
  cantidad?: number; // Cantidad disponible de esta herramienta
  ultimoUsoDatos?: {
    fecha: string; // ISO
    obraId: number;
    obraNombre: string;
  };
}

export interface HerramientaFormValues {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  fechaAdquisicion?: string;
  estado: Herramienta["estado"];
  cantidad?: number;
}

// --- Proveedores ---

export interface Proveedor {
  id: number;
  nombre: string;
  rut?: string;
  email?: string;
  telefono?: string;
  contacto?: string;
  notas?: string;
  activo: boolean;
}

export interface ProveedorFormValues {
  nombre: string;
  rut?: string;
  email?: string;
  telefono?: string;
  contacto?: string;
  notas?: string;
}

// --- Filtros ---

export interface FiltroFacturas {
  estado?: EstadoFactura | "TODAS";
}
