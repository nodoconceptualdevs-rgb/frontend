"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";

// Mock data - reemplazar con llamada al backend
const MOCK_PROYECTOS = [
  {
    id: 1,
    nombre_proyecto: "Remodelación Apartamento Las Mercedes",
    cliente_nombre: "María González",
    estado_general: "En Ejecución",
    progreso: 86,
    ultimo_avance: "Instalación de pisos completada",
    fecha_inicio: "2025-01-15",
    token_nfc: "demo-token-123",
  },
  {
    id: 2,
    nombre_proyecto: "Casa Moderna Los Palos Grandes",
    cliente_nombre: "Carlos Rodríguez",
    estado_general: "En Planificación",
    progreso: 28,
    ultimo_avance: "Planos aprobados por el cliente",
    fecha_inicio: "2025-10-01",
    token_nfc: "token-xyz-456",
  },
];

export default function AdminProyectosPage() {
  const router = useRouter();
  const [proyectos] = useState(MOCK_PROYECTOS);
  const [searchTerm, setSearchTerm] = useState("");

  const proyectosFiltrados = proyectos.filter((p) =>
    p.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "En Planificación":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "En Ejecución":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Completado":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo="Mis Proyectos"
        subtitulo={`${proyectos.length} proyecto${proyectos.length !== 1 ? "s" : ""} activos`}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Proyectos
            </h2>
            <p className="text-gray-600">
              {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""} en total
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/proyectos/nuevo")}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre de proyecto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Projects Grid */}
        {proyectosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron proyectos
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Comienza creando tu primer proyecto"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push("/admin/proyectos/nuevo")}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                Crear Primer Proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectosFiltrados.map((proyecto) => (
              <div
                key={proyecto.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group cursor-pointer"
                onClick={() => router.push(`/admin/proyectos/${proyecto.id}`)}
              >
                {/* Header del Card */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition line-clamp-2">
                        {proyecto.nombre_proyecto}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {proyecto.cliente_nombre}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(
                      proyecto.estado_general
                    )}`}
                  >
                    {proyecto.estado_general}
                  </span>
                </div>

                {/* Progress */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Progreso
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {proyecto.progreso}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${proyecto.progreso}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="px-6 py-4">
                  <div className="text-xs text-gray-500 mb-2">
                    Último avance:
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {proyecto.ultimo_avance}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/proyectos/${proyecto.id}`);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `/proyecto/${proyecto.token_nfc}`,
                        "_blank"
                      );
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-red-600 hover:text-red-600 transition"
                  >
                    Vista Cliente
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Nodo Conceptual. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
