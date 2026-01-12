import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface AdminHeaderProps {
  titulo: string;
  subtitulo?: string;
  mostrarVolver?: boolean;
  mostrarVistaCliente?: boolean;
  tokenNFC?: string;
}

export default function AdminHeader({
  titulo,
  subtitulo,
  mostrarVolver = false,
  mostrarVistaCliente = false,
  tokenNFC,
}: AdminHeaderProps) {
  const router = useRouter();
  const { isAdmin, isGerente, isCliente } = useAuth();

  // Determinar el texto del panel según el rol
  const getPanelText = () => {
    if (isAdmin) return "Panel de Administrador";
    if (isGerente) return "Panel de Gerente de Proyectos";
    if (isCliente) return "Panel de Cliente";
    return "Panel de Usuario";
  };

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
      <div className="px-8 py-6">
        {/* Logo y Actions */}
        <div className="mb-4 flex items-center justify-between">
          <Link 
            href="/admin/proyectos"
            className="cursor-pointer"
          >
            <div className="text-2xl font-bold text-red-500">NODO CONCEPTUAL</div>
            <div className="text-sm text-gray-400 mt-1">
              {getPanelText()}
            </div>
          </Link>

          {mostrarVistaCliente && tokenNFC && (
            <button
              onClick={() => window.open(`/proyecto/${tokenNFC}`, "_blank")}
              className="px-4 py-2 border-2 border-gray-400 text-white font-semibold rounded-lg hover:border-red-500 hover:bg-gray-700 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Vista Cliente
            </button>
          )}
        </div>

        {/* Información Principal */}
        <div className="flex items-center gap-4">
          {mostrarVolver && (
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{titulo}</h1>
            {subtitulo && <p className="text-gray-400 text-sm">{subtitulo}</p>}
          </div>
        </div>
      </div>
    </header>
  );
}
