"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { alerts } from "@/lib/alerts";
import BibliotecaArchivos from "@/components/admin/BibliotecaArchivos";
import type { MediaFile } from "@/services/mediaLibrary";

interface ArchivoSubido {
  id: number;
  name: string;
  url: string;
  size: number;
  tipo: "imagen" | "video" | "documento";
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

export default function HitoEditor({ hito, onUpdate }: HitoEditorProps) {
  const [localHito, setLocalHito] = useState(hito);
  const [saving, setSaving] = useState(false);
  const [archivosSubidos, setArchivosSubidos] = useState<ArchivoSubido[]>([]);
  const [showBiblioteca, setShowBiblioteca] = useState(false);

  // Actualizar localHito cuando el prop hito cambia
  useEffect(() => {
    setLocalHito(hito);
  }, [hito]);

  // Cargar archivos existentes del hito
  useEffect(() => {
    const archivos: ArchivoSubido[] = [];

    if (hito.contenido?.galeria_fotos) {
      hito.contenido.galeria_fotos.forEach((foto: any) => {
        if (foto && foto.url) {
          archivos.push({
            id: foto.id,
            name: foto.name || "Imagen",
            url: foto.url,
            size: foto.size || 0,
            tipo: "imagen",
            mime: foto.mime || "image/jpeg",
          });
        }
      });
    }

    if (hito.contenido?.videos_walkthrough) {
      hito.contenido.videos_walkthrough.forEach((video: any) => {
        if (video && video.url) {
          archivos.push({
            id: video.id,
            name: video.name || "Video",
            url: video.url,
            size: video.size || 0,
            tipo: "video",
            mime: video.mime || "video/mp4",
          });
        }
      });
    }

    if (hito.contenido?.documentacion) {
      hito.contenido.documentacion.forEach((doc: any) => {
        if (doc && doc.url) {
          archivos.push({
            id: doc.id,
            name: doc.name || "Documento",
            url: doc.url,
            size: doc.size || 0,
            tipo: "documento",
            mime: doc.mime || "application/pdf",
          });
        }
      });
    }

    setArchivosSubidos(archivos);
  }, [hito]);

  const handleChange = (field: string, value: string | boolean) => {
    if (field === "descripcion_avance" || field === "enlace_tour_360") {
      setLocalHito({
        ...localHito,
        contenido: {
          ...localHito.contenido,
          [field]: value,
        },
      });
    } else {
      setLocalHito({ ...localHito, [field]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Actualizar el contenido del hito con los archivos subidos
      // Strapi espera solo IDs para campos de tipo media
      const contenidoActualizado: ContenidoHito = {
        id: localHito.contenido?.id,
        descripcion_avance:
          localHito.contenido?.descripcion_avance ??
          localHito.descripcion_avance,
        enlace_tour_360:
          localHito.contenido?.enlace_tour_360 ?? localHito.enlace_tour_360,
        galeria_fotos: archivosSubidos
          .filter((f) => f.tipo === "imagen")
          .map((f) => f.id) as any[],
        videos_walkthrough: archivosSubidos
          .filter((f) => f.tipo === "video")
          .map((f) => f.id) as any[],
        documentacion: archivosSubidos
          .filter((f) => f.tipo === "documento")
          .map((f) => f.id) as any[],
      };

      // Actualizar el hito local con el contenido nuevo
      const hitoActualizado = {
        ...localHito,
        contenido: contenidoActualizado,
      };

      // Si se marca como completado y no tiene fecha, agregar fecha actual
      if (
        hitoActualizado.estado_completado &&
        !hitoActualizado.fecha_actualizacion
      ) {
        hitoActualizado.fecha_actualizacion = new Date().toISOString();
      }

      // Si se marca como pendiente, quitar fecha
      if (!hitoActualizado.estado_completado) {
        hitoActualizado.fecha_actualizacion = null;
      }

      onUpdate(hitoActualizado);
      alerts.success("✅ Hito actualizado correctamente");
    } catch (error) {
      console.error("Error guardando hito:", error);
      alerts.error("❌ Error al guardar el hito");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFile = (fileId: number) => {
    setArchivosSubidos((prev) => prev.filter((f) => f.id !== fileId));
    alerts.success("Archivo quitado del hito");
  };

  const handleSelectFromLibrary = (files: MediaFile[]) => {
    const nuevos: ArchivoSubido[] = files.map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      size: f.size * 1024, // Strapi devuelve KB, convertir a bytes
      tipo: f.mime.startsWith("image/")
        ? "imagen"
        : f.mime.startsWith("video/")
          ? "video"
          : "documento",
      mime: f.mime,
    }));
    // Evitar duplicados por id
    setArchivosSubidos((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const sinDuplicados = nuevos.filter((n) => !existingIds.has(n.id));
      if (sinDuplicados.length < nuevos.length) {
        alerts.error(
          `${nuevos.length - sinDuplicados.length} archivo(s) ya estaban agregados`,
        );
      }
      return [...prev, ...sinDuplicados];
    });
    if (nuevos.length > 0) {
      alerts.success(
        `${nuevos.length} archivo(s) agregado(s) desde la biblioteca`,
      );
    }
  };

  const getIconoArchivo = (tipo: string) => {
    if (tipo === "imagen") {
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    if (tipo === "video") {
      return (
        <svg
          className="w-5 h-5 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
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
                onChange={(e) =>
                  handleChange("estado_completado", e.target.checked)
                }
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
            Este texto será visible para el cliente. Puedes usar HTML para
            formato.
          </p>
        </div>

        {/* Upload de Archivos - Dropbox Elegante */}
        <div className="relative">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Archivos Multimedia
          </h3>

          {/* Aviso de formatos permitidos */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Formatos permitidos:
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700">
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  <strong>Imágenes:</strong> JPG, PNG, GIF, WebP, SVG (máx.
                  25MB)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>
                  <strong>Videos:</strong> MP4, WebM, MOV (máx. 100MB)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>
                  <strong>Documentos:</strong> PDF, Word, Excel (máx. 25MB)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                <span>
                  <strong>Modelos 3D:</strong> GLB, GLTF (máx. 500MB)
                </span>
              </div>
            </div>
          </div>

          {/* Botón de Biblioteca */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowBiblioteca(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 transition shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Seleccionar de la Biblioteca
            </button>
          </div>
        </div>

        {/* Archivos Subidos */}
        {archivosSubidos.length > 0 && (
          <div className="bg-green-50 rounded-xl border-2 border-green-300 p-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
                  {archivo.tipo === "imagen" ? (
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
                      {archivo.tipo === "imagen" && "📸 Imagen"}
                      {archivo.tipo === "video" && "🎥 Video"}
                      {archivo.tipo === "documento" && "📄 Documento"}
                      {archivo.size > 0 &&
                        ` • ${(archivo.size / 1024).toFixed(1)} KB`}
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
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleRemoveFile(archivo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar archivo"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay archivos */}
        {archivosSubidos.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              No hay archivos aún. Usa la Biblioteca para agregar archivos.
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
                Guardando...
              </span>
            ) : (
              <>
                <svg
                  className="w-5 h-5 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Guardar Cambios del Hito
              </>
            )}
          </button>
        </div>
      </div>

      {/* Biblioteca de Archivos */}
      <BibliotecaArchivos
        visible={showBiblioteca}
        onClose={() => setShowBiblioteca(false)}
        onSelect={handleSelectFromLibrary}
        maxSelection={10}
      />
    </div>
  );
}
