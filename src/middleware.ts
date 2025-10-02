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
      return NextResponse.redirect(new URL("/dashboard/mis-cursos", req.url));
    }
    return NextResponse.next();
  }

  // Proteger solo rutas de usuario autenticado con token
  if (
    pathname === "/dashboard/mi-perfil" ||
    pathname === "/dashboard/mis-cursos" ||
    pathname === "/dashboard/mis-pagos"
  ) {
    const cookieToken = req.cookies.get("token")?.value;
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
  matcher: ["/dashboard/:path*", "/login", "/registro"],
};
