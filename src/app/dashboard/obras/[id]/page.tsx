"use client";

import React, { useEffect, useState, useCallback, Fragment } from "react";
import { Tabs, Spin, Empty, Button, Modal, DatePicker } from "antd";
import dayjs from "dayjs";
import { Plus, ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getObra,
  updateEstadoObra,
  getPersonal,
  getMaterialesDisponibles,
  getValuacion,
  getValuaciones,
  createPartida,
  deletePartida,
  createReporte,
  createPersonal,
  createValuacion,
} from "@/services/obras";
import { getFacturasByObra } from "@/services/inventario";
import type { FacturaCompra } from "@/types/inventario";
import {
  PartidasTable,
  ReportesTable,
  PersonalTable,
  ValuacionResumen,
  PartidaModal,
  PersonalModal,
  ReporteFormSection,
  EstadoSegmented,
  ValuacionesTab,
  AnaliticaTab,
  InventarioTab,
} from "@/components/obras";
import type {
  Obra,
  EstadoObra,
  Personal,
  MaterialDisponible,
  ValuacionFinal,
  PartidaFormValues,
  PersonalFormValues,
  ReporteFormValues,
} from "@/types/obras";
import toast from "react-hot-toast";

export default function GerenteObraDetallePage() {
  const params = useParams();
  const router = useRouter();
  const obraId = Number(params.id);

  const [obra, setObra] = useState<Obra | null>(null);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [materiales, setMateriales] = useState<MaterialDisponible[]>([]);
  const [valuacion, setValuacion] = useState<ValuacionFinal | null>(null);
  const [valuaciones, setValuaciones] = useState<import("@/types/obras").ValuacionDoc[]>([]);
  const [facturas, setFacturas] = useState<FacturaCompra[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales de edición
  const [partidaModalOpen, setPartidaModalOpen] = useState(false);
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [reporteModalOpen, setReporteModalOpen] = useState(false);
  const [personalEditable, setPersonalEditable] = useState<Personal | null>(null);
  const [activeTab, setActiveTab] = useState("partidas");

  // Filtro de fechas para reportes
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  // Expandibles para reportes pendientes
  const [expandedReportesPendientes, setExpandedReportesPendientes] = useState<Set<number>>(new Set());


  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [o, p, m, v, vals, f2] = await Promise.all([
        getObra(obraId),
        getPersonal(),
        getMaterialesDisponibles(),
        getValuacion(obraId),
        getValuaciones(obraId),
        getFacturasByObra(obraId),
      ]);
      setObra(o);
      setPersonal(p);
      setMateriales(m);
      setValuacion(v);
      setValuaciones(vals);
      setFacturas(f2);
    } catch (error) {
      console.error("Error cargando obra:", error);
      toast.error("Error al cargar la obra");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handlers
  const handleEstadoChange = async (newEstado: EstadoObra) => {
    try {
      await updateEstadoObra(obraId, newEstado);
      await cargarDatos();
      toast.success("Estado actualizado");
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleAgregarPartida = async (values: PartidaFormValues) => {
    try {
      await createPartida(obraId, values);
      setPartidaModalOpen(false);
      await cargarDatos();
      toast.success("Partida agregada");
    } catch (error) {
      console.error("Error creando partida:", error);
      toast.error("Error al agregar la partida");
    }
  };

  const handleEliminarPartida = async (partidaId: number) => {
    Modal.confirm({
      title: "Eliminar Partida",
      content: "¿Está seguro de que desea eliminar esta partida?",
      okText: "Eliminar",
      okType: "danger",
      onOk: async () => {
        try {
          await deletePartida(obraId, partidaId);
          await cargarDatos();
          toast.success("Partida eliminada");
        } catch (error) {
          console.error("Error eliminando partida:", error);
          toast.error("Error al eliminar la partida");
        }
      },
    });
  };

  const handleGuardarReporte = async (values: ReporteFormValues) => {
    try {
      await createReporte(values);
      await cargarDatos();
      setActiveTab("reportes");
      toast.success("Reporte registrado");
    } catch (error) {
      console.error("Error creando reporte:", error);
      toast.error("Error al guardar el reporte");
    }
  };

  const handleAgregarPersonal = async (values: PersonalFormValues) => {
    try {
      await createPersonal(values);
      setPersonalModalOpen(false);
      setPersonalEditable(null);
      await cargarDatos();
      toast.success("Personal agregado");
    } catch (error) {
      console.error("Error guardando personal:", error);
      toast.error("Error al guardar el personal");
    }
  };

  const handleConcretarValuacion = async () => {
    try {
      await createValuacion(obraId, {});
      await cargarDatos();
      toast.success("Valuación concretada");
    } catch (error: any) {
      console.error("Error concretando valuación:", error);
      toast.error(error.message || "Error al concretar la valuación");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="space-y-6 px-6">
        <div className="border-b border-gray-200 bg-white px-6 py-6 -mx-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/obras">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Obra no encontrada</h1>
          </div>
        </div>
        <Empty description="La obra solicitada no existe" />
      </div>
    );
  }

  // Filtrar reportes por rango de fechas
  const reportesFiltrados = obra.reportes.filter((reporte) => {
    const fechaReporte = new Date(reporte.fecha).getTime();
    if (fechaInicio) {
      const inicio = new Date(fechaInicio).getTime();
      if (fechaReporte < inicio) return false;
    }
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setDate(fin.getDate() + 1); // Incluir todo el día fin
      if (fechaReporte >= fin.getTime()) return false;
    }
    return true;
  });

  const tabItems = [
    {
      key: "partidas",
      label: "Partidas",
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => setPartidaModalOpen(true)}
            >
              Agregar Partida
            </Button>
          </div>
          <PartidasTable
            partidas={obra.partidas}
            onEditar={() => {}}
            onEliminar={handleEliminarPartida}
          />
        </div>
      ),
    },
    {
      key: "reportes",
      label: "Reportes",
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => setReporteModalOpen(true)}
            >
              Nuevo Reporte
            </Button>
          </div>

          {/* Reportes sin valuación - agrupados por fecha */}
          {(() => {
            const reportesPendientes = obra.reportes.filter((r) => !r.valuacionId);
            if (reportesPendientes.length === 0) return null;

            const agrupados = new Map<string, typeof reportesPendientes>();
            for (const r of reportesPendientes) {
              const fecha = dayjs(r.fecha).format("YYYY-MM-DD");
              if (!agrupados.has(fecha)) agrupados.set(fecha, []);
              agrupados.get(fecha)!.push(r);
            }

            const fechasOrdenadas = Array.from(agrupados.entries())
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

            return (
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-gray-800">Reportes Pendientes de Valuación</h4>
                <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                  {fechasOrdenadas.map(([fecha, reportes]) => {
                    const fechaKey = fecha;
                    return (
                      <div key={fechaKey} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        {/* Header de Fecha */}
                        <div
                          style={{
                            background: "#6b7280",
                            color: "#fff",
                            padding: "8px 12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                          onClick={() => {}}
                        >
                          <span>{dayjs(fecha).format("DD MMM YYYY")}</span>
                          <span style={{ fontSize: 11, fontWeight: 400, marginLeft: "auto" }}>
                            {reportes.length} reporte{reportes.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Tabla de Reportes Pendientes */}
                        <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse", fontSize: 12, background: "#f9fafb" }}>
                          <thead>
                            <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                              <th style={{ border: "1px solid #e5e7eb", padding: "5px 6px", textAlign: "center", fontWeight: 700, fontSize: 10, width: 30 }}>▼</th>
                              {["#", "Código", "Descripción", "Avance", "Personal", "Costo MO", "Costo Mat.", "Total"].map((h, i) => (
                                <th key={i} style={{ border: "1px solid #e5e7eb", padding: "5px 6px", textAlign: i > 1 ? "right" : "left", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reportes.map((r, idx) => {
                              const isExpanded = expandedReportesPendientes.has(r.id);
                              const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";
                              const cell = (content: React.ReactNode, align = "right", bold = false) => (
                                <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: align as any, background: rowBg, whiteSpace: "nowrap", fontWeight: bold ? 600 : 400 }}>{content}</td>
                              );
                              return (
                                <Fragment key={r.id}>
                                  <tr style={{ cursor: "pointer" }} onClick={() => {
                                    const newSet = new Set(expandedReportesPendientes);
                                    if (isExpanded) {
                                      newSet.delete(r.id);
                                    } else {
                                      newSet.add(r.id);
                                    }
                                    setExpandedReportesPendientes(newSet);
                                  }}>
                                    <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, fontSize: 10, color: "#6b7280" }}>{isExpanded ? "▼" : "▶"}</td>
                                    <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, fontWeight: 700 }}>{idx + 1}</td>
                                    {cell(r.partidaCodigo, "center")}
                                    {cell(r.partidaDescripcion, "left")}
                                    {cell(<span style={{ fontWeight: 600, color: "#7c3aed" }}>{r.avanceLogrado}%</span>)}
                                    {cell(<span style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6" }}>{r.personal?.length || 0}P</span>)}
                                    {cell(<strong style={{ color: "#2563eb" }}>${r.costoManoObra.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                                    {cell(<strong style={{ color: "#06b6d4" }}>${r.costoMateriales.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                                    {cell(<strong style={{ color: "#374151" }}>${r.costoTotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>, "right", true)}
                                  </tr>
                                  {isExpanded && (
                                    <tr style={{ background: "#f3f4f6" }}>
                                      <td colSpan={9} style={{ padding: "8px", borderBottom: "1px solid #fed7aa" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                          {(r.personal?.length || 0) > 0 && (
                                            <div>
                                              <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#374151" }}>PERSONAL ({r.personal?.length})</p>
                                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                                <thead>
                                                  <tr style={{ background: "#e3f2fd" }}>
                                                    <th style={{ border: "1px solid #90caf9", padding: 4, textAlign: "left", fontSize: 10 }}>Trabajador</th>
                                                    <th style={{ border: "1px solid #90caf9", padding: 4, textAlign: "center", fontSize: 10 }}>Horas</th>
                                                    <th style={{ border: "1px solid #90caf9", padding: 4, textAlign: "right", fontSize: 10 }}>Subtotal</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {r.personal?.map((p, i) => (
                                                    <tr key={i}>
                                                      <td style={{ border: "1px solid #e3f2fd", padding: 4, fontSize: 11 }}>{p.personalNombre}</td>
                                                      <td style={{ border: "1px solid #e3f2fd", padding: 4, textAlign: "center", fontSize: 11 }}>{p.horasTrabajadas.toFixed(1)}h</td>
                                                      <td style={{ border: "1px solid #e3f2fd", padding: 4, textAlign: "right", fontSize: 11, fontWeight: 600 }}>${p.subtotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                          {(r.materiales?.length || 0) > 0 && (
                                            <div>
                                              <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#374151" }}>MATERIALES ({r.materiales?.length})</p>
                                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                                <thead>
                                                  <tr style={{ background: "#cffafe" }}>
                                                    <th style={{ border: "1px solid #67e8f9", padding: 4, textAlign: "left", fontSize: 10 }}>Material</th>
                                                    <th style={{ border: "1px solid #67e8f9", padding: 4, textAlign: "center", fontSize: 10 }}>Cantidad</th>
                                                    <th style={{ border: "1px solid #67e8f9", padding: 4, textAlign: "right", fontSize: 10 }}>Subtotal</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {r.materiales?.map((m, i) => (
                                                    <tr key={i}>
                                                      <td style={{ border: "1px solid #cffafe", padding: 4, fontSize: 11 }}>{m.materialNombre}</td>
                                                      <td style={{ border: "1px solid #cffafe", padding: 4, textAlign: "center", fontSize: 11 }}>{m.cantidad.toFixed(2)} {m.unidad}</td>
                                                      <td style={{ border: "1px solid #cffafe", padding: 4, textAlign: "right", fontSize: 11, fontWeight: 600 }}>${m.subtotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <h4 className="font-semibold text-gray-800 mb-3">Reportes</h4>
          <div className="flex items-center gap-4 mb-4">
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              allowClear
              placeholder={["Desde", "Hasta"]}
              value={[
                fechaInicio ? dayjs(fechaInicio) : null,
                fechaFin ? dayjs(fechaFin) : null,
              ]}
              onChange={(fechas) => {
                setFechaInicio(fechas?.[0]?.toISOString() || null);
                setFechaFin(fechas?.[1]?.toISOString() || null);
              }}
            />
          </div>

          <ReportesTable
            reportes={reportesFiltrados}
          />
        </div>
      ),
    },
    {
      key: "personal",
      label: "Personal",
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => {
                setPersonalEditable(null);
                setPersonalModalOpen(true);
              }}
            >
              Agregar Personal
            </Button>
          </div>
          <PersonalTable
            personal={personal}
            onEditar={(p) => {
              setPersonalEditable(p);
              setPersonalModalOpen(true);
            }}
          />
        </div>
      ),
    },
    {
      key: "valuaciones",
      label: "Valuaciones",
      children: (
        <ValuacionesTab
          reportesPendientes={obra.reportes.filter((r) => !r.valuacionId)}
          partidas={obra.partidas}
          valuaciones={valuaciones}
          obraNombre={obra.nombre}
          onConcretar={handleConcretarValuacion}
          onVerReporte={(r) => {
            setReporteSeleccionado(r);
            setReporteDetalleOpen(true);
          }}
        />
      ),
    },
    {
      key: "analitica",
      label: "Analítica",
      children: valuacion ? (
        <AnaliticaTab
          obra={obra}
          valuacion={valuacion}
          valuaciones={valuaciones}
          materiales={materiales}
        />
      ) : null,
    },
    {
      key: "inventario",
      label: "Inventario",
      children: (
        <InventarioTab
          reportes={obra.reportes}
          materiales={materiales}
          facturas={facturas}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/obras">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
              <ChevronLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{obra.nombre}</h1>
            <p className="text-sm text-gray-600 mt-1">{obra.proyectoNombre} · Estado: {obra.estado}</p>
          </div>
        </div>
      </div>

      {/* Controles rápidos */}
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Estado:</span>
          <EstadoSegmented value={obra.estado} onChange={handleEstadoChange} />
        </div>
      </div>

      {/* Stat strip */}
      <div className="px-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Presupuesto Total
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${obra.presupuestoTotal.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Costo Real
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${obra.presupuestoConsumido.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            % Ejecución
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {valuacion
              ? Math.round(valuacion.porcentajeEjecucion)
              : 0}
            %
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Total Reportes
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {obra.reportes.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Modales */}
      <PartidaModal
        open={partidaModalOpen}
        obraId={obraId}
        partida={null}
        onClose={() => setPartidaModalOpen(false)}
        onSubmit={handleAgregarPartida}
      />

      <PersonalModal
        open={personalModalOpen}
        personal={personalEditable}
        onClose={() => {
          setPersonalModalOpen(false);
          setPersonalEditable(null);
        }}
        onSubmit={handleAgregarPersonal}
      />

      <Modal
        title="Nuevo Reporte Diario"
        open={reporteModalOpen}
        onCancel={() => setReporteModalOpen(false)}
        width="90vw"
        style={{ maxWidth: "1400px" }}
        footer={null}
      >
        {obra && (
          <ReporteFormSection
            obra={obra}
            personal={personal}
            materiales={materiales}
            onSubmit={async (values) => {
              await handleGuardarReporte(values);
              setReporteModalOpen(false);
            }}
          />
        )}
      </Modal>




    </div>
  );
}
