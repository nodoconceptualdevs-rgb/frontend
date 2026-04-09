"use client";

import type { Proyecto, Usuario } from '@/types/proyecto.types';
import UserSelector from './UserSelector';

interface ProyectoInfoFormProps {
  proyecto: Proyecto;
  clientes: Usuario[];
  gerentes: Usuario[];
  loadingUsers: boolean;
  onUpdate: (field: keyof Proyecto, value: string | number | number[] | Usuario[] | boolean) => void;
  onSave: () => void;
  saving: boolean;
}

export default function ProyectoInfoForm({
  proyecto,
  clientes,
  gerentes,
  loadingUsers,
  onUpdate,
  onSave,
  saving
}: ProyectoInfoFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Información del Proyecto
      </h2>

      <div className="space-y-6">
        {/* Nombre del Proyecto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre del Proyecto
          </label>
          <input
            type="text"
            value={proyecto.nombre_proyecto}
            onChange={(e) => onUpdate("nombre_proyecto", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
          />
        </div>

        {/* Clientes y Gerentes - Nuevo Selector Moderno */}
        <div className="grid md:grid-cols-2 gap-6">
          <UserSelector
            label="Clientes"
            availableUsers={clientes}
            selectedUsers={Array.isArray(proyecto.clientes) ? proyecto.clientes : []}
            onSelectionChange={(userIds) => onUpdate("clientes", userIds)}
            loading={loadingUsers}
            required={true}
            placeholder="Buscar clientes..."
          />

          <UserSelector
            label="Gerentes de Proyecto"
            availableUsers={gerentes}
            selectedUsers={Array.isArray(proyecto.gerentes) ? proyecto.gerentes : []}
            onSelectionChange={(userIds) => onUpdate("gerentes", userIds)}
            loading={loadingUsers}
            required={true}
            placeholder="Buscar gerentes..."
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
              onChange={(e) => onUpdate("estado_general", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
            >
              <option value="En Planificación">En Planificación</option>
              <option value="En Ejecución">En Ejecución</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={proyecto.fecha_inicio}
              onChange={(e) => onUpdate("fecha_inicio", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
            />
          </div>
        </div>

        {/* Configuración de Privacidad */}
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Configuración de Privacidad
              </h3>
              <p className="text-sm text-gray-500">
                {proyecto.es_publico !== false 
                  ? "El proyecto es accesible con el token NFC sin necesidad de autenticación" 
                  : "El proyecto requiere autenticación además del token NFC"}
              </p>
            </div>
            <div className="ml-4">
              <button
                type="button"
                onClick={() => onUpdate("es_publico", proyecto.es_publico === false ? true : false)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  proyecto.es_publico !== false ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <span className="sr-only">Proyecto público</span>
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    proyecto.es_publico !== false ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className={`flex items-center gap-1 ${proyecto.es_publico !== false ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Público</span>
            </div>
            <div className={`flex items-center gap-1 ${proyecto.es_publico === false ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Privado (Requiere Autenticación)</span>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={onSave}
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
  );
}
