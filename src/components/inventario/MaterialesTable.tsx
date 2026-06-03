"use client";

import React from "react";
import { Table, Tag } from "antd";
import { AlertCircle, TrendingUp } from "lucide-react";
import type { MaterialConEstado, HistorialPrecio } from "@/types/inventario";
import { ESTADO_STOCK_LABEL } from "@/types/inventario";

interface MaterialesTableProps {
  materiales: MaterialConEstado[];
}

const ESTADO_COLOR: Record<string, { color: string; bg: string }> = {
  NORMAL: { color: "text-emerald-700", bg: "bg-emerald-50" },
  BAJO: { color: "text-amber-700", bg: "bg-amber-50" },
  CRITICO: { color: "text-red-700", bg: "bg-red-50" },
  SIN_STOCK: { color: "text-red-900", bg: "bg-red-100" },
};

function HistorialExpandable({ material }: { material: MaterialConEstado }) {
  const historial = material.historialPrecios || [];

  if (historial.length === 0) {
    return (
      <div className="px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-500">Sin historial de precios</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-blue-600" />
        <h4 className="font-semibold text-gray-900">Historial de Precios</h4>
      </div>
      <div className="space-y-2">
        {historial
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .map((h, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-2 border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {new Date(h.fecha).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  ${h.precio.toLocaleString("es-MX")} / {material.unidad}
                </span>
                {h.cantidad && (
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    {h.cantidad} unidades
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function MaterialesTable({ materiales }: MaterialesTableProps) {
  const columns = [
    {
      title: "Material",
      dataIndex: "nombre",
      key: "nombre",
      width: 220,
      render: (texto: string) => <span className="font-semibold text-gray-900">{texto}</span>,
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 140,
      render: (cat: string) => (
        <span className="text-sm">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
      ),
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 100,
      render: (unit: string) => <span className="text-sm text-gray-600">{unit}</span>,
    },
    {
      title: "Stock",
      dataIndex: "stockActual",
      key: "stock",
      width: 100,
      align: "right" as const,
      render: (stock: number | undefined) => (
        <span className="font-semibold text-gray-900">{(stock || 0).toLocaleString("es-MX")}</span>
      ),
    },
    {
      title: "Mínimo",
      dataIndex: "stockMinimo",
      key: "minimo",
      width: 100,
      align: "right" as const,
      render: (minimo: number | undefined) => (
        <span className="text-sm text-gray-600">{minimo ? minimo.toLocaleString("es-MX") : "—"}</span>
      ),
    },
    {
      title: "Precio Prom.",
      dataIndex: "precioPromedio",
      key: "precio",
      width: 140,
      align: "right" as const,
      render: (precio: number | undefined) => (
        <span className="text-sm font-semibold text-gray-900">
          ${(precio || 0).toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "Valor Total",
      dataIndex: "valorTotalStock",
      key: "valorTotal",
      width: 150,
      align: "right" as const,
      render: (valor: number | undefined) => (
        <span className="font-semibold text-gray-900">
          ${(valor || 0).toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estadoStock",
      key: "estado",
      width: 140,
      render: (estado: string) => {
        const config = ESTADO_COLOR[estado] || ESTADO_COLOR.NORMAL;
        const esAlerta = estado !== "NORMAL";
        return (
          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.color}`}
          >
            {esAlerta && <AlertCircle size={14} />}
            {ESTADO_STOCK_LABEL[estado as any]}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={materiales.map((m) => ({ ...m, key: m.id }))}
      pagination={{ pageSize: 15 }}
      size="small"
      bordered
      className="bg-white rounded-lg"
      expandable={{
        expandedRowRender: (record: MaterialConEstado) => (
          <HistorialExpandable material={record} />
        ),
        expandedRowClassName: () => "bg-gray-50",
      }}
    />
  );
}
