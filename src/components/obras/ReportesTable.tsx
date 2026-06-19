import React, { useMemo, useState } from "react";
import { Table, Button, Tag, Popconfirm } from "antd";
import { Trash2 } from "lucide-react";
import type { ReporteDiario, Obra } from "@/types/obras";
import dayjs from "dayjs";

interface Props {
  reportes: ReporteDiario[];
  obra?: Obra;
  onVerDetalle?: (reporte: ReporteDiario) => void;
  onEliminar?: (reporteId: number) => void;
}

interface ReporteFecha {
  fecha: string;
  fechaFormatada: string;
  reportes: ReporteDiario[];
  id: string;
}

export default function ReportesTable({ reportes, obra, onVerDetalle, onEliminar }: Props) {
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
                    {["#", "Código", "Descripción", "Avance", "Costo Presupuestado", "Personal", "Costo MO", "Costo Mat.", "TOTAL"].map((h, i) => (
                      <th key={i} style={{ border: "1px solid #e5e7eb", padding: "5px 6px", textAlign: i > 1 ? "right" : "left", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {record.reportes.map((r, idx) => {
                    const isExpanded = expandedReportes.has(r.id);
                    const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";
                    const cell = (content: React.ReactNode, align = "right", bold = false) => (
                      <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: align as any, background: rowBg, whiteSpace: "nowrap", fontWeight: bold ? 600 : 400 }}>{content}</td>
                    );

                    // Calcular costo presupuestado según avance
                    let costoSegunAvance = 0;
                    if (obra && obra.partidas) {
                      const partida = obra.partidas.find((p) => p.id === r.partidaId);
                      if (partida) {
                        const costoPresupuestadoPartida = partida.cantidadPresupuestada * partida.precioUnitario;
                        costoSegunAvance = costoPresupuestadoPartida > 0 ? (costoPresupuestadoPartida * r.avanceLogrado) / 100 : 0;
                      }
                    }

                    return (
                      <React.Fragment key={r.id}>
                        <tr style={{ cursor: "pointer" }} onClick={() => toggleReporte(r.id)}>
                          <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, fontSize: 10, color: "#6b7280" }}>{isExpanded ? "▼" : "▶"}</td>
                          <td style={{ border: "1px solid #e5e7eb", padding: "5px 7px", textAlign: "center", background: rowBg, fontWeight: 700 }}>{idx + 1}</td>
                          {cell(r.partidaCodigo, "center")}
                          {cell(r.partidaDescripcion, "left")}
                          {cell(<span style={{ fontWeight: 600, color: "#7c3aed" }}>{r.avanceLogrado}%</span>)}
                          {cell(<strong style={{ color: "#059669" }}>${costoSegunAvance.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                          {cell(<span style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6" }}>{r.personal?.length || 0}P</span>)}
                          {cell(<strong style={{ color: "#2563eb" }}>${r.costoManoObra.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                          {cell(<strong style={{ color: "#06b6d4" }}>${r.costoMateriales.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>)}
                          {cell(<strong style={{ color: "#374151", fontWeight: 700 }}>${(r.costoManoObra + r.costoMateriales + costoSegunAvance).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>, "right", true)}
                          {onEliminar && <td style={{ border: "1px solid #e5e7eb", padding: "3px 5px", background: rowBg, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                              title="Eliminar reporte"
                              description="¿Está seguro?"
                              onConfirm={() => onEliminar(r.id)}
                              okText="Sí"
                              cancelText="No"
                            >
                              <Button type="text" size="small" danger icon={<Trash2 size={14} />} />
                            </Popconfirm>
                          </td>}
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: "#f3f4f6" }}>
                            <td colSpan={10} style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
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
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ),
        }}
      />
    </div>
  );
}
