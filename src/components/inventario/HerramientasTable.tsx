"use client";

import React, { useState } from "react";
import { Table, Tag, Space, Button, Popconfirm, Badge } from "antd";
import { Eye, Trash2, Edit2, Barcode, FileDown } from "lucide-react";
import BulkActionsBar from "@/components/BulkActionsBar";
import ImprimirCodigosBarraModal from "./ImprimirCodigosBarraModal";
import { generarCodigoHerramienta } from "@/services/inventario";
import { generarPdfCodigosBarra } from "@/lib/barcodePdf";
import toast from "react-hot-toast";
import type { Herramienta } from "@/types/inventario";

interface HerramientasTableProps {
  herramientas: Herramienta[];
  onEdit?: (herramienta: Herramienta) => void;
  onDelete?: (herramienta: Herramienta) => void;
  onVerDetalle?: (herramienta: Herramienta) => void;
  onEliminarMasivo?: (ids: number[]) => Promise<void>;
  onCodigoGenerado?: (herramientaId: number, codigo: string) => void;
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
  onEliminarMasivo,
  onCodigoGenerado,
}: HerramientasTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [herramientasParaImprimir, setHerramientasParaImprimir] = useState<Herramienta[] | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const handleDescargarPdf = async (seleccionadas: Herramienta[]) => {
    if (seleccionadas.length === 0) return;
    setGenerandoPdf(true);
    try {
      const conCodigo = await Promise.all(
        seleccionadas.map(async (h) => {
          if (h.codigo) return { nombre: h.nombre, codigo: h.codigo };
          try {
            const actualizada = await generarCodigoHerramienta(h.id);
            if (actualizada.codigo) {
              onCodigoGenerado?.(h.id, actualizada.codigo);
              return { nombre: h.nombre, codigo: actualizada.codigo };
            }
          } catch {
            // se filtra abajo si no se pudo generar
          }
          return null;
        })
      );

      const herramientasListas = conCodigo.filter(
        (h): h is { nombre: string; codigo: string } => h !== null
      );

      if (herramientasListas.length === 0) {
        toast.error("No se pudo generar el código de ninguna herramienta seleccionada");
        return;
      }
      if (herramientasListas.length < seleccionadas.length) {
        toast.error(
          `${seleccionadas.length - herramientasListas.length} herramienta(s) no se pudieron incluir`
        );
      }

      generarPdfCodigosBarra(herramientasListas);
      toast.success(`PDF generado con ${herramientasListas.length} código(s) de barra`);
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setGenerandoPdf(false);
    }
  };

  const toggleSelectId = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === herramientas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(herramientas.map((h) => h.id));
    }
  };

  const handleEliminarMasivo = async () => {
    if (!onEliminarMasivo || selectedIds.length === 0) return;
    setLoadingDelete(true);
    try {
      await onEliminarMasivo(selectedIds);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} herramienta(s) eliminada(s)`);
    } catch (error) {
      console.error("Error eliminando herramientas:", error);
      toast.error("Error al eliminar herramientas");
    } finally {
      setLoadingDelete(false);
    }
  };

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={selectedIds.length === herramientas.length && herramientas.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < herramientas.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      key: "checkbox",
      width: 45,
      align: "center" as const,
      render: (_: unknown, record: Herramienta) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(record.id)}
          onChange={() => toggleSelectId(record.id)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      title: "Herramienta",
      dataIndex: "nombre",
      key: "nombre",
      width: 200,
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 130,
      render: (categoria: string) => (
        <span className="text-sm text-gray-600">{categoria}</span>
      ),
    },
    {
      title: "Serie/Placa",
      dataIndex: "serie",
      key: "serie",
      width: 130,
      render: (serie: string | undefined) => (
        <span className="text-sm text-gray-600">{serie || "—"}</span>
      ),
    },
    {
      title: "Marca",
      dataIndex: "marca",
      key: "marca",
      width: 110,
      render: (marca: string | undefined) => (
        <span className="text-sm text-gray-600">{marca || "—"}</span>
      ),
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 90,
      render: (unidad: string | undefined) => (
        <span className="text-sm text-gray-600">{unidad || "—"}</span>
      ),
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 90,
      align: "center" as const,
      render: (cantidad: number | undefined) => (
        <span className="font-semibold text-gray-900">{cantidad || 1}</span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      render: (estado: string) => (
        <Tag color={ESTADO_COLOR[estado] || "default"}>
          {estado === "EN_USO" ? "En uso" : estado === "DISPONIBLE" ? "Disponible" : estado === "MANTENIMIENTO" ? "Mantenimiento" : "Descartada"}
        </Tag>
      ),
    },
    {
      title: "Ubicación en Depósito",
      dataIndex: "ubicacionDeposito",
      key: "ubicacionDeposito",
      width: 150,
      render: (ubicacion: string | undefined) => (
        <span className="text-sm text-gray-600">{ubicacion || "—"}</span>
      ),
    },
    {
      title: "Último Uso",
      dataIndex: "ultimoUsoDatos",
      key: "ultimoUsoDatos",
      width: 160,
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
      width: 110,
      render: (fecha: string) => {
        if (!fecha) return "—";
        return new Date(fecha).getFullYear();
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 110,
      render: (_, record: Herramienta) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Barcode size={16} />}
            onClick={() => setHerramientasParaImprimir([record])}
            title="Imprimir código de barra"
          />
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
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden ${selectedIds.length > 0 ? "pb-24" : ""}`}>
        <Table
          columns={columns}
          dataSource={herramientas.map((h) => ({ ...h, key: h.id }))}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
          scroll={{ x: 1400 }}
          locale={{ emptyText: "No hay herramientas registradas" }}
          rowClassName={(record: Herramienta) =>
            selectedIds.includes(record.id) ? "bg-blue-50" : ""
          }
        />
      </div>

      {onEliminarMasivo && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          totalCount={herramientas.length}
          onSelectAll={() => setSelectedIds(herramientas.map((h) => h.id))}
          onClearSelection={() => setSelectedIds([])}
          onDeleteSelected={() => {}}
          onConfirmDelete={handleEliminarMasivo}
          isLoading={loadingDelete}
          itemLabel="herramienta(s)"
          extraActions={
            <>
              <Button
                icon={<Barcode size={16} />}
                onClick={() =>
                  setHerramientasParaImprimir(herramientas.filter((h) => selectedIds.includes(h.id)))
                }
              >
                Imprimir códigos
              </Button>
              <Button
                icon={<FileDown size={16} />}
                loading={generandoPdf}
                onClick={() =>
                  handleDescargarPdf(herramientas.filter((h) => selectedIds.includes(h.id)))
                }
              >
                Descargar PDF
              </Button>
            </>
          }
        />
      )}

      <ImprimirCodigosBarraModal
        items={(herramientasParaImprimir || []).map((h) => ({
          id: h.id,
          nombre: h.nombre,
          codigo: h.codigo,
          unidad: h.unidad,
          cantidadSugerida: h.cantidad,
        }))}
        open={herramientasParaImprimir !== null}
        onClose={() => setHerramientasParaImprimir(null)}
        onCodigoGenerado={onCodigoGenerado}
        generarCodigo={(id) => generarCodigoHerramienta(id).then((h) => h.codigo)}
        itemLabel="herramienta"
      />
    </>
  );
}
