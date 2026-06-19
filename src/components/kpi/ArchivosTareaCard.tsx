"use client";

import React, { useState } from "react";
import { FileText, FileImage, Download, Trash2, GripHorizontal, Eye, X } from "lucide-react";
import type { TareaConKpi } from "@/types/kpi";

interface ArchivosTareaCardProps {
  tarea: TareaConKpi;
  draggedFile: string | null;
  onDragStart: (archivoIds: string[]) => void;
  onDragEnd: () => void;
  onRemove?: (archivoId: string) => void;
}

const getFileIcon = (nombre: string) => {
  const ext = nombre.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return <FileImage className="w-5 h-5" />;
  }
  return <FileText className="w-5 h-5" />;
};

const formatearTamaño = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function ArchivosTareaCard({
  tarea,
  draggedFile,
  onDragStart,
  onDragEnd,
  onRemove,
}: ArchivosTareaCardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [archivoPreview, setArchivoPreview] = useState<{ id: string; nombre: string; ruta: string } | null>(null);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<Set<string>>(new Set());
  const archivos = tarea.archivos || [];

  const isImage = (nombre: string) => {
    const ext = nombre.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  };

  const toggleArchivoSeleccionado = (archivoId: string) => {
    const next = new Set(archivosSeleccionados);
    if (next.has(archivoId)) {
      next.delete(archivoId);
    } else {
      next.add(archivoId);
    }
    setArchivosSeleccionados(next);
  };

  if (archivos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-lg">📎</span>
            Archivos de la Tarea
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {archivos.length} archivo{archivos.length !== 1 ? "s" : ""} • Arrastra a los hitos
          </p>
        </div>
      </div>

      {/* Grid de archivos */}
      <div className="grid grid-cols-1 gap-2">
        {archivos.map((archivo) => {
          const archivoId = String(archivo.id);
          const isSelected = archivosSeleccionados.has(archivoId);
          const isBeingDragged = draggedFile === archivoId;
          const isHovered = hoveredId === archivoId;

          return (
            <div
              key={archivo.id}
              draggable
              onDragStart={() => {
                // Si el archivo está seleccionado, arrastra todos los seleccionados
                // Si no está seleccionado, selecciona solo ese y lo arrastra
                if (isSelected) {
                  onDragStart(Array.from(archivosSeleccionados));
                } else {
                  onDragStart([archivoId]);
                }
              }}
              onDragEnd={onDragEnd}
              onMouseEnter={() => setHoveredId(archivoId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => toggleArchivoSeleccionado(archivoId)}
              className={`
                group relative rounded-lg border-2 p-3 transition-all duration-200
                cursor-grab active:cursor-grabbing
                ${isBeingDragged
                  ? "border-red-400 bg-red-50/50 shadow-lg scale-[1.02] opacity-50"
                  : isSelected
                    ? "border-red-300 bg-red-50 shadow-md ring-2 ring-red-100"
                    : isHovered
                      ? "border-gray-300 bg-gray-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox de selección */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? "border-red-600 bg-red-600"
                      : "border-gray-300 bg-white group-hover:border-gray-400"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Grip handle */}
                <div
                  className={`transition-colors ${
                    isHovered ? "text-red-500" : "text-gray-300 group-hover:text-gray-400"
                  }`}
                >
                  <GripHorizontal className="w-4 h-4" />
                </div>

                {/* Icono del archivo */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                    isHovered ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {getFileIcon(archivo.nombre)}
                </div>

                {/* Info del archivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {archivo.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatearTamaño(archivo.tamaño)}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Vista Previa */}
                  {isImage(archivo.nombre) && archivo.ruta && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchivoPreview({
                          id: String(archivo.id),
                          nombre: archivo.nombre,
                          ruta: archivo.ruta,
                        });
                      }}
                      className="p-1.5 rounded-md hover:bg-purple-100 text-purple-600 hover:text-purple-700 transition-colors"
                      title="Ver previa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {/* Descargar */}
                  {archivo.ruta && (
                    <a
                      href={archivo.ruta}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  {/* Eliminar */}
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(String(archivo.id));
                      }}
                      className="p-1.5 rounded-md hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Estado de arrastre */}
              {isBeingDragged && (
                <div className="absolute inset-0 rounded-lg bg-red-400/10 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded">
                    Arrastrando...
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hint visual */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
        <span className="text-lg">💡</span>
        <p className="text-xs text-gray-600">
          <strong>Arrastra cualquier archivo</strong> a un hito abajo para publicar un avance
        </p>
      </div>

      {/* Modal de Vista Previa */}
      {archivoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {archivoPreview.nombre}
              </p>
              <button
                onClick={() => setArchivoPreview(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la previa */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4">
              {isImage(archivoPreview.nombre) ? (
                <img
                  src={archivoPreview.ruta}
                  alt={archivoPreview.nombre}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Tipo de archivo no soportado en previa
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
              <a
                href={archivoPreview.ruta}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
              <button
                onClick={() => setArchivoPreview(null)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
