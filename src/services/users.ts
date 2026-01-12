import api from "@/lib/api";
import { getAuthHeaders } from "@/lib/getAuthToken";

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
  const res = await api.get("/users?populate=role", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener un usuario por ID
 */
export async function getUserById(id: number) {
  const res = await api.get(`/users/${id}?populate=role`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Actualizar un usuario
 */
export async function updateUser(id: number, data: Partial<User>) {
  const res = await api.put(`/users/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Bloquear/Desbloquear usuario
 */
export async function toggleBlockUser(id: number, blocked: boolean) {
  return updateUser(id, { blocked });
}
