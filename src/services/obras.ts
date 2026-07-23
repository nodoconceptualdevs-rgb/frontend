import api from "@/lib/api";

const STRAPI_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://backend-production-2ce7.up.railway.app/api").replace(/\/api$/, "");
const toAbsoluteUrl = (url: string) => (url?.startsWith("http") ? url : `${STRAPI_BASE}${url}`);
import {
  Obra,
  ObraFormValues,
  Partida,
  PartidaFormValues,
  ReporteDiario,
  ReporteFormValues,
  Personal,
  PersonalFormValues,
  ObrasResumen,
  MaterialDisponible,
  ValuacionFinal,
  ValuacionDoc,
  ValuacionFormValues,
  EstadoObra,
} from "@/types/obras";
import {
  calcularMontoPresupuestado,
  calcularMontoEjecutado,
  calcularAvancePartida,
  calcularResumenObras,
  calcularValuacion,
  calcularValuacionDocConReportes,
  calcularCostoManoObra,
  calcularCostoMateriales,
} from "@/lib/obras";
import dayjs from "dayjs";
import { decrementarStock } from "./inventario";
import { calcularEstadoStock } from "@/lib/inventario";

// ─── Datos Semilla ────────────────────────────────────────────────────────────

const hace = (dias: number) => dayjs().subtract(dias, "days").toISOString();
const dentro = (dias: number) => dayjs().add(dias, "days").toISOString();

// ─── Helpers para seed ────────────────────────────────────────────────────────
const p = (id: string, pId: string, nomId: string, nom: string, cargo: string, hrs: number, cph: number) => ({
  id, personalId: Number(pId), personalNombre: nom, cargo, horasTrabajadas: hrs, costoPorHora: cph, subtotal: hrs * cph,
});
const m = (id: string, mId: string, nomId: string, nom: string, ud: string, cant: number, pu: number) => ({
  id, materialId: Number(mId), materialNombre: nom, unidad: ud, cantidad: cant, precioUnitario: pu, subtotal: cant * pu,
});


// ─── Helpers ──────────────────────────────────────────────────────────────────

const uuidLocal = () => Math.random().toString(36).slice(2, 11);

// ─── Helper para mapear respuesta Strapi a tipo Obra ─────────────────────────
function mapStrapiObra(item: any): Obra {
  const partidas = (item.partidas || []).map((p: any) => ({
    id: p.id,
    obraId: item.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    unidad: p.unidad,
    cantidadPresupuestada: p.cantidadPresupuestada || 0,
    precioUnitario: p.precioUnitario || 0,
    montoPresupuestado: p.montoPresupuestado || 0,
    cantidadEjecutada: p.cantidadEjecutada || 0,
    montoEjecutado: p.montoEjecutado || 0,
    avancePorcentaje: p.avancePorcentaje || 0,
    esExtra: p.esExtra || false,
  }));

  return {
    id: item.id,
    documentId: item.documentId,
    nombre: item.nombre,
    proyectoId: item.proyecto?.id ?? undefined,
    proyectoNombre: item.proyecto?.nombre_proyecto ?? undefined,
    gerentes: (item.gerentes || []).map((g: any) => ({
      id: g.id,
      username: g.username,
      email: g.email,
      name: g.name,
    })),
    capatazId: undefined,
    capatazNombre: undefined,
    estado: item.estado,
    fechaInicio: item.fecha_inicio,
    fechaFinPlanificada: item.fecha_fin_planificada,
    fechaFinReal: item.fecha_fin_real ?? undefined,
    presupuestoTotal: item.presupuesto_total,
    presupuestoConsumido: item.presupuesto_consumido ?? 0,
    notas: item.notas,
    creadoEn: item.createdAt,
    partidas,
    reportes: [],
  };
}

// ─── Obras CRUD ───────────────────────────────────────────────────────────────

export async function getObras(): Promise<Obra[]> {
  try {
    const res = await api.get('/obras?populate[proyecto]=*');
    return res.data.data.map(mapStrapiObra);
  } catch (error) {
    console.error('Error fetching obras:', error);
    throw error;
  }
}

export async function getObra(id: number): Promise<Obra> {
  try {
    const res = await api.get(`/obras?filters[id][$eq]=${id}&populate[proyecto]=*&pagination[pageSize]=1`);
    const items: any[] = res.data.data ?? [];
    // Explicitly match by id in case Strapi v5 filter is not applied
    const item = items.find((o: any) => o.id === id) ?? items[0];
    if (!item) throw new Error(`Obra ${id} no encontrada`);
    if (item.id !== id) throw new Error(`Obra ${id} no encontrada`);
    return mapStrapiObra(item);
  } catch (error) {
    console.error('Error fetching obra:', error);
    throw error;
  }
}

export async function createObra(values: ObraFormValues): Promise<Obra> {
  try {
    const res = await api.post('/obras', {
      data: {
        nombre: values.nombre,
        proyecto: values.proyectoId ?? null,
        gerentes: values.gerentesIds ?? [],
        estado: values.estado,
        fecha_inicio: values.fechaInicio,
        fecha_fin_planificada: values.fechaFinPlanificada,
        presupuesto_total: values.presupuestoTotal,
        presupuesto_consumido: 0,
        notas: values.notas,
      }
    });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error creating obra:', error);
    throw error;
  }
}

export async function updateObra(
  documentId: string,
  values: Partial<ObraFormValues>
): Promise<Obra> {
  try {
    const res = await api.put(`/obras/${documentId}`, {
      data: {
        ...(values.nombre && { nombre: values.nombre }),
        ...(values.estado && { estado: values.estado }),
        ...(values.fechaInicio && { fecha_inicio: values.fechaInicio }),
        ...(values.fechaFinPlanificada && { fecha_fin_planificada: values.fechaFinPlanificada }),
        ...(values.presupuestoTotal !== undefined && { presupuesto_total: values.presupuestoTotal }),
        ...(values.notas !== undefined && { notas: values.notas }),
      }
    });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error updating obra:', error);
    throw error;
  }
}

export async function updateEstadoObra(
  documentId: string,
  estado: EstadoObra
): Promise<Obra> {
  try {
    const data: any = { estado };
    if (estado === "COMPLETADA") {
      data.fecha_fin_real = new Date().toISOString();
    }
    const res = await api.put(`/obras/${documentId}`, { data });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error updating estado obra:', error);
    throw error;
  }
}

export async function getResumenObras(): Promise<ObrasResumen> {
  const obras = await getObras();
  // Convertir obras reales a formato esperado por calcularResumenObras
  const obrasConReportes: Obra[] = obras.map(o => ({
    ...o,
    reportes: o.reportes || []
  }));
  const resumen = calcularResumenObras(obrasConReportes);
  return resumen;
}

// ─── Partidas ─────────────────────────────────────────────────────────────────

export async function getPartidas(obraId: number): Promise<Partida[]> {
  try {
    const res = await api.get(`/obras/${obraId}/partidas`);
    return (res.data.data || []).map((p: any) => ({ ...p, obraId, partidaOriginalId: p.partidaOriginalId ?? undefined }));
  } catch (error) {
    console.error('Error fetching partidas:', error);
    throw error;
  }
}

export async function createPartida(
  obraId: number,
  values: PartidaFormValues
): Promise<Partida> {
  try {
    const montoPresupuestado = values.cantidadPresupuestada * values.precioUnitario;
    const res = await api.post(`/obras/${obraId}/partidas`, {
      data: {
        codigo: values.codigo,
        descripcion: values.descripcion,
        unidad: values.unidad,
        cantidadPresupuestada: values.cantidadPresupuestada,
        precioUnitario: values.precioUnitario,
        montoPresupuestado,
        esExtra: values.esExtra || false,
        ...(values.partidaOriginalId !== undefined && { partidaOriginalId: values.partidaOriginalId }),
      }
    });
    return res.data.data;
  } catch (error) {
    console.error('Error creating partida:', error);
    throw error;
  }
}

export async function updatePartida(
  obraId: number,
  partidaId: number,
  values: Partial<PartidaFormValues>
): Promise<Partida> {
  try {
    const montoPresupuestado = values.cantidadPresupuestada && values.precioUnitario
      ? values.cantidadPresupuestada * values.precioUnitario
      : undefined;

    const res = await api.put(`/obras/${obraId}/partidas/${partidaId}`, {
      data: {
        ...(values.codigo && { codigo: values.codigo }),
        ...(values.descripcion && { descripcion: values.descripcion }),
        ...(values.unidad && { unidad: values.unidad }),
        ...(values.cantidadPresupuestada !== undefined && { cantidadPresupuestada: values.cantidadPresupuestada }),
        ...(values.precioUnitario !== undefined && { precioUnitario: values.precioUnitario }),
        ...(montoPresupuestado !== undefined && { montoPresupuestado }),
        ...(values.esExtra !== undefined && { esExtra: values.esExtra })
      }
    });
    return res.data.data;
  } catch (error) {
    console.error('Error updating partida:', error);
    throw error;
  }
}

export async function deletePartida(
  obraId: number,
  partidaId: number
): Promise<void> {
  try {
    await api.delete(`/obras/${obraId}/partidas/${partidaId}`);
  } catch (error) {
    console.error('Error deleting partida:', error);
    throw error;
  }
}

export async function getHistorialPrecios(partidaId: number): Promise<import('@/types/obras').PrecioHistorial[]> {
  const res = await api.get(`/partidas/${partidaId}/historial-precios`);
  return (res.data.data ?? []).map((d: any) => ({
    id: d.id,
    precio: d.precio,
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.fecha_fin ?? null,
  }));
}

// ─── Cache de Personal y Materiales (para resolver datos en createReporte) ────

let personalCache: Personal[] = [];
let materialesCache: Array<{ id: number; nombre: string; unidad: string }> = [];

async function ensurePersonalCache(obraId: number): Promise<void> {
  if (personalCache.length === 0) {
    personalCache = await getPersonal(obraId);
  }
}

async function ensureMaterialesCache(): Promise<void> {
  if (materialesCache.length === 0) {
    const mats = await getMaterialesDisponibles();
    materialesCache = mats.map((m) => ({ id: m.materialId, nombre: m.materialNombre, unidad: m.unidad }));
  }
}

// ─── Reportes ─────────────────────────────────────────────────────────────────

function mapStrapiReporte(r: any, obraId: number): ReporteDiario {
  return {
    id: r.id,
    obraId,
    obraNombre: r.obraNombre || '',
    partidaId: r.partidaId ?? r.partida?.id ?? 0,
    partidaCodigo: r.partidaCodigo || '',
    partidaDescripcion: r.partidaDescripcion || '',
    fecha: r.fecha,
    avanceLogrado: r.avanceLogrado ?? 0,
    montoAplicado: r.montoAplicado ?? 0,
    observaciones: r.observaciones || '',
    personal: r.personal || [],
    materiales: r.materiales || [],
    costoManoObra: r.costoManoObra ?? 0,
    costoMateriales: r.costoMateriales ?? 0,
    costoTotal: r.costoTotal ?? 0,
    creadoEn: r.createdAt || r.fecha,
    valuacionId: r.valuacionId ?? undefined,
    imagenes: (r.imagenes || []).map((img: any) => ({ ...img, url: toAbsoluteUrl(img.url) })),
  };
}

export async function getReportes(obraId: number): Promise<ReporteDiario[]> {
  try {
    const res = await api.get(`/obras/${obraId}/reportes`);
    return (res.data.data || []).map((r: any) => mapStrapiReporte(r, obraId));
  } catch (error) {
    console.error('Error fetching reportes:', error);
    throw error;
  }
}

export async function createReporte(values: ReporteFormValues): Promise<ReporteDiario> {
  await ensurePersonalCache(values.obraId);
  await ensureMaterialesCache();

  // Resolve personal names/costs from cache
  const personal = values.personal.map((lp) => {
    const per = personalCache.find((p) => p.id === lp.personalId);
    if (!per) throw new Error(`Personal ${lp.personalId} no encontrado`);
    const subtotal = lp.horasTrabajadas * per.costoPorHora;
    return {
      id: uuidLocal(),
      personalId: lp.personalId,
      personalNombre: per.nombre,
      cargo: per.cargo,
      horasTrabajadas: lp.horasTrabajadas,
      costoPorHora: per.costoPorHora,
      subtotal,
    };
  });

  // Resolve material names/units and decrement stock
  const materiales = values.materiales.map((lm) => {
    const material = materialesCache.find((m) => m.id === lm.materialId);
    if (!material) throw new Error(`Material ${lm.materialId} no encontrado`);
    decrementarStock(lm.materialId, lm.cantidad);
    const subtotal = lm.cantidad * lm.precioUnitario;
    return {
      id: uuidLocal(),
      materialId: lm.materialId,
      materialNombre: material.nombre,
      unidad: material.unidad,
      cantidad: lm.cantidad,
      precioUnitario: lm.precioUnitario,
      subtotal,
    };
  });

  const costoManoObra = calcularCostoManoObra(personal);
  const costoMateriales = calcularCostoMateriales(materiales);
  const costoTotal = costoManoObra + costoMateriales;

  try {
    const formData = new FormData();

    // Agregar datos del reporte
    formData.append('data', JSON.stringify({
      partidaId: values.partidaId,
      fecha: values.fecha,
      montoAplicado: values.montoAplicado,
      observaciones: values.observaciones,
      personal,
      materiales,
      costoManoObra,
      costoMateriales,
      costoTotal,
      existingImageIds: values.existingImageIds || [],
    }));

    // Agregar imágenes si existen
    if (values.imagenesArchivos && values.imagenesArchivos.length > 0) {
      console.log('📸 Enviando', values.imagenesArchivos.length, 'imagen(es)...');
      values.imagenesArchivos.forEach((file, idx) => {
        formData.append(`files.imagenes`, file);
      });
    }

    const res = await api.post(`/obras/${values.obraId}/reportes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Respuesta del reporte:', res.data.data);
    return mapStrapiReporte(res.data.data, values.obraId);
  } catch (error) {
    console.error('Error creating reporte:', error);
    throw error;
  }
}

export async function deleteReporte(obraId: number, reporteId: number): Promise<void> {
  try {
    await api.delete(`/obras/${obraId}/reportes/${reporteId}`);
  } catch (error) {
    console.error('Error deleting reporte:', error);
    throw error;
  }
}

// ─── Personal ─────────────────────────────────────────────────────────────────

function mapStrapiPersonal(item: any): Personal {
  return {
    id: item.id,
    nombre: item.attributes?.nombre ?? item.nombre,
    cargo: item.attributes?.cargo ?? item.cargo,
    costoPorHora: item.attributes?.costoPorHora ?? item.costoPorHora,
  };
}

export async function getPersonal(obraId: number): Promise<Personal[]> {
  try {
    const res = await api.get(`/obras/${obraId}/personal`);
    const result = (res.data.data as any[]).map(mapStrapiPersonal);
    personalCache = result;
    return result;
  } catch (error) {
    console.error('Error fetching personal:', error);
    throw error;
  }
}

export async function createPersonal(obraId: number, values: PersonalFormValues): Promise<Personal> {
  try {
    const res = await api.post(`/obras/${obraId}/personal`, { data: values });
    const item = mapStrapiPersonal(res.data.data);
    personalCache = [];
    return item;
  } catch (error) {
    console.error('Error creating personal:', error);
    throw error;
  }
}

export async function updatePersonal(
  obraId: number,
  id: number,
  values: Partial<PersonalFormValues>
): Promise<Personal> {
  try {
    const res = await api.put(`/obras/${obraId}/personal/${id}`, { data: values });
    const item = mapStrapiPersonal(res.data.data);
    personalCache = [];
    return item;
  } catch (error) {
    console.error('Error updating personal:', error);
    throw error;
  }
}

export async function deletePersonal(obraId: number, id: number): Promise<void> {
  try {
    await api.delete(`/obras/${obraId}/personal/${id}`);
    personalCache = [];
  } catch (error) {
    console.error('Error deleting personal:', error);
    throw error;
  }
}

// ─── Valuaciones ──────────────────────────────────────────────────────────────

function mapStrapiValuacion(v: any, obraId: number): ValuacionDoc {
  return {
    id: v.id,
    obraId,
    numero:               v.numero               ?? v.attributes?.numero               ?? 0,
    fecha:                v.fecha                ?? v.attributes?.fecha                ?? '',
    notas:                v.notas                ?? v.attributes?.notas                ?? undefined,
    lineas:               v.lineas               ?? v.attributes?.lineas               ?? [],
    totalPresupuesto:     v.totalPresupuesto     ?? v.attributes?.totalPresupuesto     ?? 0,
    totalEjecutado:       v.totalEjecutado       ?? v.attributes?.totalEjecutado       ?? 0,
    totalAumentos:        v.totalAumentos        ?? v.attributes?.totalAumentos        ?? 0,
    totalDisminuciones:   v.totalDisminuciones   ?? v.attributes?.totalDisminuciones   ?? 0,
    totalExtras:          v.totalExtras          ?? v.attributes?.totalExtras          ?? 0,
    presupuestoModificado: v.presupuestoModificado ?? v.attributes?.presupuestoModificado ?? 0,
  };
}

export async function getValuaciones(obraId: number): Promise<ValuacionDoc[]> {
  try {
    const res = await api.get(`/obras/${obraId}/valuaciones`);
    return (res.data.data || []).map((v: any) => mapStrapiValuacion(v, obraId));
  } catch (error) {
    console.error('Error fetching valuaciones:', error);
    throw error;
  }
}

export async function createValuacion(
  obraId: number,
  obra: Obra,
  valuacionesExistentes: ValuacionDoc[],
  values: ValuacionFormValues
): Promise<ValuacionDoc> {
  const reportesPendientes = obra.reportes.filter((r) => !r.valuacionId);

  if (reportesPendientes.length === 0) {
    throw new Error('No hay reportes pendientes para concretar. Crea reportes diarios primero.');
  }

  const numero = valuacionesExistentes.length + 1;
  const snapshot = calcularValuacionDocConReportes(obra, reportesPendientes, 0, numero, values.notas);

  const costoManoObra   = reportesPendientes.reduce((s, r) => s + r.costoManoObra,   0);
  const costoMateriales = reportesPendientes.reduce((s, r) => s + r.costoMateriales, 0);
  const costoTotal      = reportesPendientes.reduce((s, r) => s + r.costoTotal,      0);

  try {
    const res = await api.post(`/obras/${obraId}/valuaciones`, {
      data: {
        fecha:                new Date().toISOString().split('T')[0],
        notas:                values.notas || null,
        lineas:               snapshot.lineas,
        totalPresupuesto:     snapshot.totalPresupuesto,
        totalEjecutado:       snapshot.totalEjecutado,
        totalAumentos:        snapshot.totalAumentos,
        totalDisminuciones:   snapshot.totalDisminuciones,
        totalExtras:          snapshot.totalExtras,
        presupuestoModificado: snapshot.presupuestoModificado,
        costoManoObra,
        costoMateriales,
        costoTotal,
      },
    });
    return mapStrapiValuacion(res.data.data, obraId);
  } catch (error) {
    console.error('Error creating valuacion:', error);
    throw error;
  }
}

// ─── Selectores (cross-service) ────────────────────────────────────────────────

export async function getMaterialesDisponibles(): Promise<MaterialDisponible[]> {
  try {
    const res = await api.get('/material-catalogos?sort=nombre:asc&pagination[pageSize]=200');
    const result = (res.data.data as any[]).map((item: any) => {
      const raw = item.attributes ?? item;
      const stockActual = raw.stockActual ?? 0;
      const stockMinimo = raw.stockMinimo ?? undefined;
      return {
        materialId: item.id,
        materialNombre: raw.nombre,
        unidad: raw.unidad,
        stockActual,
        precioPromedio: raw.precioPromedio ?? 0,
        estadoStock: calcularEstadoStock(stockActual, stockMinimo),
      };
    });
    // Keep cache in sync on every call (same pattern as getPersonal)
    materialesCache = result.map((m) => ({ id: m.materialId, nombre: m.materialNombre, unidad: m.unidad }));
    return result;
  } catch (error) {
    console.error('Error fetching materiales disponibles:', error);
    throw error;
  }
}

export async function getProyectosDisponiblesParaObra(
  proyectoActualId?: number
): Promise<{ id: number; nombre: string }[]> {
  const res = await api.get('/proyectos?populate[obras]=*');
  const proyectos: any[] = res.data.data ?? [];
  return proyectos
    .filter((p) => (p.obras ?? []).length === 0 || p.id === proyectoActualId)
    .map((p) => ({ id: p.id, nombre: p.nombre_proyecto }));
}

export async function getObrasDisponiblesParaProyecto(
  obraActualId?: number
): Promise<{ id: number; documentId: string; nombre: string }[]> {
  const res = await api.get('/obras?populate[proyecto]=*');
  const obras: any[] = res.data.data ?? [];
  return obras
    .filter((o) => !o.proyecto || o.id === obraActualId)
    .map((o) => ({ id: o.id, documentId: o.documentId, nombre: o.nombre }));
}

export async function vincularProyectoAObra(
  obraDocumentId: string,
  proyectoId: number
): Promise<Obra> {
  try {
    const res = await api.put(`/obras/${obraDocumentId}`, {
      data: { proyecto: proyectoId },
    });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error vinculando proyecto a obra:', error);
    throw error;
  }
}

export async function desvincularProyectoDeObra(obraDocumentId: string): Promise<Obra> {
  try {
    const res = await api.put(`/obras/${obraDocumentId}`, {
      data: { proyecto: null },
    });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error desvinculando proyecto de obra:', error);
    throw error;
  }
}

export async function actualizarGerentesObra(
  obraDocumentId: string,
  gerenteIds: number[]
): Promise<Obra> {
  try {
    const res = await api.put(`/obras/${obraDocumentId}`, {
      data: { gerentes: gerenteIds },
    });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error actualizando gerentes de obra:', error);
    throw error;
  }
}

