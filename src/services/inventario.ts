import api from "@/lib/api";
import { calcularEstadoStock } from "@/lib/inventario";
import type {
  EstadoFactura,
  FacturaCompra,
  FacturaFormValues,
  InventarioResumen,
  LineaFactura,
  MaterialCatalogo,
  MaterialConEstado,
  Herramienta,
  HerramientaFormValues,
} from "@/types/inventario";

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapLinea(raw: any): LineaFactura {
  return {
    id: String(raw.id),
    materialId: raw.materialId,
    materialNombre: raw.materialNombre,
    unidad: raw.unidad,
    cantidad: raw.cantidad,
    precioUnitario: raw.precioUnitario,
    subtotal: raw.subtotal,
  };
}

function mapFactura(raw: any): FacturaCompra {
  return {
    id: raw.id,
    documentId: raw.documentId,
    numero: raw.numero,
    proveedorNombre: raw.proveedorNombre ?? raw.proveedor?.nombre ?? "",
    proveedorRut: raw.proveedorRut ?? raw.proveedor?.rut ?? undefined,
    proveedorId: raw.proveedor?.id ?? undefined,
    fecha: raw.fecha,
    fechaRecepcion: raw.fechaRecepcion ?? undefined,
    estado: raw.estado as EstadoFactura,
    proyectoId: raw.proyectoId ?? undefined,
    proyectoNombre: raw.proyectoNombre ?? undefined,
    obraId: raw.obraId ?? undefined,
    items: (raw.items ?? []).map(mapLinea),
    subtotal: raw.subtotal ?? 0,
    impuesto: raw.impuesto ?? undefined,
    total: raw.total ?? 0,
    notas: raw.notas ?? undefined,
    archivoPdf: raw.archivoPdf ?? undefined,
    inhabilitada: raw.inhabilitada ?? false,
  };
}

function mapMaterial(raw: any): MaterialConEstado {
  const stockActual = raw.stockActual ?? 0;
  const stockMinimo = raw.stockMinimo ?? undefined;
  const precioPromedio = raw.precioPromedio ?? 0;
  return {
    id: raw.id,
    documentId: raw.documentId,
    codigo: raw.codigo ?? undefined,
    nombre: raw.nombre,
    categoria: raw.categoria,
    unidad: raw.unidad,
    stockActual,
    stockMinimo,
    precioPromedio,
    ultimaCompra: raw.ultimaCompra ?? undefined,
    historialPrecios: (raw.historialPrecios ?? []).map((h: any) => ({
      fecha: h.fecha,
      precio: h.precio,
      cantidad: h.cantidad ?? undefined,
    })),
    proyectoId: raw.proyectoId ?? undefined,
    proyectoNombre: raw.proyectoNombre ?? undefined,
    estadoStock: calcularEstadoStock(stockActual, stockMinimo),
    valorTotalStock: stockActual * precioPromedio,
  };
}

function mapHerramienta(raw: any): Herramienta {
  return {
    id: raw.id,
    documentId: raw.documentId,
    codigo: raw.codigo ?? undefined,
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? undefined,
    categoria: raw.categoria,
    serie: raw.serie ?? undefined,
    marca: raw.marca ?? undefined,
    unidad: raw.unidad ?? undefined,
    ubicacionDeposito: raw.ubicacionDeposito ?? undefined,
    cantidad: raw.cantidad ?? 1,
    fechaAdquisicion: raw.fechaAdquisicion ?? undefined,
    estado: raw.estado,
    ultimoUsoDatos: raw.ultimoUsoObraId
      ? {
          fecha: raw.ultimoUsoFecha,
          obraId: raw.ultimoUsoObraId,
          obraNombre: raw.ultimoUsoObraNombre ?? "",
        }
      : undefined,
  };
}

// ─── Facturas ────────────────────────────────────────────────────────────────

export async function getFacturas(): Promise<FacturaCompra[]> {
  const res = await api.get(
    "/factura-compras?populate[items]=true&populate[proveedor]=true&sort=fecha:desc"
  );
  return (res.data.data as any[]).map(mapFactura);
}

export async function getFactura(id: number): Promise<FacturaCompra> {
  const res = await api.get(
    `/factura-compras/${id}?populate[items]=true&populate[proveedor]=true`
  );
  return mapFactura(res.data.data);
}

export async function getFacturasByObra(obraId: number): Promise<FacturaCompra[]> {
  const res = await api.get(`/obras/${obraId}/factura-compras`);
  return (res.data.data as any[]).map(mapFactura);
}

export async function createFactura(values: FacturaFormValues): Promise<FacturaCompra> {
  // Validaciones
  if (!values.proveedorNombre) throw new Error("Proveedor es requerido");
  if (!values.items || values.items.length === 0) throw new Error("Debe agregar al menos un ítem");

  // Sin obra: la compra queda como stock general de Nodo, sin proyecto asociado
  let proyectoId = values.proyectoId;
  let proyectoNombre = values.proyectoNombre;
  if (values.obraId && !proyectoId) {
    const obraRes = await api.get(`/obras?filters[id][$eq]=${values.obraId}&populate[proyecto]=*`);
    const obraData = (obraRes.data.data as any[])?.find((o) => o.id === values.obraId);
    proyectoId = obraData?.proyecto?.id ?? undefined;
    proyectoNombre = obraData?.proyecto?.nombre_proyecto ?? undefined;
  }

  // Resolver nombres de materiales antes de enviar
  const materialIds = values.items.map((i) => i.materialId);
  const inParams = materialIds.map((id, i) => `filters[id][$in][${i}]=${id}`).join("&");
  const mRes = await api.get(`/material-catalogos?${inParams}`);
  const materiales: any[] = mRes.data.data ?? [];

  const items = values.items.map((item) => {
    const mat = materiales.find((m: any) => m.id === item.materialId);
    if (!mat) throw new Error(`Material ${item.materialId} no encontrado`);
    return {
      materialId: item.materialId,
      materialNombre: mat.nombre,
      unidad: mat.unidad,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.cantidad * item.precioUnitario,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const impuesto = values.impuesto ? (subtotal * values.impuesto) / 100 : 0;

  const payload: any = {
    numero: values.numero,
    proveedorNombre: values.proveedorNombre,
    proveedorRut: values.proveedorRut,
    fecha: values.fecha,
    fechaRecepcion: values.fechaRecepcion,
    impuesto: values.impuesto,
    notas: values.notas,
    subtotal,
    total: subtotal + impuesto,
    estado: "APROBADA",
    items,
  };

  if (values.proveedorId) {
    payload.proveedor = values.proveedorId;
  }

  // Con obra: queda vinculada a esa obra y a su proyecto (endpoint anidado).
  // Sin obra: compra directa al inventario general de Nodo (endpoint plano).
  if (values.obraId) {
    payload.proyectoId = proyectoId;
    payload.proyectoNombre = proyectoNombre;
    payload.obraId = values.obraId;
    const res = await api.post(`/obras/${values.obraId}/factura-compras`, { data: payload });
    return mapFactura(res.data.data);
  }

  const res = await api.post(`/factura-compras`, { data: payload });
  return mapFactura(res.data.data);
}

export async function updateFactura(id: number, values: Partial<FacturaFormValues>): Promise<FacturaCompra> {
  const res = await api.put(`/factura-compras/${id}`, { data: values });
  return mapFactura(res.data.data);
}

export async function updateEstadoFactura(id: number, estado: EstadoFactura): Promise<FacturaCompra> {
  const res = await api.patch(`/factura-compras/${id}/estado`, { estado });
  return mapFactura(res.data.data);
}

export async function anularFactura(id: number): Promise<void> {
  await api.patch(`/factura-compras/${id}/anular`);
}

export async function inhabilitarFactura(id: number): Promise<void> {
  await api.patch(`/factura-compras/${id}/inhabilitar`);
}

// ─── Materiales ───────────────────────────────────────────────────────────────

export async function getMateriales(): Promise<MaterialConEstado[]> {
  const res = await api.get(
    "/material-catalogos?populate[historialPrecios]=true&sort=nombre:asc"
  );
  return (res.data.data as any[]).map(mapMaterial);
}

export async function createMaterial(
  nombre: string,
  categoria: string,
  unidad: string,
  stockMinimo?: number,
  precioPromedio?: number,
  codigo?: string
): Promise<MaterialCatalogo> {
  const res = await api.post("/material-catalogos", {
    data: {
      codigo: codigo || undefined,
      nombre,
      categoria,
      unidad,
      stockActual: 0,
      stockMinimo: stockMinimo || undefined,
      precioPromedio: precioPromedio ?? 0,
    },
  });
  return mapMaterial(res.data.data);
}

export async function updateMaterial(
  documentId: string,
  nombre: string,
  categoria: string,
  unidad: string,
  stockMinimo?: number,
  precioPromedio?: number,
  codigo?: string
): Promise<MaterialCatalogo> {
  const res = await api.put(`/material-catalogos/${documentId}`, {
    data: {
      codigo: codigo || undefined,
      nombre,
      categoria,
      unidad,
      stockMinimo: stockMinimo || undefined,
      precioPromedio: precioPromedio ?? 0,
    },
  });
  return mapMaterial(res.data.data);
}

export async function deleteMaterial(documentId: string): Promise<void> {
  await api.delete(`/material-catalogos/${documentId}`);
}

export async function deleteMaterialsMasivo(documentIds: string[]): Promise<void> {
  await Promise.all(
    documentIds.map(docId => api.delete(`/material-catalogos/${docId}`))
  );
}

export async function decrementarStock(materialId: number, cantidad: number): Promise<void> {
  await api.post(`/material-catalogos/${materialId}/decrementar`, { cantidad });
}

export async function incrementarStock(materialId: number, cantidad: number): Promise<void> {
  await api.post(`/material-catalogos/${materialId}/incrementar`, { cantidad });
}

export async function generarCodigoMaterial(materialId: number): Promise<MaterialCatalogo> {
  const res = await api.patch(`/material-catalogos/${materialId}/generar-codigo`);
  return mapMaterial(res.data.data);
}

// ─── Resumen ─────────────────────────────────────────────────────────────────

export async function getResumenInventario(): Promise<InventarioResumen> {
  const res = await api.get("/inventario/resumen");
  return res.data.data as InventarioResumen;
}

export interface DistribucionFila {
  materialId: number;
  obraId: number | null; // null = Inventario General de Nodo
  obraNombre: string | null;
  cantidad: number;
}

export interface DistribucionInventario {
  obras: { id: number; nombre: string }[];
  filas: DistribucionFila[];
}

export async function getDistribucionInventario(): Promise<DistribucionInventario> {
  const res = await api.get("/inventario/distribucion");
  return res.data.data as DistribucionInventario;
}

// ─── Herramientas ────────────────────────────────────────────────────────────

export async function getHerramientas(): Promise<Herramienta[]> {
  const res = await api.get("/herramientas?sort=nombre:asc");
  return (res.data.data as any[]).map(mapHerramienta);
}

export async function getHerramienta(id: number): Promise<Herramienta> {
  const res = await api.get(`/herramientas/${id}`);
  return mapHerramienta(res.data.data);
}

export async function createHerramienta(values: HerramientaFormValues): Promise<Herramienta> {
  const res = await api.post("/herramientas", { data: values });
  return mapHerramienta(res.data.data);
}

export async function updateHerramienta(
  documentId: string,
  values: Partial<HerramientaFormValues>
): Promise<Herramienta> {
  const res = await api.put(`/herramientas/${documentId}`, { data: values });
  return mapHerramienta(res.data.data);
}

export async function updateEstadoHerramienta(
  id: number,
  estado: Herramienta["estado"],
  obraData?: { obraId: number; obraNombre: string }
): Promise<Herramienta> {
  const res = await api.patch(`/herramientas/${id}/estado`, { estado, ...obraData });
  return mapHerramienta(res.data.data);
}

export async function generarCodigoHerramienta(id: number): Promise<Herramienta> {
  const res = await api.patch(`/herramientas/${id}/generar-codigo`);
  return mapHerramienta(res.data.data);
}

export async function deleteHerramienta(documentId: string): Promise<void> {
  await api.delete(`/herramientas/${documentId}`);
}

export async function deleteHerramientasMasivo(documentIds: string[]): Promise<void> {
  await Promise.all(
    documentIds.map(docId => api.delete(`/herramientas/${docId}`))
  );
}

// ─── Categorías de Materiales ────────────────────────────────────────────────

export async function getCategorias(): Promise<{ id: number; documentId: string; nombre: string; etiqueta: string }[]> {
  const res = await api.get("/categoria-materiales?sort=nombre:asc");
  return (res.data.data as any[]).map((r) => ({
    id: r.id,
    documentId: r.documentId,
    nombre: r.nombre,
    etiqueta: r.etiqueta,
  }));
}

export async function createCategoria(nombre: string): Promise<{ id: number; documentId: string; nombre: string; etiqueta: string }> {
  const res = await api.post("/categoria-materiales", { data: { nombre } });
  const d = res.data.data;
  return { id: d.id, documentId: d.documentId, nombre: d.nombre, etiqueta: d.etiqueta };
}

export async function deleteCategoria(documentId: string): Promise<void> {
  await api.delete(`/categoria-materiales/${documentId}`);
}

// ─── Unidades de Medida ───────────────────────────────────────────────────────

export async function getUnidades(): Promise<{ id: number; documentId: string; nombre: string; abreviatura: string }[]> {
  const res = await api.get("/unidad-medidas?sort=nombre:asc");
  return (res.data.data as any[]).map((r) => ({
    id: r.id,
    documentId: r.documentId,
    nombre: r.nombre,
    abreviatura: r.abreviatura ?? r.nombre,
  }));
}

export async function createUnidad(nombre: string, abreviatura?: string): Promise<{ id: number; documentId: string; nombre: string; abreviatura: string }> {
  const res = await api.post("/unidad-medidas", { data: { nombre, abreviatura } });
  const d = res.data.data;
  return { id: d.id, documentId: d.documentId, nombre: d.nombre, abreviatura: d.abreviatura ?? nombre };
}

export async function deleteUnidad(documentId: string): Promise<void> {
  await api.delete(`/unidad-medidas/${documentId}`);
}

// ─── Categorías de Herramientas ───────────────────────────────────────────────

export async function getCategoriasHerramienta(): Promise<{ id: number; documentId: string; nombre: string }[]> {
  const res = await api.get("/categoria-herramientas?sort=nombre:asc");
  return (res.data.data as any[]).map((r) => ({
    id: r.id,
    documentId: r.documentId,
    nombre: r.nombre,
  }));
}

export async function createCategoriaHerramienta(nombre: string): Promise<{ id: number; documentId: string; nombre: string }> {
  const res = await api.post("/categoria-herramientas", { data: { nombre } });
  const d = res.data.data;
  return { id: d.id, documentId: d.documentId, nombre: d.nombre };
}

export async function deleteCategoriaHerramienta(documentId: string): Promise<void> {
  await api.delete(`/categoria-herramientas/${documentId}`);
}

// ─── Ubicaciones en Depósito ───────────────────────────────────────────────────

export async function getUbicacionesDeposito(): Promise<{ id: number; documentId: string; nombre: string }[]> {
  const res = await api.get("/ubicacion-depositos?sort=nombre:asc");
  return (res.data.data as any[]).map((r) => ({
    id: r.id,
    documentId: r.documentId,
    nombre: r.nombre,
  }));
}

export async function createUbicacionDeposito(nombre: string): Promise<{ id: number; documentId: string; nombre: string }> {
  const res = await api.post("/ubicacion-depositos", { data: { nombre } });
  const d = res.data.data;
  return { id: d.id, documentId: d.documentId, nombre: d.nombre };
}

export async function deleteUbicacionDeposito(documentId: string): Promise<void> {
  await api.delete(`/ubicacion-depositos/${documentId}`);
}
