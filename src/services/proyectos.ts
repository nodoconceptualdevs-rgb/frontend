import api from "@/lib/api";
import type { 
  Proyecto, 
  RegenerarTokenResponse, 
  ProyectoResponse,
  UpdateProyectoPayload 
} from "@/types/proyecto.types";

// Re-exportar Proyecto para compatibilidad con imports existentes
export type { Proyecto } from "@/types/proyecto.types";

interface Comentario {
  id: number;
  contenido: string;
  createdAt: string;
}

/**
 * Obtener proyectos del usuario logueado (cliente o gerente)
 * El backend filtra automáticamente según el usuario autenticado
 */
export async function getMisProyectos() {
  // El controlador del backend se encarga de filtrar según el rol
  // Populate simplificado para evitar errores de sintaxis
  const res = await api.get(`/proyectos?populate=*`);
  
  return res.data;
}

/**
 * Obtener un proyecto por su token NFC
 */
export async function getProyectoByToken(tokenNfc: string) {
  const res = await api.get(`/proyectos?filters[token_nfc][$eq]=${tokenNfc}&populate[hitos][populate]=*&populate[gerente_proyecto]=*&populate[comentarios][populate]=*`, {
    headers: {},
  });
  
  const data = res.data as { data: Proyecto[] };
  if (data && data.data && data.data.length > 0) {
    return data.data[0];
  }
  
  throw new Error("Proyecto no encontrado");
}

/**
 * Obtener todos los proyectos (admin)
 */
export async function getProyectos() {
  const res = await api.get("/proyectos?populate=*");
  return res.data;
}

/**
 * Crear comentario en un proyecto
 */
export async function createComentario(proyectoId: number, contenido: string) {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!userStr) {
    throw new Error('Usuario no autenticado');
  }
  
  const user = JSON.parse(userStr);
  const userId = user.id;

  const res = await api.post("/comentario-proyectos", {
    data: {
      contenido,
      proyecto: proyectoId,
      usuario: userId,
    }
  });
  return res.data;
}

/**
 * Obtener comentarios de un proyecto
 */
export async function getComentariosByProyecto(proyectoId: number) {
  const res = await api.get(`/comentario-proyectos?filters[proyecto][id][$eq]=${proyectoId}&populate=*&sort=createdAt:desc`, {
    headers: {},
  });
  return res.data;
}

/**
 * Crear un nuevo proyecto
 */
export async function createProyecto(data: {
  nombre_proyecto: string;
  fecha_inicio: string;
  estado_general?: string;
  cliente?: number;
  gerente_proyecto?: number;
  es_publico?: boolean;
}) {
  const res = await api.post("/proyectos", {
    data
  });
  return res.data;
}

/**
 * Actualizar un proyecto
 */
export async function updateProyecto(id: number, data: UpdateProyectoPayload) {
  const res = await api.put(`/proyectos/${id}`, {
    data
  });
  return res.data;
}

/**
 * Eliminar un proyecto
 */
export async function deleteProyecto(id: number) {
  const res = await api.delete(`/proyectos/${id}`);
  return res.data;
}

/**
 * Regenerar token NFC de un proyecto
 */
export async function regenerarTokenNFC(id: number): Promise<RegenerarTokenResponse> {
  const res = await api.post<RegenerarTokenResponse>(`/proyectos/${id}/regenerar-token`, {});
  return res.data;
}

/**
 * Obtener un proyecto por ID con todas sus relaciones
 */
export async function getProyectoById(id: number) {
  const res = await api.get(`/proyectos/${id}?populate[gerente_proyecto]=*&populate[cliente]=*&populate[hitos][populate][contenido][populate]=*`);
  return res.data;
}

/**
 * Validar token NFC del proyecto
 * Retorna true si el token existe y es válido
 */
export async function validarTokenNFC(tokenNfc: string) {
  try {
    const res = await api.get(`/proyectos/auth-nfc?token=${tokenNfc}`);
    return { valido: true, proyecto: res.data };
  } catch (error) {
    return { valido: false, proyecto: null };
  }
}
