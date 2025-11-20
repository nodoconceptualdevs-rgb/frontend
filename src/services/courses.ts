"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

export interface ContentCourse {
  id: number;
  lesson_title: string;
  video_lesson_url?: { id: number; url: string } | null;
  order: number;
}

export interface Course {
  id: number;
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
  number_lessons?: number;
}

export interface CreateContentCoursePayload {
  lesson_title: string;
  order: number;
  course: number;
  video_lesson_url?: number;
}

/**
 * Obtener todos los cursos
 */
export async function getCourses() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get("/courses?populate=*", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

/**
 * Obtener un curso por ID
 */
export async function getCourseById(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get(`/courses/${id}?populate=*`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

/**
 * Crear un nuevo curso
 */
export async function createCourse(data: CreateCoursePayload) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.post("/courses", { data }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Actualizar un curso
 */
export async function updateCourse(id: number, data: Partial<CreateCoursePayload>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.put(`/courses/${id}`, { data }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Eliminar un curso
 */
export async function deleteCourse(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.delete(`/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener clases de un curso
 */
export async function getContentCourses(courseId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get(`/content-courses?filters[course][id][$eq]=${courseId}&populate=*&sort=order:asc`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

/**
 * Crear una nueva clase
 */
export async function createContentCourse(data: CreateContentCoursePayload) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.post("/content-courses", { data }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Actualizar una clase
 */
export async function updateContentCourse(id: number, data: Partial<CreateContentCoursePayload>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.put(`/content-courses/${id}`, { data }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Eliminar una clase
 */
export async function deleteContentCourse(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.delete(`/content-courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
