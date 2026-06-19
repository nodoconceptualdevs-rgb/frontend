"use client";

import React from "react";
import { Table, Button, Space, Popconfirm } from "antd";
import { TrendingUp, Edit2, Trash2 } from "lucide-react";
import type { MaterialConEstado } from "@/types/inventario";

interface MaterialesTableProps {
  materiales: MaterialConEstado[];
  onEditar?: (material: MaterialConEstado) => void;
  onEliminar?: (id: number) => Promise<void>;
}

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

export default function MaterialesTable({ materiales, onEditar, onEliminar }: MaterialesTableProps) {
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
      title: "Proyecto/Obra",
      dataIndex: "proyectoNombre",
      key: "proyecto",
      width: 140,
      render: (nombre: string | undefined, record: MaterialConEstado) => {
        if (!nombre && !record.obraNombre) {
          return <span className="text-gray-400">Sin asignar</span>;
        }
        return (
          <div className="text-sm">
            {nombre && <div className="font-medium text-gray-900">{nombre}</div>}
            {record.obraNombre && <div className="text-gray-500 text-xs">Obra: {record.obraNombre}</div>}
          </div>
        );
      },
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
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: unknown, record: MaterialConEstado) => (
        <Space size="small">
          {onEditar && (
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={16} />}
              onClick={() => onEditar(record)}
              title="Editar"
            />
          )}
          {onEliminar && (
            <Popconfirm
              title="Eliminar material"
              description="¿Está seguro de que desea eliminar este material?"
              onConfirm={() => onEliminar(record.id)}
              okText="Eliminar"
              okType="danger"
              cancelText="Cancelar"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={16} />}
                title="Eliminar"
              />
            </Popconfirm>
          )}
        </Space>
      ),
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
