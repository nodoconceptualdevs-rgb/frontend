"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import { getMisProyectos, Proyecto } from "@/services/proyectos";
import { useAuth } from "@/context/AuthContext";
import ProyectosGrid from "@/components/proyectos/ProyectosGrid";

export default function MiProyectoPage() {
  const { isGerente, isCliente } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyectos();
  }, []);

  const loadProyectos = async () => {
    try {
      setLoading(true);
      const response = await getMisProyectos() as { data: Proyecto[] };
      setProyectos(response.data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      message.error("Error al cargar tus proyectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      <ProyectosGrid
        proyectos={proyectos as any}
        loading={loading}
        isGerente={isGerente}
        isCliente={isCliente}
        editRoutePrefix={isGerente ? "/dashboard/mi-proyecto" : undefined}
        emptyMessage="No tienes proyectos asignados"
        emptyDescription={
          isCliente 
            ? "Aquí aparecerá tu proyecto cuando te sea asignado" 
            : "Cuando se te asigne un proyecto, aparecerá aquí"
        }
      />
    </div>
  );
}
