"use client";

import React from "react";
import { Table, Tag, Space, Button, Popconfirm, Badge } from "antd";
import { Eye, Trash2, Edit2 } from "lucide-react";
import type { Herramienta } from "@/types/inventario";

interface HerramientasTableProps {
  herramientas: Herramienta[];
  onEdit?: (herramienta: Herramienta) => void;
  onDelete?: (id: number) => void;
  onVerDetalle?: (herramienta: Herramienta) => void;
}

const ESTADO_COLOR: Record<string, string> = {
  DISPONIBLE: "green",
  "EN_USO": "blue",
  MANTENIMIENTO: "orange",
  DESCARTADA: "red",
};

export default function HerramientasTable({
  herramientas,
  onEdit,
  onDelete,
  onVerDetalle,
}: HerramientasTableProps) {
  const columns = [
    {
      title: "Herramienta",
      dataIndex: "nombre",
      key: "nombre",
      width: "25%",
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: "15%",
      render: (categoria: string) => (
        <span className="text-sm text-gray-600">{categoria}</span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: "12%",
      render: (estado: string) => (
        <Tag color={ESTADO_COLOR[estado] || "default"}>
          {estado === "EN_USO" ? "En uso" : estado === "DISPONIBLE" ? "Disponible" : estado === "MANTENIMIENTO" ? "Mantenimiento" : "Descartada"}
        </Tag>
      ),
    },
    {
      title: "Último Uso",
      dataIndex: "ultimoUsoDatos",
      key: "ultimoUsoDatos",
      width: "20%",
      render: (data: any) => {
        if (!data) return <span className="text-gray-400">—</span>;
        const fecha = new Date(data.fecha);
        const dias = Math.floor((Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div>
            <div className="text-sm font-medium">{data.obraNombre}</div>
            <div className="text-xs text-gray-500">
              {dias === 0 ? "Hoy" : dias === 1 ? "Ayer" : `hace ${dias} días`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Año Adquisición",
      dataIndex: "fechaAdquisicion",
      key: "fechaAdquisicion",
      width: "10%",
      render: (fecha: string) => {
        if (!fecha) return "—";
        return new Date(fecha).getFullYear();
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      width: "18%",
      render: (_, record: Herramienta) => (
        <Space size="small">
          {onVerDetalle && (
            <Button
              type="text"
              size="small"
              icon={<Eye size={16} />}
              onClick={() => onVerDetalle(record)}
            />
          )}
          {onEdit && (
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={16} />}
              onClick={() => onEdit(record)}
            />
          )}
          {onDelete && (
            <Popconfirm
              title="Eliminar herramienta"
              description="¿Está seguro de que desea eliminar esta herramienta?"
              onConfirm={() => onDelete(record.id)}
              okText="Sí"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={16} />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <Table
        columns={columns}
        dataSource={herramientas.map((h) => ({ ...h, key: h.id }))}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        size="small"
        locale={{ emptyText: "No hay herramientas registradas" }}
      />
    </div>
  );
}
