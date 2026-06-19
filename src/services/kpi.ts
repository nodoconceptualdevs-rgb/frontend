/**
 * Servicio KPI — API real Strapi.
 *
 * Reemplaza el mock anterior por llamadas HTTP a los endpoints de tareas,
 * comentarios, reprogramaciones y rechazos.
 */

import type {
  Arquitecto,
  ArchivoProyecto,
  Cliente,
  EstadoTarea,
  HitoOpcion,
  ProyectoOpcion,
  PublicarHitoValues,
  RechazoValues,
  ReprogramarValues,
  TareaConKpi,
  TareaFormValues,
} from "@/types/kpi";
import { conKpi } from "@/lib/kpi";
import api from "@/lib/api";

// Helpers para normalizar respuestas de Strapi v4 y v5
const toArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  return [];
};

const toOne = (val: any): any => {
  if (!val) return null;
  if (val.data !== undefined) return val.data;
  return val;
};

// Helpers para normalizar respuestas de Strapi
const adaptarTarea = (data: any): any => {
  if (!data) return null;
  const attrs = data.attributes || data;

  // Arquitectos → { id, name }
  const arquitectos = toArray(attrs.arquitectos).map((a: any) => {
    const aa = a.attributes || a;
    return { id: a.id ?? aa.id, name: aa.name || aa.username || '' };
  });

  // historialEntregas (reprogramaciones) → CambioEntrega shape
  const historialEntregas = toArray(attrs.reprogramaciones).map((r: any) => {
    const ra = r.attributes || r;
    return {
      fechaAnterior: ra.fechaAnterior,
      fechaNueva: ra.fechaNueva,
      motivo: ra.motivo,
      registradoEn: ra.registradoEn || ra.createdAt,
    };
  });

  // historialRechazos (rechazos) → Rechazo shape
  const historialRechazos = toArray(attrs.rechazos).map((r: any) => {
    const ra = r.attributes || r;
    return {
      motivo: ra.motivo,
      categoria: ra.categoria,
      registradoEn: ra.registradoEn || ra.createdAt,
    };
  });

  // Archivos → Archivo shape
  const archivos = toArray(attrs.archivos).map((f: any) => {
    const fa = f.attributes || f;
    return {
      id: String(f.id ?? fa.id),
      nombre: fa.name || fa.nombre || '',
      tamaño: fa.size || 0,
      ruta: fa.url || fa.ruta,
      subidoEn: fa.createdAt || fa.subidoEn || '',
    };
  });

  // Relaciones singulares
  const proyectoRaw = toOne(attrs.proyecto);
  const proyectoAttrs = proyectoRaw?.attributes || proyectoRaw;

  const clienteRaw = toOne(attrs.cliente);
  const clienteAttrs = clienteRaw?.attributes || clienteRaw;

  const hitoRaw = toOne(attrs.hito);
  const hitoAttrs = hitoRaw?.attributes || hitoRaw;

  return {
    id: data.id ?? attrs.id,
    titulo: attrs.titulo || '',
    descripcion: attrs.descripcion,
    estado: attrs.estado,
    tipo: attrs.tipo,
    orden: attrs.orden ?? 0,
    notasInternas: attrs.notasInternas,
    fechaRequerimiento: attrs.fechaRequerimiento,
    fechaInicio: attrs.fechaInicio,
    fechaEntregaEstimada: attrs.fechaEntregaEstimada,
    fechaEntregaOriginal: attrs.fechaEntregaOriginal,
    fechaCompletacion: attrs.fechaCompletacion,
    publicacion: attrs.publicacion,
    clienteId: clienteRaw?.id ?? clienteAttrs?.id,
    clienteNombre: clienteAttrs?.name || clienteAttrs?.username || '',
    proyectoId: proyectoRaw?.id ?? proyectoAttrs?.id,
    proyectoNombre: proyectoAttrs?.nombre_proyecto || proyectoAttrs?.nombre || '',
    hitoId: hitoRaw?.id ?? hitoAttrs?.id,
    hitoNombre: hitoAttrs?.nombre || '',
    arquitectos,
    historialEntregas,
    historialRechazos,
    contadorRechazos: attrs.contadorRechazos || 0,
    archivos,
    comentarios: toArray(attrs.comentarios),
  };
};

const adaptarUsuario = (data: any): Arquitecto => {
  if (!data) return null;
  const attrs = data.attributes || data;
  return {
    id: data.id || attrs.id,
    name: attrs.name || attrs.username || "",
  };
};

const adaptarProyecto = (data: any, cliente?: any): ProyectoOpcion => {
  if (!data) return null;
  const attrs = data.attributes || data;
  const clienteData = cliente || attrs.clientes?.data?.[0];
  const clienteAttrs = clienteData?.attributes || clienteData;
  return {
    id: data.id || attrs.id,
    nombre: attrs.nombre_proyecto || attrs.nombre || "",
    clienteId: clienteData?.id || clienteAttrs?.id,
    clienteNombre: clienteAttrs?.name || clienteAttrs?.nombre || "",
  };
};

const adaptarHito = (data: any, proyecto?: any): HitoOpcion => {
  if (!data) return null;
  const attrs = data.attributes || data;
  const proyData = proyecto || attrs.proyecto?.data;
  const proyAttrs = proyData?.attributes || proyData;
  return {
    id: data.id || attrs.id,
    nombre: attrs.nombre || "",
    proyectoId: proyData?.id || proyAttrs?.id,
    proyectoNombre: proyAttrs?.nombre_proyecto || "",
  };
};

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export async function getArquitectos(): Promise<Arquitecto[]> {
  try {
    const { data } = await api.get("/users?populate=role");
    const items = Array.isArray(data) ? data : data.data || [];
    return items
      .filter((u: any) => {
        const attrs = u.attributes || u;
        const role = attrs.role?.data?.attributes || attrs.role;
        return role?.type && ["admin", "gerente_de_proyecto"].includes(role.type);
      })
      .map(adaptarUsuario);
  } catch (error) {
    console.error("Error fetching arquitectos:", error);
    return [];
  }
}

export async function getClientes(): Promise<Cliente[]> {
  try {
    const { data } = await api.get("/users?populate=role");
    const items = Array.isArray(data) ? data : data.data || [];
    return items
      .filter((u: any) => {
        const attrs = u.attributes || u;
        const role = attrs.role?.data?.attributes || attrs.role;
        return role?.type === "client";
      })
      .map(adaptarUsuario);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return [];
  }
}

export async function getProyectos(): Promise<ProyectoOpcion[]> {
  try {
    const { data } = await api.get("/proyectos?populate[clientes]=true");
    const items = Array.isArray(data) ? data : data.data || [];
    return items.map((p: any) => adaptarProyecto(p, p.attributes?.clientes?.data?.[0]));
  } catch (error) {
    console.error("Error fetching proyectos:", error);
    return [];
  }
}

export async function getHitos(proyectoId?: number): Promise<HitoOpcion[]> {
  try {
    const url = proyectoId
      ? `/hitos?filters[proyecto][id][$eq]=${proyectoId}`
      : "/hitos?populate=proyecto";
    const { data } = await api.get(url);
    const items = Array.isArray(data) ? data : data.data || [];
    return items.map((h: any) => adaptarHito(h, h.attributes?.proyecto?.data));
  } catch (error) {
    console.error("Error fetching hitos:", error);
    return [];
  }
}

export async function getBibliotecaProyecto(
  proyectoId: number,
): Promise<ArchivoProyecto[]> {
  try {
    // Usar populate=* como en proyectos.ts para obtener TODO
    const { data } = await api.get(
      `/proyectos/${proyectoId}?populate=*`,
    );
    const proyecto = data.data || data;
    const attrs = proyecto.attributes || proyecto;

    // La biblioteca puede estar en diferentes formatos
    let archivos = attrs.biblioteca || [];

    // Si viene como relación poblada de Strapi
    if (archivos.data) {
      archivos = archivos.data;
    }

    // Asegurar que es un array
    const items = Array.isArray(archivos) ? archivos : [];

    console.log("📚 Biblioteca Strapi Response:", {
      raw: attrs.biblioteca,
      processed: items,
      cantidad: items.length,
    });

    // Si no hay biblioteca, extraer archivos de los hitos
    if (items.length === 0) {
      console.log("⚠️ Campo biblioteca vacío o restringido. Extrayendo archivos de hitos...");
      const hitosRaw = attrs.hitos || [];
      const hitos = Array.isArray(hitosRaw) ? hitosRaw : hitosRaw.data || [];
      const archivosDelHitos: any[] = [];

      hitos.forEach((hito: any) => {
        const hitoAttrs = hito.attributes || hito;
        const contenido = hitoAttrs.contenido;

        if (contenido) {
          const contenidoAttrs = contenido.attributes || contenido;

          // Galerías
          const galeriaFotos = Array.isArray(contenidoAttrs.galeria_fotos)
            ? contenidoAttrs.galeria_fotos
            : contenidoAttrs.galeria_fotos?.data || [];

          galeriaFotos.forEach((f: any) => {
            const fa = f.attributes || f;
            archivosDelHitos.push({
              id: String(f.id ?? fa.id),
              nombre: fa.name || fa.nombre || 'Imagen',
              tamaño: fa.size || 0,
              ruta: fa.url || fa.ruta,
              subidoEn: fa.createdAt || fa.updatedAt || '',
              proyectoId,
            });
          });

          // Documentación
          const docs = Array.isArray(contenidoAttrs.documentacion)
            ? contenidoAttrs.documentacion
            : contenidoAttrs.documentacion?.data || [];

          docs.forEach((f: any) => {
            const fa = f.attributes || f;
            archivosDelHitos.push({
              id: String(f.id ?? fa.id),
              nombre: fa.name || fa.nombre || 'Documento',
              tamaño: fa.size || 0,
              ruta: fa.url || fa.ruta,
              subidoEn: fa.createdAt || fa.updatedAt || '',
              proyectoId,
            });
          });
        }
      });

      console.log("✅ Archivos extraídos de hitos:", archivosDelHitos);
      return archivosDelHitos;
    }

    return items.map((f: any) => {
      const fa = f.attributes || f;
      return {
        id: String(f.id ?? fa.id),
        nombre: fa.name || fa.nombre || '',
        tamaño: fa.size || 0,
        ruta: fa.url || fa.ruta,
        subidoEn: fa.createdAt || fa.subidoEn || '',
        proyectoId,
      };
    });
  } catch (error) {
    console.error("❌ Error fetching biblioteca:", error);
    return [];
  }
}

export async function uploadABibliotecaProyecto(
  proyectoId: number,
  files: File[],
): Promise<ArchivoProyecto[]> {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("ref", "api::proyecto.proyecto");
    formData.append("refId", String(proyectoId));
    formData.append("field", "biblioteca");
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const uploaded = Array.isArray(data) ? data : [data];
    return uploaded.map((f: any) => ({
      id: String(f.id),
      nombre: f.name || '',
      tamaño: f.size || 0,
      ruta: f.url,
      subidoEn: f.createdAt || '',
      proyectoId,
    }));
  } catch (error) {
    console.error("Error uploading to biblioteca:", error);
    throw error;
  }
}

export interface HitoConContenido {
  id: number;
  nombre: string;
  orden: number;
  estado_completado: boolean;
  fecha_actualizacion?: string;
  contenido?: {
    descripcion_avance?: string;
    galeria_fotos?: Array<{ id: number; nombre: string; url: string; size: number }>;
    videos_walkthrough?: Array<{ id: number; nombre: string; url: string; size: number }>;
    documentacion?: Array<{ id: number; nombre: string; url: string; size: number }>;
  };
}

export async function getHitosConContenido(proyectoId: number): Promise<HitoConContenido[]> {
  try {
    // Deep populate para traer archivos del contenido
    const { data } = await api.get(
      `/hitos?filters[proyecto][id][$eq]=${proyectoId}&populate[contenido][populate][galeria_fotos]=true&populate[contenido][populate][documentacion]=true&populate[contenido][populate][videos_walkthrough]=true&sort=orden:asc`,
    );
    const items = Array.isArray(data) ? data : data.data || [];

    const mapMedia = (arr: any) => {
      // Puede venir como array directo o como { data: [...] } (Strapi v4)
      const normalized = Array.isArray(arr) ? arr : arr?.data || [];
      return normalized.map((f: any) => {
        const fa = f.attributes || f;
        return {
          id: f.id ?? fa.id,
          nombre: fa.name || fa.nombre || '',
          url: fa.url || '',
          size: fa.size || 0,
        };
      });
    };

    return items.map((h: any) => {
      const ha = h.attributes || h;
      const contRaw = ha.contenido;
      const cont = contRaw?.attributes || contRaw || {};

      return {
        id: h.id,
        nombre: ha.nombre || '',
        orden: ha.orden || 0,
        estado_completado: ha.estado_completado || false,
        fecha_actualizacion: ha.fecha_actualizacion,
        contenido: {
          descripcion_avance: cont.descripcion_avance || null,
          galeria_fotos: mapMedia(cont.galeria_fotos),
          videos_walkthrough: mapMedia(cont.videos_walkthrough),
          documentacion: mapMedia(cont.documentacion),
        },
      };
    });
  } catch (error) {
    console.error("Error fetching hitos con contenido:", error);
    return [];
  }
}

export async function asignarArchivosAHito(
  hitoId: number,
  archivoIds: number[],
  descripcionAvance: string,
): Promise<void> {
  try {
    console.log("📤 Asignando archivos a hito:", { hitoId, archivoIds, descripcionAvance });

    // Detectar tipos de archivo: imágenes vs documentos
    // Para esto necesitamos los nombres/tipos de los archivos
    // Por ahora, asumimos que todos van a galeria_fotos si son imágenes, documentacion si no
    // NOTA: Idealmente deberías tener metadata de tipos, pero por ahora separamos por extensión

    // Si los IDs son números puros, los asignamos directamente
    // El servidor debería detectar el tipo
    await api.put(`/hitos/${hitoId}`, {
      data: {
        contenido: {
          // IMPORTANTE: No duplicar archivos en ambos campos
          // Dejar que el servidor/cliente determine dónde van basado en el tipo
          galeria_fotos: archivoIds,
          descripcion_avance: descripcionAvance || '',
        },
      },
    });

    console.log("✅ Archivos asignados correctamente");
  } catch (error) {
    console.error("❌ Error asignando archivos a hito:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Tareas CRUD
// ---------------------------------------------------------------------------

export async function getTareas(): Promise<TareaConKpi[]> {
  try {
    const { data } = await api.get(
      "/tareas-diseno?populate[arquitectos]=true&populate[cliente]=true&populate[proyecto]=true&populate[hito]=true&populate[reprogramaciones]=true&populate[rechazos]=true&populate[comentarios][populate][autor]=true&populate[archivos]=true&sort=estado:asc,orden:asc",
    );
    const items = Array.isArray(data) ? data : data.data || [];
    return items.map((t: any) => conKpi(adaptarTarea(t)));
  } catch (error) {
    console.error("Error fetching tareas:", error);
    return [];
  }
}

// Actualizar función getComentarios para deep-populate autor
export async function getComentarios(tareaId: number) {
  try {
    const { data } = await api.get(
      `/comentario-tareas?filters[tarea][id][$eq]=${tareaId}&populate[autor]=true&sort=createdAt:desc`,
    );
    const items = Array.isArray(data) ? data : data.data || [];
    return items.map((c: any) => {
      const attrs = c.attributes || c;
      const autorRaw = attrs.autor?.data || attrs.autor;
      const autorAttrs = autorRaw?.attributes || autorRaw;
      return {
        id: c.id as number,
        contenido: attrs.contenido as string,
        createdAt: attrs.createdAt || c.createdAt,
        autor: autorRaw ? { id: autorRaw.id as number, name: (autorAttrs?.name || autorAttrs?.username || '') as string } : null,
      };
    });
  } catch (error) {
    console.error("Error fetching comentarios:", error);
    return [];
  }
}

export async function createTarea(values: TareaFormValues): Promise<TareaConKpi> {
  try {
    const payload = {
      titulo: values.titulo,
      descripcion: values.descripcion,
      tipo: values.tipo,
      estado: "PENDIENTE",
      fechaRequerimiento: new Date().toISOString(),
      fechaEntregaEstimada: values.fechaEntregaEstimada,
      fechaEntregaOriginal: values.fechaEntregaEstimada,
      notasInternas: values.notasInternas,
      arquitectos: values.arquitectoIds,
      proyecto: values.tipo === "CLIENTE" ? values.proyectoId : null,
      hito: values.hitoId,
      orden: 0,
    };

    const { data } = await api.post("/tareas-diseno", { data: payload });
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error creating tarea:", error);
    throw error;
  }
}

export async function updateTarea(
  id: number,
  values: TareaFormValues,
): Promise<TareaConKpi> {
  try {
    const payload = {
      titulo: values.titulo,
      descripcion: values.descripcion,
      tipo: values.tipo,
      notasInternas: values.notasInternas,
      fechaEntregaEstimada: values.fechaEntregaEstimada,
      arquitectos: values.arquitectoIds,
      proyecto: values.tipo === "CLIENTE" ? values.proyectoId : null,
      hito: values.hitoId,
    };

    const { data } = await api.put(`/tareas-diseno/${id}`, { data: payload });
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error updating tarea:", error);
    throw error;
  }
}

export async function updateEstadoTarea(
  id: number,
  estado: EstadoTarea,
  orden: number,
): Promise<TareaConKpi> {
  try {
    const { data } = await api.patch(`/tareas-diseno/${id}/estado`, {
      data: { estado, orden },
    });
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error updating estado:", error);
    throw error;
  }
}

export async function reordenarColumna(
  estado: EstadoTarea,
  idsOrdenados: number[],
): Promise<void> {
  try {
    const tareas = idsOrdenados.map((id, idx) => ({ id, orden: idx }));
    await api.post("/tareas-diseno/reordenar", {
      data: { tareas },
    });
  } catch (error) {
    console.error("Error reordenando tareas:", error);
    throw error;
  }
}

export async function eliminarTarea(id: number): Promise<void> {
  try {
    await api.delete(`/tareas-diseno/${id}`);
  } catch (error) {
    console.error("Error deleting tarea:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Reprogramaciones
// ---------------------------------------------------------------------------

export async function reprogramarEntrega(
  id: number,
  values: ReprogramarValues,
): Promise<TareaConKpi> {
  try {
    const { data } = await api.post("/reprogramacion-tareas", {
      data: {
        tarea: id,
        fechaNueva: values.fechaNueva,
        motivo: values.motivo,
      },
    });
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error reprogramming:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Rechazos
// ---------------------------------------------------------------------------

export async function registrarRechazo(
  id: number,
  values: RechazoValues,
): Promise<TareaConKpi> {
  try {
    const { data } = await api.post("/rechazo-tareas", {
      data: {
        tarea: id,
        motivo: values.motivo,
        categoria: values.categoria,
      },
    });
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error registering rechazo:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------

export async function agregarComentario(tareaId: number, contenido: string) {
  try {
    const { data } = await api.post("/comentario-tareas", {
      data: {
        tarea: tareaId,
        contenido,
        es_privado: false,
      },
    });
    const respData = data.data || data;
    const attrs = respData.attributes || respData;
    const autorRaw = attrs.autor?.data || attrs.autor;
    const autorAttrs = autorRaw?.attributes || autorRaw;
    return {
      id: respData.id as number,
      contenido: attrs.contenido as string,
      createdAt: attrs.createdAt || respData.createdAt,
      autor: autorRaw ? { id: autorRaw.id as number, name: (autorAttrs?.name || autorAttrs?.username || '') as string } : null,
    };
  } catch (error) {
    console.error("Error adding comentario:", error);
    throw error;
  }
}

export async function eliminarComentario(comentarioId: number): Promise<void> {
  try {
    await api.delete(`/comentario-tareas/${comentarioId}`);
  } catch (error) {
    console.error("Error deleting comentario:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Publicaciones en hitos
// ---------------------------------------------------------------------------

export async function publicarEnHito(
  id: number,
  values: PublicarHitoValues,
): Promise<TareaConKpi> {
  try {
    // Guardar los archivos también en la tarea (no solo en publicacion)
    const archivoIds = (values.archivoIds || []).map((id: any) => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return Number.isNaN(numId) ? null : numId;
    }).filter(Boolean);

    const { data } = await api.put(`/tareas-diseno/${id}`, {
      data: {
        // Guardar en publicacion (para el hito)
        publicacion: {
          hitoId: values.hitoId,
          hitoNombre: "",
          fecha: new Date().toISOString(),
          archivoIds: archivoIds,
        },
        // TAMBIÉN guardar en archivos de la tarea (para visualización)
        archivos: archivoIds,
      },
    });
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error publicando en hito:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

export async function agregarArchivosATarea(
  tareaId: number,
  archivos: File[],
): Promise<TareaConKpi> {
  try {
    const formData = new FormData();
    archivos.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("ref", "api::tarea-diseno.tarea-diseno");
    formData.append("refId", String(tareaId));
    formData.append("field", "archivos");

    await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { data } = await api.get(
      `/tareas-diseno/${tareaId}?populate[archivos]=true`,
    );
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error uploading archivos:", error);
    throw error;
  }
}

export async function eliminarArchivoDeTarea(
  tareaId: number,
  archivoId: number,
): Promise<TareaConKpi> {
  try {
    await api.delete(`/upload/files/${archivoId}`);
    const { data } = await api.get(
      `/tareas-diseno/${tareaId}?populate[archivos]=true`,
    );
    return conKpi(adaptarTarea(data.data || data));
  } catch (error) {
    console.error("Error deleting archivo:", error);
    throw error;
  }
}
