"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  confirmed: boolean;
  blocked: boolean;
  role?: {
    id: number;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtener todos los usuarios
 */
export async function getUsers() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get("/users?populate=role", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get(`/users/${id}?populate=role`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Actualizar un usuario
 */
export async function updateUser(id: number, data: Partial<User>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.put(`/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Bloquear/Desbloquear usuario
 */
export async function toggleBlockUser(id: number, blocked: boolean) {
  return updateUser(id, { blocked });
}
