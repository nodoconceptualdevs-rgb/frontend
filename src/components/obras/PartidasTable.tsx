import React, { useState } from "react";
import { Table, Button, Popconfirm, Tooltip } from "antd";
import { Edit2, Trash2, History, PlusCircle } from "lucide-react";
import type { Partida } from "@/types/obras";
import AvanceGauge from "./AvanceGauge";
import PrecioHistorialDrawer from "./PrecioHistorialDrawer";
import BulkActionsBar from "@/components/BulkActionsBar";
import toast from "react-hot-toast";
import {
  calcularMontoPresupuestado,
  calcularMontoEjecutado,
} from "@/lib/obras";

interface Props {
  partidas: Partida[];
  onEditar?: (partida: Partida) => void;
  onEliminar?: (id: number) => void;
  onEliminarMasivo?: (ids: number[]) => Promise<void>;
  onCrearExtra?: (partida: Partida) => void;
}

export default function PartidasTable({ partidas, onEditar, onEliminar, onEliminarMasivo, onCrearExtra }: Props) {
  const [historialPartida, setHistorialPartida] = useState<Partida | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const totalPresupuestado = partidas.reduce((sum, p) => sum + calcularMontoPresupuestado(p), 0);
  const totalEjecutado = partidas.reduce((sum, p) => sum + calcularMontoEjecutado(p), 0);

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === partidas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(partidas.map((p) => p.id));
    }
  };

  const handleEliminarMasivo = async () => {
    console.log("🎯 handleEliminarMasivo llamado");
    console.log("📌 selectedIds:", selectedIds);
    console.log("📌 onEliminarMasivo existe:", !!onEliminarMasivo);

    if (!onEliminarMasivo || selectedIds.length === 0) {
      console.warn("⚠️ Abortando: onEliminarMasivo no existe o no hay selección");
      return;
    }

    setLoadingDelete(true);
    try {
      console.log("🚀 Llamando a onEliminarMasivo con IDs:", selectedIds);
      await onEliminarMasivo(selectedIds);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} partida(s) eliminada(s)`);
    } catch (error) {
      console.error("❌ Error eliminando partidas:", error);
      toast.error("Error al eliminar partidas");
    } finally {
      setLoadingDelete(false);
    }
  };

  // ─── Vista Individual columns ─────────────────────────────────────────────────
  const columnsIndividual = [
    {
      title: (
        <input
          type="checkbox"
          checked={selectedIds.length === partidas.length && partidas.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < partidas.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      key: "checkbox",
      width: 45,
      align: "center" as const,
      render: (_: unknown, record: Partida) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(record.id)}
          onChange={() => toggleSelectId(record.id)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
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
      width: onCrearExtra ? 80 : 50,
      render: (_: unknown, record: Partida, index: number) => (
        <div className="flex gap-1 items-center">
          {onEditar && (
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={16} />}
              onClick={() => onEditar({ ...record, numero: index + 1 })}
            />
          )}
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
      <div className={selectedIds.length > 0 ? "pb-24" : ""}>
        <Table
          columns={columnsIndividual as any}
          dataSource={partidas}
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: 1200 }}
          pagination={false}
          rowClassName={(record: Partida) =>
            `${record.esExtra ? "bg-green-50" : ""} ${
              selectedIds.includes(record.id) ? "bg-blue-50" : ""
            }`
          }
          footer={() => (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-8 font-semibold">
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
      </div>

      {onEliminarMasivo && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          totalCount={partidas.length}
          onSelectAll={() => setSelectedIds(partidas.map((p) => p.id))}
          onClearSelection={() => setSelectedIds([])}
          onDeleteSelected={() => {}}
          onConfirmDelete={handleEliminarMasivo}
          isLoading={loadingDelete}
          itemLabel="partida(s)"
        />
      )}

      <PrecioHistorialDrawer
        open={historialPartida !== null}
        partida={historialPartida}
        onClose={() => setHistorialPartida(null)}
      />
    </>
  );
}
