import React from "react";
import { Table, Button } from "antd";
import { Edit2 } from "lucide-react";
import type { Personal } from "@/types/obras";

interface Props {
  personal: Personal[];
  onEditar: (p: Personal) => void;
}

export default function PersonalTable({ personal, onEditar }: Props) {
  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Cargo",
      dataIndex: "cargo",
      key: "cargo",
      width: 150,
    },
    {
      title: "Costo por Hora",
      dataIndex: "costoPorHora",
      key: "costoPorHora",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 140,
      align: "right" as const,
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 70,
      render: (_, record: Personal) => (
        <Button
          type="text"
          size="small"
          icon={<Edit2 size={16} />}
          onClick={() => onEditar(record)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        columns={columns}
        dataSource={personal}
        rowKey="id"
        size="small"
        bordered
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
