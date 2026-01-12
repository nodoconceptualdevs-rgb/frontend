import api from "@/lib/api";
import { getAuthHeaders } from "@/lib/getAuthToken";

export interface Usuario {
  id: number;
  username: string;
  email: string;
  name?: string;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}

/**
 * Obtener todos los usuarios (admin)
 */
export async function getUsuarios() {
  const res = await api.get("/users?populate=role", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener usuarios por rol
 */
export async function getUsuariosByRole(roleType: string) {
  const res = await api.get(`/users?filters[role][type][$eq]=${roleType}&populate=role`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener todos los usuarios para usar en selectores
 * Devuelve todos los usuarios disponibles
 */
export async function getUsuariosParaSelector() {
  try {
    const res = await api.get("/users?populate=role", {
      headers: getAuthHeaders(),
    });
    return res.data || [];
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }
}

/**
 * Obtener clientes (usuarios con rol 'authenticated' o 'cliente')
 */
export async function getClientes() {
  try {
    // Primero intenta obtener usuarios con rol específico de cliente
    const res = await api.get("/users?populate=role", {
      headers: getAuthHeaders(),
    });
    
    const usuarios: any[] = Array.isArray(res.data) ? res.data : [];
    
    // Filtrar usuarios que tengan rol 'authenticated' o que incluya 'client' en el nombre
    const clientes = usuarios.filter((user: any) => {
      const roleType = user.role?.type?.toLowerCase() || '';
      const roleName = user.role?.name?.toLowerCase() || '';
      
      // Buscar roles que sean 'authenticated' o contengan 'client' o 'cliente'
      return roleType === 'authenticated' || 
             roleName.includes('client') || 
             roleName.includes('cliente');
    });
    
    console.log('Clientes encontrados:', clientes.length, 'de', usuarios.length);
    return clientes;
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return [];
  }
}

/**
 * Obtener gerentes de proyecto (usuarios con rol 'gerente' o 'manager')
 */
export async function getGerentes() {
  try {
    // Obtener todos los usuarios con sus roles
    const res = await api.get("/users?populate=role", {
      headers: getAuthHeaders(),
    });
    
    const usuarios: any[] = Array.isArray(res.data) ? res.data : [];
    
    // Filtrar usuarios que tengan rol de gerente
    const gerentes = usuarios.filter((user: any) => {
      const roleType = user.role?.type?.toLowerCase() || '';
      const roleName = user.role?.name?.toLowerCase() || '';
      
      // Buscar roles que contengan 'gerente', 'manager' o 'project manager'
      return roleType.includes('gerente') || 
             roleType.includes('manager') ||
             roleName.includes('gerente') || 
             roleName.includes('manager');
    });
    
    console.log('Gerentes encontrados:', gerentes.length, 'de', usuarios.length);
    return gerentes;
  } catch (error) {
    console.error('Error obteniendo gerentes:', error);
    return [];
  }
}
