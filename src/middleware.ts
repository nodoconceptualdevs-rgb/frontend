import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // If user is already authenticated, prevent access to auth pages
  if (pathname === "/login" || pathname === "/registro") {
    const cookieToken = req.cookies.get("token")?.value;
    if (cookieToken) {
      // already logged in -> redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Only protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const cookieToken = req.cookies.get("token")?.value;
    const role = req.cookies.get("role")?.value;
    if (!cookieToken || !role) {
      // No token o no role: redirect to login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin =
      role.toLowerCase() === "admin" || role.toLowerCase() === "administrador";
    const isCliente =
      role.toLowerCase() === "cliente" || role.toLowerCase() === "client";

    // Si es ruta de admin, solo admin puede entrar
    if (pathname.startsWith("/dashboard/admin")) {
      if (!isAdmin) {
        // Si no es admin, redirigir a la ruta principal de cliente
        return NextResponse.redirect(new URL("/dashboard/mis-cursos", req.url));
      }
    } else if (pathname.startsWith("/dashboard/mis-cursos")) {
      // Si es ruta de cliente, solo cliente puede entrar
      if (!isCliente) {
        // Si no es cliente, redirigir a la ruta principal de admin
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      }
    } else {
      // Cualquier otra ruta privada no encontrada: redirigir a la principal de su rol
      if (isAdmin) {
        return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      } else if (isCliente) {
        return NextResponse.redirect(new URL("/dashboard/mis-cursos", req.url));
      } else {
        // fallback: acceso denegado
        return NextResponse.redirect(new URL("/not-authorized", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/registro"],
};
