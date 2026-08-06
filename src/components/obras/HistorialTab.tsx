"use client";

import React from "react";
import { Empty } from "antd";
import dayjs from "dayjs";
import type { HistorialEvento } from "@/services/obras";

const ETIQUETA_ACCION: Record<string, string> = {
  CREAR: "Creó",
  EDITAR: "Editó",
  ELIMINAR: "Eliminó",
  CAMBIO_ESTADO: "Cambió estado",
};

const COLOR_ACCION: Record<string, string> = {
  CREAR: "bg-green-100 text-green-700",
  EDITAR: "bg-amber-100 text-amber-700",
  ELIMINAR: "bg-red-100 text-red-700",
  CAMBIO_ESTADO: "bg-blue-100 text-blue-700",
};

interface Props {
  eventos: HistorialEvento[];
}

export default function HistorialTab({ eventos }: Props) {
  if (eventos.length === 0) {
    return (
      <div className="py-10">
        <Empty description="Todavía no hay eventos registrados en esta obra" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {eventos.map((evento) => (
        <div
          key={evento.id}
          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
        >
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              COLOR_ACCION[evento.accion] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {ETIQUETA_ACCION[evento.accion] ?? evento.accion}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">{evento.descripcion}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {evento.usuarioNombre ?? "Usuario eliminado"}
              {evento.usuarioRol === "admin" ? " (admin)" : ""}
              {" · "}
              {dayjs(evento.createdAt).format("DD MMM YYYY, HH:mm")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
