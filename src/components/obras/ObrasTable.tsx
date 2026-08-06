import React from "react";
import { Table, Progress, Button } from "antd";
import { Eye } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Obra } from "@/types/obras";
import ObraStatusTag from "./ObraStatusTag";
import dayjs from "dayjs";

interface Props {
  obras: Obra[];
}

export default function ObrasTable({ obras }: Props) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const basePath = isAdmin ? "/admin/obras" : "/dashboard/obras";

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Proyecto",
      dataIndex: "proyectoNombre",
      key: "proyectoNombre",
      width: 150,
      render: (text: string | undefined) => text || <span className="text-gray-400 italic">Sin proyecto</span>,
    },
    {
      title: "Capataz",
      dataIndex: "capatazNombre",
      key: "capatazNombre",
      width: 120,
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => <ObraStatusTag estado={estado as any} />,
      width: 140,
    },
    {
      title: "Presupuesto",
      dataIndex: "presupuestoTotal",
      key: "presupuestoTotal",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 130,
      align: "right" as const,
    },
    {
      title: "Consumido",
      dataIndex: "presupuestoConsumido",
      key: "presupuestoConsumido",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 130,
      align: "right" as const,
    },
    {
      title: "Inicio",
      dataIndex: "fechaInicio",
      key: "fechaInicio",
      render: (val: string) => dayjs(val).format("DD MMM YYYY"),
      width: 110,
    },
    {
      title: "Fin Planificado",
      dataIndex: "fechaFinPlanificada",
      key: "fechaFinPlanificada",
      render: (val: string) => dayjs(val).format("DD MMM YYYY"),
      width: 120,
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record: Obra) => (
        <Link href={`${basePath}/${record.id}`}>
          <Button type="text" size="small" icon={<Eye size={16} />} />
        </Link>
      ),
      width: 70,
      fixed: "right" as const,
    },
  ];

  return (
    <div className="px-6">
      <Table
        columns={columns}
        dataSource={obras}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
