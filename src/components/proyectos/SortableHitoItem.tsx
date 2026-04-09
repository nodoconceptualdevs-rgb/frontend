"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Hito } from '@/types/proyecto.types';

interface SortableHitoItemProps {
  hito: Hito;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function SortableHitoItem({ 
  hito, 
  isSelected, 
  onSelect, 
  onDelete 
}: SortableHitoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hito.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={() => onSelect(hito.id)}
        className={`w-full text-left px-4 py-3 rounded-lg transition border-2 group cursor-pointer ${
          isSelected
            ? "border-red-600 bg-red-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(hito.id);
          }
        }}
      >
        <div className="flex items-center gap-3 relative">
          {/* Icono de drag */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition flex-shrink-0"
            title="Arrastra para reordenar"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
            </svg>
          </div>
          
          {/* Indicador de estado */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              hito.estado_completado
                ? "bg-green-500 text-white"
                : "bg-gray-300"
            }`}
          >
            {hito.estado_completado && (
              <svg
                className="w-4 h-4"
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

          {/* Información del hito */}
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {hito.orden}. {hito.nombre}
            </div>
            <div className="text-xs text-gray-500">
              {hito.estado_completado ? "Completado" : "Pendiente"}
            </div>
          </div>

          {/* Botón de eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(hito.id);
            }}
            className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
            title="Eliminar hito"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
