"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spin, Empty, Select, Pagination } from "antd";
import dayjs from "dayjs";
import AdminHeader from "@/components/admin/AdminHeader";
import { getHistorialGlobal, type HistorialEvento } from "@/services/obras";

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

const ETIQUETA_MODULO: Record<string, string> = {
  obra: "Obra",
  equipo: "Equipo",
  partidas: "Partidas",
  reportes: "Reportes",
  personal: "Personal",
  valuaciones: "Valuaciones",
  inventario: "Inventario",
};

const PAGE_SIZE = 15;

export default function HistorialGlobalPage() {
  const [eventos, setEventos] = useState<HistorialEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroObra, setFiltroObra] = useState<string | "TODAS">("TODAS");
  const [filtroModulo, setFiltroModulo] = useState<string | "TODOS">("TODOS");
  const [filtroAccion, setFiltroAccion] = useState<string | "TODAS">("TODAS");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    getHistorialGlobal()
      .then(setEventos)
      .finally(() => setLoading(false));
  }, []);

  const obrasDisponibles = useMemo(
    () =>
      Array.from(
        new Set(eventos.map((e) => e.obraNombre).filter((n): n is string => Boolean(n)))
      ),
    [eventos]
  );

  const modulosDisponibles = useMemo(
    () => Array.from(new Set(eventos.map((e) => e.modulo).filter(Boolean))),
    [eventos]
  );

  const accionesDisponibles = useMemo(
    () => Array.from(new Set(eventos.map((e) => e.accion).filter(Boolean))),
    [eventos]
  );

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroObra !== "TODAS" && e.obraNombre !== filtroObra) return false;
      if (filtroModulo !== "TODOS" && e.modulo !== filtroModulo) return false;
      if (filtroAccion !== "TODAS" && e.accion !== filtroAccion) return false;
      return true;
    });
  }, [eventos, filtroObra, filtroModulo, filtroAccion]);

  useEffect(() => {
    setPagina(1);
  }, [filtroObra, filtroModulo, filtroAccion]);

  const eventosPagina = useMemo(() => {
    const inicio = (pagina - 1) * PAGE_SIZE;
    return eventosFiltrados.slice(inicio, inicio + PAGE_SIZE);
  }, [eventosFiltrados, pagina]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        titulo="Historial de Obras"
        subtitulo={`${eventos.length} eventos registrados`}
      />

      <div className="px-6">
        <p className="text-sm text-gray-600">
          Registro permanente de todas las acciones realizadas en obras
        </p>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 bg-white rounded-lg border border-gray-200 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Obra
          </label>
          <Select
            value={filtroObra}
            onChange={setFiltroObra}
            style={{ width: "100%" }}
            options={[
              { value: "TODAS", label: "Todas las obras" },
              ...obrasDisponibles.map((n) => ({ value: n, label: n })),
            ]}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Módulo
          </label>
          <Select
            value={filtroModulo}
            onChange={setFiltroModulo}
            style={{ width: "100%" }}
            options={[
              { value: "TODOS", label: "Todos los módulos" },
              ...modulosDisponibles.map((m) => ({
                value: m,
                label: ETIQUETA_MODULO[m] ?? m,
              })),
            ]}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Acción
          </label>
          <Select
            value={filtroAccion}
            onChange={setFiltroAccion}
            style={{ width: "100%" }}
            options={[
              { value: "TODAS", label: "Todas las acciones" },
              ...accionesDisponibles.map((a) => ({
                value: a,
                label: ETIQUETA_ACCION[a] ?? a,
              })),
            ]}
          />
        </div>
      </div>

      {/* Lista */}
      {eventosFiltrados.length === 0 ? (
        <div className="px-6">
          <Empty description="No hay eventos que coincidan con los filtros" />
        </div>
      ) : (
        <div className="px-6 space-y-4">
          <div className="space-y-2">
            {eventosPagina.map((evento) => (
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
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{evento.obraNombre ?? "Obra eliminada"}</span>
                    {" — "}
                    {evento.descripcion}
                  </p>
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

          {eventosFiltrados.length > PAGE_SIZE && (
            <div className="flex justify-end pb-2">
              <Pagination
                current={pagina}
                onChange={setPagina}
                total={eventosFiltrados.length}
                pageSize={PAGE_SIZE}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
