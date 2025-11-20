"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HitoEditor from "@/components/admin/HitoEditor";
import AdminHeader from "@/components/admin/AdminHeader";

const HITOS_INICIALES = [
  { id: 1, nombre: "Conceptualización (Diseño)", orden: 1 },
  { id: 2, nombre: "Planificación (Técnico)", orden: 2 },
  { id: 3, nombre: "Visualización 3D", orden: 3 },
  { id: 4, nombre: "Adquisición de Materiales", orden: 4 },
  { id: 5, nombre: "Ejecución (Obra Gris)", orden: 5 },
  { id: 6, nombre: "Acabados y Decoración", orden: 6 },
  { id: 7, nombre: "Entrega Final", orden: 7 },
];

export default function EditarProyectoPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [selectedHito, setSelectedHito] = useState<number | null>(null);
  
  const [proyecto, setProyecto] = useState({
    id: params.id,
    nombre_proyecto: "Remodelación Apartamento Las Mercedes",
    cliente_nombre: "María González",
    cliente_email: "maria@email.com",
    estado_general: "En Ejecución",
    fecha_inicio: "2025-01-15",
    token_nfc: "demo-token-123",
    ultimo_avance: "Instalación de pisos completada",
  });

  const [hitos, setHitos] = useState(
    HITOS_INICIALES.map((h) => ({
      ...h,
      estado_completado: h.orden <= 5,
      fecha_actualizacion: h.orden <= 5 ? new Date().toISOString() : null,
      descripcion_avance: "",
      enlace_tour_360: "",
    }))
  );

  const handleUpdateProyecto = (field: string, value: string) => {
    setProyecto({ ...proyecto, [field]: value });
  };

  const handleSaveProyecto = async () => {
    // TODO: Llamada al backend
    alert("Proyecto actualizado!");
  };

  const hitoSeleccionado = hitos.find((h) => h.id === selectedHito);

  const handleDeleteHito = (hitoId: number) => {
    if (hitos.length <= 1) {
      alert("Debe haber al menos un hito en el proyecto");
      return;
    }
    if (confirm("¿Estás seguro de eliminar este hito?")) {
      setHitos(hitos.filter(h => h.id !== hitoId));
      if (selectedHito === hitoId) {
        setSelectedHito(null);
      }
    }
  };

  const handleAddHito = () => {
    const nuevoId = Math.max(...hitos.map(h => h.id)) + 1;
    const nuevoOrden = Math.max(...hitos.map(h => h.orden)) + 1;
    const nuevoHito = {
      id: nuevoId,
      nombre: `Nuevo Hito ${nuevoOrden}`,
      orden: nuevoOrden,
      estado_completado: false,
      fecha_actualizacion: null,
      descripcion_avance: "",
      enlace_tour_360: "",
    };
    setHitos([...hitos, nuevoHito]);
    setSelectedHito(nuevoId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo={proyecto.nombre_proyecto}
        subtitulo={`Cliente: ${proyecto.cliente_nombre}`}
        mostrarVolver={true}
        mostrarVistaCliente={true}
        tokenNFC={proyecto.token_nfc}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-3 px-1 font-semibold transition border-b-2 ${
              activeTab === "info"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab("hitos")}
            className={`pb-3 px-1 font-semibold transition border-b-2 ${
              activeTab === "hitos"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Gestión de Hitos
          </button>
        </div>
        {/* Información General */}
        {activeTab === "info" && (
          <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Información del Proyecto
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={proyecto.nombre_proyecto}
                  onChange={(e) =>
                    handleUpdateProyecto("nombre_proyecto", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={proyecto.cliente_nombre}
                    onChange={(e) =>
                      handleUpdateProyecto("cliente_nombre", e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={proyecto.estado_general}
                    onChange={(e) =>
                      handleUpdateProyecto("estado_general", e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                  >
                    <option value="En Planificación">En Planificación</option>
                    <option value="En Ejecución">En Ejecución</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Último Avance
                </label>
                <textarea
                  value={proyecto.ultimo_avance}
                  onChange={(e) =>
                    handleUpdateProyecto("ultimo_avance", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition resize-none"
                  placeholder="Describe el último avance del proyecto..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Token NFC del Proyecto
                </h3>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-300 text-sm font-mono">
                    {proyecto.token_nfc}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(proyecto.token_nfc);
                      alert("Token copiado!");
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-semibold"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  URL del cliente:{" "}
                  <span className="font-mono">
                    /proyecto/{proyecto.token_nfc}
                  </span>
                </p>
              </div>

              <button
                onClick={handleSaveProyecto}
                className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-lg"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {/* Gestión de Hitos */}
        {activeTab === "hitos" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Lista de Hitos */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Hitos del Proyecto
                  </h2>
                  <button
                    onClick={handleAddHito}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    title="Agregar hito"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona un hito para editarlo
                </p>

                <div className="space-y-2">
                  {hitos.map((hito) => (
                    <button
                      key={hito.id}
                      onClick={() => setSelectedHito(hito.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition border-2 group ${
                        selectedHito === hito.id
                          ? "border-red-600 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 relative">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            hito.estado_completado
                              ? "bg-green-500 text-white"
                              : "bg-gray-300"
                          }`}
                        >
                          {hito.estado_completado && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900">
                            {hito.orden}. {hito.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {hito.estado_completado
                              ? "Completado"
                              : "Pendiente"}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHito(hito.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                          title="Eliminar hito"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editor del Hito Seleccionado */}
            <div className="lg:col-span-2">
              {hitoSeleccionado ? (
                <HitoEditor
                  hito={hitoSeleccionado}
                  onUpdate={(updatedHito) => {
                    setHitos(
                      hitos.map((h) =>
                        h.id === updatedHito.id ? updatedHito : h
                      )
                    );
                  }}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
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
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecciona un Hito
                  </h3>
                  <p className="text-gray-600">
                    Elige un hito de la lista para comenzar a editar su
                    contenido
                  </p>
                </div>
              )}
            </div>
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
