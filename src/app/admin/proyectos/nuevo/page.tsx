"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_proyecto: "",
    cliente_email: "",
    cliente_nombre: "",
    estado_general: "En Planificación",
    fecha_inicio: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Llamada al backend para crear proyecto
    // const nuevoProyecto = await crearProyecto(formData);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    alert("Proyecto creado exitosamente!");
    router.push("/admin/proyectos");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo="Crear Nuevo Proyecto"
        subtitulo="Completa la información básica del proyecto"
        mostrarVolver={true}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
          <div className="space-y-6">
            {/* Nombre del Proyecto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                name="nombre_proyecto"
                value={formData.nombre_proyecto}
                onChange={handleChange}
                required
                placeholder="Ej: Remodelación Apartamento Las Mercedes"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre descriptivo del proyecto de construcción o remodelación
              </p>
            </div>

            {/* Cliente */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  name="cliente_nombre"
                  value={formData.cliente_nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: María González"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email del Cliente *
                </label>
                <input
                  type="email"
                  name="cliente_email"
                  value={formData.cliente_email}
                  onChange={handleChange}
                  required
                  placeholder="cliente@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se enviará acceso NFC a este email
                </p>
              </div>
            </div>

            {/* Estado y Fecha */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado Inicial *
                </label>
                <select
                  name="estado_general"
                  value={formData.estado_general}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                >
                  <option value="En Planificación">En Planificación</option>
                  <option value="En Ejecución">En Ejecución</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    ¿Qué sucede después?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Se generará automáticamente un <strong>token NFC único</strong>
                    </li>
                    <li>
                      • Se crearán los <strong>7 hitos predeterminados</strong> del proyecto
                    </li>
                    <li>
                      • El cliente recibirá un email con instrucciones de acceso
                    </li>
                    <li>• Podrás empezar a agregar contenido a cada hito</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creando...
                </span>
              ) : (
                "Crear Proyecto"
              )}
            </button>
          </div>
        </form>
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
