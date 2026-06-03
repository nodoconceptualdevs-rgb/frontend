"use client";

import React from "react";
import { Table, Tag, Button, Modal, Space, Dropdown } from "antd";
import { Eye, Check, XCircle, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import type { FacturaCompra } from "@/types/inventario";
import { ESTADO_FACTURA_LABEL } from "@/types/inventario";

interface FacturasTableProps {
  facturas: FacturaCompra[];
  onVerDetalle: (factura: FacturaCompra) => void;
  onAprobar: (id: number) => Promise<void>;
  onAnular: (id: number) => Promise<void>;
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: "default",
  APROBADA: "processing",
  PAGADA: "success",
  ANULADA: "error",
};

export default function FacturasTable({
  facturas,
  onVerDetalle,
  onAprobar,
  onAnular,
}: FacturasTableProps) {
  const handleAnular = (id: number) => {
    Modal.confirm({
      title: "Anular factura",
      content: "¿Seguro que deseas anular esta factura? No se eliminará del sistema pero no se contabilizará en reportes.",
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        await onAnular(id);
        toast.success("Factura anulada");
      },
    });
  };

  const columns = [
    {
      title: "Factura",
      dataIndex: "numero",
      key: "numero",
      width: 120,
      render: (texto: string) => <span className="font-mono text-sm">{texto}</span>,
    },
    {
      title: "Proveedor",
      dataIndex: "proveedorNombre",
      key: "proveedor",
      width: 200,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 120,
      render: (fecha: string) => new Date(fecha).toLocaleDateString("es-MX"),
    },
    {
      title: "Proyecto",
      dataIndex: "proyectoNombre",
      key: "proyecto",
      width: 180,
      render: (texto: string | undefined) => texto || "—",
    },
    {
      title: "Ítems",
      dataIndex: "items",
      key: "items",
      width: 80,
      render: (items: any[]) => <span className="font-semibold">{items?.length || 0}</span>,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 150,
      render: (total: number) => (
        <span className="font-semibold text-gray-900">
          ${total.toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      render: (estado: string) => (
        <Tag color={ESTADO_COLOR[estado]}>
          {ESTADO_FACTURA_LABEL[estado as keyof typeof ESTADO_FACTURA_LABEL]}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 150,
      render: (_: any, record: FacturaCompra) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => onVerDetalle(record)}
            title="Ver detalle"
          />
          {record.estado === "BORRADOR" && (
            <Button
              type="text"
              size="small"
              icon={<Check size={14} />}
              className="text-emerald-600"
              onClick={() => onAprobar(record.id)}
              title="Aprobar"
            />
          )}
          {record.estado !== "ANULADA" && (
            <Button
              type="text"
              size="small"
              icon={<XCircle size={14} />}
              className="text-red-600"
              onClick={() => handleAnular(record.id)}
              title="Anular"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={facturas.map((f) => ({ ...f, key: f.id }))}
      pagination={{ pageSize: 10 }}
      size="small"
      bordered
      className="bg-white rounded-lg"
      rowClassName={(record: FacturaCompra) =>
        record.estado === "ANULADA" ? "opacity-50 bg-gray-100" : ""
      }
    />
  );
}
