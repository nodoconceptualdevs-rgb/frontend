/**
 * Lógica de cálculo para el módulo de Inventario.
 *
 * Estas funciones se pueden mover al backend (Strapi) en un lifecycle hook
 * para garantizar consistencia. Por ahora viven en el frontend.
 */

import type { FacturaCompra, EstadoStock, InventarioResumen, MaterialCatalogo } from "@/types/inventario";

export function calcularEstadoStock(actual: number, minimo?: number): EstadoStock {
  // Si no tiene mínimo definido, no hay alarma
  if (!minimo || minimo === 0) return "NORMAL";

  if (actual === 0) return "SIN_STOCK";
  if (actual < minimo / 2) return "CRITICO";
  if (actual < minimo) return "BAJO";
  return "NORMAL";
}

export function calcularInventarioResumen(
  facturas: FacturaCompra[],
  materiales: MaterialCatalogo[]
): InventarioResumen {
  const pagadas = facturas.filter((f) => f.estado === "PAGADA");
  const aprobadas = facturas.filter((f) => f.estado === "APROBADA");
  const bajoMinimo = materiales.filter((m) => m.stockActual < m.stockMinimo).length;
  const valorTotal = materiales.reduce((sum, m) => sum + m.stockActual * m.precioPromedio, 0);

  return {
    totalFacturas: facturas.length,
    montoPagado: pagadas.reduce((sum, f) => sum + f.total, 0),
    montoPendiente: aprobadas.reduce((sum, f) => sum + f.total, 0),
    totalMateriales: materiales.length,
    materialesBajoMinimo: bajoMinimo,
    valorTotalStock: valorTotal,
  };
}

export function calcularStockYPrecio(
  stockActual: number,
  stockMinimo: number,
  precioPromedio: number
) {
  return {
    estadoStock: calcularEstadoStock(stockActual, stockMinimo),
    valorTotal: stockActual * precioPromedio,
  };
}
