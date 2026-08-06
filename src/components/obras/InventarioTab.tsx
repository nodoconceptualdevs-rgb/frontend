"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Table, Button } from "antd";
import { Package, AlertTriangle, Plus, ChevronDown, Check, Loader2, ArrowRightLeft } from "lucide-react";
import type { ReporteDiario, MaterialDisponible } from "@/types/obras";
import type { EstadoFactura, FacturaCompra } from "@/types/inventario";
import TransferirMaterialModal from "./TransferirMaterialModal";
import dayjs from "dayjs";

interface Props {
  reportes: ReporteDiario[];
  materiales: MaterialDisponible[];
  facturas?: FacturaCompra[];
  otrasObras?: { id: number; nombre: string }[];
  onCambiarEstado?: (facturaId: number, estado: EstadoFactura) => Promise<void>;
  onAgregarFactura?: () => void;
  onTransferirMaterial?: (input: { materialId: number; cantidad: number; obraDestinoId?: number; nota?: string }) => Promise<void>;
}

const fmt = (n: number) =>
  "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ESTADO_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  APROBADA:  { label: "Aprobada",  dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-200" },
  PAGADA:    { label: "Pagada",    dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  ANULADA:   { label: "Anulada",   dot: "bg-red-400",     bg: "bg-red-50",     text: "text-red-600",     ring: "ring-red-200" },
};

const ESTADOS_FACTURA: EstadoFactura[] = ["PAGADA", "ANULADA"];

function EstadoBadge({
  estado,
  facturaId,
  loading,
  disabled,
  onCambiar,
}: {
  estado: EstadoFactura;
  facturaId: number;
  loading: boolean;
  disabled: boolean;
  onCambiar?: (id: number, estado: EstadoFactura) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = ESTADO_CONFIG[estado];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badge = (
    <button
      type="button"
      disabled={disabled || !onCambiar}
      onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        ring-1 transition-all duration-150 select-none
        ${cfg.bg} ${cfg.text} ${cfg.ring}
        ${onCambiar && !disabled ? "cursor-pointer hover:brightness-95 active:scale-95" : "cursor-default"}
      `}
    >
      {loading
        ? <Loader2 size={10} className="animate-spin" />
        : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      }
      {cfg.label}
      {onCambiar && estado === "APROBADA" && <ChevronDown size={11} className={`opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />}
    </button>
  );

  if (!onCambiar) return badge;

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {badge}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-36 rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-200/80 py-1 overflow-hidden">
          {ESTADOS_FACTURA.map((e) => {
            const c = ESTADO_CONFIG[e];
            const isActive = e === estado;
            const isDisabled = false;
            return (
              <button
                key={e}
                type="button"
                disabled={isActive || isDisabled}
                onClick={async () => {
                  setOpen(false);
                  await onCambiar(facturaId, e);
                }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors
                  ${isActive || isDisabled
                    ? "opacity-40 cursor-not-allowed text-gray-500"
                    : "hover:bg-gray-50 cursor-pointer text-gray-700"}
                `}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                <span className="flex-1 text-left">{c.label}</span>
                {isActive && <Check size={12} className="text-gray-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InventarioTab({ reportes, materiales, facturas = [], otrasObras = [], onCambiarEstado, onAgregarFactura, onTransferirMaterial }: Props) {
  const [loadingEstado, setLoadingEstado] = useState<number | null>(null);
  const [materialATransferir, setMaterialATransferir] = useState<MaterialDisponible | null>(null);
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

  // Materiales disponibles: solo los que tienen stock restante > 0
  const stockDisponible = materiales.filter((m) => m.stockActual > 0);

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
            scroll={{ x: 500 }}
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

      {/* ── Stock Disponible ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Stock Disponible</h3>
        </div>

        {stockDisponible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-sm text-gray-400">Sin materiales comprados para esta obra</p>
          </div>
        ) : (
          <Table
            size="small"
            bordered
            pagination={false}
            scroll={{ x: 500 }}
            dataSource={stockDisponible.map((m) => ({ ...m, key: m.materialId }))}
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
                  if (r.stockActual === 0) {
                    return <AlertTriangle size={14} className="text-red-500" />;
                  }
                  return null;
                },
              },
              ...(onTransferirMaterial
                ? [
                    {
                      title: "",
                      key: "transferir",
                      width: 40,
                      render: (_: unknown, r: MaterialDisponible) => (
                        <Button
                          type="text"
                          size="small"
                          icon={<ArrowRightLeft size={14} />}
                          disabled={r.stockActual <= 0}
                          onClick={() => setMaterialATransferir(r)}
                          title="Transferir a otra obra o a Nodo"
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </section>

      {onTransferirMaterial && (
        <TransferirMaterialModal
          open={materialATransferir !== null}
          material={materialATransferir}
          otrasObras={otrasObras}
          onClose={() => setMaterialATransferir(null)}
          onSubmit={onTransferirMaterial}
        />
      )}

      {/* ── Historial de Compras ───────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex items-center gap-2">
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
          {onAgregarFactura && (
            <Button size="small" icon={<Plus size={14} />} onClick={onAgregarFactura}>
              Agregar Factura
            </Button>
          )}
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
            scroll={{ x: 700 }}
            dataSource={facturas.map((f) => ({ ...f, key: f.id }))}
            expandable={{
              expandRowByClick: true,
              expandedRowRender: (f: FacturaCompra) => (
                <Table
                  size="small"
                  pagination={false}
                  scroll={{ x: 450 }}
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
              {
                title: "Estado",
                dataIndex: "estado",
                key: "estado",
                width: 130,
                render: (estado: EstadoFactura, record: FacturaCompra) => (
                  <EstadoBadge
                    estado={estado}
                    facturaId={record.id}
                    loading={loadingEstado === record.id}
                    disabled={loadingEstado === record.id || estado !== "APROBADA"}
                    onCambiar={onCambiarEstado ? async (id, e) => {
                      setLoadingEstado(id);
                      try { await onCambiarEstado(id, e); }
                      finally { setLoadingEstado(null); }
                    } : undefined}
                  />
                ),
              },
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
