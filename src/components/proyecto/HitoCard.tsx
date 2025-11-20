"use client";

import React from "react";
import MultimediaGallery from "./MultimediaGallery";

interface ContenidoMultimedia {
  id: number;
  titulo_seccion: string;
  tipo_contenido: string;
  descripcion?: string;
  archivos?: Array<{ url: string; nombre: string }>;
}

interface Hito {
  id: number;
  nombre: string;
  orden: number;
  estado_completado: boolean;
  fecha_actualizacion: string | null;
  descripcion_avance: string | null;
  enlace_tour_360?: string;
  contenido_multimedia: ContenidoMultimedia[];
}

interface HitoCardProps {
  hito: Hito;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function HitoCard({ hito, isExpanded, onToggle }: HitoCardProps) {
  return (
    <div
      className={`
        rounded-xl border-2 transition-all duration-300 overflow-hidden
        ${
          hito.estado_completado
            ? "border-green-500 bg-white shadow-lg hover:shadow-xl"
            : "border-gray-300 bg-gray-50"
        }
      `}
    >
      {/* Header del Hito */}
      <button
        onClick={onToggle}
        className={`
          w-full p-6 text-left transition-colors
          ${hito.estado_completado ? "hover:bg-green-50" : "hover:bg-gray-100"}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3
              className={`
                text-xl font-bold mb-2
                ${hito.estado_completado ? "text-gray-900" : "text-gray-400"}
              `}
            >
              {hito.nombre}
            </h3>

            {hito.estado_completado && hito.fecha_actualizacion && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Actualizado:{" "}
                {new Date(hito.fecha_actualizacion).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}

            {!hito.estado_completado && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg
                  className="w-4 h-4 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                En progreso...
              </div>
            )}
          </div>

          {/* Icono de expandir/colapsar */}
          {hito.estado_completado && (
            <div className="ml-4">
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      {hito.estado_completado && isExpanded && (
        <div className="px-6 pb-6 border-t-2 border-gray-100">
          {/* Descripción del avance */}
          {hito.descripcion_avance && (
            <div className="mt-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Descripción del Avance:
              </h4>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: hito.descripcion_avance }}
              />
            </div>
          )}

          {/* Tour 360° */}
          {hito.enlace_tour_360 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                Tour Virtual 360°
              </h4>
              <a
                href={hito.enlace_tour_360}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl"
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
                Explorar en 360°
              </a>
            </div>
          )}

          {/* Contenido Multimedia */}
          {hito.contenido_multimedia.length > 0 && (
            <div className="space-y-6">
              {hito.contenido_multimedia.map((contenido) => (
                <MultimediaGallery key={contenido.id} contenido={contenido} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
