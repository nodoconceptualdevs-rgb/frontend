"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import HitoEditor from "@/components/admin/HitoEditor";
import AdminHeader from "@/components/admin/AdminHeader";
import { getProyectoById, updateProyecto } from "@/services/proyectos";
import { createHito, updateHito, deleteHito, reordenarHitos } from "@/services/hitos";
import { alerts } from "@/lib/alerts";
import { Toaster } from "react-hot-toast";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper para ordenar hitos por el campo 'orden'
const sortHitosByOrden = (hitos: Hito[]): Hito[] => {
  return [...hitos].sort((a, b) => a.orden - b.orden);
};

interface Hito {
  id: number;
  nombre: string;
  orden: number;
  estado_completado: boolean;
  fecha_actualizacion: string | null;
  descripcion_avance?: string;
  enlace_tour_360?: string;
  contenido?: any;
}

export default function EditarProyectoPage() {
  const params = useParams();
  const router = useRouter();
  const authToken = useAuthToken();
  const [activeTab, setActiveTab] = useState("info");
  const [selectedHito, setSelectedHito] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [proyecto, setProyecto] = useState<any>(null);
  const [hitos, setHitos] = useState<Hito[]>([]);

  // Cargar datos del proyecto
  useEffect(() => {
    async function cargarProyecto() {
      try {
        setLoading(true);
        const data = await getProyectoById(Number(params.id));
        
        if (!data || !data.data) {
          alerts.error('Proyecto no encontrado');
          router.push('/dashboard/mi-proyecto');
          return;
        }

        setProyecto(data.data);
        // Ordenar hitos por el campo 'orden' al cargar
        setHitos(sortHitosByOrden(data.data.hitos || []));
      } catch (error) {
        console.error('Error cargando proyecto:', error);
        alerts.error('Error al cargar el proyecto');
        router.push('/dashboard/mi-proyecto');
      } finally {
        setLoading(false);
      }
    }
    cargarProyecto();
  }, [params.id, router]);

  const handleUpdateProyecto = (field: string, value: string | number) => {
    setProyecto({ ...proyecto, [field]: value });
  };

  const handleSaveProyecto = async () => {
    try {
      setSaving(true);
      
      await updateProyecto(proyecto.id, {
        nombre_proyecto: proyecto.nombre_proyecto,
        estado_general: proyecto.estado_general,
        fecha_inicio: proyecto.fecha_inicio,
      });
      
      alerts.success('Proyecto actualizado exitosamente');
    } catch (error: any) {
      console.error('Error actualizando proyecto:', error);
      alerts.error(error.message || 'Error al actualizar el proyecto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHito = async (hitoId: number) => {
    if (!confirm("¿Estás seguro de eliminar este hito?")) {
      return;
    }

    try {
      const loadingId = alerts.loading('Eliminando hito...');
      await deleteHito(hitoId);
      alerts.dismiss();
      
      setHitos(hitos.filter(h => h.id !== hitoId));
      if (selectedHito === hitoId) {
        setSelectedHito(null);
      }
      alerts.success('Hito eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando hito:', error);
      alerts.error('Error al eliminar el hito');
    }
  };

  const handleAddHito = async () => {
    const nuevoOrden = hitos.length > 0 ? Math.max(...hitos.map(h => h.orden)) + 1 : 1;
    
    try {
      const loadingId = alerts.loading('Creando hito...');
      const response = await createHito({
        nombre: `Nuevo Hito ${nuevoOrden}`,
        orden: nuevoOrden,
        estado_completado: false,
        proyecto: proyecto.id,
      });
      alerts.dismiss();
      
      if (response && response.data) {
        // Agregar y ordenar por 'orden'
        setHitos(sortHitosByOrden([...hitos, response.data]));
        setSelectedHito(response.data.id);
        alerts.success('Hito creado exitosamente');
      }
    } catch (error) {
      console.error('Error creando hito:', error);
      alerts.error('Error al crear el hito');
    }
  };

  const handleUpdateHito = async (updatedHito: Hito) => {
    try {
      const response = await updateHito(updatedHito.id, updatedHito);
      
      if (response && response.data) {
        // Actualizar y mantener ordenados por 'orden'
        setHitos(sortHitosByOrden(hitos.map((h) => (h.id === updatedHito.id ? response.data : h))));
        alerts.success('Hito actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error actualizando hito:', error);
      alerts.error('Error al actualizar el hito');
    }
  };

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = hitos.findIndex((h) => h.id === active.id);
    const newIndex = hitos.findIndex((h) => h.id === over.id);

    const reorderedHitos = arrayMove(hitos, oldIndex, newIndex);
    
    // Actualizar órdenes
    const hitosConNuevoOrden = reorderedHitos.map((hito, index) => ({
      ...hito,
      orden: index + 1
    }));

    // Actualizar UI inmediatamente
    setHitos(hitosConNuevoOrden);

    try {
      // Enviar al backend
      await reordenarHitos(
        proyecto.id,
        hitosConNuevoOrden.map(h => ({ id: h.id, orden: h.orden })),
        authToken || undefined
      );
      alerts.success('✅ Hitos reordenados exitosamente');
    } catch (error) {
      console.error('Error reordenando hitos:', error);
      alerts.error('❌ Error al reordenar hitos');
      // Revertir cambios en caso de error
      setHitos(hitos);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!proyecto) {
    return null;
  }

  const hitoSeleccionado = hitos.find((h) => h.id === selectedHito);

  // Componente sortable para cada hito
  function SortableHitoItem({ hito }: { hito: Hito }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: hito.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <button
          onClick={() => setSelectedHito(hito.id)}
          className={`w-full text-left px-4 py-3 rounded-lg transition border-2 group ${
            selectedHito === hito.id
              ? "border-red-600 bg-red-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3 relative">
            {/* Icono de drag */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition flex-shrink-0"
              title="Arrastra para reordenar"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
              </svg>
            </div>
            
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <AdminHeader
        titulo={proyecto.nombre_proyecto}
        subtitulo={`Cliente: ${proyecto.cliente?.username || proyecto.cliente?.email || 'Sin cliente'}`}
        mostrarVolver={true}
        mostrarVistaCliente={true}
        tokenNFC={proyecto.token_nfc}
      />

      <main className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">

        {/* Tabs */}
        <div className="flex gap-4 sm:gap-6 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-3 px-1 font-semibold transition border-b-2 whitespace-nowrap text-sm sm:text-base ${
              activeTab === "info"
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab("hitos")}
            className={`pb-3 px-1 font-semibold transition border-b-2 whitespace-nowrap text-sm sm:text-base ${
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
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8 max-w-3xl">
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

              {/* Estado y Fecha */}
              <div className="grid md:grid-cols-2 gap-6">
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={proyecto.fecha_inicio}
                    onChange={(e) =>
                      handleUpdateProyecto("fecha_inicio", e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProyecto}
                disabled={saving}
                className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
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
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold">💡 Tip:</span> Arrastra los hitos para reordenarlos
                </p>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={hitos.map(h => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {hitos.map((hito) => (
                        <SortableHitoItem key={hito.id} hito={hito} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Editor del Hito Seleccionado */}
            <div className="lg:col-span-2">
              {hitoSeleccionado ? (
                <HitoEditor
                  hito={hitoSeleccionado}
                  onUpdate={handleUpdateHito}
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
    </div>
  );
}
