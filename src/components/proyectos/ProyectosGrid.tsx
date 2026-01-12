import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProyectoCard, { ProyectoCardProps } from "./ProyectoCard";

interface ProyectosGridProps {
  proyectos: ProyectoCardProps["proyecto"][];
  loading?: boolean;
  isAdmin?: boolean;
  isGerente?: boolean;
  isCliente?: boolean;
  showCreateButton?: boolean;
  editRoutePrefix?: string;
  emptyMessage?: string;
  emptyDescription?: string;
}

export default function ProyectosGrid({
  proyectos,
  loading = false,
  isAdmin = false,
  isGerente = false,
  isCliente = false,
  showCreateButton = false,
  editRoutePrefix,
  emptyMessage = "No tienes proyectos asignados",
  emptyDescription = "Cuando se te asigne un proyecto, aparecerá aquí"
}: ProyectosGridProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  // Filtrar proyectos por búsqueda
  const proyectosFiltrados = useMemo(() => {
    if (!searchText.trim()) return proyectos;
    
    const search = searchText.toLowerCase();
    return proyectos.filter((proyecto) => {
      const nombre = proyecto.nombre_proyecto?.toLowerCase() || "";
      const cliente = proyecto.cliente?.name?.toLowerCase() || proyecto.cliente?.username?.toLowerCase() || "";
      const gerente = proyecto.gerente_proyecto?.name?.toLowerCase() || proyecto.gerente_proyecto?.username?.toLowerCase() || "";
      
      return nombre.includes(search) || cliente.includes(search) || gerente.includes(search);
    });
  }, [proyectos, searchText]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
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

        {/* Solo admin puede crear proyectos */}
        {showCreateButton && isAdmin && (
          <Link
            href="/admin/proyectos/nuevo"
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
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre de proyecto o cliente..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
            {searchText
              ? "Intenta con otros términos de búsqueda"
              : emptyDescription}
          </p>
          {!searchText && showCreateButton && isAdmin && (
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
          {proyectosFiltrados.map((proyecto) => {
            const editRoute = editRoutePrefix ? `${editRoutePrefix}/${proyecto.id}` : undefined;
            
            return (
              <ProyectoCard
                key={proyecto.id}
                proyecto={proyecto}
                isAdmin={isAdmin}
                isGerente={isGerente}
                isCliente={isCliente}
                editRoute={editRoute}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
