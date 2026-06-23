import React, { useState } from "react";
import { Table, Button, Popconfirm, Tooltip } from "antd";
import { Edit2, Trash2, History, PlusCircle } from "lucide-react";
import type { Partida } from "@/types/obras";
import AvanceGauge from "./AvanceGauge";
import PrecioHistorialDrawer from "./PrecioHistorialDrawer";
import {
  calcularMontoPresupuestado,
  calcularMontoEjecutado,
} from "@/lib/obras";

interface Props {
  partidas: Partida[];
  onEditar: (partida: Partida) => void;
  onEliminar: (id: number) => void;
  onCrearExtra?: (partida: Partida) => void;
}

export default function PartidasTable({ partidas, onEditar, onEliminar, onCrearExtra }: Props) {
  const [historialPartida, setHistorialPartida] = useState<Partida | null>(null);

  const totalPresupuestado = partidas.reduce((sum, p) => sum + calcularMontoPresupuestado(p), 0);
  const totalEjecutado = partidas.reduce((sum, p) => sum + calcularMontoEjecutado(p), 0);

  // ─── Vista Individual columns ─────────────────────────────────────────────────
  const columnsIndividual = [
    {
      title: "N°",
      key: "numero",
      width: 50,
      align: "center" as const,
      render: (_: unknown, __: Partida, index: number) => index + 1,
    },
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 110,
      render: (text: string, record: Partida) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{text}</span>
          {record.esExtra && (
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">
              Extra
            </span>
          )}
        </div>
      ),
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
      render: (val: number, record: Partida) => record.esExtra ? "—" : val.toFixed(2),
      align: "right" as const,
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      width: 130,
      align: "right" as const,
      render: (val: number, record: Partida) => (
        <div className="flex items-center justify-end gap-1.5">
          <span>${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
          <Tooltip title="Ver historial de precios">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setHistorialPartida(record); }}
              className="text-slate-300 hover:text-amber-500 transition-colors"
            >
              <History size={13} />
            </button>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Monto Presup.",
      key: "montoPresupuestado",
      width: 130,
      render: (_: unknown, record: Partida) => {
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
      render: (_: unknown, record: Partida) => {
        const monto = calcularMontoEjecutado(record);
        return `$${monto.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
      },
      align: "right" as const,
    },
    {
      title: "Avance",
      key: "avance",
      width: 80,
      render: (_: unknown, record: Partida) => (
        <AvanceGauge porcentaje={record.avancePorcentaje} size="sm" />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: onCrearExtra ? 130 : 90,
      render: (_: unknown, record: Partida, index: number) => (
        <div className="flex gap-1 items-center">
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={16} />}
            onClick={() => onEditar({ ...record, numero: index + 1 })}
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
          {onCrearExtra && !record.esExtra && record.avancePorcentaje >= 100 && (
            <Tooltip title="Crear Partida Extra ligada a esta">
              <Button
                type="text"
                size="small"
                icon={<PlusCircle size={15} />}
                style={{ color: "#16a34a" }}
                onClick={() => onCrearExtra(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];


  return (
    <>
      <Table
        columns={columnsIndividual as any}
        dataSource={partidas}
        rowKey="id"
        size="small"
        bordered
        scroll={{ x: 1200 }}
        pagination={false}
        rowClassName={(record: Partida) => record.esExtra ? "bg-green-50" : ""}
        footer={() => (
          <div className="flex justify-end gap-8 font-semibold">
            <span>
              Monto Presupuestado: $
              {totalPresupuestado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </span>
            <span>
              Monto Ejecutado: $
              {totalEjecutado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      />

      <PrecioHistorialDrawer
        open={historialPartida !== null}
        partida={historialPartida}
        onClose={() => setHistorialPartida(null)}
      />
    </>
  );
}
