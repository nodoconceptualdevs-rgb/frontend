import api from "@/lib/api";
import { getAuthHeaders } from "@/lib/getAuthToken";

export interface ContentCourse {
  id: number;
  lesson_title: string;
  video_lesson_url?: { id: number; url: string } | null;
  order: number;
}

export interface Course {
  id: number;
  documentId: string;
  title: string;
  description: string;
  price: number;
  cover?: { id: number; url: string } | null;
  isActive: boolean;
  number_lessons?: number;
  content_courses?: ContentCourse[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  price: number;
  cover?: number;
  isActive?: boolean;
}

export interface CreateContentCoursePayload {
  lesson_title: string;
  order?: number; // Opcional - se calcula automáticamente en el backend
  course: number | string; // Puede ser ID numérico o documentId (string)
  video_lesson_url?: number;
  video_url?: string;
  video_duration?: number;
}

/**
 * Obtener todos los cursos
 */
export async function getCourses() {
  const res = await api.get("/courses", {
    headers: getAuthHeaders(),
  });
  // En Strapi v5, res.data contiene { data: [...], meta: {...} }
  return (res.data as any).data || res.data;
}

/**
 * Obtener un curso por ID (acepta ID numérico o documentId)
 */
export async function getCourseById(id: number | string) {
  const res = await api.get(`/courses/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener un curso por documentId (Strapi v5)
 */
export async function getCourseByDocumentId(documentId: string) {
  const res = await api.get(`/courses/${documentId}?populate=*`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener un curso con populate específico
 * @param id - ID numérico o documentId
 * @param populate - Campos a popular (ej: "content_courses,cover")
 */
export async function getCourseWithPopulate(id: number | string, populate: string = "*") {
  const res = await api.get(`/courses/${id}?populate=${populate}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear un nuevo curso
 */
export async function createCourse(data: CreateCoursePayload) {
  const res = await api.post("/courses", { data }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar un curso
 * @param id - ID numérico o documentId (usar documentId en Strapi v5)
 */
export async function updateCourse(id: number | string, data: Partial<CreateCoursePayload>) {
  const res = await api.put(`/courses/${id}`, { data }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar un curso
 * @param id - ID numérico o documentId (usar documentId en Strapi v5)
 */
export async function deleteCourse(id: number | string) {
  const res = await api.delete(`/courses/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener clases de un curso
 * @param courseId - ID numérico del curso (para filtros se necesita ID numérico)
 */
export async function getContentCourses(courseId: number) {
  const res = await api.get(`/content-courses?filters[course][id][$eq]=${courseId}&populate=*&sort=order:asc`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear una nueva clase
 */
export async function createContentCourse(data: CreateContentCoursePayload) {
  const res = await api.post("/content-courses", { data }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar una clase
 */
export async function updateContentCourse(id: number, data: Partial<CreateContentCoursePayload>) {
  const res = await api.put(`/content-courses/${id}`, { data }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Eliminar una clase
 */
export async function deleteContentCourse(id: number) {
  const res = await api.delete(`/content-courses/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}
