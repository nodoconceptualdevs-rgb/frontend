"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { createProyecto } from "@/services/proyectos";
import { getClientes, getGerentes } from "@/services/usuarios";
import { alerts } from "@/lib/alerts";
import { Toaster } from "react-hot-toast";

interface Usuario {
  id: number;
  username: string;
  email: string;
  name?: string;
}

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [gerentes, setGerentes] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState({
    nombre_proyecto: "",
    cliente: "",
    gerente_proyecto: "",
    estado_general: "En Planificación",
    fecha_inicio: new Date().toISOString().split("T")[0],
    es_publico: true,
  });

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        setLoadingUsers(true);
        
        // Obtener clientes y gerentes en paralelo
        const [clientesData, gerentesData] = await Promise.all([
          getClientes(),
          getGerentes()
        ]);
        
        console.log("Clientes cargados:", clientesData);
        console.log("Gerentes cargados:", gerentesData);
        
        setClientes(Array.isArray(clientesData) ? clientesData : []);
        setGerentes(Array.isArray(gerentesData) ? gerentesData : []);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
        setClientes([]);
        setGerentes([]);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsuarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await alerts.promise(
        createProyecto({
          nombre_proyecto: formData.nombre_proyecto,
          fecha_inicio: formData.fecha_inicio,
          estado_general: formData.estado_general,
          cliente: formData.cliente ? parseInt(formData.cliente) : undefined,
          gerente_proyecto: formData.gerente_proyecto ? parseInt(formData.gerente_proyecto) : undefined,
          es_publico: formData.es_publico
        }),
        {
          loading: 'Creando proyecto...',
          success: 'Proyecto creado exitosamente',
          error: 'Error al crear el proyecto'
        }
      );
      
      // Esperar un poco para que se vea la alerta de éxito
      setTimeout(() => {
        router.push("/admin/proyectos");
      }, 1000);
    } catch (error: any) {
      console.error("Error creando proyecto:", error);
    } finally {
      setLoading(false);
    }
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
      <Toaster />
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

            {/* Cliente y Gerente */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  disabled={loadingUsers}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingUsers ? "Cargando clientes..." : "Sin cliente asignado"}
                  </option>
                  {!loadingUsers && clientes.map((cliente: Usuario) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.username || cliente.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingUsers ? "Cargando lista de clientes..." : `${clientes.length} clientes disponibles`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gerente de Proyecto
                </label>
                <select
                  name="gerente_proyecto"
                  value={formData.gerente_proyecto}
                  onChange={handleChange}
                  disabled={loadingUsers}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingUsers ? "Cargando gerentes..." : "Sin gerente asignado"}
                  </option>
                  {!loadingUsers && gerentes.map((gerente: Usuario) => (
                    <option key={gerente.id} value={gerente.id}>
                      {gerente.username || gerente.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingUsers ? "Cargando lista de gerentes..." : `${gerentes.length} gerentes disponibles`}
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

            {/* Privacidad del Proyecto */}
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Configuración de Privacidad
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formData.es_publico 
                      ? "El proyecto es accesible con el token NFC sin necesidad de autenticación" 
                      : "El proyecto requiere autenticación además del token NFC"}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, es_publico: !formData.es_publico })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.es_publico ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    <span className="sr-only">Proyecto público</span>
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formData.es_publico ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <div className={`flex items-center gap-1 ${formData.es_publico ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Público</span>
                </div>
                <div className={`flex items-center gap-1 ${!formData.es_publico ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Privado</span>
                </div>
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
                      • Podrás <strong>crear los hitos</strong> del proyecto manualmente
                    </li>
                    <li>
                      • El proyecto estará disponible para gestión inmediata
                    </li>
                    <li>• Podrás agregar contenido multimedia a cada hito creado</li>
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
