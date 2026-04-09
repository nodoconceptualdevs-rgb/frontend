import api from "@/lib/api";
import { getAuthHeaders } from "@/lib/getAuthToken";

export interface Comment {
  id: number;
  content: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
  content_course: number;
  parent_comment?: number;
  replies?: Comment[];
  is_admin_reply: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  content: string;
  content_course: number;
  parent_comment?: number;
  user?: number;
  is_admin_reply?: boolean;
}

/**
 * Obtener comentarios de un contenido de curso
 * El backend maneja el populate automáticamente
 */
export async function getCommentsByContent(contentCourseId: number) {
  const res = await api.get(
    `/comments?filters[content_course][id][$eq]=${contentCourseId}&sort=createdAt:desc`,
    {
      headers: getAuthHeaders(),
    }
  );
  return res.data;
}

/**
 * Obtener el conteo de comentarios de una lección
 * El backend maneja el populate automáticamente
 */
export async function getCommentsCountByContent(contentCourseId: number): Promise<number> {
  const res = await api.get(
    `/comments?filters[content_course][id][$eq]=${contentCourseId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  // Strapi v5 devuelve { data: [], meta: { pagination: { total } } }
  const data = res.data as any;
  return data?.data?.length || 0;
}

/**
 * Crear un nuevo comentario
 */
export async function createComment(data: CreateCommentPayload) {
  // Obtener el ID del usuario actual del localStorage
  const userStr = localStorage.getItem('user');
  let userId = null;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id;
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }

  const payload = {
    data: {
      ...data,
      user: data.user || userId,
    }
  };

  const res = await api.post("/comments", payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Responder a un comentario (para admin/gerente)
 */
export async function replyToComment(
  parentCommentId: number,
  content: string,
  contentCourseId: number
) {
  const userStr = localStorage.getItem('user');
  let userId = null;
  let isAdmin = false;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id;
      // Verificar si es admin o gerente
      isAdmin = ['admin', 'gerente', 'manager'].includes(user.role?.type?.toLowerCase());
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }

  // Construir payload - NO incluir parent_comment si es 0 (comentario nuevo)
  const payloadData: any = {
    content,
    content_course: contentCourseId,
    user: userId,
    is_admin_reply: isAdmin,
  };

  // Solo agregar parent_comment si es una respuesta real (no 0)
  if (parentCommentId && parentCommentId > 0) {
    payloadData.parent_comment = parentCommentId;
  }

  const payload = { data: payloadData };

  const res = await api.post("/comments", payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar un comentario (solo el propio usuario o admin)
 */
export async function updateComment(id: number, content: string) {
  const res = await api.put(`/comments/${id}`, {
    data: { content }
  }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar un comentario (solo admin o el propio usuario)
 */
export async function deleteComment(id: number) {
  const res = await api.delete(`/comments/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}
