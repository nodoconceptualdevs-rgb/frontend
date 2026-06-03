"use client";

import React from "react";
import { Segmented, DatePicker } from "antd";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, CalendarRange, Layers } from "lucide-react";
import {
  type Granularidad,
  GRANULARIDAD_LABEL,
  GRANULARIDADES_NAVEGABLES,
  rangoPeriodo,
  desplazar,
} from "@/lib/periodo";

const { RangePicker } = DatePicker;

interface PeriodoSelectorProps {
  granularidad: Granularidad;
  anchorIso: string;
  rangoInicioIso: string | null;
  rangoFinIso: string | null;
  onGranularidad: (g: Granularidad) => void;
  onAnchor: (iso: string) => void;
  onRango: (inicioIso: string | null, finIso: string | null) => void;
  /** ISO de "hoy" para el botón de reinicio. */
  hoyIso: string;
}

const OPCIONES: Granularidad[] = ["DIA", "SEMANA", "MES", "RANGO", "TODOS"];

export default function PeriodoSelector({
  granularidad,
  anchorIso,
  rangoInicioIso,
  rangoFinIso,
  onGranularidad,
  onAnchor,
  onRango,
  hoyIso,
}: PeriodoSelectorProps) {
  const esNavegable = GRANULARIDADES_NAVEGABLES.includes(granularidad);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Segmented
        value={granularidad}
        onChange={(v) => onGranularidad(v as Granularidad)}
        options={OPCIONES.map((g) => ({
          label: GRANULARIDAD_LABEL[g],
          value: g,
        }))}
      />

      {/* Día / Semana / Mes → navegación con flechas */}
      {esNavegable && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Periodo anterior"
            onClick={() => onAnchor(desplazar(granularidad, anchorIso, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800">
            <CalendarRange size={15} className="text-red-500" />
            {rangoPeriodo(granularidad, anchorIso).label}
          </div>

          <button
            type="button"
            aria-label="Periodo siguiente"
            onClick={() => onAnchor(desplazar(granularidad, anchorIso, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
          >
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => onAnchor(hoyIso)}
            className="ml-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Hoy
          </button>
        </div>
      )}

      {/* Rango personalizado → selector de fechas */}
      {granularidad === "RANGO" && (
        <RangePicker
          format="DD/MM/YYYY"
          allowClear
          placeholder={["Desde", "Hasta"]}
          value={[
            rangoInicioIso ? dayjs(rangoInicioIso) : null,
            rangoFinIso ? dayjs(rangoFinIso) : null,
          ]}
          onChange={(fechas) =>
            onRango(
              fechas?.[0] ? fechas[0].toISOString() : null,
              fechas?.[1] ? fechas[1].toISOString() : null,
            )
          }
        />
      )}

      {/* Todos → sin filtro */}
      {granularidad === "TODOS" && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700">
          <Layers size={15} className="text-red-500" />
          Todos los reportes
        </div>
      )}
    </div>
  );
}
