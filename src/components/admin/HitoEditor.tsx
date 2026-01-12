"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { alerts } from "@/lib/alerts";
import { determinarTipoArchivo } from "@/lib/fileUtils";

interface ArchivoSubido {
  id: number;
  name: string;
  url: string;
  size: number;
  tipo: 'imagen' | 'video' | 'documento';
  mime: string;
}

interface ContenidoHito {
  id?: number;
  descripcion_avance?: string;
  enlace_tour_360?: string;
  galeria_fotos?: ArchivoSubido[];
  videos_walkthrough?: ArchivoSubido[];
  documentacion?: ArchivoSubido[];
}

interface Hito {
  id: number;
  documentId?: string;
  nombre: string;
  orden: number;
  estado_completado: boolean;
  fecha_actualizacion: string | null;
  descripcion_avance?: string;
  enlace_tour_360?: string;
  contenido?: ContenidoHito;
}

interface HitoEditorProps {
  hito: Hito;
  onUpdate: (hito: Hito) => void;
}

interface PreviewUrl {
  file: File;
  url: string;
}

// Función para formatear tamaño de archivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Función para obtener icono según tipo de archivo
const getFileIcon = (file: File): string => {
  const type = file.type;
  if (type.startsWith('image/')) return '📸';
  if (type.startsWith('video/')) return '🎥';
  if (type.includes('pdf')) return '📄';
  if (type.includes('document') || type.includes('word')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) return '🧊';
  return '📁';
};

export default function HitoEditor({ hito, onUpdate }: HitoEditorProps) {
  const [localHito, setLocalHito] = useState(hito);
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);
  const [archivosSubidos, setArchivosSubidos] = useState<ArchivoSubido[]>([]);
  const [previewUrls, setPreviewUrls] = useState<PreviewUrl[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar archivos existentes del hito
  useEffect(() => {
    const archivos: ArchivoSubido[] = [];
    
    if (hito.contenido?.galeria_fotos) {
      hito.contenido.galeria_fotos.forEach((foto: any) => {
        if (foto && foto.url) {
          archivos.push({
            id: foto.id,
            name: foto.name || 'Imagen',
            url: foto.url,
            size: foto.size || 0,
            tipo: 'imagen',
            mime: foto.mime || 'image/jpeg'
          });
        }
      });
    }
    
    if (hito.contenido?.videos_walkthrough) {
      hito.contenido.videos_walkthrough.forEach((video: any) => {
        if (video && video.url) {
          archivos.push({
            id: video.id,
            name: video.name || 'Video',
            url: video.url,
            size: video.size || 0,
            tipo: 'video',
            mime: video.mime || 'video/mp4'
          });
        }
      });
    }
    
    if (hito.contenido?.documentacion) {
      hito.contenido.documentacion.forEach((doc: any) => {
        if (doc && doc.url) {
          archivos.push({
            id: doc.id,
            name: doc.name || 'Documento',
            url: doc.url,
            size: doc.size || 0,
            tipo: 'documento',
            mime: doc.mime || 'application/pdf'
          });
        }
      });
    }
    
    setArchivosSubidos(archivos);
  }, [hito]);

  // Limpiar URLs de preview al desmontar
  useEffect(() => {
    return () => {
      previewUrls.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [previewUrls]);

  const handleChange = (field: string, value: string | boolean) => {
    if (field === 'descripcion_avance' || field === 'enlace_tour_360') {
      setLocalHito({
        ...localHito,
        contenido: {
          ...localHito.contenido,
          [field]: value
        }
      });
    } else {
      setLocalHito({ ...localHito, [field]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Subir archivos pendientes primero
      if (archivosPendientes.length > 0) {
        await uploadPendingFiles();
      }
      
      // Si se marca como completado y no tiene fecha, agregar fecha actual
      if (localHito.estado_completado && !localHito.fecha_actualizacion) {
        localHito.fecha_actualizacion = new Date().toISOString();
      }
      
      // Si se marca como pendiente, quitar fecha
      if (!localHito.estado_completado) {
        localHito.fecha_actualizacion = null;
      }

      onUpdate(localHito);
      alerts.success('✅ Hito actualizado correctamente');
    } catch (error) {
      console.error('Error guardando hito:', error);
      alerts.error('❌ Error al guardar el hito');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    const newPreviews: PreviewUrl[] = [];
    
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews.push({
          file,
          url: URL.createObjectURL(file)
        });
      }
    });
    
    setArchivosPendientes(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const handleRemovePendingFile = (index: number) => {
    const file = archivosPendientes[index];
    const preview = previewUrls.find(p => p.file === file);
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }
    
    setArchivosPendientes(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter(p => p.file !== file));
  };

  const uploadPendingFiles = async () => {
    if (archivosPendientes.length === 0) return;
    
    setUploadingFiles(true);
    
    try {
      for (const file of archivosPendientes) {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('ref', 'api::hito.hito');
        formData.append('refId', hito.id.toString());
        
        // Determinar el campo según el tipo de archivo
        const tipo = determinarTipoArchivo(file);
        let field = 'contenido.documentacion';
        if (tipo === 'imagen') field = 'contenido.galeria_fotos';
        else if (tipo === 'video') field = 'contenido.videos_walkthrough';
        
        formData.append('field', field);
        
        const response = await api.post<any[]>('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data && Array.isArray(response.data) && response.data[0]) {
          const uploaded = response.data[0];
          setArchivosSubidos(prev => [...prev, {
            id: uploaded.id,
            name: uploaded.name,
            url: uploaded.url,
            size: uploaded.size,
            tipo: tipo as 'imagen' | 'video' | 'documento',
            mime: uploaded.mime
          }]);
        }
      }
      
      // Limpiar archivos pendientes
      previewUrls.forEach(p => URL.revokeObjectURL(p.url));
      setArchivosPendientes([]);
      setPreviewUrls([]);
      
      alerts.success(`✅ ${archivosPendientes.length} archivo(s) subido(s)`);
    } catch (error: any) {
      console.error('Error subiendo archivos:', error);
      alerts.error('❌ Error al subir archivos');
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;
    
    try {
      await api.delete(`/upload/files/${fileId}`);
      setArchivosSubidos(prev => prev.filter(f => f.id !== fileId));
      alerts.success('🗑️ Archivo eliminado');
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alerts.error('❌ Error al eliminar archivo');
    }
  };

  const getIconoArchivo = (tipo: string) => {
    if (tipo === 'imagen') {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (tipo === 'video') {
      return (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
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

        {/* Upload de Archivos - Dropbox Elegante */}
        <div className="relative">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Archivos Multimedia
          </h3>

          {/* Aviso de formatos permitidos */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Formatos permitidos:
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span><strong>Imágenes:</strong> JPG, PNG, GIF, WebP, SVG (máx. 10MB)</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span><strong>Videos:</strong> MP4, WebM, MOV (máx. 100MB)</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <span><strong>Documentos:</strong> PDF, Word, Excel (máx. 25MB)</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>
                </svg>
                <span><strong>Modelos 3D:</strong> GLB, GLTF (máx. 50MB)</span>
              </div>
            </div>
          </div>

          {/* Dropbox para arrastrar archivos */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-red-500 bg-red-50 scale-[1.02]'
                : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.glb,.gltf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            {uploadingFiles ? (
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Subiendo archivos...</p>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base font-medium text-gray-900 mb-1">
                  {isDragging ? '¡Suelta aquí!' : 'Arrastra archivos aquí'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  o haz click para seleccionar
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 transition shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Seleccionar Archivos
                </div>
              </>
            )}
          </div>
        </div>

        {/* Archivos Pendientes de Subir */}
        {archivosPendientes.length > 0 && (
          <div className="bg-yellow-50 rounded-xl border-2 border-yellow-300 p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Archivos Pendientes ({archivosPendientes.length})
            </h4>
            <p className="text-sm text-gray-700 mb-4">
              Estos archivos se subirán cuando presiones "Guardar Cambios"
            </p>
            <div className="space-y-2">
              {archivosPendientes.map((file, index) => {
                const preview = previewUrls.find(p => p.file === file);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200 hover:shadow-md transition"
                  >
                    {/* Preview o Icono */}
                    {preview ? (
                      <img
                        src={preview.url}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg border-2 border-yellow-400"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center text-2xl">
                        {getFileIcon(file)}
                      </div>
                    )}
                    
                    {/* Info del archivo */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    
                    {/* Botón eliminar */}
                    <button
                      onClick={() => handleRemovePendingFile(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar de la cola"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Archivos Subidos */}
        {archivosSubidos.length > 0 && (
          <div className="bg-green-50 rounded-xl border-2 border-green-300 p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Archivos Subidos ({archivosSubidos.length})
            </h4>
            <p className="text-sm text-gray-700 mb-4">
              Estos archivos ya están disponibles en el proyecto
            </p>
            <div className="space-y-2">
              {archivosSubidos.map((archivo) => (
                <div
                  key={archivo.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200 hover:shadow-md transition group"
                >
                  {/* Preview o Icono */}
                  {archivo.tipo === 'imagen' ? (
                    <img
                      src={archivo.url}
                      alt={archivo.name}
                      className="w-12 h-12 object-cover rounded-lg border-2 border-green-400"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getIconoArchivo(archivo.tipo)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {archivo.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {archivo.tipo === 'imagen' && '📸 Imagen'}
                      {archivo.tipo === 'video' && '🎥 Video'}
                      {archivo.tipo === 'documento' && '📄 Documento'}
                      {archivo.size > 0 && ` • ${formatFileSize(archivo.size)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 p-2"
                      title="Ver archivo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleDeleteFile(archivo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar archivo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay archivos */}
        {archivosSubidos.length === 0 && archivosPendientes.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">
              No hay archivos subidos aún. Arrastra archivos o haz click en el área de arriba.
            </p>
          </div>
        )}

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
