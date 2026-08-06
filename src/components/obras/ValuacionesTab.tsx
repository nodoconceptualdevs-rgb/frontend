"use client";

import React from "react";
import { Table, Button, Empty, Tag, Tooltip, Image as AntImage } from "antd";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import dayjs from "dayjs";
import type { ValuacionDoc, ReporteDiario, Partida } from "@/types/obras";

interface Props {
  reportesPendientes: ReporteDiario[];
  partidas: Partida[];
  valuaciones: ValuacionDoc[];
  obraNombre?: string;
  onConcretar?: () => Promise<void>;
  onVerReporte: (reporte: ReporteDiario) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ValuacionesTab({
  reportesPendientes,
  partidas,
  valuaciones,
  onConcretar,
  onVerReporte,
}: Props) {
  const [concretando, setConcretando] = React.useState(false);
  const [expandedReportes, setExpandedReportes] = React.useState<Set<number>>(new Set());

  // Resumen del ciclo actual agrupado por partida
  const resumenCiclo = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const r of reportesPendientes) {
      const p = partidas.find((p) => p.id === r.partidaId);
      if (!p) continue;
      // Use montoAplicado if available, otherwise derive from %
      const montoEjecReporte = r.montoAplicado > 0
        ? r.montoAplicado
        : (r.avanceLogrado / 100) * p.cantidadPresupuestada * p.precioUnitario;
      const cant = p.precioUnitario > 0 ? montoEjecReporte / p.precioUnitario : (r.avanceLogrado / 100) * p.cantidadPresupuestada;
      map.set(r.partidaId, (map.get(r.partidaId) || 0) + cant);
    }
    return partidas
      .filter((p) => (map.get(p.id) || 0) > 0)
      .map((p) => {
        const cantEjec = map.get(p.id) || 0;
        const montoEjec = cantEjec * p.precioUnitario;
        const diff = p.esExtra ? 0 : cantEjec - p.cantidadPresupuestada;
        return {
          partidaId: p.id,
          codigo: p.codigo,
          descripcion: p.descripcion,
          unidad: p.unidad,
          esExtra: p.esExtra,
          cantPres: p.esExtra ? 0 : p.cantidadPresupuestada,
          cantEjec,
          montoEjec,
          diff,
        };
      });
  }, [reportesPendientes, partidas]);

  const totalCiclo = resumenCiclo.reduce((s, r) => s + r.montoEjec, 0);

  const handleConcretar = async () => {
    if (!onConcretar) return;
    try {
      setConcretando(true);
      await onConcretar();
    } finally {
      setConcretando(false);
    }
  };

  // Detalle expandible de valuación concretada
  const expandedRowRender = (valuacion: ValuacionDoc) => {
    const lineas = valuacion.lineas.filter((l) => l.montoEjecutado > 0);
    return (
      <div style={{ overflowX: "auto", padding: "8px 0" }}>
        <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th colSpan={7} style={{ background: "#1e3a5f", color: "#fff", padding: "5px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, border: "1px solid #bbb" }}>PRESUPUESTO</th>
              <th colSpan={2} style={{ background: "#b8cce4", color: "#1e3a5f", padding: "5px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, border: "1px solid #bbb" }}>OBRA EJECUTADA</th>
              <th colSpan={2} style={{ background: "#dce6f1", color: "#1e3a5f", padding: "5px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, border: "1px solid #bbb" }}>AUMENTO</th>
              <th colSpan={2} style={{ background: "#fce4d6", color: "#833c00", padding: "5px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, border: "1px solid #bbb" }}>DISMINUCIÓN</th>
              <th colSpan={2} style={{ background: "#e2efda", color: "#375623", padding: "5px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, border: "1px solid #bbb" }}>EXTRAS</th>
            </tr>
            <tr style={{ background: "#f2f2f2" }}>
              {["#", "Código", "Descripción", "Ud.", "Cant.", "P.U.", "Total $", "Cant.", "Total", "Cant.", "Total", "Cant.", "Total", "Cant.", "Total"].map((h, i) => (
                <th key={i} style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: i >= 4 ? "right" : i === 2 ? "left" : "center", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, idx) => {
              const hasA = (l.montoAumento ?? 0) > 0;
              const hasD = (l.montoDisminucion ?? 0) > 0;
              const rowBg = l.esExtra ? "#e2efda" : hasA ? "#dce6f1" : hasD ? "#fce4d6" : idx % 2 === 0 ? "#fff" : "#fafafa";
              const cell = (content: React.ReactNode, bg?: string, color?: string) => (
                <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: "right", background: bg || rowBg, color: color || "#333", whiteSpace: "nowrap" }}>{content}</td>
              );
              return (
                <tr key={idx}>
                  <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: "center", background: rowBg }}>{idx + 1}</td>
                  <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: "center", background: rowBg, fontFamily: "monospace", fontWeight: 600 }}>{l.codigo}</td>
                  <td style={{ border: "1px solid #ddd", padding: "5px 8px", background: rowBg, maxWidth: 220, fontSize: 11, lineHeight: 1.4 }}>{l.descripcion}</td>
                  <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: "center", background: rowBg }}>{l.unidad}</td>
                  {cell(l.esExtra ? "—" : fmt(l.cantidadPresupuestada))}
                  {cell(fmt(l.precioUnitario))}
                  {cell(<strong>{fmt(l.montoPresupuestado)}</strong>)}
                  {cell(fmt(l.cantidadEjecutada), "#dce6f1")}
                  {cell(<strong>{fmt(l.montoEjecutado)}</strong>, "#dce6f1", "#1e3a5f")}
                  {cell(hasA ? fmt(l.aumento!) : "—", hasA ? "#c6d9f1" : "#f5f5f5", hasA ? "#1e3a5f" : "#aaa")}
                  {cell(hasA ? <strong>{fmt(l.montoAumento!)}</strong> : "—", hasA ? "#c6d9f1" : "#f5f5f5", hasA ? "#1e3a5f" : "#aaa")}
                  {cell(hasD ? fmt(l.disminucion!) : "—", hasD ? "#fcd5c0" : "#f5f5f5", hasD ? "#833c00" : "#aaa")}
                  {cell(hasD ? <strong>{fmt(l.montoDisminucion!)}</strong> : "—", hasD ? "#fcd5c0" : "#f5f5f5", hasD ? "#833c00" : "#aaa")}
                  {cell(l.esExtra ? fmt(l.cantidadEjecutada) : "—", l.esExtra ? "#c6e0b4" : "#f5f5f5", l.esExtra ? "#375623" : "#aaa")}
                  {cell(l.esExtra ? <strong>{fmt(l.montoEjecutado)}</strong> : "—", l.esExtra ? "#c6e0b4" : "#f5f5f5", l.esExtra ? "#375623" : "#aaa")}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12 }}>
              <td colSpan={6} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>TOTALES</td>
              <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>{fmt(valuacion.totalPresupuesto)}</td>
              <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#4472c4" }}>{fmt(valuacion.totalEjecutado)}</td>
              <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#4472c4" }}>{valuacion.totalAumentos > 0 ? fmt(valuacion.totalAumentos) : "—"}</td>
              <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#c55a11" }}>{valuacion.totalDisminuciones > 0 ? fmt(valuacion.totalDisminuciones) : "—"}</td>
              <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#538135" }}>{valuacion.totalExtras > 0 ? fmt(valuacion.totalExtras) : "—"}</td>
            </tr>
          </tfoot>
        </table>

        {/* Resumen rápido */}
        <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {[
            { label: "Presupuesto Base", value: valuacion.totalPresupuesto, bg: "#dce6f1", color: "#1e3a5f" },
            { label: "Presupuesto Modificado", value: valuacion.presupuestoModificado, bg: "#1e3a5f", color: "#fff" },
          ].map((item) => (
            <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: "10px 16px", minWidth: 180 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: "uppercase", margin: "0 0 2px" }}>{item.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: item.color, margin: 0 }}>${fmt(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const columnas = [
    {
      title: "#",
      dataIndex: "numero",
      key: "numero",
      width: 55,
      render: (num: number) => <span className="font-bold text-gray-800">V{num}</span>,
    },
    {
      title: "Fecha de cierre",
      dataIndex: "fecha",
      key: "fecha",
      width: 130,
      render: (f: string) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar size={13} className="text-gray-400" />
          {dayjs(f).format("DD/MM/YYYY")}
        </div>
      ),
    },
    {
      title: "Ejecutado",
      key: "ejecutado",
      width: 130,
      align: "right" as const,
      render: (_: any, r: ValuacionDoc) => (
        <span className="font-semibold text-gray-900">
          ${r.totalEjecutado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      title: "Variaciones",
      key: "variaciones",
      render: (_: any, r: ValuacionDoc) => (
        <div className="flex gap-1 flex-wrap">
          {r.totalAumentos > 0 && (
            <Tag color="blue" className="text-xs">
              +${r.totalAumentos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </Tag>
          )}
          {r.totalDisminuciones > 0 && (
            <Tag color="red" className="text-xs">
              -${r.totalDisminuciones.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </Tag>
          )}
          {r.totalExtras > 0 && (
            <Tag color="green" className="text-xs">
              OE ${r.totalExtras.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </Tag>
          )}
          {!r.totalAumentos && !r.totalDisminuciones && !r.totalExtras && (
            <span className="text-xs text-gray-400">Sin cambios</span>
          )}
        </div>
      ),
    },
    {
      title: "Presup. Modificado",
      key: "modificado",
      width: 160,
      align: "right" as const,
      render: (_: any, r: ValuacionDoc) => {
        const dif = r.presupuestoModificado - r.totalPresupuesto;
        return (
          <div>
            <p className="font-bold text-gray-900">
              ${r.presupuestoModificado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </p>
            {dif !== 0 && (
              <p className={`text-xs font-semibold ${dif > 0 ? "text-blue-600" : "text-green-600"}`}>
                {dif > 0 ? "+" : ""}{dif.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
        );
      },
    },
    {
      title: "Notas",
      dataIndex: "notas",
      key: "notas",
      render: (notas: string | undefined) =>
        notas ? (
          <Tooltip title={notas}>
            <span className="text-xs text-gray-500 truncate block max-w-[140px] cursor-help">{notas}</span>
          </Tooltip>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── CICLO ACTUAL ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Clock size={15} className="text-amber-500" />
            <span className="font-semibold text-gray-800">Ciclo Actual</span>
            {reportesPendientes.length > 0 && (
              <Tag color="orange" className="text-xs">
                {reportesPendientes.length} reporte{reportesPendientes.length !== 1 ? "s" : ""} pendiente{reportesPendientes.length !== 1 ? "s" : ""}
              </Tag>
            )}
          </div>
          {reportesPendientes.length > 0 && onConcretar && (
            <Button type="primary" loading={concretando} onClick={handleConcretar} icon={<CheckCircle2 size={15} />}>
              Concretar Valuación
            </Button>
          )}
        </div>

        {reportesPendientes.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400">
              No hay reportes pendientes. Crea reportes diarios para iniciar un nuevo ciclo.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Partidas del ciclo */}
            <div className="space-y-2">
              {resumenCiclo.map((item) => (
                <div
                  key={item.partidaId}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 rounded-lg border text-sm ${
                    item.esExtra ? "bg-green-50 border-green-200"
                    : item.diff > 0.001 ? "bg-blue-50 border-blue-200"
                    : item.diff < -0.001 ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="font-mono font-semibold text-gray-700 w-16 shrink-0">{item.codigo}</span>
                  <span className="text-gray-600 flex-1 truncate">{item.descripcion}</span>
                  {!item.esExtra && (
                    <span className="text-gray-400 text-xs shrink-0">
                      Presup: {item.cantPres.toFixed(1)} {item.unidad}
                    </span>
                  )}
                  <span className="text-gray-700 text-xs shrink-0">
                    Ejec: <span className="font-semibold">{item.cantEjec.toFixed(1)} {item.unidad}</span>
                  </span>
                  {!item.esExtra && item.diff !== 0 && (
                    <span className={`text-xs font-semibold shrink-0 ${item.diff > 0 ? "text-blue-700" : "text-red-700"}`}>
                      {item.diff > 0 ? "▲" : "▼"} {Math.abs(item.diff).toFixed(1)} {item.unidad}
                    </span>
                  )}
                  {item.esExtra && <Tag color="green" className="text-xs shrink-0">Extra</Tag>}
                  <span className="font-bold text-gray-900 w-28 text-right shrink-0">
                    ${item.montoEjec.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>

            {/* Reportes incluidos en este ciclo — tabla Excel expandible */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Reportes incluidos en este ciclo
              </p>
              {reportesPendientes.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                  <p className="text-xs text-gray-400">Sin reportes incluidos</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: "6px" }}>
                  <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ background: "#1e3a5f", color: "#fff", padding: "6px 8px", textAlign: "center", fontWeight: 700, border: "1px solid #bbb", fontSize: 11, width: 30 }}></th>
                        <th colSpan={5} style={{ background: "#1e3a5f", color: "#fff", padding: "6px 8px", textAlign: "center", fontWeight: 700, border: "1px solid #bbb", fontSize: 11 }}>PARTIDA</th>
                        <th colSpan={4} style={{ background: "#1e3a5f", color: "#fff", padding: "6px 8px", textAlign: "center", fontWeight: 700, border: "1px solid #bbb", fontSize: 11 }}>REPORTES INCLUIDOS</th>
                      </tr>
                      <tr style={{ background: "#f2f2f2" }}>
                        <th style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center", fontWeight: 700, fontSize: 10 }}>▼</th>
                        {["#", "Fecha", "Código", "Descripción", "Ud.", "Avance", "Personal", "Costo MO", "Costo Mat.", "Total"].map((h, i) => (
                          <th key={i} style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: i > 2 ? "right" : "left", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportesPendientes.map((r, idx) => {
                        const isExpanded = expandedReportes.has(r.id);
                        const rowBg = idx % 2 === 0 ? "#fff" : "#fafafa";
                        const cell = (content: React.ReactNode, align = "right", bold = false) => (
                          <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: align as any, background: rowBg, whiteSpace: "nowrap", fontWeight: bold ? 600 : 400 }}>{content}</td>
                        );
                        const toggleExpand = () => {
                          const newSet = new Set(expandedReportes);
                          if (isExpanded) {
                            newSet.delete(r.id);
                          } else {
                            newSet.add(r.id);
                          }
                          setExpandedReportes(newSet);
                        };
                        return (
                          <React.Fragment key={r.id}>
                            <tr style={{ cursor: "pointer" }} onClick={toggleExpand}>
                              <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: "center", background: rowBg, fontSize: 10, color: "#666" }}>{isExpanded ? "▼" : "▶"}</td>
                              <td style={{ border: "1px solid #ddd", padding: "5px 7px", textAlign: "center", background: rowBg, fontWeight: 700 }}>{idx + 1}</td>
                              {cell(dayjs(r.fecha).format("DD/MM/YYYY"), "center")}
                              {cell(r.partidaCodigo, "center")}
                              {cell(r.partidaDescripcion, "left")}
                              {cell(r.unidad || "—", "center")}
                              {cell(
                                <Tooltip title={`${r.avanceLogrado.toFixed(1)}% del presupuesto`}>
                                  <span style={{ fontWeight: 600, color: "#d97706" }}>
                                    {r.montoAplicado > 0
                                      ? `$${r.montoAplicado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`
                                      : `${r.avanceLogrado}%`}
                                  </span>
                                </Tooltip>
                              )}
                              {cell(<span style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6" }}>{r.personal?.length || 0}P</span>)}
                              {cell(<strong style={{ color: "#2563eb" }}>${r.costoManoObra.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                              {cell(<strong style={{ color: "#06b6d4" }}>${r.costoMateriales.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                              {cell(<strong style={{ color: "#1f2937" }}>${r.costoTotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>, "right", true)}
                            </tr>
                            {isExpanded && (
                              <tr style={{ background: "#f9fafb" }}>
                                <td colSpan={10} style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  {(r.imagenes?.length || 0) > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                      <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#374151" }}>FOTOS DEL AVANCE ({r.imagenes?.length})</p>
                                      <AntImage.PreviewGroup>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                          {r.imagenes?.map((img: any, i: number) => (
                                            <AntImage
                                              key={i}
                                              src={img.url}
                                              alt={img.name || `Foto ${i + 1}`}
                                              width={100}
                                              height={75}
                                              style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb" }}
                                              preview={{ src: img.url }}
                                            />
                                          ))}
                                        </div>
                                      </AntImage.PreviewGroup>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      <tr style={{ background: "#1e3a5f", fontWeight: 700, color: "#fff" }}>
                        <td colSpan={6} style={{ border: "1px solid #bbb", padding: "6px 8px", textAlign: "right" }}>TOTALES</td>
                        <td style={{ border: "1px solid #bbb", padding: "6px 8px", textAlign: "right" }}>${reportesPendientes.reduce((s, r) => s + r.costoManoObra, 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                        <td style={{ border: "1px solid #bbb", padding: "6px 8px", textAlign: "right" }}>${reportesPendientes.reduce((s, r) => s + r.costoMateriales, 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                        <td style={{ border: "1px solid #bbb", padding: "6px 8px", textAlign: "right" }}>${reportesPendientes.reduce((s, r) => s + r.costoTotal, 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total del ciclo</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalCiclo.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── HISTORIAL ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-600" />
          <span className="font-semibold text-gray-800">Historial de Valuaciones</span>
          {valuaciones.length > 0 && (
            <span className="text-xs text-gray-400">
              {valuaciones.length} concretada{valuaciones.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {valuaciones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12">
            <Empty description={<span className="text-sm text-gray-400">Sin valuaciones concretadas aún</span>} />
          </div>
        ) : (
          <Table
            columns={columnas}
            dataSource={[...valuaciones].sort((a, b) => b.numero - a.numero).map((v) => ({ ...v, key: v.id }))}
            expandable={{
              expandedRowRender,
              expandRowByClick: true,
            }}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 700 }}
            rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
          />
        )}
      </div>
    </div>
  );
}
