import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, isGerente, isCliente } = useAuth();

  const isProyectos = pathname.startsWith("/admin/proyectos");

  // Determinar el texto del panel según el rol
  const getPanelText = () => {
    if (isAdmin) return "Panel de Administrador";
    if (isGerente) return "Panel de Gerente";
    if (isCliente) return "Panel de Cliente";
    return "Panel de Usuario";
  };

  return (
    <div style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
      <nav className="bg-white rounded-3xl my-8 shadow-lg border border-gray-200">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 cursor-pointer">
              <img src="/logo.svg" alt="Nodo Conceptual" className="h-10" />
              <div className="border-l-2 border-gray-300 pl-4">
                <div className="text-sm font-semibold text-red-600">
                  {getPanelText()}
                </div>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/admin/proyectos"
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isProyectos
                    ? "bg-red-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Mis Proyectos
              </Link>
              
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold transition"
              >
                Salir
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
