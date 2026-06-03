"use client";

import React, { useRef } from "react";
import { Upload, X, File, AlertCircle } from "lucide-react";
import type { Archivo } from "@/types/kpi";

interface ArchivoUploaderProps {
  archivos: Archivo[];
  onAgregar: (archivos: Archivo[]) => void;
  onEliminar: (id: string) => void;
  disabled?: boolean;
  maxArchivos?: number;
  compact?: boolean; // reduce altura de zona drop cuando está embebido
}

function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatearTamaño(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ArchivoUploader({
  archivos,
  onAgregar,
  onEliminar,
  disabled = false,
  maxArchivos = 20,
  compact = false,
}: ArchivoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const manejarArchivos = (files: FileList | null) => {
    if (!files || disabled) return;

    setError(null);
    const nuevos: Archivo[] = [];
    const archivosExistentes = archivos.map((a) => a.nombre);

    Array.from(files).forEach((file) => {
      // Validar duplicados
      if (archivosExistentes.includes(file.name)) {
        setError(`El archivo "${file.name}" ya fue subido.`);
        return;
      }

      // Validar cantidad máxima
      if (archivos.length + nuevos.length >= maxArchivos) {
        setError(`Máximo ${maxArchivos} archivos permitidos.`);
        return;
      }

      nuevos.push({
        id: generarId(),
        nombre: file.name,
        tamaño: file.size,
        ruta: URL.createObjectURL(file), // Mock: blob URL
        subidoEn: new Date().toISOString(),
      });
    });

    if (nuevos.length > 0) {
      onAgregar(nuevos);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e);
    manejarArchivos(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    manejarArchivos(e.target.files);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Zona de drag-drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition ${
          compact ? "gap-1 p-3" : "gap-2 p-6"
        } ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50"
            : dragActive
              ? "border-red-400 bg-red-50"
              : "cursor-pointer border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <div className={`${disabled ? "text-gray-400" : "text-gray-500"}`}>
          <Upload size={compact ? 18 : 24} />
        </div>
        {!compact && (
          <div className="text-center">
            <p className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-gray-700"}`}>
              Arrastra archivos aquí
            </p>
            <p className="text-xs text-gray-500">
              o haz clic para seleccionar ({archivos.length}/{maxArchivos})
            </p>
          </div>
        )}
        {compact && (
          <p className="text-center text-xs text-gray-600">
            Arrastra o haz clic ({archivos.length}/{maxArchivos})
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de archivos */}
      {archivos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Archivos subidos ({archivos.length})
          </p>
          <div className="flex flex-col gap-2">
            {archivos.map((archivo) => (
              <div
                key={archivo.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <File size={18} className="flex-shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {archivo.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatearTamaño(archivo.tamaño)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminar(archivo.id)}
                  disabled={disabled}
                  className={`flex-shrink-0 rounded-lg p-1.5 transition ${
                    disabled
                      ? "cursor-not-allowed text-gray-300"
                      : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                  }`}
                  aria-label="Eliminar archivo"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
