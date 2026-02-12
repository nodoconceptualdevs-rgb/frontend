"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getProyectos, getMisProyectos, type Proyecto } from "@/services/proyectos";
import { useAuth } from "@/context/AuthContext";
import ProyectosGrid from "@/components/proyectos/ProyectosGrid";

export default function AdminProyectosPage() {
  const { isAdmin } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProyectos() {
      try {
        // Admin ve todos los proyectos, gerente solo los suyos
        const response: any = isAdmin ? await getProyectos() : await getMisProyectos();
        
        const proyectosData = response.data.map((p: Proyecto) => {
          // Calcular progreso
          const totalHitos = p.hitos?.length || 0;
          const hitosCompletados = p.hitos?.filter((h: any) => h.estado_completado).length || 0;
          const progreso = totalHitos > 0 ? Math.round((hitosCompletados / totalHitos) * 100) : 0;
          
          return {
            ...p,
            progreso
          };
        });
        setProyectos(proyectosData);
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProyectos();
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo="Proyectos"
        subtitulo={`${proyectos.length} proyecto${proyectos.length !== 1 ? "s" : ""} activos`}
      />

      <main className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        <ProyectosGrid
          proyectos={proyectos as any}
          loading={loading}
          isAdmin={isAdmin}
          showCreateButton={true}
          editRoutePrefix="/admin/proyectos"
          emptyMessage="No hay proyectos creados"
          emptyDescription="Comienza creando tu primer proyecto"
        />
      </main>
    </div>
  );
}
