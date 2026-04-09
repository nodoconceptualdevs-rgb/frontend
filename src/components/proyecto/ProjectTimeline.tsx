"use client";

import React, { useState } from "react";
import HitoCard from "./HitoCard";

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

interface ProjectTimelineProps {
  hitos: Hito[];
}

export default function ProjectTimeline({ hitos }: ProjectTimelineProps) {
  const [expandedHito, setExpandedHito] = useState<number | null>(null);

  const toggleHito = (hitoId: number) => {
    setExpandedHito(expandedHito === hitoId ? null : hitoId);
  };

  // Calcular porcentaje de progreso
  const hitosCompletados = hitos.filter((h) => h.estado_completado).length;
  const porcentajeProgreso = Math.round((hitosCompletados / hitos.length) * 100);

  return (
    <div>
      {/* Barra de Progreso Global */}
      <div className="mb-12 bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Progreso General
          </h3>
          <span className="text-3xl font-bold text-red-600">
            {porcentajeProgreso}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${porcentajeProgreso}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {hitosCompletados} de {hitos.length} hitos completados
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Línea vertical del timeline */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-gray-300 to-gray-300" />

        {/* Hitos */}
        <div className="space-y-8">
          {hitos.map((hito) => (
            <div key={hito.id} className="relative pl-20">
              {/* Círculo indicador */}
              <div
                className={`
                  absolute left-4 w-8 h-8 rounded-full border-4 flex items-center justify-center
                  transition-all duration-300 z-10
                  ${
                    hito.estado_completado
                      ? "bg-green-500 border-green-200 shadow-lg shadow-green-500/50"
                      : "bg-gray-300 border-gray-100"
                  }
                `}
              >
                {hito.estado_completado && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Número del hito */}
              <div className="absolute left-2 -top-2 bg-gray-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {hito.orden}
              </div>

              {/* Contenido del Hito */}
              <HitoCard
                hito={hito}
                isExpanded={expandedHito === hito.id}
                onToggle={() => toggleHito(hito.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje final */}
      <div className="mt-12 text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200">
        {porcentajeProgreso === 100 ? (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Proyecto Completado!
            </h3>
            <p className="text-gray-600">
              Gracias por confiar en Nodo Conceptual para hacer realidad tu visión.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Trabajo en Progreso
            </h3>
            <p className="text-gray-600">
              Estamos trabajando arduamente para completar tu proyecto. Te
              mantendremos actualizado con cada avance.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
