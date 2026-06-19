/**
 * Utilidades para ver las métricas por periodo (día / semana / mes).
 *
 * Una tarea se "ancla" a un periodo por su fecha relevante:
 *  - completada  → fecha de entrega real (fechaCompletacion)
 *  - resto       → fecha de entrega comprometida (fechaEntregaEstimada)
 *                  o, en su defecto, la del requerimiento.
 * Así, el periodo muestra las tareas entregadas o con vencimiento en ese rango.
 */

import dayjs from "dayjs";
import type { TareaDiseno } from "@/types/kpi";

export type Granularidad = "DIA" | "SEMANA" | "MES" | "RANGO" | "TODOS";

export const GRANULARIDAD_LABEL: Record<Granularidad, string> = {
  DIA: "Día",
  SEMANA: "Semana",
  MES: "Mes",
  RANGO: "Rango",
  TODOS: "Todos",
};

/** Modos que se navegan con flechas ← → (los que tienen un periodo fijo). */
export const GRANULARIDADES_NAVEGABLES: Granularidad[] = ["DIA", "SEMANA", "MES"];

export interface Rango {
  inicio: number; // timestamp (ms)
  fin: number; // timestamp (ms)
  label: string; // etiqueta legible del periodo
}

const UNIDAD: Partial<Record<Granularidad, dayjs.ManipulateType>> = {
  DIA: "day",
  SEMANA: "week",
  MES: "month",
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmt(ts: number, opts: Intl.DateTimeFormatOptions): string {
  return new Date(ts).toLocaleDateString("es", opts);
}

/** Lunes de la semana que contiene a `d` (semana de lunes a domingo). */
function inicioSemana(d: dayjs.Dayjs): dayjs.Dayjs {
  const offset = (d.day() + 6) % 7; // day(): 0=Dom..6=Sáb → 0=Lun..6=Dom
  return d.subtract(offset, "day").startOf("day");
}

/** Calcula el rango [inicio, fin] y la etiqueta del periodo que contiene a `anchorIso`. */
export function rangoPeriodo(
  granularidad: Granularidad,
  anchorIso: string,
): Rango {
  const d = dayjs(anchorIso);

  if (granularidad === "DIA") {
    const ini = d.startOf("day");
    const fin = d.endOf("day");
    return {
      inicio: ini.valueOf(),
      fin: fin.valueOf(),
      label: cap(
        fmt(ini.valueOf(), { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
      ),
    };
  }

  if (granularidad === "SEMANA") {
    const ini = inicioSemana(d);
    const fin = ini.add(6, "day").endOf("day");
    const label = `${fmt(ini.valueOf(), { day: "numeric", month: "short" })} – ${fmt(
      fin.valueOf(),
      { day: "numeric", month: "short", year: "numeric" },
    )}`;
    return { inicio: ini.valueOf(), fin: fin.valueOf(), label };
  }

  // MES
  const ini = d.startOf("month");
  const fin = d.endOf("month");
  return {
    inicio: ini.valueOf(),
    fin: fin.valueOf(),
    label: cap(fmt(ini.valueOf(), { month: "long", year: "numeric" })),
  };
}

/** Devuelve el ISO del ancla desplazado un periodo hacia adelante (+1) o atrás (-1). */
export function desplazar(
  granularidad: Granularidad,
  anchorIso: string,
  dir: 1 | -1,
): string {
  return dayjs(anchorIso)
    .add(dir, UNIDAD[granularidad] ?? "day")
    .toISOString();
}

/** Rango personalizado a partir de dos fechas (inclusive). */
export function rangoPersonalizado(inicioIso: string, finIso: string): Rango {
  const ini = dayjs(inicioIso).startOf("day");
  const fin = dayjs(finIso).endOf("day");
  const label = `${fmt(ini.valueOf(), { day: "numeric", month: "short" })} – ${fmt(
    fin.valueOf(),
    { day: "numeric", month: "short", year: "numeric" },
  )}`;
  return { inicio: ini.valueOf(), fin: fin.valueOf(), label };
}

/** Fecha por la que una tarea se ubica en un periodo. */
export function fechaAncla(tarea: TareaDiseno): string | undefined {
  if (tarea.estado === "COMPLETADA" && tarea.fechaCompletacion) {
    return tarea.fechaCompletacion;
  }
  return tarea.fechaEntregaEstimada ?? tarea.fechaRequerimiento;
}

/** True si la tarea cae dentro del rango según su fecha-ancla. */
export function tareaEnRango(tarea: TareaDiseno, rango: Rango): boolean {
  const iso = fechaAncla(tarea);
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= rango.inicio && t <= rango.fin;
}
