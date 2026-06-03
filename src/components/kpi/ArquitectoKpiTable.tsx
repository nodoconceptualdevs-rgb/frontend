"use client";

import React from "react";
import { Avatar } from "antd";
import { Trophy, Timer, RotateCcw, CheckCircle2 } from "lucide-react";
import type { KpiArquitecto } from "@/types/kpi";
import { EFICIENCIA_COLOR } from "@/lib/kpi";

interface ArquitectoKpiTableProps {
  filas: KpiArquitecto[];
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = ["#ef4444", "#f5b940", "#0ea5e9", "#8b5cf6", "#10b981"];

export default function ArquitectoKpiTable({ filas }: ArquitectoKpiTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
          Rendimiento por arquitecto
        </h3>
      </div>

      {/* Cabecera (desktop) */}
      <div className="hidden grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:grid">
        <span className="col-span-4">Arquitecto</span>
        <span className="col-span-2 text-center">A tiempo</span>
        <span className="col-span-2 text-center">Rechazos</span>
        <span className="col-span-2 text-center">Load time</span>
        <span className="col-span-2 text-right">Eficiencia</span>
      </div>

      <div className="divide-y divide-gray-50">
        {filas.map((fila, i) => {
          const ef = EFICIENCIA_COLOR[fila.eficienciaPromedio];
          return (
            <div
              key={fila.arquitectoId}
              className="grid grid-cols-2 items-center gap-2 px-5 py-3.5 transition hover:bg-gray-50/60 md:grid-cols-12"
            >
              {/* Arquitecto */}
              <div className="col-span-2 flex items-center gap-3 md:col-span-4">
                <div className="relative">
                  <Avatar
                    size={36}
                    style={{
                      backgroundColor:
                        AVATAR_COLORS[fila.arquitectoId % AVATAR_COLORS.length],
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {iniciales(fila.nombre)}
                  </Avatar>
                  {i === 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
                      <Trophy size={9} className="text-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {fila.nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {fila.tareasTotales} tarea{fila.tareasTotales !== 1 ? "s" : ""}
                    {" · "}
                    {fila.tareasEnProceso} en proceso
                  </p>
                </div>
              </div>

              {/* Entregas a tiempo */}
              <div className="text-center md:col-span-2">
                <span className="md:hidden text-[11px] uppercase text-gray-400">
                  A tiempo{" "}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 size={13} />
                  {fila.entregasATiempo}/{fila.tareasCompletadas}
                </span>
              </div>

              {/* Rechazos / retrabajo */}
              <div className="text-center md:col-span-2">
                <span className="md:hidden text-[11px] uppercase text-gray-400">
                  Rechazos{" "}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${fila.totalRechazos > 0 ? "text-red-500" : "text-gray-400"}`}
                >
                  <RotateCcw size={13} />
                  {fila.totalRechazos}
                </span>
              </div>

              {/* Load time promedio */}
              <div className="flex items-center justify-center gap-1 md:col-span-2">
                <Timer size={13} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {fila.loadTimePromedioDias}d
                </span>
              </div>

              {/* Eficiencia */}
              <div className="flex items-center justify-end md:col-span-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${ef.bg} ${ef.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${ef.dot}`} />
                  {ef.label}
                </span>
              </div>
            </div>
          );
        })}

        {filas.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No hay datos de arquitectos para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}
