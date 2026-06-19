"use client";

import React, { useState } from "react";
import { Table, Tag, Button, Modal, Space, Dropdown } from "antd";
import { Eye, Check, XCircle, MoreVertical, Edit } from "lucide-react";
import toast from "react-hot-toast";
import type { FacturaCompra } from "@/types/inventario";
import { ESTADO_FACTURA_LABEL } from "@/types/inventario";

interface FacturasTableProps {
  facturas: FacturaCompra[];
  onVerDetalle: (factura: FacturaCompra) => void;
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
  onAnular,
}: FacturasTableProps) {
  const [anularId, setAnularId] = useState<number | null>(null);
  const [anulando, setAnulando] = useState(false);

  const handleConfirmarAnular = async () => {
    if (!anularId) return;
    try {
      setAnulando(true);
      await onAnular(anularId);
      toast.success("Factura anulada");
      setAnularId(null);
    } catch (error) {
      toast.error("Error al anular factura");
    } finally {
      setAnulando(false);
    }
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
      width: 150,
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
          {record.estado !== "ANULADA" && (
            <Button
              type="text"
              size="small"
              className="text-red-600"
              onClick={() => setAnularId(record.id)}
              title="Anular factura - No se eliminará pero no se contabilizará"
            >
              ✕
            </Button>
          )}
          {record.estado === "ANULADA" && (
            <span className="text-xs text-gray-400">Anulada</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={facturas.map((f) => ({ ...f, key: f.id }))}
        pagination={{ pageSize: 10 }}
        size="small"
        bordered
        className="bg-white rounded-lg"
        rowClassName={(record: FacturaCompra) => {
          if (record.estado === "ANULADA") return "opacity-50 bg-gray-100";
          if (record.inhabilitada) return "opacity-60 bg-yellow-50";
          return "";
        }}
      />

      <Modal
        title="Anular factura"
        open={anularId !== null}
        onOk={handleConfirmarAnular}
        onCancel={() => setAnularId(null)}
        okText="Anular"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, loading: anulando }}
        cancelButtonProps={{ disabled: anulando }}
      >
        <p>¿Seguro que deseas anular esta factura? No se eliminará del sistema pero no se contabilizará en reportes.</p>
      </Modal>
    </>
  );
}
