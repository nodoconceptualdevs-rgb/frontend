"use client";

import { useState } from "react";

interface Hito {
  id: number;
  nombre: string;
  orden: number;
  estado_completado: boolean;
  fecha_actualizacion: string | null;
  descripcion_avance: string;
  enlace_tour_360: string;
}

interface HitoEditorProps {
  hito: Hito;
  onUpdate: (hito: Hito) => void;
}

export default function HitoEditor({ hito, onUpdate }: HitoEditorProps) {
  const [localHito, setLocalHito] = useState(hito);
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setLocalHito({ ...localHito, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Si se marca como completado y no tiene fecha, agregar fecha actual
    if (localHito.estado_completado && !localHito.fecha_actualizacion) {
      localHito.fecha_actualizacion = new Date().toISOString();
    }
    
    // Si se marca como pendiente, quitar fecha
    if (!localHito.estado_completado) {
      localHito.fecha_actualizacion = null;
    }

    // TODO: Llamada al backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    onUpdate(localHito);
    setSaving(false);
    alert("Hito actualizado correctamente!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    
    // TODO: Upload a servidor/CDN
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setUploadingFiles(false);
    alert(`${files.length} archivo(s) subido(s) exitosamente!`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Hito
            </label>
            <input
              type="text"
              value={localHito.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition font-bold text-xl"
              placeholder="Nombre del hito..."
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Orden: {localHito.orden} | Edita el contenido y estado de este hito
          </p>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localHito.estado_completado}
                onChange={(e) => handleChange("estado_completado", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {localHito.estado_completado ? "Completado" : "Pendiente"}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Descripción del Avance */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descripción del Avance
          </label>
          <textarea
            value={localHito.descripcion_avance}
            onChange={(e) => handleChange("descripcion_avance", e.target.value)}
            rows={6}
            placeholder="Describe detalladamente el avance de este hito..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Este texto será visible para el cliente. Puedes usar HTML para formato.
          </p>
        </div>

        {/* Tour 360 */}
        {(localHito.orden === 3 || localHito.nombre.includes("Visualización")) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Enlace Tour Virtual 360°
            </label>
            <input
              type="url"
              value={localHito.enlace_tour_360}
              onChange={(e) => handleChange("enlace_tour_360", e.target.value)}
              placeholder="https://my.matterport.com/show/?m=..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL del recorrido virtual 3D (Matterport, Kuula, etc.)
            </p>
          </div>
        )}

        {/* Upload de Archivos */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Contenido Multimedia
          </h3>

          <div className="space-y-4">
            {/* Fotos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📸 Galería de Fotos
              </label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formatos: JPG, PNG, WEBP. Máx 10MB por imagen.
              </p>
            </div>

            {/* Videos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎥 Videos Walkthrough
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formatos: MP4, MOV. Máx 100MB.
              </p>
            </div>

            {/* Documentos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📄 Documentos (Planos, Manuales, etc.)
              </label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formatos: PDF, DOC, DOCX. Máx 20MB por archivo.
              </p>
            </div>
          </div>

          {uploadingFiles && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Subiendo archivos...
              </span>
            </div>
          )}
        </div>

        {/* Archivos Actuales */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Archivos Actuales
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">3 fotos</p>
                <p className="text-xs text-gray-500">Última actualización: hoy</p>
              </div>
              <button className="text-red-600 hover:text-red-700 text-sm font-semibold">
                Ver
              </button>
            </div>
            
            <p className="text-sm text-gray-500 text-center py-4">
              Los archivos subidos aparecerán aquí
            </p>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Cambios del Hito
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
