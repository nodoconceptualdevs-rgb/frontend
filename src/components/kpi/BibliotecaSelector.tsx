"use client";

import React, { useState, useMemo } from "react";
import { Checkbox, Button } from "antd";
import { ChevronDown, ChevronUp, File } from "lucide-react";
import type { Archivo, ArchivoProyecto } from "@/types/kpi";

interface BibliotecaSelectorProps {
  archivosDisponibles: ArchivoProyecto[];
  archivosYaAdjuntos: string[];
  onAdjuntar: (archivos: Archivo[]) => void;
  isLoading?: boolean;
}

function formatearTamaño(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function BibliotecaSelector({
  archivosDisponibles,
  archivosYaAdjuntos,
  onAdjuntar,
  isLoading = false,
}: BibliotecaSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Archivos disponibles que NO están ya adjuntos
  const archivosParaAdjuntar = useMemo(
    () =>
      archivosDisponibles.filter(
        (a) => !archivosYaAdjuntos.includes(a.id),
      ),
    [archivosDisponibles, archivosYaAdjuntos],
  );

  if (archivosDisponibles.length === 0) return null;

  const handleAdjuntar = () => {
    if (selected.size === 0) return;

    const archivosSeleccionados = archivosParaAdjuntar
      .filter((a) => selected.has(a.id))
      .map(
        (a): Archivo => ({
          id: a.id,
          nombre: a.nombre,
          tamaño: a.tamaño,
          ruta: a.ruta,
          subidoEn: a.subidoEn,
        }),
      );

    onAdjuntar(archivosSeleccionados);
    setSelected(new Set());
    setExpanded(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {expanded ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
        Agregar desde biblioteca ({archivosParaAdjuntar.length} disponibles)
      </button>

      {expanded && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          {archivosParaAdjuntar.length === 0 ? (
            <p className="text-center text-xs text-gray-500">
              Todos los archivos de la biblioteca ya están adjuntos.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {archivosParaAdjuntar.map((archivo) => (
                  <label
                    key={archivo.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <Checkbox
                      checked={selected.has(archivo.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selected);
                        if (e.target.checked) {
                          newSelected.add(archivo.id);
                        } else {
                          newSelected.delete(archivo.id);
                        }
                        setSelected(newSelected);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <File size={14} className="flex-shrink-0 text-gray-400" />
                        <p className="truncate text-xs font-medium text-gray-900">
                          {archivo.nombre}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatearTamaño(archivo.tamaño)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                block
                type="primary"
                onClick={handleAdjuntar}
                disabled={selected.size === 0 || isLoading}
                loading={isLoading}
                style={{
                  background: selected.size > 0 ? "#ef4444" : "#ccc",
                  borderColor: "#ef4444",
                }}
                className="mt-3"
              >
                Adjuntar seleccionados ({selected.size})
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
