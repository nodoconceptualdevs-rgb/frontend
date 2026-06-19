"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, Dropdown, Tooltip } from "antd";
import type { MenuProps } from "antd";
import {
  CalendarClock,
  MoreVertical,
  GripVertical,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  Building2,
  Wrench,
  CalendarCheck,
  CalendarX,
  RotateCcw,
} from "lucide-react";
import type { TareaConKpi } from "@/types/kpi";
import { EFICIENCIA_COLOR, fmtFecha } from "@/lib/kpi";

interface TareaCardProps {
  tarea: TareaConKpi;
  onVerDetalle?: (tarea: TareaConKpi) => void;
  onEditar?: (tarea: TareaConKpi) => void;
  onReprogramar?: (tarea: TareaConKpi) => void;
  onRechazo?: (tarea: TareaConKpi) => void;
  onPublicar?: (tarea: TareaConKpi) => void;
  onEliminar?: (tarea: TareaConKpi) => void;
  /** Si true, se renderiza estática (para el DragOverlay). */
  overlay?: boolean;
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = ["#ef4444", "#f5b940", "#0ea5e9", "#8b5cf6", "#10b981"];

/** Badge de estado de entrega según el estado y las fechas. */
function EntregaBadge({ tarea }: { tarea: TareaConKpi }) {
  // Completada → a tiempo o tarde respecto a lo comprometido originalmente.
  if (tarea.estado === "COMPLETADA") {
    const d = tarea.diasDesviacion;
    if (typeof d !== "number") return null;
    if (d <= 0) {
      return (
        <Badge tono="emerald" icon={<CalendarCheck size={11} />}>
          A tiempo
        </Badge>
      );
    }
    return (
      <Badge tono="red" icon={<CalendarX size={11} />}>
        +{d}d tarde
      </Badge>
    );
  }

  // En proceso → faltan / vencida.
  if (tarea.estado === "EN_PROCESO" && typeof tarea.diasRestantes === "number") {
    if (tarea.enRiesgo) {
      return (
        <Badge tono="red" icon={<CalendarX size={11} />}>
          Vencida {Math.abs(tarea.diasRestantes)}d
        </Badge>
      );
    }
    return (
      <Badge tono="gray" icon={<CalendarClock size={11} />}>
        Faltan {tarea.diasRestantes}d
      </Badge>
    );
  }

  // Pendiente → fecha comprometida.
  if (tarea.fechaEntregaEstimada) {
    return (
      <Badge tono="gray" icon={<CalendarClock size={11} />}>
        {fmtFecha(tarea.fechaEntregaEstimada)}
      </Badge>
    );
  }
  return null;
}

const BADGE_TONOS: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
};

function Badge({
  tono,
  icon,
  children,
}: {
  tono: keyof typeof BADGE_TONOS | string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${BADGE_TONOS[tono] ?? BADGE_TONOS.gray}`}
    >
      {icon}
      {children}
    </span>
  );
}

export default function TareaCard({
  tarea,
  onVerDetalle,
  onEditar,
  onReprogramar,
  onRechazo,
  onPublicar,
  onEliminar,
  overlay = false,
}: TareaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card-${tarea.id}`, disabled: overlay });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ef = tarea.eficiencia ? EFICIENCIA_COLOR[tarea.eficiencia] : null;
  const mostrarEficiencia = tarea.estado !== "PENDIENTE";
  const esIndependiente = tarea.tipo === "INDEPENDIENTE";
  const yaPublicada = Boolean(tarea.publicacion);

  const menuItems: MenuProps["items"] = [
    { key: "editar", label: "Editar tarea", icon: <Pencil size={14} /> },
    ...(!esIndependiente
      ? [
          {
            key: "publicar",
            label: yaPublicada ? "Actualizar en hito" : "Publicar en hito",
            icon: <Send size={14} />,
          },
        ]
      : []),
    { type: "divider" as const },
    {
      key: "eliminar",
      label: "Eliminar",
      icon: <Trash2 size={14} />,
      danger: true,
    },
  ];

  const onMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (key === "editar") onEditar?.(tarea);
    if (key === "publicar") onPublicar?.(tarea);
    if (key === "eliminar") onEliminar?.(tarea);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!overlay) onVerDetalle?.(tarea);
      }}
      role={overlay ? undefined : "button"}
      className={[
        "group relative rounded-xl border bg-white p-3.5 select-none",
        tarea.enRiesgo ? "border-red-200" : "border-gray-200",
        "shadow-sm",
        overlay
          ? "rotate-2 scale-[1.02] shadow-xl ring-2 ring-red-500/30 cursor-grabbing"
          : "cursor-grab hover:border-gray-300 hover:shadow-md transition-all duration-150",
        isDragging && !overlay ? "opacity-40" : "opacity-100",
      ].join(" ")}
    >
      {/* Barra de acento por eficiencia (lateral izquierda) */}
      {mostrarEficiencia && ef && (
        <span
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${ef.dot}`}
          aria-hidden
        />
      )}

      {/* Cabecera: cliente/independiente + menú */}
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="min-w-0">
          {esIndependiente ? (
            <p className="inline-flex items-center gap-1 truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <Wrench size={11} />
              Independiente
            </p>
          ) : (
            <p className="inline-flex items-center gap-1 truncate text-[11px] font-semibold uppercase tracking-wide text-red-600">
              <Building2 size={11} />
              {tarea.clienteNombre}
            </p>
          )}
          <p className="truncate text-[11px] text-gray-400">
            {esIndependiente
              ? "Trabajo interno"
              : `${tarea.proyectoNombre}${tarea.hitoNombre ? ` · ${tarea.hitoNombre}` : ""}`}
          </p>
        </div>

        {!overlay && (
          <Dropdown
            menu={{ items: menuItems, onClick: onMenuClick }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <button
              type="button"
              aria-label="Acciones de la tarea"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
          </Dropdown>
        )}
      </div>

      {/* Título */}
      <h4 className="mt-1.5 pl-1.5 text-sm font-semibold leading-snug text-gray-900">
        {tarea.titulo}
      </h4>

      {/* Badge de publicación en hito (visible al cliente) */}
      {yaPublicada && (
        <div className="mt-2 ml-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 size={12} />
          Publicada en “{tarea.publicacion!.hitoNombre}”
        </div>
      )}

      {/* Pie: arquitectos + indicadores */}
      <div className="mt-3 flex items-center justify-between gap-2 pl-1.5">
        <Avatar.Group
          max={{
            count: 3,
            style: { backgroundColor: "#6b7280", fontSize: 11 },
          }}
          size={26}
        >
          {tarea.arquitectos.map((a) => (
            <Tooltip key={a.id} title={a.name}>
              <Avatar
                size={26}
                style={{
                  backgroundColor: AVATAR_COLORS[a.id % AVATAR_COLORS.length],
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {iniciales(a.name)}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* Estado de entrega */}
          <EntregaBadge tarea={tarea} />

          {/* Reprogramaciones de fecha */}
          {tarea.reprogramaciones > 0 && (
            <Tooltip
              title={`${tarea.reprogramaciones} reprogramación(es) de entrega`}
            >
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                <CalendarClock size={11} />×{tarea.reprogramaciones}
              </span>
            </Tooltip>
          )}

          {/* Rechazos / retrabajo */}
          {tarea.contadorRechazos > 0 && (
            <Tooltip title={`${tarea.contadorRechazos} rechazo(s) / retrabajo`}>
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600">
                <RotateCcw size={11} />×{tarea.contadorRechazos}
              </span>
            </Tooltip>
          )}

          {/* Eficiencia */}
          {mostrarEficiencia && ef && (
            <Tooltip title={`Eficiencia ${ef.label.toLowerCase()}`}>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${ef.bg} ${ef.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ef.dot}`} />
                {ef.label}
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {!overlay && (
        <GripVertical
          size={14}
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-200 opacity-0 transition group-hover:opacity-100"
          aria-hidden
        />
      )}
    </div>
  );
}
