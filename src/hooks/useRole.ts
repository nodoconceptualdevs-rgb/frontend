/**
 * Hook para verificar roles y permisos
 */

import { useAuth } from '@/context/AuthContext';
import { RoleType } from '@/types/auth';

export function useRole() {
  const { user, isAdmin, isGerente, isCliente } = useAuth();

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (role: RoleType): boolean => {
    return user?.role.type === role;
  };

  /**
   * Verifica si el usuario tiene uno de varios roles
   */
  const hasAnyRole = (roles: RoleType[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role.type);
  };

  /**
   * Verifica si el usuario puede gestionar proyectos
   */
  const canManageProjects = (): boolean => {
    return isAdmin || isGerente;
  };

  /**
   * Verifica si el usuario puede asignar gerentes
   */
  const canAssignGerentes = (): boolean => {
    return isAdmin;
  };

  /**
   * Verifica si el usuario puede gestionar hitos
   */
  const canManageHitos = (): boolean => {
    return isAdmin || isGerente;
  };

  /**
   * Verifica si el usuario puede subir archivos
   */
  const canUploadFiles = (): boolean => {
    return isAdmin || isGerente;
  };

  /**
   * Verifica si el usuario puede crear comentarios
   */
  const canComment = (): boolean => {
    return isAdmin || isGerente || isCliente;
  };

  /**
   * Verifica si el usuario puede ver todos los proyectos
   */
  const canViewAllProjects = (): boolean => {
    return isAdmin;
  };

  /**
   * Verifica si el usuario puede gestionar usuarios
   */
  const canManageUsers = (): boolean => {
    return isAdmin;
  };

  return {
    user,
    isAdmin,
    isGerente,
    isCliente,
    hasRole,
    hasAnyRole,
    canManageProjects,
    canAssignGerentes,
    canManageHitos,
    canUploadFiles,
    canComment,
    canViewAllProjects,
    canManageUsers,
  };
}
