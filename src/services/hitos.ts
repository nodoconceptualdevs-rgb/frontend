import api from "@/lib/api";
import { getAuthHeaders } from "@/lib/getAuthToken";
import type { Hito, ContenidoHito, CreateHitoPayload, HitosReordenResponse } from "@/types/proyecto.types";

// Re-exportar para compatibilidad
export type { Hito, ContenidoHito } from "@/types/proyecto.types";

/**
 * Crear un nuevo hito
 */
export async function createHito(data: CreateHitoPayload) {
  const res = await api.post("/hitos", {
    data
  }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar un hito
 */
export async function updateHito(id: number, data: Partial<Hito>) {
  const res = await api.put(`/hitos/${id}`, {
    data
  }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar un hito
 */
export async function deleteHito(id: number) {
  const res = await api.delete(`/hitos/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener un hito por ID
 */
export async function getHitoById(id: number) {
  const res = await api.get(`/hitos/${id}?populate[contenido][populate]=*`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Subir archivo a un hito
 */
export async function uploadFileToHito(
  hitoId: number,
  file: File,
  field: 'galeria_fotos' | 'videos_walkthrough' | 'documentacion'
) {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'api::hito.hito');
  formData.append('refId', hitoId.toString());
  formData.append('field', `contenido.${field}`);

  const res = await api.post('/upload', formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

/**
 * Eliminar archivo de un hito
 */
export async function deleteFileFromHito(fileId: number) {
  const res = await api.delete(`/upload/files/${fileId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Reordenar hitos de un proyecto (client-side)
 */
export async function reordenarHitos(
  proyectoId: number,
  hitos: Array<{ id: number; orden: number }>,
  token?: string
): Promise<HitosReordenResponse> {
  // Si no se proporciona token, intentar obtenerlo del cliente (se guarda como 'token', no 'jwt')
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  
  // Log para depuración
  console.log('🔑 Token disponible para reordenar:', authToken ? 'Sí' : 'No');
  
  if (!authToken) {
    console.error('❌ Token no encontrado en localStorage ni proporcionado como parámetro');
    throw new Error('No hay token de autenticación disponible. Por favor, vuelve a iniciar sesión.');
  }

  const res = await api.post<HitosReordenResponse>('/hitos/reordenar', {
    data: {
      proyectoId,
      hitos
    }
  }, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  
  console.log('✅ Respuesta de reordenamiento:', res.data);
  return res.data;
}
