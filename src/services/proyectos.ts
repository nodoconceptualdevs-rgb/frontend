"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

export interface Proyecto {
  id: number;
  nombre_proyecto: string;
  token_nfc: string;
  estado_general: "En Planificación" | "En Ejecución" | "Completado";
  fecha_inicio: string;
  ultimo_avance?: string;
  cliente?: any;
  gerente_proyecto?: any;
  hitos?: any[];
  comentarios?: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtener proyectos del usuario logueado (cliente)
 */
export async function getMisProyectos() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;

  const res = await api.get(`/proyectos?filters[cliente][id][$eq]=${userId}&populate=*`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener un proyecto por su token NFC
 */
export async function getProyectoByToken(tokenNfc: string) {
  const res: any = await api.get(`/proyectos?filters[token_nfc][$eq]=${tokenNfc}&populate[hitos][populate]=*&populate[gerente_proyecto]=*&populate[comentarios][populate]=*`, {
    headers: {},
  });
  
  if (res.data && res.data.data && res.data.data.length > 0) {
    return res.data.data[0];
  }
  
  throw new Error("Proyecto no encontrado");
}

/**
 * Obtener todos los proyectos (admin)
 */
export async function getProyectos() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get("/proyectos?populate=*", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Crear comentario en un proyecto
 */
export async function createComentario(proyectoId: number, contenido: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;

  const res = await api.post("/comentario-proyectos", {
    data: {
      contenido,
      proyecto: proyectoId,
      usuario: userId,
    }
  }, {
    headers: { Authorization: `Bearer ${token}` },
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
