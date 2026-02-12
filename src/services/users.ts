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

/**
 * Actualizar el rol de un usuario
 * @param userId ID del usuario
 * @param roleId ID del nuevo rol
 */
export async function updateUserRole(userId: number, roleId: number) {
  const res = await api.put(`/users/${userId}`, { role: roleId }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Interfaz para roles
 */
export interface Role {
  id: number;
  name: string;
  type: string;
  description?: string;
}

/**
 * Obtener todos los roles disponibles
 */
export async function getRoles() {
  const res = await api.get('/users-permissions/roles', {
    headers: getAuthHeaders(),
  });
  // Manejo seguro de la respuesta
  const data = res.data as any;
  return (data && Array.isArray(data.roles) ? data.roles : []) as Role[];
}

/**
 * Obtener el ID del rol cliente/authenticated
 * Esta función busca el rol por tipo y devuelve su ID
 */
export async function getClientRoleId(): Promise<number> {
  try {
    const roles = await getRoles();
    const clientRole = roles.find(role => role.type === 'authenticated' || role.name.toLowerCase().includes('client'));
    
    if (clientRole) {
      return clientRole.id;
    }
    
    // Si no encuentra el rol específico, devolver el ID predeterminado (4 suele ser el authenticated)
    return 4;
  } catch (error) {
    console.error('Error obteniendo el ID del rol cliente:', error);
    // ID predeterminado como fallback
    return 4;
  }
}
