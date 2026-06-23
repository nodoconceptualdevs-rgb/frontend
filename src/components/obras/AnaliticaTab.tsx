"use client";

import React, { useMemo } from "react";
import { Table, Tag, Empty, Progress } from "antd";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  FileText,
  CheckCircle2,
  Package,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import dayjs from "dayjs";
import { calcularMontoPresupuestado, calcularMontoEjecutado } from "@/lib/obras";
import type {
  Obra,
  ValuacionFinal,
  ValuacionDoc,
  MaterialDisponible,
} from "@/types/obras";

interface Props {
  obra: Obra;
  valuacion: ValuacionFinal;
  valuaciones: ValuacionDoc[];
  materiales: MaterialDisponible[];
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AnaliticaTab({ obra, valuacion, valuaciones, materiales }: Props) {
  const valOrdenadas = useMemo(
    () => [...valuaciones].sort((a, b) => a.numero - b.numero),
    [valuaciones]
  );

  const ultimaValuacion = valOrdenadas[valOrdenadas.length - 1] ?? null;

  // ── Mano de obra agregada ──────────────────────────────────────────────────
  const manoObraTotal = useMemo(() => {
    const map = new Map<
      number,
      { nombre: string; cargo: string; horas: number; costo: number }
    >();
    for (const reporte of obra.reportes) {
      for (const per of reporte.personal) {
        const prev = map.get(per.personalId) ?? {
          nombre: per.personalNombre,
          cargo: per.cargo,
          horas: 0,
          costo: 0,
        };
        map.set(per.personalId, {
          nombre: per.personalNombre,
          cargo: per.cargo,
          horas: prev.horas + per.horasTrabajadas,
          costo: prev.costo + per.subtotal,
        });
      }
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.costo - a.costo);
  }, [obra.reportes]);

  const totalCostoManoObra = manoObraTotal.reduce((s, p) => s + p.costo, 0);

  // ── Columnas historial por partida ─────────────────────────────────────────
  const columnasDinamicas = valOrdenadas.map((v) => ({
    title: `V${v.numero}`,
    key: `v${v.numero}`,
    width: 100,
    align: "right" as const,
    render: (_: any, record: any) => {
      const linea = v.lineas.find((l) => l.partidaId === record.id);
      const monto = linea?.montoEjecutado ?? 0;
      return monto > 0 ? (
        <span className="text-sm font-medium text-gray-800">{fmt(monto)}</span>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      );
    },
  }));

  const columnasHistorial = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 80,
      render: (v: string) => <span className="font-mono font-semibold text-xs">{v}</span>,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 60,
      align: "center" as const,
    },
    {
      title: "Presupuestado",
      key: "presupuestado",
      width: 120,
      align: "right" as const,
      render: (_: any, r: any) => (
        <span className="text-sm font-semibold">
          {fmt(r.cantidadPresupuestada * r.precioUnitario)}
        </span>
      ),
    },
    ...columnasDinamicas,
    {
      title: "Total Ejecutado",
      key: "totalEjec",
      width: 130,
      align: "right" as const,
      render: (_: any, r: any) => {
        const total = valOrdenadas.reduce((s, v) => {
          const l = v.lineas.find((l) => l.partidaId === r.id);
          return s + (l?.montoEjecutado ?? 0);
        }, 0);
        return <span className="font-bold text-gray-900">{fmt(total)}</span>;
      },
    },
    {
      title: "Variación",
      key: "variacion",
      width: 120,
      align: "right" as const,
      render: (_: any, r: any) => {
        if (r.esExtra) return <Tag color="green" className="text-xs">Extra</Tag>;
        const totalEjec = valOrdenadas.reduce((s, v) => {
          const l = v.lineas.find((l) => l.partidaId === r.id);
          return s + (l?.montoEjecutado ?? 0);
        }, 0);
        const presupuestado = r.cantidadPresupuestada * r.precioUnitario;
        const dif = totalEjec - presupuestado;
        if (Math.abs(dif) < 1) return <span className="text-xs text-gray-400">—</span>;
        return (
          <span className={`text-xs font-semibold ${dif > 0 ? "text-blue-600" : "text-red-600"}`}>
            {dif > 0 ? "+" : ""}{fmt(dif)}
          </span>
        );
      },
    },
  ];

  const totalMontoPresup = obra.partidas.reduce((s, p) => s + calcularMontoPresupuestado(p), 0);
  const totalMontoEjec = obra.partidas.reduce((s, p) => s + calcularMontoEjecutado(p), 0);
  const porcEjecucion = Math.round(totalMontoPresup > 0 ? (totalMontoEjec / totalMontoPresup) * 100 : 0);

  const diasColor =
    valuacion.diasTranscurridos > valuacion.diasPlanificados
      ? "text-red-600"
      : "text-green-600";

  return (
    <div className="space-y-8 pb-10">

      {/* ── 1. KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {/* % Ejecución */}
        <div className="col-span-3 lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Avance de Obra</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-black text-gray-900">{porcEjecucion}%</span>
            <span className="text-sm text-gray-400 mb-1">ejecutado</span>
          </div>
          <Progress
            percent={porcEjecucion}
            showInfo={false}
            strokeColor={porcEjecucion >= 100 ? "#16a34a" : porcEjecucion > 60 ? "#2563eb" : "#f59e0b"}
            trailColor="#e5e7eb"
            size="small"
          />
        </div>

        {/* Presupuesto */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-gray-400" />
            <p className="text-xs font-semibold uppercase text-gray-500">Presupuesto</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{fmt(obra.presupuestoTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">Costo real: {fmt(obra.partidas.reduce((s, p) => s + p.montoEjecutado, 0))}</p>
        </div>

        {/* Días */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-gray-400" />
            <p className="text-xs font-semibold uppercase text-gray-500">Plazo</p>
          </div>
          <p className={`text-lg font-bold ${diasColor}`}>{valuacion.diasTranscurridos}d</p>
          <p className="text-xs text-gray-500 mt-1">de {valuacion.diasPlanificados} planificados</p>
        </div>

        {/* Reportes */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-gray-400" />
            <p className="text-xs font-semibold uppercase text-gray-500">Reportes</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{obra.reportes.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {obra.reportes.filter((r) => !r.valuacionId).length} pendientes
          </p>
        </div>

        {/* Valuaciones */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-gray-400" />
            <p className="text-xs font-semibold uppercase text-gray-500">Valuaciones</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{valuaciones.length}</p>
          <p className="text-xs text-gray-500 mt-1">concretadas</p>
        </div>
      </div>

      {/* ── 2. Última Valuación ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Última Valuación</h3>
        </div>

        {!ultimaValuacion ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-10">
            <Empty description={<span className="text-sm text-gray-400">Sin valuaciones concretadas</span>} />
          </div>
        ) : (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold text-blue-900">
                  Valuación #{ultimaValuacion.numero}
                </p>
                <p className="text-xs text-blue-600">
                  Concretada el {dayjs(ultimaValuacion.fecha).format("DD [de] MMMM [de] YYYY")}
                </p>
              </div>
              {(() => {
                const dif = ultimaValuacion.presupuestoModificado - ultimaValuacion.totalPresupuesto;
                return dif !== 0 ? (
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${dif > 0 ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                    {dif > 0 ? "+" : ""}{fmt(dif)}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Presupuesto Base", value: ultimaValuacion.totalPresupuesto, bg: "bg-white", color: "text-gray-900" },
                { label: "Total Ejecutado", value: ultimaValuacion.totalEjecutado, bg: "bg-white", color: "text-gray-900" },
                { label: "Aumentos", value: ultimaValuacion.totalAumentos, bg: "bg-blue-100", color: "text-blue-800" },
                { label: "Presup. Modificado", value: ultimaValuacion.presupuestoModificado, bg: "bg-blue-900", color: "text-white" },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-lg p-3`}>
                  <p className={`text-xs font-semibold uppercase mb-1 ${item.color} opacity-70`}>{item.label}</p>
                  <p className={`text-xl font-black ${item.color}`}>{fmt(item.value)}</p>
                </div>
              ))}
            </div>
            {ultimaValuacion.totalDisminuciones > 0 && (
              <p className="text-xs text-red-700 mt-3 font-semibold">
                Disminuciones: -{fmt(ultimaValuacion.totalDisminuciones)}
              </p>
            )}
            {ultimaValuacion.totalExtras > 0 && (
              <p className="text-xs text-green-700 mt-1 font-semibold">
                Obras Extras: {fmt(ultimaValuacion.totalExtras)}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── 3. Comparativa de Valuaciones ───────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Comparativa de Valuaciones</h3>
        </div>

        {valOrdenadas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-sm text-gray-400">Sin valuaciones para comparar</p>
          </div>
        ) : (
          <Table
            size="small"
            bordered
            pagination={false}
            dataSource={valOrdenadas.map((v) => ({ ...v, key: v.id }))}
            expandable={{
              expandRowByClick: true,
              expandedRowRender: (v: ValuacionDoc) => {
                const lineas = v.lineas.filter((l) => l.montoEjecutado > 0);
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
                          <td style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right" }}>{fmt(v.totalPresupuesto)}</td>
                          <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#4472c4" }}>{fmt(v.totalEjecutado)}</td>
                          <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#4472c4" }}>{v.totalAumentos > 0 ? fmt(v.totalAumentos) : "—"}</td>
                          <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#c55a11" }}>{v.totalDisminuciones > 0 ? fmt(v.totalDisminuciones) : "—"}</td>
                          <td colSpan={2} style={{ border: "1px solid #999", padding: "6px 8px", textAlign: "right", background: "#538135" }}>{v.totalExtras > 0 ? fmt(v.totalExtras) : "—"}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              },
            }}
            columns={[
              {
                title: "V#",
                dataIndex: "numero",
                key: "numero",
                width: 60,
                render: (num: number) => <span className="font-bold text-gray-800">V{num}</span>,
              },
              {
                title: "Fecha",
                dataIndex: "fecha",
                key: "fecha",
                width: 110,
                render: (f: string) => dayjs(f).format("DD/MM/YYYY"),
              },
              {
                title: "Ejecutado",
                dataIndex: "totalEjecutado",
                key: "ejecutado",
                width: 130,
                align: "right" as const,
                render: (v: number) => <span className="font-semibold">${v.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>,
              },
              {
                title: "Aumentos",
                key: "aumentos",
                width: 110,
                align: "right" as const,
                render: (_: any, r: ValuacionDoc) =>
                  r.totalAumentos > 0 ? (
                    <span className="font-semibold text-blue-600">${r.totalAumentos.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  ),
              },
              {
                title: "Disminuciones",
                key: "disminuciones",
                width: 130,
                align: "right" as const,
                render: (_: any, r: ValuacionDoc) =>
                  r.totalDisminuciones > 0 ? (
                    <span className="font-semibold text-red-600">-${r.totalDisminuciones.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  ),
              },
              {
                title: "Extras",
                key: "extras",
                width: 110,
                align: "right" as const,
                render: (_: any, r: ValuacionDoc) =>
                  r.totalExtras > 0 ? (
                    <span className="font-semibold text-green-600">${r.totalExtras.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  ),
              },
              {
                title: "Ppto. Modificado",
                dataIndex: "presupuestoModificado",
                key: "modificado",
                width: 140,
                align: "right" as const,
                render: (v: number) => <span className="font-bold text-gray-900">${v.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>,
              },
            ]}
            summary={() => (
              <Table.Summary.Row style={{ background: "#f1f5f9", fontWeight: 700 }}>
                <Table.Summary.Cell colSpan={2} align="center" index={0}>
                  <span className="text-xs uppercase">Acumulado</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right" index={2}>
                  {fmt(valOrdenadas.reduce((s, v) => s + v.totalEjecutado, 0))}
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right" index={3}>
                  {fmt(valOrdenadas.reduce((s, v) => s + v.totalAumentos, 0))}
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right" index={4}>
                  -{fmt(valOrdenadas.reduce((s, v) => s + v.totalDisminuciones, 0)).slice(1)}
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right" index={5}>
                  {fmt(valOrdenadas.reduce((s, v) => s + v.totalExtras, 0))}
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right" index={6}>
                  {fmt(valOrdenadas[valOrdenadas.length - 1]?.presupuestoModificado ?? 0)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        )}
      </section>

      {/* ── 4. Historial por Partida ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Historial por Partida</h3>
          <span className="text-xs text-gray-400">Ejecución en cada valuación</span>
        </div>

        {valOrdenadas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-sm text-gray-400">Sin valuaciones concretadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Partidas normales */}
            <Table
              columns={columnasHistorial}
              dataSource={obra.partidas
                .filter((p) => !p.esExtra)
                .map((p) => ({ ...p, key: p.id }))}
              pagination={false}
              size="small"
              bordered
              scroll={{ x: 600 + valOrdenadas.length * 110 }}
            />

            {/* Obras extras */}
            {obra.partidas.some((p) => p.esExtra) && (
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 mt-4">
                  Obras Extras
                </p>
                <Table
                  columns={columnasHistorial}
                  dataSource={obra.partidas
                    .filter((p) => p.esExtra)
                    .map((p) => ({ ...p, key: p.id }))}
                  pagination={false}
                  size="small"
                  bordered
                  scroll={{ x: 600 + valOrdenadas.length * 110 }}
                  rowClassName={() => "bg-green-50"}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 5. Mano de Obra ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">
            Mano de Obra
            <span className="ml-2 text-sm font-normal text-gray-400">
              Total: {fmt(totalCostoManoObra)}
            </span>
          </h3>
        </div>

        {manoObraTotal.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">Sin registros de personal</p>
          </div>
        ) : (
          <Table
            size="small"
            bordered
            pagination={false}
            dataSource={manoObraTotal.map((p) => ({ ...p, key: p.id }))}
            columns={[
              { title: "Nombre", dataIndex: "nombre", key: "nombre" },
              { title: "Cargo", dataIndex: "cargo", key: "cargo", width: 130 },
              {
                title: "Horas",
                dataIndex: "horas",
                key: "horas",
                width: 80,
                align: "right" as const,
                render: (v: number) => `${v}h`,
              },
              {
                title: "Costo Total",
                dataIndex: "costo",
                key: "costo",
                width: 120,
                align: "right" as const,
                render: (v: number) => <span className="font-semibold">{fmt(v)}</span>,
              },
            ]}
            footer={() => (
              <div className="flex justify-between text-sm font-bold text-gray-800">
                <span>
                  Total horas: {manoObraTotal.reduce((s, p) => s + p.horas, 0)}h
                </span>
                <span>Total mano de obra: {fmt(totalCostoManoObra)}</span>
              </div>
            )}
          />
        )}
      </section>

    </div>
  );
}
