import React from "react";
import { Table, Button, Tag } from "antd";
import { Eye } from "lucide-react";
import type { ReporteDiario } from "@/types/obras";
import dayjs from "dayjs";

interface Props {
  reportes: ReporteDiario[];
  onVerDetalle: (reporte: ReporteDiario) => void;
}

export default function ReportesTable({ reportes, onVerDetalle }: Props) {
  const columns = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (val: string) => dayjs(val).format("DD MMM YYYY"),
      width: 110,
    },
    {
      title: "Partida",
      key: "partida",
      render: (_, record: ReporteDiario) => (
        <span>
          {record.partidaCodigo} - {record.partidaDescripcion}
        </span>
      ),
    },
    {
      title: "Avance %",
      dataIndex: "avanceLogrado",
      key: "avanceLogrado",
      width: 80,
      render: (val: number) => `${val}%`,
      align: "right" as const,
    },
    {
      title: "Personal",
      dataIndex: "personal",
      key: "personal",
      width: 80,
      render: (val: any[]) => (
        <Tag color="blue">{val ? val.length : 0} personas</Tag>
      ),
    },
    {
      title: "Materiales",
      dataIndex: "materiales",
      key: "materiales",
      width: 90,
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
    {
      title: "Acciones",
      key: "acciones",
      width: 70,
      render: (_, record: ReporteDiario) => (
        <Button
          type="text"
          size="small"
          icon={<Eye size={16} />}
          onClick={() => onVerDetalle(record)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        columns={columns}
        dataSource={reportes}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
