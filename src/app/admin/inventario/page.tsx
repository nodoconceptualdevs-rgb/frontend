"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, Spin, Empty, Select } from "antd";
import { Plus, Package, Archive } from "lucide-react";
import dayjs from "dayjs";
import AgregarMaterialModal from "@/components/inventario/AgregarMaterialModal";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import FacturasTable from "@/components/inventario/FacturasTable";
import MaterialesTable from "@/components/inventario/MaterialesTable";
import FacturaModal from "@/components/inventario/FacturaModal";
import FacturaDetalleModal from "@/components/inventario/FacturaDetalleModal";
import HerramientasTable from "@/components/inventario/HerramientasTable";
import HerramientaModal from "@/components/inventario/HerramientaModal";
import PeriodoSelector from "@/components/kpi/PeriodoSelector";
import type { Granularidad } from "@/lib/periodo";
import { rangoPeriodo } from "@/lib/periodo";
import type {
  FacturaCompra,
  FacturaFormValues,
  MaterialConEstado,
  InventarioResumen,
  Herramienta,
  HerramientaFormValues,
} from "@/types/inventario";
import {
  getFacturas,
  createFactura,
  updateEstadoFactura,
  anularFactura,
  getMateriales,
  getResumenInventario,
  getHerramientas,
  createHerramienta,
  updateHerramienta,
  deleteHerramienta,
} from "@/services/inventario";
import { getObras } from "@/services/obras";
import type { Obra } from "@/types/obras";

export default function InventarioPage() {
  const [facturas, setFacturas] = useState<FacturaCompra[]>([]);
  const [materiales, setMateriales] = useState<MaterialConEstado[]>([]);
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [resumen, setResumen] = useState<InventarioResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalFacturaOpen, setModalFacturaOpen] = useState(false);
  const [modalMaterialOpen, setModalMaterialOpen] = useState(false);
  const [modalHerramientaOpen, setModalHerramientaOpen] = useState(false);
  const [facturaDetalleOpen, setFacturaDetalleOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaCompra | null>(null);
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState<Herramienta | null>(null);

  // Período para filtro de facturas
  const [hoyIso] = useState(() => new Date().toISOString());
  const [granularidad, setGranularidad] = useState<Granularidad>("MES");
  const [anchorIso, setAnchorIso] = useState(() => new Date().toISOString());
  const [rangoInicioIso, setRangoInicioIso] = useState<string | null>(null);
  const [rangoFinIso, setRangoFinIso] = useState<string | null>(null);

  // Filtro por proyecto
  const [proyectoIdFiltro, setProyectoIdFiltro] = useState<number | undefined>(undefined);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [f, m, r, h, o] = await Promise.all([
        getFacturas(),
        getMateriales(),
        getResumenInventario(),
        getHerramientas(),
        getObras(),
      ]);
      setFacturas(f);
      setMateriales(m);
      setResumen(r);
      setHerramientas(h);
      setObras(o);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handlers
  const handleCrearFactura = async (values: FacturaFormValues) => {
    await createFactura(values);
    await cargarDatos();
  };

  const handleAprobarFactura = async (id: number) => {
    await updateEstadoFactura(id, "APROBADA");
    await cargarDatos();
    toast.success("Factura aprobada");
  };

  const handleAnularFactura = async (id: number) => {
    await anularFactura(id);
    await cargarDatos();
  };

  const handleVerDetalle = (factura: FacturaCompra) => {
    setFacturaSeleccionada(factura);
    setFacturaDetalleOpen(true);
  };

  // Obtener proyectos únicos
  const proyectosUnicos = useMemo(() => {
    const proyectos = new Map<number | undefined, string>();
    facturas.forEach((f) => {
      if (f.proyectoId && f.proyectoNombre) {
        proyectos.set(f.proyectoId, f.proyectoNombre);
      }
    });
    return Array.from(proyectos.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [facturas]);

  // Filtrar facturas por período y proyecto
  const facturasFiltradasPorFecha = useMemo(() => {
    let filtered = facturas;

    // Filtro por período
    if (granularidad !== "TODOS") {
      let inicio: number;
      let fin: number;

      if (granularidad === "RANGO") {
        if (!rangoInicioIso || !rangoFinIso) return filtered;
        inicio = new Date(rangoInicioIso).getTime();
        fin = new Date(rangoFinIso).getTime();
      } else {
        const rango = rangoPeriodo(granularidad, anchorIso);
        inicio = rango.inicio;
        fin = rango.fin;
      }

      filtered = filtered.filter((f) => {
        const fechaFactura = new Date(f.fecha).getTime();
        return fechaFactura >= inicio && fechaFactura <= fin;
      });
    }

    // Filtro por proyecto
    if (proyectoIdFiltro !== undefined) {
      filtered = filtered.filter((f) => f.proyectoId === proyectoIdFiltro);
    }

    return filtered;
  }, [facturas, granularidad, anchorIso, rangoInicioIso, rangoFinIso, proyectoIdFiltro]);

  // Calcular resumen de facturas filtradas (por período y proyecto)
  const resumenFiltradasPorFecha = useMemo(() => {
    const facturasActivas = facturasFiltradasPorFecha.filter((f) => f.estado !== "ANULADA");
    const totalFacturas = facturasFiltradasPorFecha.length;
    const montoPagado = facturasActivas
      .filter((f) => f.estado === "PAGADA")
      .reduce((sum, f) => sum + f.total, 0);
    const montoPendiente = facturasActivas
      .filter((f) => f.estado === "APROBADA")
      .reduce((sum, f) => sum + f.total, 0);

    return {
      totalFacturas,
      montoPagado,
      montoPendiente,
    };
  }, [facturasFiltradasPorFecha]);

  const handleCrearMaterial = async (
    nombre: string,
    categoria: any,
    unidad: string,
    stockMinimo: number | null
  ) => {
    const { createMaterial } = await import("@/services/inventario");
    await createMaterial(nombre, categoria, unidad, stockMinimo || 0, 0);
    await cargarDatos();
    setModalMaterialOpen(false);
    toast.success("Material agregado al catálogo");
  };

  const handleCrearHerramienta = async (values: HerramientaFormValues) => {
    try {
      await createHerramienta(values);
      await cargarDatos();
      setModalHerramientaOpen(false);
      setHerramientaSeleccionada(null);
      toast.success("Herramienta agregada correctamente");
    } catch (error) {
      console.error("Error al crear herramienta:", error);
      toast.error("Error al crear la herramienta");
    }
  };

  const handleActualizarHerramienta = async (values: HerramientaFormValues) => {
    if (!herramientaSeleccionada) return;
    try {
      await updateHerramienta(herramientaSeleccionada.id, values);
      await cargarDatos();
      setModalHerramientaOpen(false);
      setHerramientaSeleccionada(null);
      toast.success("Herramienta actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar herramienta:", error);
      toast.error("Error al actualizar la herramienta");
    }
  };

  const handleEliminarHerramienta = async (id: number) => {
    try {
      await deleteHerramienta(id);
      await cargarDatos();
      toast.success("Herramienta eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar herramienta:", error);
      toast.error("Error al eliminar la herramienta");
    }
  };

  // Stats cards
  const StatCard = ({
    label,
    value,
    sufijo,
  }: {
    label: string;
    value: string | number;
    sufijo?: string;
  }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
        {sufijo && <span className="text-sm text-gray-500">{sufijo}</span>}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: "facturas",
      label: (
        <span className="inline-flex items-center gap-2">
          <Package size={16} /> Facturas de Compra
        </span>
      ),
      children: (
        <div className="flex flex-col gap-5">
          {/* Filtros: Período y Proyecto */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <PeriodoSelector
                  granularidad={granularidad}
                  anchorIso={anchorIso}
                  rangoInicioIso={rangoInicioIso}
                  rangoFinIso={rangoFinIso}
                  onGranularidad={setGranularidad}
                  onAnchor={setAnchorIso}
                  onRango={(inicio, fin) => {
                    setRangoInicioIso(inicio);
                    setRangoFinIso(fin);
                  }}
                  hoyIso={hoyIso}
                />
              </div>

              <div className="w-full lg:w-48">
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-2">
                  Proyecto
                </label>
                <Select
                  placeholder="Todos los proyectos"
                  allowClear
                  value={proyectoIdFiltro}
                  onChange={setProyectoIdFiltro}
                  options={[
                    { value: undefined, label: "Todos los proyectos" },
                    ...proyectosUnicos.map((p) => ({
                      value: p.id,
                      label: p.nombre,
                    })),
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stats (basados en período filtrado) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Facturas" value={resumenFiltradasPorFecha.totalFacturas} />
            <StatCard
              label="Monto Pagado"
              value={`$${(resumenFiltradasPorFecha.montoPagado || 0).toLocaleString("es-MX")}`}
            />
            <StatCard
              label="Por Pagar"
              value={`$${(resumenFiltradasPorFecha.montoPendiente || 0).toLocaleString("es-MX")}`}
            />
            <StatCard label="Materiales en Alerta" value={resumen?.materialesBajoMinimo || 0} />
          </div>

          {/* Tabla */}
          {facturasFiltradasPorFecha.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16">
              <Empty description={facturas.length === 0 ? "No hay facturas registradas" : "No hay facturas en el rango seleccionado"} />
            </div>
          ) : (
            <FacturasTable
              facturas={facturasFiltradasPorFecha}
              onVerDetalle={handleVerDetalle}
              onAprobar={handleAprobarFactura}
              onAnular={handleAnularFactura}
            />
          )}
        </div>
      ),
    },
    {
      key: "stock",
      label: (
        <span className="inline-flex items-center gap-2">
          <Archive size={16} /> Stock de Materiales
        </span>
      ),
      children: (
        <div className="flex flex-col gap-5">
          {/* Botón agregar material */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Administra el catálogo de materiales disponibles para las facturas
            </p>
            <button
              type="button"
              onClick={() => setModalMaterialOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              <Plus size={18} />
              Agregar Material
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Materiales" value={resumen?.totalMateriales || 0} />
            <StatCard
              label="Valor Total Stock"
              value={`$${(resumen?.valorTotalStock || 0).toLocaleString("es-MX")}`}
            />
            <StatCard label="Bajo Mínimo" value={resumen?.materialesBajoMinimo || 0} />
            <StatCard
              label="Sin Stock"
              value={materiales.filter((m) => m.stockActual === 0).length}
            />
          </div>

          {/* Tabla */}
          {materiales.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16">
              <Empty description="No hay materiales" />
            </div>
          ) : (
            <MaterialesTable materiales={materiales} />
          )}
        </div>
      ),
    },
    {
      key: "herramientas",
      label: (
        <span className="inline-flex items-center gap-2">
          <Package size={16} /> Herramientas
        </span>
      ),
      children: (
        <div className="flex flex-col gap-5">
          {/* Botón agregar herramienta */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Administra las herramientas disponibles para las obras
            </p>
            <button
              type="button"
              onClick={() => {
                setHerramientaSeleccionada(null);
                setModalHerramientaOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              <Plus size={18} />
              Agregar Herramienta
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Herramientas" value={herramientas.length} />
            <StatCard label="Disponibles" value={herramientas.filter((h) => h.estado === "DISPONIBLE").length} />
            <StatCard label="En uso" value={herramientas.filter((h) => h.estado === "EN_USO").length} />
            <StatCard label="En mantenimiento" value={herramientas.filter((h) => h.estado === "MANTENIMIENTO").length} />
          </div>

          {/* Tabla */}
          {herramientas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16">
              <Empty description="No hay herramientas registradas" />
            </div>
          ) : (
            <HerramientasTable
              herramientas={herramientas}
              onEdit={(h) => {
                setHerramientaSeleccionada(h);
                setModalHerramientaOpen(true);
              }}
              onDelete={handleEliminarHerramienta}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        titulo="Inventario de Materiales"
        subtitulo={`${facturas.length} facturas · $${(resumen?.montoPagado || 0).toLocaleString("es-MX")} pagado`}
      />

      <main className="px-4 py-4 sm:px-6 md:px-8 md:py-8">
        {/* Acción principal */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="hidden text-sm text-gray-500 sm:block">
            Registra las facturas de compra de materiales. Automáticamente se actualiza el stock
            disponible.
          </p>
          <button
            type="button"
            onClick={() => setModalFacturaOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            <Plus size={18} />
            Nueva Factura
          </button>
        </div>

        {/* Tabs */}
        <Tabs items={tabItems} defaultActiveKey="facturas" />
      </main>

      {/* Modal de nueva factura */}
      <FacturaModal
        open={modalFacturaOpen}
        onClose={() => setModalFacturaOpen(false)}
        onSubmit={handleCrearFactura}
        materiales={materiales}
        proyectos={obras.map((o) => ({ id: o.proyectoId, nombre: o.proyectoNombre }))}
        obras={obras.map((o) => ({ id: o.id, nombre: o.nombre, proyectoId: o.proyectoId }))}
      />

      {/* Modal de agregar material */}
      <AgregarMaterialModal
        open={modalMaterialOpen}
        onClose={() => setModalMaterialOpen(false)}
        onMaterialCreado={() => {
          setModalMaterialOpen(false);
          cargarDatos();
        }}
      />

      {/* Modal de detalle factura */}
      <FacturaDetalleModal
        open={facturaDetalleOpen}
        factura={facturaSeleccionada}
        onClose={() => {
          setFacturaDetalleOpen(false);
          setFacturaSeleccionada(null);
        }}
      />

      {/* Modal de herramienta */}
      <HerramientaModal
        open={modalHerramientaOpen}
        herramienta={herramientaSeleccionada || undefined}
        onClose={() => {
          setModalHerramientaOpen(false);
          setHerramientaSeleccionada(null);
        }}
        onSubmit={herramientaSeleccionada ? handleActualizarHerramienta : handleCrearHerramienta}
      />
    </div>
  );
}
