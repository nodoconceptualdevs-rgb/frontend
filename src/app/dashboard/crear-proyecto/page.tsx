"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProyecto } from "@/services/proyectos";
import { getClientes } from "@/services/usuarios";
import { alerts } from "@/lib/alerts";
import { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface Usuario {
  id: number;
  username: string;
  email: string;
  name?: string;
}

export default function NuevoProyectoGerentePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState({
    nombre_proyecto: "",
    cliente: "",
    estado_general: "En Planificación",
    fecha_inicio: new Date().toISOString().split("T")[0],
    es_publico: true,
  });

  useEffect(() => {
    // Verificar si el usuario es gerente
    if (user && user.role?.type !== 'gerente_de_proyecto') {
      alerts.error('No tienes permisos para acceder a esta página');
      router.push('/dashboard');
      return;
    }

    async function fetchClientes() {
      try {
        setLoadingClientes(true);
        const clientesData = await getClientes();
        console.log("Clientes cargados:", clientesData);
        setClientes(Array.isArray(clientesData) ? clientesData : []);
      } catch (error) {
        console.error("Error cargando clientes:", error);
        setClientes([]);
      } finally {
        setLoadingClientes(false);
      }
    }
    
    fetchClientes();
  }, [user, router]);

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
          gerente_proyecto: user?.id, // Asignar automáticamente el gerente
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
        router.push("/dashboard/mi-proyecto");
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
    <>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Crear Nuevo Proyecto
            </h1>
            <p className="text-gray-600">
              Como gerente, serás asignado automáticamente al proyecto
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nombre del Proyecto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  name="nombre_proyecto"
                  value={formData.nombre_proyecto}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                  placeholder="Ej: Torre Residencial Skyline"
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  disabled={loadingClientes}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingClientes ? "Cargando clientes..." : "Sin cliente asignado"}
                  </option>
                  {!loadingClientes && clientes.map((cliente: Usuario) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.username || cliente.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingClientes ? "Cargando lista de clientes..." : `${clientes.length} clientes disponibles`}
                </p>
              </div>

              {/* Estado */}
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

              {/* Fecha de Inicio */}
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

              {/* Proyecto Público */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="es_publico"
                    checked={formData.es_publico}
                    onChange={(e) =>
                      setFormData({ ...formData, es_publico: e.target.checked })
                    }
                    className="w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-red-200"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Proyecto público (visible para todos)
                  </span>
                </label>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                📋 ¿Qué sucederá al crear el proyecto?
              </h3>
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
                <li className="font-semibold text-green-700">
                  • Como gerente, tendrás acceso completo a la gestión de este proyecto
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push("/dashboard/mi-proyecto")}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.nombre_proyecto}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear Proyecto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toaster />
    </>
  );
}
