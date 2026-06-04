/**
 * Servicio de Inventario — versión MOCK (en memoria).
 *
 * La UI de Inventario se construye contra estas funciones con datos
 * simulados. Cuando exista el backend Strapi, se reemplaza SOLO el
 * cuerpo de cada función por llamadas a API (axios), manteniendo
 * las mismas firmas.
 */

import type {
  CategoriaItem,
  Categoria,
  EstadoFactura,
  FacturaCompra,
  FacturaFormValues,
  InventarioResumen,
  LineaFactura,
  MaterialCatalogo,
  MaterialConEstado,
  UnidadDeMedida,
} from "@/types/inventario";
import { calcularInventarioResumen, calcularEstadoStock, calcularStockYPrecio } from "@/lib/inventario";

// --- Helpers ---

function hace(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

function dentro(dias: number): string {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
}

async function delay<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), 280));
}

function uuidLocal(): string {
  return Math.random().toString(36).slice(2, 11);
}

// --- Categorías de Materiales ---

let CATEGORIAS: Categoria[] = [
  { id: 1, nombre: "ESTRUCTURA", etiqueta: "Estructura" },
  { id: 2, nombre: "ACABADOS", etiqueta: "Acabados" },
  { id: 3, nombre: "INSTALACIONES", etiqueta: "Instalaciones" },
  { id: 4, nombre: "HERRAMIENTAS", etiqueta: "Herramientas" },
  { id: 5, nombre: "OTRO", etiqueta: "Otro" },
];

// --- Unidades de Medida (catálogo) ---

let UNIDADES: UnidadDeMedida[] = [
  { id: 1, nombre: "bolsa", abreviatura: "bol" },
  { id: 2, nombre: "tonelada", abreviatura: "ton" },
  { id: 3, nombre: "m³", abreviatura: "m³" },
  { id: 4, nombre: "m²", abreviatura: "m²" },
  { id: 5, nombre: "m", abreviatura: "m" },
  { id: 6, nombre: "unidad", abreviatura: "u" },
  { id: 7, nombre: "caja", abreviatura: "caja" },
  { id: 8, nombre: "galón", abreviatura: "gal" },
  { id: 9, nombre: "varilla", abreviatura: "var" },
  { id: 10, nombre: "kg", abreviatura: "kg" },
];

// --- Estado en memoria ---

let MATERIALES: MaterialCatalogo[] = [
  // ESTRUCTURA
  { id: 101, nombre: "Cemento Portland", categoria: "ESTRUCTURA", unidad: "bolsa", stockActual: 450, stockMinimo: 100, precioPromedio: 8500, ultimaCompra: hace(2), historialPrecios: [{ fecha: hace(30), precio: 8000 }, { fecha: hace(15), precio: 8300 }, { fecha: hace(2), precio: 8500 }] },
  { id: 102, nombre: "Acero corrugado #3", categoria: "ESTRUCTURA", unidad: "varilla", stockActual: 240, stockMinimo: 50, precioPromedio: 12000, ultimaCompra: hace(5), historialPrecios: [{ fecha: hace(45), precio: 11500 }, { fecha: hace(20), precio: 11800 }, { fecha: hace(5), precio: 12000 }] },
  { id: 103, nombre: "Acero corrugado #4", categoria: "ESTRUCTURA", unidad: "varilla", stockActual: 180, stockMinimo: 50, precioPromedio: 15000, ultimaCompra: hace(10), historialPrecios: [{ fecha: hace(60), precio: 14000 }, { fecha: hace(30), precio: 14500 }, { fecha: hace(10), precio: 15000 }] },
  { id: 104, nombre: "Arena gruesa", categoria: "ESTRUCTURA", unidad: "m³", stockActual: 35, stockMinimo: 20, precioPromedio: 45000, ultimaCompra: hace(3), historialPrecios: [{ fecha: hace(40), precio: 42000 }, { fecha: hace(20), precio: 43500 }, { fecha: hace(3), precio: 45000 }] },
  { id: 105, nombre: "Grava / piedra chancada", categoria: "ESTRUCTURA", unidad: "m³", stockActual: 28, stockMinimo: 15, precioPromedio: 55000, ultimaCompra: hace(7), historialPrecios: [{ fecha: hace(50), precio: 52000 }, { fecha: hace(25), precio: 53500 }, { fecha: hace(7), precio: 55000 }] },
  { id: 106, nombre: "Bloque de concreto 15cm", categoria: "ESTRUCTURA", unidad: "unidad", stockActual: 1200, stockMinimo: 500, precioPromedio: 2500, ultimaCompra: hace(4), historialPrecios: [{ fecha: hace(35), precio: 2300 }, { fecha: hace(18), precio: 2400 }, { fecha: hace(4), precio: 2500 }] },

  // ACABADOS
  { id: 201, nombre: "Cerámica piso 60x60", categoria: "ACABADOS", unidad: "caja", stockActual: 45, stockMinimo: 20, precioPromedio: 95000, ultimaCompra: hace(8), historialPrecios: [{ fecha: hace(55), precio: 90000 }, { fecha: hace(28), precio: 92500 }, { fecha: hace(8), precio: 95000 }] },
  { id: 202, nombre: "Pintura latex interior", categoria: "ACABADOS", unidad: "galón", stockActual: 8, stockMinimo: 10, precioPromedio: 35000, ultimaCompra: hace(15), historialPrecios: [{ fecha: hace(60), precio: 32000 }, { fecha: hace(35), precio: 33500 }, { fecha: hace(15), precio: 35000 }] },
  { id: 203, nombre: "Masilla corriente", categoria: "ACABADOS", unidad: "bolsa", stockActual: 22, stockMinimo: 15, precioPromedio: 12000, ultimaCompra: hace(6), historialPrecios: [{ fecha: hace(42), precio: 11000 }, { fecha: hace(22), precio: 11500 }, { fecha: hace(6), precio: 12000 }] },
  { id: 204, nombre: "Fragua blanca", categoria: "ACABADOS", unidad: "bolsa", stockActual: 5, stockMinimo: 10, precioPromedio: 28000, ultimaCompra: hace(20), historialPrecios: [{ fecha: hace(65), precio: 26000 }, { fecha: hace(40), precio: 27000 }, { fecha: hace(20), precio: 28000 }] },

  // INSTALACIONES
  { id: 301, nombre: "Tubo PVC 4\" presión", categoria: "INSTALACIONES", unidad: "m", stockActual: 120, stockMinimo: 50, precioPromedio: 8500, ultimaCompra: hace(12), historialPrecios: [{ fecha: hace(50), precio: 8000 }, { fecha: hace(28), precio: 8250 }, { fecha: hace(12), precio: 8500 }] },
  { id: 302, nombre: "Cable THW 12 AWG", categoria: "INSTALACIONES", unidad: "m", stockActual: 200, stockMinimo: 100, precioPromedio: 1200, ultimaCompra: hace(9), historialPrecios: [{ fecha: hace(48), precio: 1100 }, { fecha: hace(24), precio: 1150 }, { fecha: hace(9), precio: 1200 }] },
  { id: 303, nombre: "Tomacorriente doble", categoria: "INSTALACIONES", unidad: "unidad", stockActual: 35, stockMinimo: 20, precioPromedio: 8500, ultimaCompra: hace(11), historialPrecios: [{ fecha: hace(52), precio: 8000 }, { fecha: hace(30), precio: 8250 }, { fecha: hace(11), precio: 8500 }] },

  // HERRAMIENTAS
  { id: 401, nombre: "Clavo 2½\"", categoria: "HERRAMIENTAS", unidad: "kg", stockActual: 8, precioPromedio: 5000, ultimaCompra: hace(30), historialPrecios: [{ fecha: hace(60), precio: 4500 }, { fecha: hace(45), precio: 4750 }, { fecha: hace(30), precio: 5000 }] },
  { id: 402, nombre: "Tornillo autoperforante 1\"", categoria: "HERRAMIENTAS", unidad: "caja", stockActual: 3, stockMinimo: 5, precioPromedio: 18000, ultimaCompra: hace(45), historialPrecios: [{ fecha: hace(90), precio: 17000 }, { fecha: hace(65), precio: 17500 }, { fecha: hace(45), precio: 18000 }] },
];

let FACTURAS: FacturaCompra[] = [
  // FACTURA PAGADA 1
  {
    id: 1001,
    numero: "F-001-2026",
    proveedorNombre: "Distribuidora Aceros del Valle",
    proveedorRut: "12.345.678-9",
    fecha: hace(30),
    fechaRecepcion: hace(29),
    estado: "PAGADA",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna",
    items: [
      { id: uuidLocal(), materialId: 102, materialNombre: "Acero corrugado #3", unidad: "varilla", cantidad: 100, precioUnitario: 12000, subtotal: 1200000 },
      { id: uuidLocal(), materialId: 103, materialNombre: "Acero corrugado #4", unidad: "varilla", cantidad: 80, precioUnitario: 15000, subtotal: 1200000 },
    ],
    subtotal: 2400000,
    impuesto: 19,
    total: 2856000,
    notas: "Entrega completa, todos los items conformes",
  },

  // FACTURA PAGADA 2
  {
    id: 1002,
    numero: "F-0045-2026",
    proveedorNombre: "Cementos y Hormigones S.A.",
    proveedorRut: "98.765.432-1",
    fecha: hace(20),
    fechaRecepcion: hace(19),
    estado: "PAGADA",
    proyectoId: 2,
    proyectoNombre: "Edificio Comercial",
    items: [
      { id: uuidLocal(), materialId: 101, materialNombre: "Cemento Portland", unidad: "bolsa", cantidad: 200, precioUnitario: 8500, subtotal: 1700000 },
      { id: uuidLocal(), materialId: 104, materialNombre: "Arena gruesa", unidad: "m³", cantidad: 15, precioUnitario: 45000, subtotal: 675000 },
      { id: uuidLocal(), materialId: 105, materialNombre: "Grava / piedra chancada", unidad: "m³", cantidad: 10, precioUnitario: 55000, subtotal: 550000 },
    ],
    subtotal: 2925000,
    impuesto: 19,
    total: 3481750,
    notas: "Materias primas de excelente calidad",
  },

  // FACTURA APROBADA 1
  {
    id: 1003,
    numero: "F-156-2026",
    proveedorNombre: "Acabados y Decoración Integral",
    proveedorRut: "55.555.555-5",
    fecha: hace(10),
    fechaRecepcion: hace(8),
    estado: "APROBADA",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna",
    items: [
      { id: uuidLocal(), materialId: 201, materialNombre: "Cerámica piso 60x60", unidad: "caja", cantidad: 30, precioUnitario: 95000, subtotal: 2850000 },
      { id: uuidLocal(), materialId: 202, materialNombre: "Pintura latex interior", unidad: "galón", cantidad: 8, precioUnitario: 35000, subtotal: 280000 },
    ],
    subtotal: 3130000,
    impuesto: 19,
    total: 3724700,
    notas: "Pendiente de pago, se paga el próximo ciclo",
  },

  // FACTURA APROBADA 2
  {
    id: 1004,
    numero: "F-312-2026",
    proveedorNombre: "Distribuidora Aceros del Valle",
    proveedorRut: "12.345.678-9",
    fecha: hace(5),
    fechaRecepcion: hace(4),
    estado: "APROBADA",
    proyectoId: 3,
    proyectoNombre: "Reforma Casa",
    items: [
      { id: uuidLocal(), materialId: 301, materialNombre: "Tubo PVC 4\" presión", unidad: "m", cantidad: 50, precioUnitario: 8500, subtotal: 425000 },
      { id: uuidLocal(), materialId: 302, materialNombre: "Cable THW 12 AWG", unidad: "m", cantidad: 100, precioUnitario: 1200, subtotal: 120000 },
      { id: uuidLocal(), materialId: 303, materialNombre: "Tomacorriente doble", unidad: "unidad", cantidad: 15, precioUnitario: 8500, subtotal: 127500 },
    ],
    subtotal: 672500,
    impuesto: 19,
    total: 800675,
    notas: "Instalaciones completas para la obra",
  },

  // FACTURA APROBADA 3
  {
    id: 1005,
    numero: "F-099-2026",
    proveedorNombre: "Cementos y Hormigones S.A.",
    proveedorRut: "98.765.432-1",
    fecha: hace(3),
    fechaRecepcion: hace(2),
    estado: "APROBADA",
    proyectoId: 2,
    proyectoNombre: "Edificio Comercial",
    items: [
      { id: uuidLocal(), materialId: 106, materialNombre: "Bloque de concreto 15cm", unidad: "unidad", cantidad: 500, precioUnitario: 2500, subtotal: 1250000 },
    ],
    subtotal: 1250000,
    impuesto: 19,
    total: 1487500,
    notas: "Bloques para estructura interna",
  },

  // FACTURA BORRADOR 1
  {
    id: 1006,
    numero: "F-NEW-1",
    proveedorNombre: "Acabados y Decoración Integral",
    proveedorRut: "55.555.555-5",
    fecha: hace(1),
    estado: "BORRADOR",
    items: [
      { id: uuidLocal(), materialId: 203, materialNombre: "Masilla corriente", unidad: "bolsa", cantidad: 15, precioUnitario: 12000, subtotal: 180000 },
      { id: uuidLocal(), materialId: 204, materialNombre: "Fragua blanca", unidad: "bolsa", cantidad: 8, precioUnitario: 28000, subtotal: 224000 },
    ],
    subtotal: 404000,
    impuesto: 19,
    total: 480760,
    notas: "En revisión para aprobación",
  },

  // FACTURA BORRADOR 2
  {
    id: 1007,
    numero: "F-NEW-2",
    proveedorNombre: "Distribuidora Aceros del Valle",
    proveedorRut: "12.345.678-9",
    fecha: hace(1),
    estado: "BORRADOR",
    items: [
      { id: uuidLocal(), materialId: 401, materialNombre: "Clavo 2½\"", unidad: "kg", cantidad: 5, precioUnitario: 5000, subtotal: 25000 },
      { id: uuidLocal(), materialId: 402, materialNombre: "Tornillo autoperforante 1\"", unidad: "caja", cantidad: 3, precioUnitario: 18000, subtotal: 54000 },
    ],
    subtotal: 79000,
    impuesto: 19,
    total: 94010,
    notas: "Fasteners para proyectos en ejecución",
  },

  // FACTURA ANULADA
  {
    id: 1008,
    numero: "F-CANCEL-1",
    proveedorNombre: "Cementos y Hormigones S.A.",
    proveedorRut: "98.765.432-1",
    fecha: hace(45),
    estado: "ANULADA",
    items: [
      { id: uuidLocal(), materialId: 101, materialNombre: "Cemento Portland", unidad: "bolsa", cantidad: 100, precioUnitario: 8500, subtotal: 850000 },
    ],
    subtotal: 850000,
    impuesto: 19,
    total: 1011500,
    notas: "Anulada por error en cantidad. Reemplazo: F-001-2026",
  },
];

let SECUENCIA_FACTURA = 1009;
let SECUENCIA_MATERIAL = 403;
let SECUENCIA_UNIDAD = 11;
let SECUENCIA_CATEGORIA = 6;

// --- Funciones privadas ---

function nuevoIdFactura(): number {
  return SECUENCIA_FACTURA++;
}

function nuevoIdMaterial(): number {
  return SECUENCIA_MATERIAL++;
}

function nuevoIdUnidad(): number {
  return SECUENCIA_UNIDAD++;
}

function nuevoIdCategoria(): number {
  return SECUENCIA_CATEGORIA++;
}

function calcularFacturasEnMemoria(): FacturaCompra[] {
  return FACTURAS.map((f) => {
    const subtotal = f.items.reduce((sum, item) => sum + item.subtotal, 0);
    const impuesto = f.impuesto ? (subtotal * f.impuesto) / 100 : 0;
    return {
      ...f,
      subtotal,
      total: subtotal + impuesto,
    };
  });
}

// --- API Pública ---

export async function getFacturas(): Promise<FacturaCompra[]> {
  return delay(calcularFacturasEnMemoria());
}

export async function getFactura(id: number): Promise<FacturaCompra> {
  const f = FACTURAS.find((x) => x.id === id);
  if (!f) throw new Error(`Factura ${id} no encontrada`);
  const subtotal = f.items.reduce((sum, item) => sum + item.subtotal, 0);
  const impuesto = f.impuesto ? (subtotal * f.impuesto) / 100 : 0;
  return delay({ ...f, subtotal, total: subtotal + impuesto });
}

export async function createFactura(values: FacturaFormValues): Promise<FacturaCompra> {
  const items: LineaFactura[] = values.items.map((item) => {
    const material = MATERIALES.find((m) => m.id === item.materialId);
    if (!material) throw new Error(`Material ${item.materialId} no encontrado`);
    return {
      id: uuidLocal(),
      materialId: item.materialId,
      materialNombre: material.nombre,
      unidad: material.unidad,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.cantidad * item.precioUnitario,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const impuesto = values.impuesto ? (subtotal * values.impuesto) / 100 : 0;

  const nueva: FacturaCompra = {
    id: nuevoIdFactura(),
    numero: values.numero,
    proveedorNombre: values.proveedorNombre,
    proveedorRut: values.proveedorRut,
    fecha: values.fecha,
    fechaRecepcion: values.fechaRecepcion,
    estado: "BORRADOR",
    proyectoId: values.proyectoId,
    proyectoNombre: undefined, // se buscaría en backend
    items,
    subtotal,
    impuesto: values.impuesto,
    total: subtotal + impuesto,
    notas: values.notas,
  };

  FACTURAS.push(nueva);
  return delay(nueva);
}

export async function updateEstadoFactura(id: number, estado: EstadoFactura): Promise<FacturaCompra> {
  const f = FACTURAS.find((x) => x.id === id);
  if (!f) throw new Error(`Factura ${id} no encontrada`);

  f.estado = estado;

  // Si se aprueba, actualizar stock de materiales
  if (estado === "APROBADA") {
    f.items.forEach((item) => {
      const material = MATERIALES.find((m) => m.id === item.materialId);
      if (material) {
        material.stockActual += item.cantidad;
        material.ultimaCompra = new Date().toISOString();
      }
    });
  }

  return delay(f);
}

export async function anularFactura(id: number): Promise<void> {
  const factura = FACTURAS.find((f) => f.id === id);
  if (factura) {
    factura.estado = "ANULADA";
  }
  return delay(undefined);
}

export async function getMateriales(): Promise<MaterialConEstado[]> {
  return delay(
    MATERIALES.map((m) => ({
      ...m,
      estadoStock: calcularEstadoStock(m.stockActual, m.stockMinimo),
      valorTotalStock: m.stockActual * m.precioPromedio,
    }))
  );
}

export async function getResumenInventario(): Promise<InventarioResumen> {
  const facturasActivas = FACTURAS.filter((f) => f.estado !== "ANULADA");
  const resumen = calcularInventarioResumen(facturasActivas, MATERIALES);
  return delay(resumen);
}

export async function createMaterial(nombre: string, categoria: CategoriaItem, unidad: string, stockMinimo?: number, precioPromedio?: number): Promise<MaterialCatalogo> {
  const nueva: MaterialCatalogo = {
    id: nuevoIdMaterial(),
    nombre,
    categoria,
    unidad,
    stockActual: 0,
    stockMinimo: stockMinimo || undefined,
    precioPromedio: precioPromedio || 0,
  };
  MATERIALES.push(nueva);
  return delay(nueva);
}

export async function getUnidades(): Promise<UnidadDeMedida[]> {
  return delay(UNIDADES);
}

export async function createUnidad(nombre: string, abreviatura: string): Promise<UnidadDeMedida> {
  const nueva: UnidadDeMedida = {
    id: nuevoIdUnidad(),
    nombre,
    abreviatura,
  };
  UNIDADES.push(nueva);
  return delay(nueva);
}

export async function getCategorias(): Promise<Categoria[]> {
  return delay(CATEGORIAS);
}

export async function createCategoria(nombre: string, etiqueta: string): Promise<Categoria> {
  const nueva: Categoria = {
    id: nuevoIdCategoria(),
    nombre: nombre.toUpperCase(),
    etiqueta,
  };
  CATEGORIAS.push(nueva);
  return delay(nueva);
}

// ─── Helper para Obras (side effect de reporte diario) ───────────────────────

export function decrementarStock(materialId: number, cantidad: number): void {
  const material = MATERIALES.find((m) => m.id === materialId);
  if (!material) throw new Error(`Material ${materialId} no encontrado`);
  material.stockActual = Math.max(0, material.stockActual - cantidad);
}
