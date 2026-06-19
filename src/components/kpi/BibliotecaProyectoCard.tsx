"use client";

import React, { useState } from "react";
import { Upload, File, FileImage, FileVideo, Plus } from "lucide-react";
import type { ArchivoProyecto } from "@/types/kpi";

interface BibliotecaProyectoCardProps {
  archivos: ArchivoProyecto[];
  cargando: boolean;
  archivosSeleccionados: Set<string>;
  draggedFile: string | null;
  onSeleccionar: (archivoId: string) => void;
  onDragStart: (archivoId: string) => void;
  onDragEnd: () => void;
  onSubirArchivos: (files: File[]) => Promise<void>;
  onEliminar?: (archivoId: string) => Promise<void>;
}

const getIconoArchivo = (nombre: string) => {
  const ext = nombre.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <FileImage className="w-4 h-4" />;
  }
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
    return <FileVideo className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
};

const formatearTamaño = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function BibliotecaProyectoCard({
  archivos,
  cargando,
  archivosSeleccionados,
  draggedFile,
  onSeleccionar,
  onDragStart,
  onDragEnd,
  onSubirArchivos,
  onEliminar,
}: BibliotecaProyectoCardProps) {
  const [subiendo, setSubiendo] = useState(false);

  const handleSubir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSubiendo(true);
    try {
      await onSubirArchivos(files);
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            📚 Biblioteca del Proyecto
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {archivos.length} archivo{archivos.length !== 1 ? "s" : ""} disponible{archivos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Upload Button */}
        <label className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:from-blue-100 hover:to-cyan-100 transition-all border border-blue-200 cursor-pointer group">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleSubir}
            disabled={subiendo}
          />
          {subiendo ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Subir
            </>
          )}
        </label>
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : archivos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">No hay archivos aún</p>
          <p className="text-xs text-gray-400">Sube archivos para verlos aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}>
          {archivos.map((archivo) => {
            const isSelected = archivosSeleccionados.has(archivo.id);
            const isDragging = draggedFile === archivo.id;

            return (
              <div
                key={archivo.id}
                draggable
                onDragStart={() => onDragStart(archivo.id)}
                onDragEnd={onDragEnd}
                onClick={() => onSeleccionar(archivo.id)}
                className={`
                  group relative rounded-lg border-2 p-3 cursor-grab active:cursor-grabbing
                  transition-all duration-200 ease-out
                  ${isDragging
                    ? "border-blue-400 bg-blue-50 shadow-lg scale-95 opacity-60"
                    : isSelected
                      ? "border-emerald-300 bg-emerald-50/50 shadow-md ring-2 ring-emerald-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:bg-gray-50/30"
                  }
                `}
              >
                {/* Contenido */}
                <div className="flex gap-2.5 items-start min-h-14">
                  {/* Icono */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center
                    transition-all duration-200
                    ${isSelected
                      ? "bg-emerald-100 text-emerald-600"
                      : isDragging
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    }
                  `}>
                    {getIconoArchivo(archivo.nombre)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                      {archivo.nombre.length > 24
                        ? `${archivo.nombre.substring(0, 21)}...`
                        : archivo.nombre}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatearTamaño(archivo.tamaño)}
                    </p>
                  </div>
                </div>

                {/* Indicador de selección */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md animate-in fade-in scale-in duration-200">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Indicador de arrastre */}
                {isDragging && (
                  <div className="absolute inset-0 rounded-lg bg-blue-400/10 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-white rounded shadow">
                      Arrastrando
                    </span>
                  </div>
                )}

                {/* Overlay en hover para eliminar */}
                {onEliminar && (
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(archivo.id);
                      }}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs shadow-lg transition-colors"
                      title="Eliminar archivo"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      {archivos.length > 0 && (
        <p className="text-xs text-gray-400 px-1">
          💡 Selecciona y arrastra archivos a los hitos para publicar avances
        </p>
      )}
    </div>
  );
}
