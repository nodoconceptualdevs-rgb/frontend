"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { EstadoTarea, TareaConKpi } from "@/types/kpi";
import { ESTADOS_TAREA } from "@/types/kpi";
import KanbanColumn from "./KanbanColumn";
import TareaCard from "./TareaCard";

interface KanbanBoardProps {
  tareas: TareaConKpi[];
  /** El estado de una tarea cambió de columna. */
  onMover: (id: number, estado: EstadoTarea, orden: number) => void;
  /** Se reordenaron las tareas dentro de una columna. */
  onReordenar: (estado: EstadoTarea, idsOrdenados: number[]) => void;
  onVerDetalle: (t: TareaConKpi) => void;
  onEditar: (t: TareaConKpi) => void;
  onReprogramar: (t: TareaConKpi) => void;
  onRechazo: (t: TareaConKpi) => void;
  onPublicar: (t: TareaConKpi) => void;
  onEliminar: (t: TareaConKpi) => void;
  onCrear?: () => void;
}

type Columnas = Record<EstadoTarea, TareaConKpi[]>;

function agrupar(tareas: TareaConKpi[]): Columnas {
  const cols: Columnas = { PENDIENTE: [], EN_PROCESO: [], COMPLETADA: [] };
  for (const t of tareas) cols[t.estado].push(t);
  for (const estado of ESTADOS_TAREA) {
    cols[estado].sort((a, b) => a.orden - b.orden);
  }
  return cols;
}

const idNum = (cardId: string) => Number(cardId.replace("card-", ""));

export default function KanbanBoard({
  tareas,
  onMover,
  onReordenar,
  onVerDetalle,
  onEditar,
  onReprogramar,
  onRechazo,
  onPublicar,
  onEliminar,
  onCrear,
}: KanbanBoardProps) {
  const [columnas, setColumnas] = useState<Columnas>(() => agrupar(tareas));
  const [activeId, setActiveId] = useState<string | null>(null);
  const origenRef = useRef<EstadoTarea | null>(null);

  // Resincronizar con las props cuando no se está arrastrando.
  useEffect(() => {
    if (!activeId) setColumnas(agrupar(tareas));
  }, [tareas, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findContainer = (id: string): EstadoTarea | null => {
    if ((ESTADOS_TAREA as string[]).includes(id)) return id as EstadoTarea;
    for (const estado of ESTADOS_TAREA) {
      if (columnas[estado].some((t) => `card-${t.id}` === id)) return estado;
    }
    return null;
  };

  const tareaActiva: TareaConKpi | null = activeId
    ? (Object.values(columnas)
        .flat()
        .find((t) => `card-${t.id}` === activeId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
    origenRef.current = findContainer(id);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const contenedorActivo = findContainer(activeIdStr);
    const contenedorDestino = findContainer(overIdStr);

    if (
      !contenedorActivo ||
      !contenedorDestino ||
      contenedorActivo === contenedorDestino
    ) {
      return;
    }

    setColumnas((prev) => {
      const itemsActivo = prev[contenedorActivo];
      const itemsDestino = prev[contenedorDestino];
      const idxActivo = itemsActivo.findIndex(
        (t) => `card-${t.id}` === activeIdStr,
      );
      if (idxActivo === -1) return prev;

      const movida = itemsActivo[idxActivo];

      // Posición de inserción en la columna destino.
      const idxOver = itemsDestino.findIndex(
        (t) => `card-${t.id}` === overIdStr,
      );
      const insertIdx = idxOver >= 0 ? idxOver : itemsDestino.length;

      return {
        ...prev,
        [contenedorActivo]: itemsActivo.filter((_, i) => i !== idxActivo),
        [contenedorDestino]: [
          ...itemsDestino.slice(0, insertIdx),
          { ...movida, estado: contenedorDestino },
          ...itemsDestino.slice(insertIdx),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeIdStr = String(active.id);
    const origen = origenRef.current;

    setActiveId(null);
    origenRef.current = null;

    if (!over) return;

    const contenedorDestino = findContainer(String(over.id));
    if (!contenedorDestino) return;

    // `columnas` ya refleja el movimiento entre columnas hecho en onDragOver.
    const items = columnas[contenedorDestino];
    const oldIndex = items.findIndex((t) => `card-${t.id}` === activeIdStr);
    const newIndex = items.findIndex((t) => `card-${t.id}` === String(over.id));

    const finalItems =
      oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex
        ? arrayMove(items, oldIndex, newIndex)
        : items;

    // Actualización de estado pura.
    setColumnas((prev) => ({ ...prev, [contenedorDestino]: finalItems }));

    // Persistencia (fuera del updater para no duplicar en StrictMode).
    const idsDestino = finalItems.map((t) => t.id);
    const posicion = Math.max(
      0,
      finalItems.findIndex((t) => `card-${t.id}` === activeIdStr),
    );
    const tareaId = idNum(activeIdStr);

    if (origen && origen !== contenedorDestino) {
      onMover(tareaId, contenedorDestino, posicion);
      onReordenar(
        origen,
        columnas[origen]
          .filter((t) => `card-${t.id}` !== activeIdStr)
          .map((t) => t.id),
      );
    }
    onReordenar(contenedorDestino, idsDestino);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid min-h-[500px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {ESTADOS_TAREA.map((estado) => (
          <KanbanColumn
            key={estado}
            estado={estado}
            tareas={columnas[estado]}
            onVerDetalle={onVerDetalle}
            onEditar={onEditar}
            onReprogramar={onReprogramar}
            onRechazo={onRechazo}
            onPublicar={onPublicar}
            onEliminar={onEliminar}
            onCrear={onCrear}
          />
        ))}
      </div>

      <DragOverlay>
        {tareaActiva ? <TareaCard tarea={tareaActiva} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
