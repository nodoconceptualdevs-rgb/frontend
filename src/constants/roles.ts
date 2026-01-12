/**
 * Constantes de roles del sistema
 */
export const ROLES = {
  ADMIN: 'admin',
  GERENTE_PROYECTO: 'gerente_de_proyecto',
  AUTHENTICATED: 'authenticated',
  CLIENT: 'client',
  PUBLIC: 'public',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

/**
 * Verifica si un rol tiene permisos de administración
 */
export function isAdminRole(role: string | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.GERENTE_PROYECTO;
}

/**
 * Verifica si un rol es de cliente
 */
export function isClientRole(role: string | undefined): boolean {
  return role === ROLES.AUTHENTICATED || role === ROLES.CLIENT;
}

/**
 * Obtiene la ruta por defecto según el rol
 */
export function getDefaultRouteByRole(role: string | undefined): string {
  if (isAdminRole(role)) {
    return '/admin/proyectos';
  }
  if (isClientRole(role)) {
    return '/dashboard/cursos';
  }
  return '/login';
}
