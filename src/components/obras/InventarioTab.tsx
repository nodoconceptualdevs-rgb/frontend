"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import { Package, AlertTriangle } from "lucide-react";
import type { ReporteDiario, MaterialDisponible } from "@/types/obras";
import type { FacturaCompra } from "@/types/inventario";
import dayjs from "dayjs";

interface Props {
  reportes: ReporteDiario[];
  materiales: MaterialDisponible[];
  facturas?: FacturaCompra[];
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ESTADO_STOCK_COLOR: Record<string, string> = {
  NORMAL: "green",
  BAJO: "orange",
  CRITICO: "red",
  SIN_STOCK: "default",
};

const ESTADO_FACTURA_COLOR: Record<string, string> = {
  BORRADOR: "default",
  APROBADA: "blue",
  PAGADA: "green",
  ANULADA: "red",
};

export default function InventarioTab({ reportes, materiales, facturas = [] }: Props) {
  // Materiales consumidos en reportes
  const materialesGastados = useMemo(() => {
    const map = new Map<
      number,
      { nombre: string; unidad: string; cantidad: number; costo: number; reportes: number }
    >();
    for (const reporte of reportes) {
      for (const mat of reporte.materiales) {
        const prev = map.get(mat.materialId) ?? {
          nombre: mat.materialNombre,
          unidad: mat.unidad,
          cantidad: 0,
          costo: 0,
          reportes: 0,
        };
        map.set(mat.materialId, {
          nombre: mat.materialNombre,
          unidad: mat.unidad,
          cantidad: prev.cantidad + mat.cantidad,
          costo: prev.costo + mat.subtotal,
          reportes: prev.reportes + 1,
        });
      }
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.costo - a.costo);
  }, [reportes]);

  const materialesUsadosIds = new Set(materialesGastados.map((m) => m.id));
  const stockRelacionado = materiales.filter((m) => materialesUsadosIds.has(m.materialId));

  const totalCostoMateriales = materialesGastados.reduce((s, m) => s + m.costo, 0);

  return (
    <div className="space-y-8 pb-10">
      {/* ── Consumo en Obra ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">
            Consumo en Obra
            {materialesGastados.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                Total: {fmt(totalCostoMateriales)}
              </span>
            )}
          </h3>
        </div>

        {materialesGastados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-sm text-gray-400">Sin materiales consumidos</p>
          </div>
        ) : (
          <Table
            size="small"
            bordered
            pagination={false}
            dataSource={materialesGastados.map((m) => ({ ...m, key: m.id }))}
            columns={[
              { title: "Material", dataIndex: "nombre", key: "nombre" },
              { title: "Ud.", dataIndex: "unidad", key: "unidad", width: 50, align: "center" as const },
              {
                title: "Cantidad",
                dataIndex: "cantidad",
                key: "cantidad",
                width: 90,
                align: "right" as const,
                render: (v: number) => fmtDec(v),
              },
              {
                title: "Costo Total",
                dataIndex: "costo",
                key: "costo",
                width: 130,
                align: "right" as const,
                render: (v: number) => <span className="font-semibold">{fmt(v)}</span>,
              },
              {
                title: "Rep.",
                dataIndex: "reportes",
                key: "reportes",
                width: 50,
                align: "center" as const,
                render: (v: number) => <span className="text-xs text-gray-500">{v}</span>,
              },
            ]}
            footer={() => (
              <div className="flex justify-end text-sm font-bold text-gray-800">
                Total materiales: {fmt(totalCostoMateriales)}
              </div>
            )}
          />
        )}
      </section>

      {/* ── Stock Actual ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Stock Actual (materiales usados en obra)</h3>
        </div>

        {stockRelacionado.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-sm text-gray-400">Sin materiales en inventario relacionados</p>
          </div>
        ) : (
          <Table
            size="small"
            bordered
            pagination={false}
            dataSource={stockRelacionado.map((m) => ({ ...m, key: m.materialId }))}
            columns={[
              { title: "Material", dataIndex: "materialNombre", key: "nombre" },
              { title: "Ud.", dataIndex: "unidad", key: "unidad", width: 50, align: "center" as const },
              {
                title: "Stock",
                dataIndex: "stockActual",
                key: "stock",
                width: 90,
                align: "right" as const,
                render: (v: number) => <span className="font-semibold">{fmtDec(v)}</span>,
              },
              {
                title: "Estado",
                dataIndex: "estadoStock",
                key: "estado",
                width: 100,
                render: (estado: string) => {
                  const colors: Record<string, string> = {
                    NORMAL: "bg-green-100 text-green-800",
                    BAJO: "bg-orange-100 text-orange-800",
                    CRITICO: "bg-red-100 text-red-800",
                    SIN_STOCK: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[estado] || "bg-gray-100"}`}>
                      {estado}
                    </span>
                  );
                },
              },
              {
                title: "",
                key: "alerta",
                width: 30,
                render: (_: any, r: MaterialDisponible) => {
                  const gastado = materialesGastados.find((m) => m.id === r.materialId);
                  if (gastado && r.stockActual < gastado.cantidad * 0.2) {
                    return <AlertTriangle size={14} className="text-red-500" />;
                  }
                  return null;
                },
              },
            ]}
          />
        )}
      </section>

      {/* ── Historial de Compras ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">
            Historial de Compras
            {facturas.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {facturas.length} factura{facturas.length !== 1 ? "s" : ""} · {fmt(facturas.reduce((s, f) => s + f.total, 0))} total
              </span>
            )}
          </h3>
        </div>

        {facturas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-sm text-gray-400">Sin compras vinculadas a esta obra</p>
          </div>
        ) : (
          <Table
            size="small"
            bordered
            pagination={false}
            dataSource={facturas.map((f) => ({ ...f, key: f.id }))}
            expandable={{
              expandRowByClick: true,
              expandedRowRender: (f: FacturaCompra) => (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={f.items.map((i, idx) => ({ ...i, key: idx }))}
                  columns={[
                    { title: "Material", dataIndex: "materialNombre", key: "mat" },
                    { title: "Ud.", dataIndex: "unidad", key: "ud", width: 60, align: "center" as const },
                    { title: "Cantidad", dataIndex: "cantidad", key: "qty", width: 90, align: "right" as const, render: (v: number) => fmtDec(v) },
                    { title: "P.U.", dataIndex: "precioUnitario", key: "pu", width: 110, align: "right" as const, render: (v: number) => fmt(v) },
                    { title: "Subtotal", dataIndex: "subtotal", key: "sub", width: 120, align: "right" as const, render: (v: number) => <span className="font-semibold">{fmt(v)}</span> },
                  ]}
                />
              ),
            }}
            columns={[
              { title: "Factura", dataIndex: "numero", key: "num", width: 130, render: (v: string) => <span className="font-mono font-semibold text-sm">{v}</span> },
              { title: "Fecha", dataIndex: "fecha", key: "fecha", width: 110, render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
              { title: "Proveedor", dataIndex: "proveedorNombre", key: "prov" },
              { title: "Ítems", dataIndex: "items", key: "items", width: 60, align: "center" as const, render: (v: any[]) => v?.length ?? 0 },
              { title: "Total", dataIndex: "total", key: "total", width: 130, align: "right" as const, render: (v: number) => <span className="font-bold">{fmt(v)}</span> },
              { title: "Estado", dataIndex: "estado", key: "estado", width: 100, render: (v: string) => {
                const colors: Record<string, string> = {
                  BORRADOR: "bg-gray-100 text-gray-800",
                  APROBADA: "bg-blue-100 text-blue-800",
                  PAGADA: "bg-green-100 text-green-800",
                  ANULADA: "bg-red-100 text-red-800",
                };
                return (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[v] || "bg-gray-100"}`}>
                    {v}
                  </span>
                );
              }},
            ]}
            footer={() => (
              <div className="flex justify-end text-sm font-bold text-gray-800">
                Total compras: {fmt(facturas.reduce((s, f) => s + f.total, 0))}
              </div>
            )}
          />
        )}
      </section>
    </div>
  );
}
