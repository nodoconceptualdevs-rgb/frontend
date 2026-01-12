"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import HitoEditor from "@/components/admin/HitoEditor";
import AdminHeader from "@/components/admin/AdminHeader";
import ProyectoInfoForm from "@/components/proyectos/ProyectoInfoForm";
import TokenNFCCard from "@/components/proyectos/TokenNFCCard";
import SortableHitoItem from "@/components/proyectos/SortableHitoItem";
import { getProyectoById, updateProyecto, regenerarTokenNFC } from "@/services/proyectos";
import { getClientes, getGerentes } from "@/services/usuarios";
import { createHito, updateHito, deleteHito, reordenarHitos } from "@/services/hitos";
import { alerts } from "@/lib/alerts";
import { Toaster } from "react-hot-toast";
import { useAuthToken } from "@/hooks/useAuthToken";
import type { Hito, Usuario, Proyecto, RegenerarTokenResponse } from "@/types/proyecto.types";
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Tipos importados desde @/types/proyecto.types

// Helper para ordenar hitos por el campo 'orden'
const sortHitosByOrden = (hitos: Hito[]): Hito[] => {
  return [...hitos].sort((a, b) => a.orden - b.orden);
};

export default function EditarProyectoPage() {
  const params = useParams();
  const router = useRouter();
  const authToken = useAuthToken() as string | null;
  const [activeTab, setActiveTab] = useState("info");
  const [selectedHito, setSelectedHito] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [hitos, setHitos] = useState<Hito[]>([]);
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [gerentes, setGerentes] = useState<Usuario[]>([]);

  // Cargar datos del proyecto
  useEffect(() => {
    async function cargarProyecto() {
      try {
        setLoading(true);
        const data = await getProyectoById(Number(params.id));
        
        if (!data || !data.data) {
          alerts.error('Proyecto no encontrado');
          router.push('/admin/proyectos');
          return;
        }

        setProyecto(data.data);
        // Ordenar hitos por el campo 'orden' al cargar
        setHitos(sortHitosByOrden(data.data.hitos || []));
        console.log('Proyecto cargado:', data.data);
      } catch (error) {
        console.error('Error cargando proyecto:', error);
        alerts.error('Error al cargar el proyecto');
        router.push('/admin/proyectos');
      } finally {
        setLoading(false);
      }
    }
    cargarProyecto();
  }, [params.id, router]);

  // Cargar usuarios para selectores
  useEffect(() => {
    async function cargarUsuarios() {
      try {
        setLoadingUsers(true);
        const [clientesData, gerentesData] = await Promise.all([
          getClientes(),
          getGerentes()
        ]);
        setClientes(Array.isArray(clientesData) ? clientesData : []);
        setGerentes(Array.isArray(gerentesData) ? gerentesData : []);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setLoadingUsers(false);
      }
    }
    cargarUsuarios();
  }, []);

  const handleUpdateProyecto = (field: keyof Proyecto, value: string | number | boolean | number[] | Usuario[]) => {
    if (!proyecto) return;
    setProyecto({ ...proyecto, [field]: value } as Proyecto);
  };

  const handleSaveProyecto = async () => {
    if (!proyecto) return;
    
    // Validaciones antes de guardar
    const clientesIds = Array.isArray(proyecto.clientes) 
      ? proyecto.clientes.map(c => typeof c === 'number' ? c : c.id)
      : [];
    
    const gerentesIds = Array.isArray(proyecto.gerentes)
      ? proyecto.gerentes.map(g => typeof g === 'number' ? g : g.id)
      : [];

    if (clientesIds.length === 0) {
      alerts.error('⚠️ Debes asignar al menos un cliente al proyecto');
      return;
    }

    if (gerentesIds.length === 0) {
      alerts.error('⚠️ Debes asignar al menos un gerente al proyecto');
      return;
    }

    if (!proyecto.nombre_proyecto || proyecto.nombre_proyecto.trim() === '') {
      alerts.error('⚠️ El nombre del proyecto es obligatorio');
      return;
    }

    if (!proyecto.fecha_inicio) {
      alerts.error('⚠️ La fecha de inicio es obligatoria');
      return;
    }

    try {
      setSaving(true);
      
      await updateProyecto(proyecto.id, {
        nombre_proyecto: proyecto.nombre_proyecto,
        estado_general: proyecto.estado_general,
        fecha_inicio: proyecto.fecha_inicio,
        clientes: clientesIds,
        gerentes: gerentesIds,
        es_publico: proyecto.es_publico
      });
      
      alerts.success('✅ Proyecto actualizado exitosamente');
    } catch (error: unknown) {
      console.error('Error actualizando proyecto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el proyecto';
      alerts.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerarToken = async () => {
    if (!proyecto) return;
    
    if (!confirm('¿Estás seguro de regenerar el token NFC? El token actual dejará de funcionar.')) {
      return;
    }

    try {
      const loadingId = alerts.loading('Regenerando token...');
      const response: RegenerarTokenResponse = await regenerarTokenNFC(proyecto.id);
      alerts.dismiss();
      
      if (response && response.data) {
        setProyecto({ ...proyecto, token_nfc: response.data.token_nfc } as Proyecto);
        alerts.success('Token regenerado exitosamente');
      }
    } catch (error: unknown) {
      console.error('Error regenerando token:', error);
      alerts.error('Error al regenerar el token');
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
    if (!proyecto) return;
    
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

  // ========== CONFIGURACIÓN DRAG AND DROP ==========
  // Los sensores detectan las interacciones del usuario:
  // - PointerSensor: Detecta clics y arrastres del mouse/touch
  // - KeyboardSensor: Permite reordenar con teclado (accesibilidad)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * ========== MANEJO DE DRAG AND DROP ==========
   * Función principal que se ejecuta cuando el usuario suelta un hito después de arrastrarlo
   * 
   * FLUJO DEL PROCESO:
   * 1. Se detecta el inicio del drag (usuario agarra un hito)
   * 2. Mientras arrastra, @dnd-kit muestra feedback visual
   * 3. Al soltar (dragEnd), esta función se ejecuta
   * 4. Reordenamos localmente (optimistic update)
   * 5. Enviamos al backend
   * 6. Si falla, revertimos (rollback)
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🎯 [DRAG END] Evento de drag terminado:', event);
    
    if (!proyecto) {
      console.warn('⚠️ [DRAG END] No hay proyecto cargado');
      return;
    }
    
    const { active, over } = event;
    console.log('📍 [DRAG END] Hito arrastrado (active):', active.id);
    console.log('📍 [DRAG END] Posición de destino (over):', over?.id);

    // Si no hay destino válido o soltó en la misma posición, cancelar
    if (!over || active.id === over.id) {
      console.log('❌ [DRAG END] Cancelado: Sin cambio de posición');
      return;
    }

    // Encontrar índices en el array actual
    const oldIndex = hitos.findIndex((h) => h.id === active.id);
    const newIndex = hitos.findIndex((h) => h.id === over.id);
    
    console.log('📊 [DRAG END] Índice anterior:', oldIndex, '→ Índice nuevo:', newIndex);
    console.log('📋 [DRAG END] Estado de hitos ANTES del reorden:', 
      hitos.map(h => ({ id: h.id, nombre: h.nombre, orden: h.orden }))
    );

    // Guardar el estado anterior para rollback en caso de error
    const previousHitos = [...hitos];

    // Reordenar el array usando arrayMove de @dnd-kit/sortable
    const reorderedHitos = arrayMove(hitos, oldIndex, newIndex);
    
    // Recalcular el campo 'orden' para que sea secuencial (1, 2, 3...)
    const hitosConNuevoOrden = reorderedHitos.map((hito, index) => ({
      ...hito,
      orden: index + 1
    }));

    console.log('🔄 [DRAG END] Nuevo orden calculado:', 
      hitosConNuevoOrden.map(h => ({ id: h.id, nombre: h.nombre, orden: h.orden }))
    );

    // OPTIMISTIC UPDATE: Actualizar UI inmediatamente (no esperar al backend)
    console.log('⚡ [DRAG END] Aplicando optimistic update...');
    setHitos(hitosConNuevoOrden);

    try {
      console.log('📤 [DRAG END] Enviando petición al backend...');
      console.log('📦 [DRAG END] Payload:', {
        proyectoId: proyecto.id,
        hitos: hitosConNuevoOrden.map(h => ({ id: h.id, orden: h.orden })),
        token: authToken ? '***' : 'null'
      });
      
      // Enviar al backend el nuevo orden
      const response = await reordenarHitos(
        proyecto.id,
        hitosConNuevoOrden.map(h => ({ id: h.id, orden: h.orden })),
        authToken || undefined
      );
      
      console.log('✅ [DRAG END] Respuesta del backend recibida:', response);
      
      // IMPORTANTE: Actualizar con la respuesta del backend
      // El backend puede haber aplicado validaciones o cambios adicionales
      if (response && response.data) {
        console.log('📦 [DRAG END] Actualizando hitos con respuesta del backend:', response.data);
        // Asegurar que estén ordenados por 'orden'
        setHitos(sortHitosByOrden(response.data));
        alerts.success('✅ Hitos reordenados exitosamente');
      }
    } catch (error) {
      console.error('❌ [DRAG END] Error reordenando hitos:', error);
      console.log('🔙 [DRAG END] Revertiendo cambios (rollback)...');
      alerts.error('Error al reordenar hitos');
      
      // ROLLBACK: Revertir cambios en caso de error
      setHitos(previousHitos);
      console.log('↩️ [DRAG END] Estado revertido a:', 
        previousHitos.map(h => ({ id: h.id, nombre: h.nombre, orden: h.orden }))
      );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <AdminHeader
        titulo={proyecto.nombre_proyecto}
        subtitulo={`Clientes: ${
          Array.isArray(proyecto.clientes) && proyecto.clientes.length > 0
            ? proyecto.clientes.map((c: Usuario | number) => 
                typeof c === 'object' ? (c.username || c.email) : ''
              ).filter(Boolean).join(', ')
            : 'Sin clientes'
        }`}
        mostrarVolver={true}
        mostrarVistaCliente={true}
        tokenNFC={proyecto.token_nfc}
      />

      <main className="px-8 py-8">

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
          <div className="max-w-3xl mx-auto space-y-6">
            <ProyectoInfoForm
              proyecto={proyecto}
              clientes={clientes}
              gerentes={gerentes}
              loadingUsers={loadingUsers}
              onUpdate={handleUpdateProyecto}
              onSave={handleSaveProyecto}
              saving={saving}
            />
            
            <TokenNFCCard
              tokenNfc={proyecto.token_nfc}
              onRegenerar={handleRegenerarToken}
            />
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
                        <SortableHitoItem 
                          key={hito.id} 
                          hito={hito}
                          isSelected={selectedHito === hito.id}
                          onSelect={setSelectedHito}
                          onDelete={handleDeleteHito}
                        />
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
