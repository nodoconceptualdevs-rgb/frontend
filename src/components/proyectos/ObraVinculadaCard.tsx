"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getObrasDisponiblesParaProyecto, vincularProyectoAObra, desvincularProyectoDeObra } from "@/services/obras";
import { alerts } from "@/lib/alerts";

interface ObraVinculada {
  id: number;
  documentId: string;
  nombre: string;
  estado: string;
}

interface ObraVinculadaCardProps {
  proyectoId: number;
  obraVinculada?: ObraVinculada;
  basePath: "/admin/obras" | "/dashboard/obras";
  nuevaObraPath: "/admin/obras/nueva" | "/dashboard/obras/nueva";
  onCambio: () => void;
}

export default function ObraVinculadaCard({
  proyectoId,
  obraVinculada,
  basePath,
  nuevaObraPath,
  onCambio,
}: ObraVinculadaCardProps) {
  const router = useRouter();
  const [obrasDisponibles, setObrasDisponibles] = useState<{ id: number; documentId: string; nombre: string }[]>([]);
  const [obraSeleccionadaId, setObraSeleccionadaId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!obraVinculada) {
      getObrasDisponiblesParaProyecto()
        .then(setObrasDisponibles)
        .catch((error) => console.error("Error cargando obras disponibles:", error));
    }
  }, [obraVinculada]);

  const handleVincular = async () => {
    const obra = obrasDisponibles.find((o) => o.id === parseInt(obraSeleccionadaId));
    if (!obra) {
      alerts.error("Selecciona una obra");
      return;
    }
    try {
      setLoading(true);
      await vincularProyectoAObra(obra.documentId, proyectoId);
      alerts.success("Obra vinculada exitosamente");
      onCambio();
    } catch (error) {
      console.error("Error vinculando obra:", error);
      alerts.error("Error al vincular la obra");
    } finally {
      setLoading(false);
    }
  };

  const handleDesvincular = async () => {
    if (!obraVinculada) return;
    if (!confirm(`¿Desvincular la obra "${obraVinculada.nombre}" de este proyecto?`)) return;
    try {
      setLoading(true);
      await desvincularProyectoDeObra(obraVinculada.documentId);
      alerts.success("Obra desvinculada");
      onCambio();
    } catch (error) {
      console.error("Error desvinculando obra:", error);
      alerts.error("Error al desvincular la obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Obra Vinculada</h2>

      {obraVinculada ? (
        <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <div>
            <p className="font-semibold text-gray-900">{obraVinculada.nombre}</p>
            <p className="text-sm text-gray-500">Estado: {obraVinculada.estado}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`${basePath}/${obraVinculada.id}`)}
              className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition"
            >
              Ver obra
            </button>
            <button
              onClick={handleDesvincular}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition disabled:opacity-50"
            >
              Desvincular
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Este proyecto no tiene una obra vinculada.</p>
          <div className="flex gap-2">
            <select
              value={obraSeleccionadaId}
              onChange={(e) => setObraSeleccionadaId(e.target.value)}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
            >
              <option value="">Selecciona una obra sin proyecto</option>
              {obrasDisponibles.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={handleVincular}
              disabled={loading || !obraSeleccionadaId}
              className="px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:bg-gray-300"
            >
              Vincular
            </button>
          </div>
          <button
            onClick={() => router.push(`${nuevaObraPath}?proyectoId=${proyectoId}`)}
            className="text-sm text-red-600 font-semibold hover:underline"
          >
            + Crear una obra nueva y vincularla
          </button>
        </div>
      )}
    </div>
  );
}
