"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Inbox } from "lucide-react";
import type { EstadoTarea, TareaConKpi } from "@/types/kpi";
import { ESTADO_LABEL } from "@/types/kpi";
import TareaCard from "./TareaCard";

interface KanbanColumnProps {
  estado: EstadoTarea;
  tareas: TareaConKpi[];
  onVerDetalle: (t: TareaConKpi) => void;
  onEditar: (t: TareaConKpi) => void;
  onReprogramar: (t: TareaConKpi) => void;
  onRechazo: (t: TareaConKpi) => void;
  onPublicar: (t: TareaConKpi) => void;
  onEliminar: (t: TareaConKpi) => void;
}

/** Estilos de acento por columna. */
const ACENTO: Record<
  EstadoTarea,
  { dot: string; chip: string; ring: string }
> = {
  PENDIENTE: {
    dot: "bg-gray-400",
    chip: "bg-gray-100 text-gray-600",
    ring: "ring-gray-300",
  },
  EN_PROCESO: {
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-700",
    ring: "ring-amber-300",
  },
  COMPLETADA: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-300",
  },
};

export default function KanbanColumn({
  estado,
  tareas,
  onVerDetalle,
  onEditar,
  onReprogramar,
  onRechazo,
  onPublicar,
  onEliminar,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  const acento = ACENTO[estado];
  const ids = tareas.map((t) => `card-${t.id}`);

  return (
    <div className="flex min-w-0 flex-col">
      {/* Cabecera de columna */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${acento.dot}`} />
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
          {ESTADO_LABEL[estado]}
        </h3>
        <span
          className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${acento.chip}`}
        >
          {tareas.length}
        </span>
      </div>

      {/* Zona droppable */}
      <div
        ref={setNodeRef}
        className={[
          "flex min-h-[140px] flex-1 flex-col gap-2.5 rounded-2xl border border-dashed p-2.5 transition-colors",
          isOver
            ? `border-transparent bg-white ring-2 ${acento.ring}`
            : "border-gray-200 bg-gray-50/60",
        ].join(" ")}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tareas.map((tarea) => (
            <TareaCard
              key={tarea.id}
              tarea={tarea}
              onVerDetalle={onVerDetalle}
              onEditar={onEditar}
              onReprogramar={onReprogramar}
              onRechazo={onRechazo}
              onPublicar={onPublicar}
              onEliminar={onEliminar}
            />
          ))}
        </SortableContext>

        {tareas.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center text-gray-300">
            <Inbox size={26} strokeWidth={1.5} />
            <span className="text-xs text-gray-400">Sin tareas</span>
          </div>
        )}
      </div>
    </div>
  );
}
