"use client";

import React from "react";
import { Modal, Table, Divider, Space, Tag } from "antd";
import { Calendar, Building2, FileText } from "lucide-react";
import type { FacturaCompra } from "@/types/inventario";
import { ESTADO_FACTURA_LABEL } from "@/types/inventario";

interface FacturaDetalleModalProps {
  open: boolean;
  factura: FacturaCompra | null;
  onClose: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: "default",
  APROBADA: "processing",
  PAGADA: "success",
  ANULADA: "error",
};

export default function FacturaDetalleModal({
  open,
  factura,
  onClose,
}: FacturaDetalleModalProps) {
  if (!factura) return null;

  const columnasItems = [
    {
      title: "Material",
      dataIndex: "materialNombre",
      key: "material",
      width: 250,
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 100,
      align: "right" as const,
      render: (cantidad: number) => <span className="font-semibold">{cantidad.toLocaleString("es-MX")}</span>,
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precio",
      width: 140,
      align: "right" as const,
      render: (precio: number) => (
        <span className="font-semibold text-gray-900">
          ${precio.toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 140,
      align: "right" as const,
      render: (subtotal: number) => (
        <span className="font-bold text-gray-900">
          ${subtotal.toLocaleString("es-MX")}
        </span>
      ),
    },
  ];

  const montoImpuesto = (factura.subtotal * (factura.impuesto || 0)) / 100;

  return (
    <Modal
      title={`Detalle Factura: ${factura.numero}`}
      open={open}
      onCancel={onClose}
      width="90vw"
      footer={null}
      bodyStyle={{ maxHeight: "85vh", overflowY: "auto", scrollbarWidth: "none" }}
      style={{ maxWidth: "1400px" }}
      centered
    >
      <style>{`
        .factura-detalle-scroll::-webkit-scrollbar {
          width: 0px;
        }
        .factura-detalle-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .factura-detalle-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
      <div className="space-y-6 factura-detalle-scroll">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Número
            </label>
            <p className="text-lg font-mono font-bold text-gray-900">{factura.numero}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Estado
            </label>
            <Tag
              color={ESTADO_COLOR[factura.estado]}
              className="text-sm"
            >
              {ESTADO_FACTURA_LABEL[factura.estado as keyof typeof ESTADO_FACTURA_LABEL]}
            </Tag>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Proveedor
            </label>
            <p className="text-sm font-semibold text-gray-900">{factura.proveedorNombre}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              <Calendar size={12} className="inline mr-1" />
              Fecha Factura
            </label>
            <p className="text-sm text-gray-900">
              {new Date(factura.fecha).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {factura.fechaRecepcion && (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Fecha Recepción
              </label>
              <p className="text-sm text-gray-900">
                {new Date(factura.fechaRecepcion).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {factura.proyectoNombre && (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                <Building2 size={12} className="inline mr-1" />
                Proyecto
              </label>
              <p className="text-sm text-gray-900">{factura.proyectoNombre}</p>
            </div>
          )}
        </div>

        {factura.proveedorRut && (
          <div className="rounded-lg bg-gray-50 px-4 py-2">
            <p className="text-xs text-gray-600 mb-1">RUT del Proveedor</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{factura.proveedorRut}</p>
          </div>
        )}

        <Divider />

        {/* Items */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={16} />
            Ítems de la Factura
          </h3>
          <Table
            columns={columnasItems}
            dataSource={factura.items.map((item) => ({ ...item, key: item.id }))}
            pagination={false}
            size="small"
            bordered
          />
        </div>

        <Divider />

        {/* Totales */}
        <div className="flex flex-col items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex gap-8 text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="w-40 text-right font-semibold text-gray-900">
              ${factura.subtotal.toLocaleString("es-MX")}
            </span>
          </div>
          {factura.impuesto && factura.impuesto > 0 && (
            <div className="flex gap-8 text-sm">
              <span className="text-gray-600">IVA ({factura.impuesto}%):</span>
              <span className="w-40 text-right font-semibold text-gray-900">
                ${montoImpuesto.toLocaleString("es-MX")}
              </span>
            </div>
          )}
          <div className="border-t border-gray-300 pt-2 w-full flex justify-end">
            <div className="flex gap-8 text-lg">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="w-40 text-right text-xl font-bold text-emerald-600">
                ${factura.total.toLocaleString("es-MX")}
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {factura.notas && (
          <>
            <Divider />
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-2">
                Notas
              </label>
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 border border-gray-200">
                {factura.notas}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
