"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Spin, Empty, Button, Modal, DatePicker, Image as AntImage } from "antd";
import dayjs from "dayjs";
import { Plus, FileUp } from "lucide-react";
import { useParams } from "next/navigation";
import ObraHeroBanner from "@/components/obras/ObraHeroBanner";
import {
  getObra,
  getPartidas,
  getReportes,
  updateEstadoObra,
  getPersonal,
  getMaterialesDisponibles,
  getValuaciones,
  createPartida,
  updatePartida,
  deletePartida,
  createReporte,
  deleteReporte,
  createPersonal,
  updatePersonal,
  createValuacion,
  updateObra,
  desvincularProyectoDeObra,
  actualizarGerentesObra,
} from "@/services/obras";
import { getGerentes } from "@/services/usuarios";
import UserSelector from "@/components/proyectos/UserSelector";
import VincularProyectoModal from "@/components/obras/VincularProyectoModal";
import { getHerramientas } from "@/services/inventario";
import { calcularValuacion } from "@/lib/obras";
import { getFacturasByObra, updateEstadoFactura, createFactura } from "@/services/inventario";
import type { EstadoFactura, FacturaCompra, FacturaFormValues } from "@/types/inventario";
import FacturaModal from "@/components/inventario/FacturaModal";
import {
  PartidasTable,
  ReportesTable,
  PersonalTable,
  ValuacionResumen,
  PartidaModal,
  PersonalModal,
  ReporteFormSection,
  ValuacionesTab,
  AnaliticaTab,
  InventarioTab,
  ImportarPartidasModal,
} from "@/components/obras";
import type {
  Obra,
  EstadoObra,
  Personal,
  Partida,
  ReporteDiario,
  MaterialDisponible,
  ValuacionFinal,
  PartidaFormValues,
  PersonalFormValues,
  ReporteFormValues,
} from "@/types/obras";
import type { Herramienta } from "@/types/inventario";
import toast from "react-hot-toast";

export default function ObraDetallePage() {
  const params = useParams();
  const obraId = Number(params.id);

  const [obra, setObra] = useState<Obra | null>(null);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [materiales, setMateriales] = useState<MaterialDisponible[]>([]);
  const [materialesDisponibles, setMaterialesDisponibles] = useState<MaterialDisponible[]>([]);
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [valuacion, setValuacion] = useState<ValuacionFinal | null>(null);
  const [valuaciones, setValuaciones] = useState<import("@/types/obras").ValuacionDoc[]>([]);
  const [facturas, setFacturas] = useState<FacturaCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [facturaModalOpen, setFacturaModalOpen] = useState(false);

  // Estados para modales de edición
  const [partidaModalOpen, setPartidaModalOpen] = useState(false);
  const [importarModalOpen, setImportarModalOpen] = useState(false);
  const [editingPartida, setEditingPartida] = useState<Partida | null>(null);
  const [partidaExtraDefaults, setPartidaExtraDefaults] = useState<import("@/types/obras").PartidaFormValues | null>(null);
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [reporteModalOpen, setReporteModalOpen] = useState(false);
  const [personalEditable, setPersonalEditable] = useState<Personal | null>(null);
  const [activeTab, setActiveTab] = useState("partidas");

  // Filtro de fechas para reportes
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  // Expandibles para reportes pendientes
  const [expandedReportesPendientes, setExpandedReportesPendientes] = useState<Set<number>>(new Set());

  // Estado para ver detalle de reporte
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteDiario | null>(null);
  const [reporteDetalleOpen, setReporteDetalleOpen] = useState(false);

  const [vincularProyectoModalOpen, setVincularProyectoModalOpen] = useState(false);
  const [gerentesDisponibles, setGerentesDisponibles] = useState<{ id: number; username: string; email: string; name?: string }[]>([]);


  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [o, p, m, h, vals, f2] = await Promise.all([
        getObra(obraId),
        getPersonal(obraId),
        getMaterialesDisponibles(),
        getHerramientas(),
        getValuaciones(obraId),
        getFacturasByObra(obraId),
      ]);

      const [partidasResult, reportesResult] = await Promise.allSettled([
        getPartidas(obraId),
        getReportes(obraId),
      ]);

      const partidas = partidasResult.status === "fulfilled" ? partidasResult.value : [];
      const reportes = reportesResult.status === "fulfilled" ? reportesResult.value : [];

      const compradoPorMaterial = new Map<number, number>();
      f2.filter(f => !f.inhabilitada && f.estado !== "ANULADA").forEach(factura =>
        (factura.items || []).forEach(item => {
          compradoPorMaterial.set(item.materialId, (compradoPorMaterial.get(item.materialId) || 0) + item.cantidad);
        })
      );
      const consumidoPorMaterial = new Map<number, number>();
      reportes.forEach(reporte =>
        (reporte.materiales || []).forEach((mat: any) => {
          consumidoPorMaterial.set(mat.materialId, (consumidoPorMaterial.get(mat.materialId) || 0) + mat.cantidad);
        })
      );
      const materialesObra = m
        .filter(mat => compradoPorMaterial.has(mat.materialId))
        .map(mat => ({ ...mat, stockActual: Math.max(0, (compradoPorMaterial.get(mat.materialId) || 0) - (consumidoPorMaterial.get(mat.materialId) || 0)) }));

      const consumidoHerramientas = new Map<number, number>();
      reportes.forEach(reporte => {
        (reporte.herramientas || []).forEach((h: any) => {
          if (h.herramientaId) consumidoHerramientas.set(h.herramientaId, (consumidoHerramientas.get(h.herramientaId) || 0) + (h.cantidad || 1));
        });
      });
      const herramientasObra = h.map(herr => ({ ...herr, cantidad: Math.max(0, (herr.cantidad || 0) - (consumidoHerramientas.get(herr.id) || 0)) }));

      const obraConDatos = { ...o, partidas, reportes };
      setObra(obraConDatos);
      setPersonal(p);
      setMateriales(materialesObra);
      setMaterialesDisponibles(m);
      setHerramientas(herramientasObra);
      setValuacion(calcularValuacion(obraConDatos));
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
    setObra(null);
    setValuacion(null);
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    getGerentes()
      .then((g) => setGerentesDisponibles(Array.isArray(g) ? g : []))
      .catch((error) => console.error("Error cargando gerentes:", error));
  }, []);

  // Handlers
  const handleEstadoChange = async (newEstado: EstadoObra) => {
    if (!obra?.documentId) return;
    const estadoAnterior = obra.estado;
    setObra((prev) => prev ? { ...prev, estado: newEstado } : prev);
    try {
      await updateEstadoObra(obra.documentId, newEstado);
      toast.success("Estado actualizado");
    } catch (error) {
      setObra((prev) => prev ? { ...prev, estado: estadoAnterior } : prev);
      console.error("Error actualizando estado:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handlePresupuestoChange = async (monto: number) => {
    if (!obra?.documentId) return;
    setObra((prev) => prev ? { ...prev, presupuestoTotal: monto } : prev);
    try {
      await updateObra(obra.documentId, { presupuestoTotal: monto });
      toast.success("Presupuesto actualizado");
    } catch (error) {
      await cargarDatos();
      toast.error("Error al actualizar el presupuesto");
    }
  };

  const handleDesvincularProyecto = async () => {
    if (!obra?.documentId) return;
    if (!confirm("¿Desvincular el proyecto de esta obra?")) return;
    try {
      await desvincularProyectoDeObra(obra.documentId);
      toast.success("Proyecto desvinculado");
      await cargarDatos();
    } catch (error) {
      console.error("Error desvinculando proyecto:", error);
      toast.error("Error al desvincular el proyecto");
    }
  };

  const handleActualizarGerentes = async (gerenteIds: number[]) => {
    if (!obra?.documentId) return;
    try {
      await actualizarGerentesObra(obra.documentId, gerenteIds);
      toast.success("Gerentes actualizados");
      await cargarDatos();
    } catch (error) {
      console.error("Error actualizando gerentes:", error);
      toast.error("Error al actualizar los gerentes");
    }
  };

  const handleAgregarPartida = async (values: PartidaFormValues) => {
    try {
      if (editingPartida) {
        await updatePartida(obraId, editingPartida.id, values);
        toast.success("Partida actualizada");
      } else {
        await createPartida(obraId, values);
        toast.success("Partida agregada");
      }
      setPartidaModalOpen(false);
      setEditingPartida(null);
      setPartidaExtraDefaults(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando partida:", error);
      toast.error("Error al guardar la partida");
    }
  };

  const handleCrearExtra = (partida: Partida) => {
    setEditingPartida(null);
    setPartidaExtraDefaults({
      codigo: partida.codigo + "-E",
      descripcion: "Extra: " + partida.descripcion,
      unidad: partida.unidad,
      cantidadPresupuestada: 0,
      precioUnitario: partida.precioUnitario,
      esExtra: true,
      partidaOriginalId: partida.id,
    });
    setPartidaModalOpen(true);
  };

  const handleEliminarPartida = async (partidaId: number) => {
    try {
      await deletePartida(obraId, partidaId);
      await cargarDatos();
      toast.success("Partida eliminada");
    } catch (error) {
      console.error("Error eliminando partida:", error);
      toast.error("Error al eliminar la partida");
    }
  };

  const handleEliminarReporte = async (reporteId: number) => {
    Modal.confirm({
      title: "Eliminar Reporte",
      content: "¿Está seguro de que desea eliminar este reporte?",
      okText: "Eliminar",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteReporte(obraId, reporteId);
          await cargarDatos();
          toast.success("Reporte eliminado");
        } catch (error) {
          console.error("Error eliminando reporte:", error);
          toast.error("Error al eliminar el reporte");
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
      if (personalEditable) {
        await updatePersonal(obraId, personalEditable.id, values);
        toast.success("Personal actualizado");
      } else {
        await createPersonal(obraId, values);
        toast.success("Personal agregado");
      }
      setPersonalModalOpen(false);
      setPersonalEditable(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error guardando personal:", error);
      toast.error("Error al guardar el personal");
    }
  };

  const handleConcretarValuacion = async () => {
    if (!obra) return;
    try {
      await createValuacion(obraId, obra, valuaciones, {});
      await cargarDatos();
      toast.success("Valuación concretada");
    } catch (error: any) {
      console.error("Error concretando valuación:", error);
      toast.error(error.message || "Error al concretar la valuación");
    }
  };

  const handleCrearFacturaEnObra = async (values: FacturaFormValues) => {
    try {
      await createFactura(values);
      toast.success("Factura creada");
      setFacturaModalOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error("Error creando factura:", error);
      toast.error("Error al crear la factura");
    }
  };

  const handleCambiarEstadoFactura = async (facturaId: number, estado: EstadoFactura) => {
    const estadoAnterior = facturas.find((f) => f.id === facturaId)?.estado;
    setFacturas((prev) => prev.map((f) => f.id === facturaId ? { ...f, estado } : f));
    try {
      await updateEstadoFactura(facturaId, estado);
    } catch (error) {
      setFacturas((prev) => prev.map((f) => f.id === facturaId && estadoAnterior ? { ...f, estado: estadoAnterior } : f));
      console.error("Error cambiando estado de factura:", error);
      toast.error("Error al cambiar el estado de la factura");
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
        <Empty description="La obra solicitada no existe" />
      </div>
    );
  }

  // Solo reportes ya concretados en una valuación
  const reportesFiltrados = obra.reportes.filter((reporte) => {
    if (!reporte.valuacionId) return false;
    const fechaReporte = new Date(reporte.fecha).getTime();
    if (fechaInicio) {
      const inicio = new Date(fechaInicio).getTime();
      if (fechaReporte < inicio) return false;
    }
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setDate(fin.getDate() + 1);
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
          <div className="flex gap-2 justify-end">
            <Button
              icon={<FileUp size={18} />}
              onClick={() => setImportarModalOpen(true)}
            >
              Importar Excel
            </Button>
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
            onEditar={(partida) => {
              setEditingPartida(partida);
              setPartidaExtraDefaults(null);
              setPartidaModalOpen(true);
            }}
            onEliminar={handleEliminarPartida}
            onCrearExtra={handleCrearExtra}
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
                              {["#", "Código", "Descripción", "Avance", "Costo Presupuestado", "Personal", "Costo MO", "Costo Mat.", "TOTAL"].map((h, i) => (
                                <th key={i} style={{ border: "1px solid #e5e7eb", padding: "5px 6px", textAlign: i > 1 ? "right" : "left", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reportes.map((r, idx) => {
                              const isExpanded = expandedReportesPendientes.has(r.id);
                              const hasDetail = (r.imagenes?.length || 0) + (r.personal?.length || 0) + (r.materiales?.length || 0) > 0;
                              const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";
                              const cell = (content: React.ReactNode, align = "right", bold = false) => (
                                <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: align as any, background: rowBg, whiteSpace: "nowrap", fontWeight: bold ? 600 : 400 }}>{content}</td>
                              );

                              const partida = obra?.partidas?.find((p) => p.id === r.partidaId);
                              const costoPresupuestadoPartida = partida ? partida.cantidadPresupuestada * partida.precioUnitario : 0;
                              const costoSegunAvance = (costoPresupuestadoPartida * r.avanceLogrado) / 100;

                              const toggleRow = () => {
                                if (!hasDetail) return;
                                const newSet = new Set(expandedReportesPendientes);
                                if (isExpanded) newSet.delete(r.id); else newSet.add(r.id);
                                setExpandedReportesPendientes(newSet);
                              };

                              return (
                                <React.Fragment key={r.id}>
                                  <tr style={{ cursor: hasDetail ? "pointer" : "default" }} onClick={toggleRow}>
                                    <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, width: 28 }}>
                                      {hasDetail && (
                                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 3, background: isExpanded ? "#1e293b" : "#f1f5f9", border: "1px solid #cbd5e1", fontSize: 8, color: isExpanded ? "#f8fafc" : "#64748b", transition: "all .15s" }}>
                                          {isExpanded ? "▼" : "▶"}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, fontWeight: 700 }}>{idx + 1}</td>
                                    {cell(r.partidaCodigo, "center")}
                                    {cell(r.partidaDescripcion, "left")}
                                    {cell(<span style={{ fontWeight: 600, color: "#7c3aed" }}>{r.avanceLogrado}%</span>)}
                                    {cell(<strong style={{ color: "#059669" }}>${costoSegunAvance.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                                    {cell(<span style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6" }}>{r.personal?.length || 0}P</span>)}
                                    {cell(<strong style={{ color: "#2563eb" }}>${r.costoManoObra.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                                    {cell(<strong style={{ color: "#06b6d4" }}>${r.costoMateriales.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                                    {cell(<strong style={{ color: "#374151", fontWeight: 700 }}>${(r.costoManoObra + r.costoMateriales + costoSegunAvance).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>, "right", true)}
                                  </tr>
                                  {hasDetail && isExpanded && (
                                    <tr>
                                      <td colSpan={10} style={{ padding: 0, background: "#f8fafc", borderLeft: "3px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
                                        {r.observaciones && (
                                          <div style={{ padding: "6px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginRight: 6 }}>OBS:</span>
                                            <span style={{ fontSize: 11, color: "#374151" }}>{r.observaciones}</span>
                                          </div>
                                        )}
                                        {(r.imagenes?.length || 0) > 0 && (
                                          <div style={{ padding: "10px 16px", borderBottom: ((r.personal?.length || 0) + (r.materiales?.length || 0)) > 0 ? "1px solid #e5e7eb" : "none", background: "#fff" }}>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: "#92400e", letterSpacing: "0.1em", marginBottom: 8 }}>FOTOS DEL AVANCE · {r.imagenes?.length}</p>
                                            <AntImage.PreviewGroup>
                                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {r.imagenes?.map((img: any, i: number) => (
                                                  <AntImage key={i} src={img.url} alt={img.name || `Foto ${i + 1}`} width={96} height={72}
                                                    style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb", display: "block" }}
                                                    preview={{ src: img.url }} />
                                                ))}
                                              </div>
                                            </AntImage.PreviewGroup>
                                          </div>
                                        )}
                                        {((r.personal?.length || 0) > 0 || (r.materiales?.length || 0) > 0) && (
                                          <div style={{ display: "grid", gridTemplateColumns: (r.personal?.length || 0) > 0 && (r.materiales?.length || 0) > 0 ? "1fr 1fr" : "1fr", gap: 0 }}>
                                            {(r.personal?.length || 0) > 0 && (
                                              <div style={{ padding: "10px 16px", borderRight: (r.materiales?.length || 0) > 0 ? "1px solid #e5e7eb" : "none" }}>
                                                <p style={{ fontSize: 9, fontWeight: 700, color: "#1e40af", letterSpacing: "0.1em", marginBottom: 8 }}>PERSONAL · {r.personal?.length}</p>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                  <thead><tr>
                                                    {["TRABAJADOR","HRS","SUBTOTAL"].map((h, i) => (
                                                      <th key={i} style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textAlign: i===0?"left":i===1?"center":"right", padding: "2px 4px 6px", borderBottom: "1px solid #e5e7eb", letterSpacing: "0.07em" }}>{h}</th>
                                                    ))}
                                                  </tr></thead>
                                                  <tbody>
                                                    {r.personal?.map((p, i) => (
                                                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <td style={{ fontSize: 11, color: "#374151", padding: "5px 4px" }}>{p.personalNombre}</td>
                                                        <td style={{ fontSize: 11, color: "#6b7280", padding: "5px 4px", textAlign: "center" }}>{p.horasTrabajadas.toFixed(1)}h</td>
                                                        <td style={{ fontSize: 11, color: "#374151", padding: "5px 4px", textAlign: "right", fontWeight: 600 }}>${p.subtotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                            {(r.materiales?.length || 0) > 0 && (
                                              <div style={{ padding: "10px 16px" }}>
                                                <p style={{ fontSize: 9, fontWeight: 700, color: "#065f46", letterSpacing: "0.1em", marginBottom: 8 }}>MATERIALES · {r.materiales?.length}</p>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                  <thead><tr>
                                                    {["MATERIAL","CANT.","SUBTOTAL"].map((h, i) => (
                                                      <th key={i} style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textAlign: i===0?"left":i===1?"center":"right", padding: "2px 4px 6px", borderBottom: "1px solid #e5e7eb", letterSpacing: "0.07em" }}>{h}</th>
                                                    ))}
                                                  </tr></thead>
                                                  <tbody>
                                                    {r.materiales?.map((m, i) => (
                                                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <td style={{ fontSize: 11, color: "#374151", padding: "5px 4px" }}>{m.materialNombre}</td>
                                                        <td style={{ fontSize: 11, color: "#6b7280", padding: "5px 4px", textAlign: "center" }}>{m.cantidad.toFixed(2)} {m.unidad}</td>
                                                        <td style={{ fontSize: 11, color: "#374151", padding: "5px 4px", textAlign: "right", fontWeight: 600 }}>${m.subtotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
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

          <h4 className="font-semibold text-gray-800 mb-3">Reportes Valuados</h4>
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
            obra={obra}
            onEliminar={handleEliminarReporte}
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
          onCambiarEstado={handleCambiarEstadoFactura}
          onAgregarFactura={() => setFacturaModalOpen(true)}
        />
      ),
    },
  ];

  return (
    <div>
      <ObraHeroBanner
        obra={obra}
        valuacion={valuacion}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEstadoChange={handleEstadoChange}
        onPresupuestoChange={handlePresupuestoChange}
        onVincularProyecto={() => setVincularProyectoModalOpen(true)}
        onDesvincularProyecto={handleDesvincularProyecto}
      />

      <div className="px-6 pt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 max-w-3xl">
          <UserSelector
            label="Gerentes con acceso a esta obra"
            availableUsers={gerentesDisponibles}
            selectedUsers={obra.gerentes ?? []}
            onSelectionChange={handleActualizarGerentes}
          />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 pt-6">
        {activeTab === "partidas" && tabItems.find(t => t.key === "partidas")?.children}
        {activeTab === "reportes" && tabItems.find(t => t.key === "reportes")?.children}
        {activeTab === "personal" && tabItems.find(t => t.key === "personal")?.children}
        {activeTab === "valuaciones" && tabItems.find(t => t.key === "valuaciones")?.children}
        {activeTab === "analitica" && tabItems.find(t => t.key === "analitica")?.children}
        {activeTab === "inventario" && tabItems.find(t => t.key === "inventario")?.children}
      </div>

      {/* Modales */}
      <PartidaModal
        open={partidaModalOpen}
        obraId={obraId}
        partida={editingPartida}
        defaultValues={partidaExtraDefaults ?? undefined}
        onClose={() => {
          setPartidaModalOpen(false);
          setEditingPartida(null);
          setPartidaExtraDefaults(null);
        }}
        onSubmit={handleAgregarPartida}
      />

      <ImportarPartidasModal
        open={importarModalOpen}
        obraId={obraId}
        onClose={() => setImportarModalOpen(false)}
        onImported={cargarDatos}
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
            key={obra.id}
            obra={obra}
            personal={personal}
            materiales={materiales}
            herramientas={herramientas}
            onSubmit={async (values) => {
              await handleGuardarReporte(values);
              setReporteModalOpen(false);
            }}
          />
        )}
      </Modal>

      {obra && (
        <FacturaModal
          open={facturaModalOpen}
          onClose={() => setFacturaModalOpen(false)}
          onSubmit={handleCrearFacturaEnObra}
          materiales={materialesDisponibles.map((material) => ({
            id: material.materialId,
            nombre: material.materialNombre,
            categoria: "",
            unidad: material.unidad,
            stockActual: material.stockActual,
            precioPromedio: material.precioPromedio,
          }))}
          obras={[{
            id: obraId,
            nombre: obra.nombre,
            proyectoId: obra.proyectoId,
            proyectoNombre: obra.proyectoNombre,
          }]}
        />
      )}

      {obra?.documentId && (
        <VincularProyectoModal
          open={vincularProyectoModalOpen}
          obraDocumentId={obra.documentId}
          onClose={() => setVincularProyectoModalOpen(false)}
          onVinculado={cargarDatos}
        />
      )}

    </div>
  );
}
