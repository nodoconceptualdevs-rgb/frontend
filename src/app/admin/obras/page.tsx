"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Select, Spin, Empty, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AdminHeader from "@/components/admin/AdminHeader";
import { getObras } from "@/services/obras";
import { calcularResumenObras } from "@/lib/obras";
import {
  ObrasTable,
  ObrasResumenCards,
} from "@/components/obras";
import type {
  Obra,
  ObrasResumen,
  EstadoObra,
  FiltroObras,
} from "@/types/obras";
import { ESTADO_OBRA_LABEL } from "@/types/obras";
import toast from "react-hot-toast";

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [resumen, setResumen] = useState<ObrasResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoObra | "TODAS">(
    "TODAS"
  );
  const [filtroProyectoId, setFiltroProyectoId] = useState<number | "SIN_PROYECTO" | undefined>(
    undefined
  );

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const o = await getObras();
      setObras(o);
      setResumen(calcularResumenObras(o.map(ob => ({ ...ob, reportes: ob.reportes || [] }))));
    } catch (error) {
      console.error("Error cargando obras:", error);
      toast.error("Error al cargar las obras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtrar obras
  const obrasFiltradasList = useMemo(() => {
    return obras.filter((o) => {
      if (filtroEstado !== "TODAS" && o.estado !== filtroEstado) {
        return false;
      }
      if (filtroProyectoId === "SIN_PROYECTO" && o.proyectoId !== undefined) {
        return false;
      }
      if (
        filtroProyectoId !== undefined &&
        filtroProyectoId !== "SIN_PROYECTO" &&
        o.proyectoId !== filtroProyectoId
      ) {
        return false;
      }
      return true;
    });
  }, [obras, filtroEstado, filtroProyectoId]);

  // Extraer proyectos únicos para el filtro
  const proyectosUnicos = useMemo(() => {
    return Array.from(
      new Map(
        obras
          .filter((o) => o.proyectoId !== undefined)
          .map((o) => [o.proyectoId as number, o.proyectoNombre as string])
      ).entries()
    ).map(([id, nombre]) => ({ id, nombre }));
  }, [obras]);

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
        titulo="Obras"
        subtitulo={`${resumen?.totalObras || 0} obras · $${(resumen?.presupuestoConsumido || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`}
      />

      <div className="px-6">
        <p className="text-sm text-gray-600">
          Control de construcción y ejecución de presupuesto
        </p>
      </div>

      {/* Stat Cards */}
      {resumen && <ObrasResumenCards resumen={resumen} />}

      {/* Filtros */}
      <div className="px-6 py-4 bg-white rounded-lg border border-gray-200 flex gap-4 items-end justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <Select
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={[
                { label: "Todas", value: "TODAS" },
                { label: ESTADO_OBRA_LABEL.PREPARACION, value: "PREPARACION" },
                { label: ESTADO_OBRA_LABEL.EN_CURSO, value: "EN CURSO" },
                { label: ESTADO_OBRA_LABEL.PAUSADA, value: "PAUSADA" },
                { label: ESTADO_OBRA_LABEL.COMPLETADA, value: "COMPLETADA" },
              ]}
              style={{ width: "100%" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Proyecto
            </label>
            <Select
              value={filtroProyectoId}
              onChange={setFiltroProyectoId}
              placeholder="Todos los proyectos"
              allowClear
              options={[
                { label: "Todos los proyectos", value: undefined },
                { label: "Sin proyecto", value: "SIN_PROYECTO" },
                ...proyectosUnicos.map((p) => ({
                  label: p.nombre,
                  value: p.id,
                })),
              ]}
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <Link href="/admin/obras/nueva">
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            className="w-full md:w-auto whitespace-nowrap"
          >
            Nueva Obra
          </Button>
        </Link>
      </div>

      {/* Tabla */}
      {obrasFiltradasList.length > 0 ? (
        <ObrasTable obras={obrasFiltradasList} />
      ) : (
        <div className="px-6">
          <Empty description="No hay obras que mostrar" />
        </div>
      )}
    </div>
  );
}
