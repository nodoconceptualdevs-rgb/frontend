import api from "@/lib/api";
import { alerts } from "@/lib/alerts";

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  name?: string;
  role: number; // ID del rol
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  name?: string;
  role?: number;
  blocked?: boolean;
}

/**
 * Crear un nuevo usuario como administrador
 */
export async function createUser(userData: CreateUserPayload) {
  try {
    // Usar el endpoint de users-permissions para crear usuarios con rol
    const res = await api.post("/users", {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      name: userData.name || userData.username,
      role: userData.role,
      confirmed: true, // Confirmar el usuario automáticamente
      blocked: false, // No bloquear al usuario
    });

    alerts.success("✅ Usuario creado exitosamente");
    return res.data;
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    
    // Extraer mensaje de error específico
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.data?.[0]?.message ||
                        error.response?.data?.message ||
                        "Error al crear el usuario";
    
    alerts.error(`❌ ${errorMessage}`);
    throw error;
  }
}

/**
 * Actualizar un usuario
 */
export async function updateUser(userId: number, userData: UpdateUserPayload) {
  try {
    const res = await api.put(`/users/${userId}`, userData);
    alerts.success("✅ Usuario actualizado exitosamente");
    return res.data;
  } catch (error: any) {
    console.error("Error actualizando usuario:", error);
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.data?.[0]?.message ||
                        error.response?.data?.message ||
                        "Error al actualizar el usuario";
    alerts.error(`❌ ${errorMessage}`);
    throw error;
  }
}

/**
 * Bloquear o desbloquear un usuario
 */
export async function toggleBlockUser(userId: number, blocked: boolean) {
  try {
    const res = await api.put(`/users/${userId}`, { blocked });
    alerts.success(`✅ Usuario ${blocked ? "bloqueado" : "desbloqueado"} exitosamente`);
    return res.data;
  } catch (error: any) {
    console.error("Error cambiando estado del usuario:", error);
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.data?.[0]?.message ||
                        error.response?.data?.message ||
                        "Error al cambiar el estado del usuario";
    alerts.error(`❌ ${errorMessage}`);
    throw error;
  }
}

/**
 * Eliminar un usuario
 */
export async function deleteUser(userId: number) {
  try {
    await api.delete(`/users/${userId}`);
    alerts.success("✅ Usuario eliminado exitosamente");
  } catch (error: any) {
    console.error("Error eliminando usuario:", error);
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.data?.[0]?.message ||
                        error.response?.data?.message ||
                        "Error al eliminar el usuario";
    alerts.error(`❌ ${errorMessage}`);
    throw error;
  }
}

/**
 * Obtener todos los usuarios con sus roles
 */
export async function getUsers() {
  try {
    const res = await api.get("/users?populate=role", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return res.data;
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    throw error;
  }
}
