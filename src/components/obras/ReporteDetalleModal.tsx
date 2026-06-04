import React from "react";
import { Modal, Table, Empty, Divider } from "antd";
import type { ReporteDiario } from "@/types/obras";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  reporte: ReporteDiario | null;
  onClose: () => void;
}

export default function ReporteDetalleModal({ open, reporte, onClose }: Props) {
  if (!reporte) return null;

  const personalColumns = [
    {
      title: "Nombre",
      dataIndex: "personalNombre",
      key: "personalNombre",
    },
    {
      title: "Cargo",
      dataIndex: "cargo",
      key: "cargo",
    },
    {
      title: "Horas",
      dataIndex: "horasTrabajadas",
      key: "horasTrabajadas",
      align: "right" as const,
    },
    {
      title: "Costo/Hr",
      dataIndex: "costoPorHora",
      key: "costoPorHora",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      align: "right" as const,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      align: "right" as const,
    },
  ];

  const materialColumns = [
    {
      title: "Material",
      dataIndex: "materialNombre",
      key: "materialNombre",
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      align: "right" as const,
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      align: "right" as const,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      align: "right" as const,
    },
  ];

  return (
    <Modal
      title="Detalle de Reporte"
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnHidden
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-600 uppercase">Fecha</p>
            <p className="text-sm font-semibold">
              {dayjs(reporte.fecha).format("DD MMMM YYYY")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Partida</p>
            <p className="text-sm font-semibold">
              {reporte.partidaCodigo} - {reporte.partidaDescripcion}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Avance Logrado</p>
            <p className="text-sm font-semibold">{reporte.avanceLogrado}%</p>
          </div>
          {reporte.observaciones && (
            <div>
              <p className="text-xs text-gray-600 uppercase">Observaciones</p>
              <p className="text-sm">{reporte.observaciones}</p>
            </div>
          )}
        </div>

        <Divider />

        {/* Personal */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Personal</h3>
          {reporte.personal.length > 0 ? (
            <Table
              columns={personalColumns}
              dataSource={reporte.personal}
              rowKey="id"
              size="small"
              pagination={false}
              bordered
            />
          ) : (
            <Empty description="Sin personal registrado" />
          )}
        </div>

        {/* Materiales */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Materiales Consumidos</h3>
          {reporte.materiales.length > 0 ? (
            <Table
              columns={materialColumns}
              dataSource={reporte.materiales}
              rowKey="id"
              size="small"
              pagination={false}
              bordered
            />
          ) : (
            <Empty description="Sin materiales registrados" />
          )}
        </div>

        <Divider />

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 uppercase">Costo Mano de Obra</p>
            <p className="text-lg font-bold text-blue-600">
              ${reporte.costoManoObra.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <p className="text-xs text-gray-600 uppercase">Costo Materiales</p>
            <p className="text-lg font-bold text-cyan-600">
              ${reporte.costoMateriales.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 uppercase">Costo Total</p>
            <p className="text-lg font-bold text-green-600">
              ${reporte.costoTotal.toLocaleString("es-CO", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
