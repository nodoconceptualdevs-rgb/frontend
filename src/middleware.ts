import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// DEFINICIÓN DE ROLES
// ============================================
const ROLES = {
  ADMIN: 'admin',
  GERENTE_PROYECTO: 'gerente_de_proyecto',
  AUTHENTICATED: 'authenticated',
  CLIENT: 'client',
} as const;

/**
 * Verifica si un rol tiene permisos administrativos
 */
function isAdminRole(role: string | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.GERENTE_PROYECTO;
}

/**
 * Verifica si un rol es de cliente
 */
function isClientRole(role: string | undefined): boolean {
  return role === ROLES.AUTHENTICATED || role === ROLES.CLIENT;
}

/**
 * Obtiene la ruta por defecto según el rol
 */
function getDefaultRouteByRole(role: string | undefined): string {
  if (isAdminRole(role)) {
    return '/admin/proyectos';
  }
  if (isClientRole(role)) {
    return '/dashboard/mis-cursos';
  }
  return '/login';
}

// ============================================
// MIDDLEWARE
// ============================================
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const cookieToken = req.cookies.get("token")?.value;
  const cookieRole = req.cookies.get("role")?.value;

  // ============================================
  // Prevenir acceso a páginas de auth si ya está autenticado
  // ============================================
  if (pathname === "/login" || pathname === "/registro") {
    if (cookieToken && cookieRole) {
      const defaultRoute = getDefaultRouteByRole(cookieRole);
      return NextResponse.redirect(new URL(defaultRoute, req.url));
    }
    return NextResponse.next();
  }

  // ============================================
  // Proteger rutas de administración (/admin)
  // ============================================
  if (pathname.startsWith("/admin")) {
    if (!cookieToken) {
      // No autenticado: redirect to login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Verificar que el rol tenga permisos administrativos
    if (!isAdminRole(cookieRole)) {
      // Rol no autorizado: redirect a su dashboard
      const defaultRoute = getDefaultRouteByRole(cookieRole);
      return NextResponse.redirect(new URL(defaultRoute, req.url));
    }
    
    // Restricciones para gerente de proyecto
    // Solo puede acceder a: /admin/proyectos y /admin/mi-perfil
    if (cookieRole === ROLES.GERENTE_PROYECTO) {
      const allowedPaths = ["/admin/proyectos", "/admin/mi-perfil"];
      const isAllowed = allowedPaths.some(path => pathname.startsWith(path));
      
      if (!isAllowed) {
        // Redirigir a proyectos si intenta acceder a otra ruta
        return NextResponse.redirect(new URL("/admin/proyectos", req.url));
      }
    }
    
    return NextResponse.next();
  }

  // ============================================
  // Proteger rutas de dashboard (/dashboard)
  // ============================================
  if (pathname.startsWith("/dashboard")) {
    if (!cookieToken) {
      // No token: redirect to login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Si tiene token, puede acceder
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/registro"],
};
