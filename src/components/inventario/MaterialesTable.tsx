"use client";

import React, { useState } from "react";
import { Table, Button, Space, Popconfirm } from "antd";
import { TrendingUp, Edit2, Trash2, Barcode, FileDown, ArrowRightLeft } from "lucide-react";
import BulkActionsBar from "@/components/BulkActionsBar";
import ImprimirCodigosBarraModal from "./ImprimirCodigosBarraModal";
import { generarCodigoMaterial } from "@/services/inventario";
import { generarPdfCodigosBarra } from "@/lib/barcodePdf";
import toast from "react-hot-toast";
import type { MaterialConEstado } from "@/types/inventario";

interface MaterialesTableProps {
  materiales: MaterialConEstado[];
  onEditar?: (material: MaterialConEstado) => void;
  onEliminar?: (id: number) => Promise<void>;
  onEliminarMasivo?: (ids: number[]) => Promise<void>;
  onCodigoGenerado?: (materialId: number, codigo: string) => void;
  /** Cuando se pasa, aparece un botón de transferir por fila (pensado para
   * cuando la tabla está filtrada a una ubicación específica: obra o Nodo). */
  onTransferir?: (material: MaterialConEstado) => void;
}

function HistorialExpandable({ material }: { material: MaterialConEstado }) {
  const historial = material.historialPrecios || [];

  if (historial.length === 0) {
    return (
      <div className="px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-500">Sin historial de precios</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-blue-600" />
        <h4 className="font-semibold text-gray-900">Historial de Precios</h4>
      </div>
      <div className="space-y-2">
        {historial
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .map((h, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-2 border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {new Date(h.fecha).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  ${h.precio.toLocaleString("es-MX")} / {material.unidad}
                </span>
                {h.cantidad && (
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    {h.cantidad} unidades
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function MaterialesTable({ materiales, onEditar, onEliminar, onEliminarMasivo, onCodigoGenerado, onTransferir }: MaterialesTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [materialesParaImprimir, setMaterialesParaImprimir] = useState<MaterialConEstado[] | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const handleDescargarPdf = async (seleccionados: MaterialConEstado[]) => {
    if (seleccionados.length === 0) return;
    setGenerandoPdf(true);
    try {
      const conCodigo = await Promise.all(
        seleccionados.map(async (m) => {
          if (m.codigo) return { nombre: m.nombre, codigo: m.codigo };
          try {
            const actualizado = await generarCodigoMaterial(m.id);
            if (actualizado.codigo) {
              onCodigoGenerado?.(m.id, actualizado.codigo);
              return { nombre: m.nombre, codigo: actualizado.codigo };
            }
          } catch {
            // se filtra abajo si no se pudo generar
          }
          return null;
        })
      );

      const materialesListos = conCodigo.filter(
        (m): m is { nombre: string; codigo: string } => m !== null
      );

      if (materialesListos.length === 0) {
        toast.error("No se pudo generar el código de ningún material seleccionado");
        return;
      }
      if (materialesListos.length < seleccionados.length) {
        toast.error(
          `${seleccionados.length - materialesListos.length} material(es) no se pudieron incluir`
        );
      }

      generarPdfCodigosBarra(materialesListos);
      toast.success(`PDF generado con ${materialesListos.length} código(s) de barra`);
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
    if (selectedIds.length === materiales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(materiales.map((m) => m.id));
    }
  };

  const handleEliminarMasivo = async () => {
    if (!onEliminarMasivo || selectedIds.length === 0) return;
    setLoadingDelete(true);
    try {
      await onEliminarMasivo(selectedIds);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} material(es) eliminado(s)`);
    } catch (error) {
      console.error("Error eliminando materiales:", error);
      toast.error("Error al eliminar materiales");
    } finally {
      setLoadingDelete(false);
    }
  };

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={selectedIds.length === materiales.length && materiales.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < materiales.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      key: "checkbox",
      width: 45,
      align: "center" as const,
      render: (_: unknown, record: MaterialConEstado) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(record.id)}
          onChange={() => toggleSelectId(record.id)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      title: "Material",
      dataIndex: "nombre",
      key: "nombre",
      width: 220,
      render: (texto: string) => <span className="font-semibold text-gray-900">{texto}</span>,
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 140,
      render: (cat: string) => (
        <span className="text-sm">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
      ),
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 100,
      render: (unit: string) => <span className="text-sm text-gray-600">{unit}</span>,
    },
    {
      title: "Proyecto/Obra",
      dataIndex: "proyectoNombre",
      key: "proyecto",
      width: 140,
      render: (nombre: string | undefined, record: MaterialConEstado) => {
        if (!nombre && !record.obraNombre) {
          return <span className="text-gray-400">Sin asignar</span>;
        }
        return (
          <div className="text-sm">
            {nombre && <div className="font-medium text-gray-900">{nombre}</div>}
            {record.obraNombre && <div className="text-gray-500 text-xs">Obra: {record.obraNombre}</div>}
          </div>
        );
      },
    },
    {
      title: "Stock",
      dataIndex: "stockActual",
      key: "stock",
      width: 100,
      align: "right" as const,
      render: (stock: number | undefined) => (
        <span className="font-semibold text-gray-900">{(stock || 0).toLocaleString("es-MX")}</span>
      ),
    },
    {
      title: "Mínimo",
      dataIndex: "stockMinimo",
      key: "minimo",
      width: 100,
      align: "right" as const,
      render: (minimo: number | undefined) => (
        <span className="text-sm text-gray-600">{minimo ? minimo.toLocaleString("es-MX") : "—"}</span>
      ),
    },
    {
      title: "Precio Prom.",
      dataIndex: "precioPromedio",
      key: "precio",
      width: 140,
      align: "right" as const,
      render: (precio: number | undefined) => (
        <span className="text-sm font-semibold text-gray-900">
          ${(precio || 0).toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "Valor Total",
      dataIndex: "valorTotalStock",
      key: "valorTotal",
      width: 150,
      align: "right" as const,
      render: (valor: number | undefined) => (
        <span className="font-semibold text-gray-900">
          ${(valor || 0).toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_: unknown, record: MaterialConEstado) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Barcode size={16} />}
            onClick={() => setMaterialesParaImprimir([record])}
            title="Imprimir código de barra"
          />
          {onTransferir && (
            <Button
              type="text"
              size="small"
              icon={<ArrowRightLeft size={16} />}
              disabled={record.stockActual <= 0}
              onClick={() => onTransferir(record)}
              title="Transferir a una obra u otra ubicación"
            />
          )}
          {onEditar && (
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={16} />}
              onClick={() => onEditar(record)}
              title="Editar"
            />
          )}
          {onEliminar && (
            <Popconfirm
              title="¿Eliminar este material?"
              description="Se eliminará del catálogo junto con su historial de precios."
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => onEliminar(record.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={16} />}
                title="Eliminar"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className={selectedIds.length > 0 ? "pb-24" : ""}>
        <Table
          columns={columns}
          dataSource={materiales.map((m) => ({ ...m, key: m.id }))}
          pagination={{ pageSize: 15 }}
          size="small"
          bordered
          className="bg-white rounded-lg"
          rowClassName={(record: MaterialConEstado) =>
            selectedIds.includes(record.id) ? "bg-blue-50" : ""
          }
          expandable={{
            expandedRowRender: (record: MaterialConEstado) => (
              <HistorialExpandable material={record} />
            ),
            expandedRowClassName: () => "bg-gray-50",
          }}
        />
      </div>

      {onEliminarMasivo && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          totalCount={materiales.length}
          onSelectAll={() => setSelectedIds(materiales.map((m) => m.id))}
          onClearSelection={() => setSelectedIds([])}
          onDeleteSelected={() => {}}
          onConfirmDelete={handleEliminarMasivo}
          isLoading={loadingDelete}
          itemLabel="material(es)"
          extraActions={
            <>
              <Button
                icon={<Barcode size={16} />}
                onClick={() =>
                  setMaterialesParaImprimir(materiales.filter((m) => selectedIds.includes(m.id)))
                }
              >
                Imprimir códigos
              </Button>
              <Button
                icon={<FileDown size={16} />}
                loading={generandoPdf}
                onClick={() =>
                  handleDescargarPdf(materiales.filter((m) => selectedIds.includes(m.id)))
                }
              >
                Descargar PDF
              </Button>
            </>
          }
        />
      )}

      <ImprimirCodigosBarraModal
        items={(materialesParaImprimir || []).map((m) => ({
          id: m.id,
          nombre: m.nombre,
          codigo: m.codigo,
          unidad: m.unidad,
          cantidadSugerida: m.stockActual,
        }))}
        open={materialesParaImprimir !== null}
        onClose={() => setMaterialesParaImprimir(null)}
        onCodigoGenerado={onCodigoGenerado}
        generarCodigo={(id) => generarCodigoMaterial(id).then((m) => m.codigo)}
        itemLabel="material"
      />
    </>
  );
}
