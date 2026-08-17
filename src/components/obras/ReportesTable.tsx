import React, { useMemo, useState } from "react";
import { Table, Button, Tag, Popconfirm, Image as AntImage } from "antd";
import { Trash2 } from "lucide-react";
import type { ReporteDiario, Obra } from "@/types/obras";
import dayjs from "dayjs";

interface Props {
  reportes: ReporteDiario[];
  obra?: Obra;
  onVerDetalle?: (reporte: ReporteDiario) => void;
  onEliminar?: (reporteId: number) => void;
  onEliminarLote?: (loteId: string) => void;
}

interface ReporteFecha {
  fecha: string;
  fechaFormatada: string;
  reportes: ReporteDiario[];
  id: string;
}

export default function ReportesTable({ reportes, obra, onVerDetalle, onEliminar, onEliminarLote }: Props) {
  const [expandedFechas, setExpandedFechas] = useState<Set<string>>(new Set());
  const [expandedReportes, setExpandedReportes] = useState<Set<number>>(new Set());

  // Agrupar reportes por fecha
  const reportesPorFecha = useMemo(() => {
    const agrupados = new Map<string, ReporteDiario[]>();
    for (const r of reportes) {
      const fecha = dayjs(r.fecha).format("YYYY-MM-DD");
      if (!agrupados.has(fecha)) agrupados.set(fecha, []);
      agrupados.get(fecha)!.push(r);
    }

    return Array.from(agrupados.entries())
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([fecha, items]) => ({
        fecha,
        fechaFormatada: dayjs(fecha).format("DD MMM YYYY"),
        reportes: items,
        id: fecha,
      }));
  }, [reportes]);

  const toggleFecha = (fecha: string) => {
    const newSet = new Set(expandedFechas);
    if (newSet.has(fecha)) {
      newSet.delete(fecha);
    } else {
      newSet.add(fecha);
    }
    setExpandedFechas(newSet);
  };

  const toggleReporte = (reporteId: number) => {
    const newSet = new Set(expandedReportes);
    if (newSet.has(reporteId)) {
      newSet.delete(reporteId);
    } else {
      newSet.add(reporteId);
    }
    setExpandedReportes(newSet);
  };

  const columnsFecha = [
    {
      title: "Fecha",
      dataIndex: "fechaFormatada",
      key: "fecha",
      width: 120,
    },
    {
      title: "Partidas",
      key: "partidas",
      render: (_ : any, record: ReporteFecha) => (
        <span className="text-sm text-gray-600">
          {record.reportes.length} partida{record.reportes.length !== 1 ? "s" : ""}
        </span>
      ),
      width: 100,
    },
    {
      title: "Total Costo MO",
      key: "totalMO",
      render: (_ : any, record: ReporteFecha) => {
        const total = record.reportes.reduce((s, r) => s + r.costoManoObra, 0);
        return (
          <span className="font-semibold">
            ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        );
      },
      width: 130,
      align: "right" as const,
    },
    {
      title: "Total Costo Materiales",
      key: "totalMateriales",
      render: (_: any, record: ReporteFecha) => {
        const total = record.reportes.reduce((s, r) => s + r.costoMateriales, 0);
        return (
          <span className="font-semibold">
            ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        );
      },
      width: 150,
      align: "right" as const,
    },
    {
      title: "Total Día",
      key: "totalDia",
      render: (_: any, record: ReporteFecha) => {
        const total = record.reportes.reduce((s, r) => {
          let costoSegunAvance = 0;
          if (obra && obra.partidas) {
            const partida = obra.partidas.find((p) => p.id === r.partidaId);
            if (partida) {
              const costoPresupuestadoPartida = partida.cantidadPresupuestada * partida.precioUnitario;
              costoSegunAvance = costoPresupuestadoPartida > 0 ? (costoPresupuestadoPartida * r.avanceLogrado) / 100 : 0;
            }
          }
          return s + r.costoManoObra + r.costoMateriales + costoSegunAvance;
        }, 0);
        return (
          <span className="font-bold text-blue-600">
            ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        );
      },
      width: 120,
      align: "right" as const,
    },
  ];

  const columnDetalle = [
    {
      title: "Partida",
      key: "partida",
      render: (_ : any, record: ReporteDiario) => (
        <span className="text-sm">
          {record.partidaCodigo} - {record.partidaDescripcion}
        </span>
      ),
    },
    {
      title: "Avance %",
      dataIndex: "avanceLogrado",
      key: "avanceLogrado",
      width: 90,
      render: (val: number) => <span className="font-semibold text-amber-600">{val}%</span>,
      align: "right" as const,
    },
    {
      title: "Personal",
      dataIndex: "personal",
      key: "personal",
      width: 100,
      render: (val: any[]) => (
        <Tag color="blue">{val ? val.length : 0} personas</Tag>
      ),
    },
    {
      title: "Materiales",
      dataIndex: "materiales",
      key: "materiales",
      width: 110,
      render: (val: any[]) => (
        <Tag color="cyan">{val ? val.length : 0} materiales</Tag>
      ),
    },
    {
      title: "Costo MO",
      dataIndex: "costoManoObra",
      key: "costoManoObra",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 110,
      align: "right" as const,
    },
    {
      title: "Costo Materiales",
      dataIndex: "costoMateriales",
      key: "costoMateriales",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 140,
      align: "right" as const,
    },
    {
      title: "Costo Total",
      dataIndex: "costoTotal",
      key: "costoTotal",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 120,
      align: "right" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        columns={columnsFecha}
        dataSource={reportesPorFecha}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record: ReporteFecha) => (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ border: "1px solid #e5e7eb", padding: "5px 6px", textAlign: "center", fontWeight: 700, fontSize: 10, width: 30 }}>▼</th>
                    {["#", "Código", "Descripción", "Cantidad", "Avance", "Costo Presupuestado", "Personal", "Costo MO", "Costo Mat.", "TOTAL"].map((h, i) => (
                      <th key={i} style={{ border: "1px solid #e5e7eb", padding: "5px 6px", textAlign: i > 1 ? "right" : "left", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Agrupa las partidas cargadas juntas en un mismo "Nuevo Reporte" (mismo
                    // loteId), preservando el orden. Sin loteId (datos viejos) quedan solas.
                    const porLote = new Map<string, ReporteDiario[]>();
                    const ordenLotes: string[] = [];
                    for (const r of record.reportes) {
                      const key = r.loteId || `solo-${r.id}`;
                      if (!porLote.has(key)) {
                        porLote.set(key, []);
                        ordenLotes.push(key);
                      }
                      porLote.get(key)!.push(r);
                    }
                    let contador = 0;
                    const colSpanTotal = onEliminar ? 12 : 11;
                    return ordenLotes.map((loteKey) => {
                      const grupo = porLote.get(loteKey)!;
                      return (
                        <React.Fragment key={loteKey}>
                          {grupo.length > 1 && (
                            <tr>
                              <td colSpan={colSpanTotal} style={{ border: "1px solid #e5e7eb", padding: "4px 8px", background: "#eef2f7", fontSize: 10, fontWeight: 700, color: "#475569" }}>
                                <div className="flex items-center justify-between">
                                  <span>REPORTE · {grupo.length} PARTIDAS</span>
                                  {onEliminarLote && (
                                    <Popconfirm
                                      title="Eliminar reporte completo"
                                      description={`Se eliminarán las ${grupo.length} partidas de este reporte.`}
                                      onConfirm={() => onEliminarLote(loteKey)}
                                      okText="Sí"
                                      cancelText="No"
                                    >
                                      <Button type="text" size="small" danger icon={<Trash2 size={12} />} style={{ height: 20 }} />
                                    </Popconfirm>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          {grupo.map((r) => {
                    const idx = contador++;
                    const isExpanded = expandedReportes.has(r.id);
                    const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";
                    const cell = (content: React.ReactNode, align = "right", bold = false) => (
                      <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: align as any, background: rowBg, whiteSpace: "nowrap", fontWeight: bold ? 600 : 400 }}>{content}</td>
                    );

                    // Calcular costo presupuestado según avance
                    let costoSegunAvance = 0;
                    let cantidadEjecutada = 0;
                    let unidadPartida = "";
                    if (obra && obra.partidas) {
                      const partida = obra.partidas.find((p) => p.id === r.partidaId);
                      if (partida) {
                        const costoPresupuestadoPartida = partida.cantidadPresupuestada * partida.precioUnitario;
                        costoSegunAvance = costoPresupuestadoPartida > 0 ? (costoPresupuestadoPartida * r.avanceLogrado) / 100 : 0;
                        cantidadEjecutada = partida.precioUnitario > 0 ? r.montoAplicado / partida.precioUnitario : 0;
                        unidadPartida = partida.unidad;
                      }
                    }

                    const hasDetail = (r.imagenes?.length || 0) + (r.personal?.length || 0) + (r.materiales?.length || 0) > 0 || !!r.observaciones;

                    return (
                      <React.Fragment key={r.id}>
                        <tr style={{ cursor: hasDetail ? "pointer" : "default" }} onClick={() => hasDetail && toggleReporte(r.id)}>
                          <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, width: 28 }}>
                            {hasDetail && (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 3, background: isExpanded ? "#1e293b" : "#f1f5f9", border: "1px solid #cbd5e1", fontSize: 8, color: isExpanded ? "#f8fafc" : "#64748b" }}>
                                {isExpanded ? "▼" : "▶"}
                              </span>
                            )}
                          </td>
                          <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, fontWeight: 700 }}>{idx + 1}</td>
                          {cell(r.partidaCodigo, "center")}
                          {cell(r.partidaDescripcion, "left")}
                          {cell(<span style={{ fontWeight: 600, color: "#0f766e" }}>{cantidadEjecutada.toLocaleString("es-CO", { maximumFractionDigits: 2 })} {unidadPartida}</span>)}
                          {cell(<span style={{ fontWeight: 600, color: "#7c3aed" }}>{r.avanceLogrado}%</span>)}
                          {cell(<strong style={{ color: "#059669" }}>${costoSegunAvance.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                          {cell(<span style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6" }}>{r.personal?.length || 0}P</span>)}
                          {cell(<strong style={{ color: "#2563eb" }}>${r.costoManoObra.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                          {cell(<strong style={{ color: "#06b6d4" }}>${r.costoMateriales.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                          {cell(<strong style={{ color: "#374151", fontWeight: 700 }}>${(r.costoManoObra + r.costoMateriales + costoSegunAvance).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>, "right", true)}
                          {onEliminar && <td style={{ border: "1px solid #e5e7eb", padding: "3px 5px", background: rowBg, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <Popconfirm title="Eliminar reporte" description="¿Está seguro?" onConfirm={() => onEliminar(r.id)} okText="Sí" cancelText="No">
                              <Button type="text" size="small" danger icon={<Trash2 size={14} />} />
                            </Popconfirm>
                          </td>}
                        </tr>
                        {hasDetail && isExpanded && (
                          <tr>
                            <td colSpan={onEliminar ? 12 : 11} style={{ padding: 0, background: "#f8fafc", borderLeft: "3px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
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
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          ),
        }}
      />
    </div>
  );
}
