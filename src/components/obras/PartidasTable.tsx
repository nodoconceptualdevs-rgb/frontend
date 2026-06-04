import React from "react";
import { Table, Button, Popconfirm } from "antd";
import { Edit2, Trash2 } from "lucide-react";
import type { Partida } from "@/types/obras";
import AvanceGauge from "./AvanceGauge";
import {
  calcularMontoPresupuestado,
  calcularMontoEjecutado,
} from "@/lib/obras";

interface Props {
  partidas: Partida[];
  onEditar: (partida: Partida) => void;
  onEliminar: (id: number) => void;
}

export default function PartidasTable({
  partidas,
  onEditar,
  onEliminar,
}: Props) {
  const totalPresupuestado = partidas.reduce(
    (sum, p) => sum + calcularMontoPresupuestado(p),
    0
  );
  const totalEjecutado = partidas.reduce(
    (sum, p) => sum + calcularMontoEjecutado(p),
    0
  );

  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 80,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 70,
    },
    {
      title: "Cant. Presup.",
      dataIndex: "cantidadPresupuestada",
      key: "cantidadPresupuestada",
      width: 100,
      render: (val: number) => val.toFixed(2),
      align: "right" as const,
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      width: 110,
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      align: "right" as const,
    },
    {
      title: "Monto Presup.",
      key: "montoPresupuestado",
      width: 130,
      render: (_, record: Partida) => {
        const monto = calcularMontoPresupuestado(record);
        return `$${monto.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
      },
      align: "right" as const,
    },
    {
      title: "Cant. Ejecutada",
      dataIndex: "cantidadEjecutada",
      key: "cantidadEjecutada",
      width: 110,
      render: (val: number) => val.toFixed(2),
      align: "right" as const,
    },
    {
      title: "Monto Ejecutado",
      key: "montoEjecutado",
      width: 130,
      render: (_, record: Partida) => {
        const monto = calcularMontoEjecutado(record);
        return `$${monto.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
      },
      align: "right" as const,
    },
    {
      title: "Avance",
      key: "avance",
      width: 80,
      render: (_, record: Partida) => (
        <AvanceGauge porcentaje={record.avancePorcentaje} size="sm" />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 90,
      render: (_, record: Partida) => (
        <div className="flex gap-2">
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={16} />}
            onClick={() => onEditar(record)}
          />
          <Popconfirm
            title="Eliminar"
            description="¿Está seguro?"
            onConfirm={() => onEliminar(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button type="text" size="small" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        columns={columns}
        dataSource={partidas}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1200 }}
        pagination={false}
        footer={() => (
          <div className="flex justify-end gap-8 font-semibold">
            <span>
              Monto Presupuestado: $
              {totalPresupuestado.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              })}
            </span>
            <span>
              Monto Ejecutado: $
              {totalEjecutado.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        )}
      />
    </div>
  );
}
