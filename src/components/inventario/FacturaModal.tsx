"use client";

import React, { useState, useCallback } from "react";
import { Modal, Form, Input, DatePicker, Select, Button, Table, InputNumber, Space, message, Divider } from "antd";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import type { FacturaFormValues, LineaFacturaFormValues, MaterialCatalogo } from "@/types/inventario";
import AgregarMaterialModal from "./AgregarMaterialModal";

interface FacturaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FacturaFormValues) => Promise<void>;
  materiales: MaterialCatalogo[];
  proyectos?: Array<{ id: number; nombre: string }>;
  obras?: Array<{ id: number; nombre: string; proyectoId: number }>;
}

interface LineaEditando extends LineaFacturaFormValues {
  id: string;
  materialNombre?: string;
  unidad?: string;
  subtotal?: number;
}

export default function FacturaModal({
  open,
  onClose,
  onSubmit,
  materiales,
  proyectos = [],
  obras = [],
}: FacturaModalProps) {
  const [numero, setNumero] = useState("");
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [proveedorRut, setProveedorRut] = useState("");
  const [fecha, setFecha] = useState<any>(dayjs());
  const [fechaRecepcion, setFechaRecepcion] = useState<any>(null);
  const [proyectoId, setProyectoId] = useState<number | undefined>();
  const [obraId, setObraId] = useState<number | undefined>();
  const [impuesto, setImpuesto] = useState(19);
  const [notas, setNotas] = useState("");

  const [lineas, setLineas] = useState<LineaEditando[]>([]);
  const [loading, setLoading] = useState(false);
  const [agregarMaterialOpen, setAgregarMaterialOpen] = useState(false);
  const [materialesActualizados, setMaterialesActualizados] = useState<MaterialCatalogo[]>(materiales);
  const [lineaSeleccionada, setLineaSeleccionada] = useState<string | null>(null);

  const handleAgregarLinea = useCallback(() => {
    const nuevaLinea: LineaEditando = {
      id: Math.random().toString(36).slice(2, 9),
      materialId: 0,
      cantidad: 1,
      precioUnitario: 0,
    };
    setLineas([...lineas, nuevaLinea]);
  }, [lineas]);

  const handleMaterialCreado = (material: MaterialCatalogo) => {
    setMaterialesActualizados([...materialesActualizados, material]);
    setAgregarMaterialOpen(false);

    // Si hay una línea seleccionada, asignale el nuevo material
    if (lineaSeleccionada) {
      handleActualizarLinea(lineaSeleccionada, "materialId", material.id);
      setLineaSeleccionada(null);
    }
  };

  const handleEliminarLinea = useCallback((id: string) => {
    setLineas(lineas.filter((l) => l.id !== id));
  }, [lineas]);

  const handleActualizarLinea = useCallback(
    (id: string, campo: keyof LineaEditando, valor: any) => {
      setLineas(
        lineas.map((l) => {
          if (l.id !== id) return l;

          const actualizada = { ...l, [campo]: valor };

          // Si cambió el material, llenar unidad automáticamente
          if (campo === "materialId" && valor) {
            const material = materiales.find((m) => m.id === valor);
            if (material) {
              actualizada.materialNombre = material.nombre;
              actualizada.unidad = material.unidad;
            }
          }

          // Recalcular subtotal
          if (campo === "cantidad" || campo === "precioUnitario") {
            actualizada.subtotal = (actualizada.cantidad || 0) * (actualizada.precioUnitario || 0);
          }

          return actualizada;
        })
      );
    },
    [lineas, materiales]
  );

  const calcularTotales = () => {
    const subtotal = lineas.reduce((sum, l) => sum + (l.subtotal || 0), 0);
    const montoImpuesto = (subtotal * impuesto) / 100;
    const total = subtotal + montoImpuesto;
    return { subtotal, montoImpuesto, total };
  };

  const { subtotal, montoImpuesto, total } = calcularTotales();

  const columnas = [
    {
      title: "Material",
      dataIndex: "materialId",
      key: "material",
      width: 200,
      render: (_: any, record: LineaEditando) => (
        <div className="flex gap-1">
          <Select
            value={record.materialId || undefined}
            onChange={(val) => {
              handleActualizarLinea(record.id, "materialId", val);
            }}
            placeholder="Selecciona material"
            options={materialesActualizados.map((m) => ({
              value: m.id,
              label: `${m.nombre} (${m.unidad})`,
            }))}
            className="flex-1"
            size="small"
          />
          <Button
            type="dashed"
            size="small"
            icon={<Plus size={14} />}
            onClick={() => {
              setLineaSeleccionada(record.id);
              setAgregarMaterialOpen(true);
            }}
            title="Agregar nuevo material"
          />
        </div>
      ),
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 100,
      render: (_: any, record: LineaEditando) => (
        <Input
          value={record.unidad || ""}
          disabled
          size="small"
          className="text-center"
        />
      ),
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 120,
      render: (_: any, record: LineaEditando) => (
        <InputNumber
          value={record.cantidad}
          onChange={(val) => handleActualizarLinea(record.id, "cantidad", val || 0)}
          min={0}
          step={1}
          precision={2}
          className="w-full"
          size="small"
        />
      ),
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precio",
      width: 140,
      render: (_: any, record: LineaEditando) => (
        <InputNumber
          value={record.precioUnitario}
          onChange={(val) => handleActualizarLinea(record.id, "precioUnitario", val || 0)}
          min={0}
          step={500}
          precision={0}
          formatter={(val) => `$${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(val) => parseFloat(val?.replace(/\$\s?|(,*)/g, "") || "0")}
          className="w-full"
          size="small"
        />
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 150,
      render: (_: any, record: LineaEditando) => (
        <span className="font-semibold text-gray-900">
          ${(record.subtotal || 0).toLocaleString("es-MX")}
        </span>
      ),
    },
    {
      title: "",
      key: "acciones",
      width: 50,
      render: (_: any, record: LineaEditando) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={() => handleEliminarLinea(record.id)}
        />
      ),
    },
  ];

  const handleSubmit = async (borrador: boolean) => {
    try {
      if (!numero.trim()) {
        toast.error("Número de factura es requerido");
        return;
      }
      if (!proveedorNombre.trim()) {
        toast.error("Proveedor es requerido");
        return;
      }
      if (lineas.length === 0) {
        toast.error("Debe agregar al menos un ítem");
        return;
      }

      const values: FacturaFormValues = {
        numero,
        proveedorNombre,
        proveedorRut: proveedorRut || undefined,
        fecha: fecha.toISOString(),
        fechaRecepcion: fechaRecepcion?.toISOString(),
        proyectoId,
        obraId,
        items: lineas.map((l) => ({
          materialId: l.materialId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
        impuesto: impuesto || undefined,
        notas: notas || undefined,
      };

      setLoading(true);
      await onSubmit(values);
      toast.success(borrador ? "Factura guardada como borrador" : "Factura aprobada");

      // Limpiar formulario
      setNumero("");
      setProveedorNombre("");
      setProveedorRut("");
      setFecha(dayjs());
      setFechaRecepcion(null);
      setProyectoId(undefined);
      setImpuesto(19);
      setNotas("");
      setLineas([]);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Nueva Factura de Compra"
      open={open}
      onCancel={() => {
        setNumero("");
        setProveedorNombre("");
        setProveedorRut("");
        setFecha(dayjs());
        setFechaRecepcion(null);
        setProyectoId(undefined);
        setImpuesto(19);
        setNotas("");
        setLineas([]);
        onClose();
      }}
      width="90vw"
      style={{ maxWidth: "1600px" }}
      centered
      footer={null}
    >
      <div className="space-y-4">
        {/* Header: Información de factura */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Número de Factura
            </label>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="F-001-2026"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Proveedor
            </label>
            <Input
              value={proveedorNombre}
              onChange={(e) => setProveedorNombre(e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              RUT
            </label>
            <Input
              value={proveedorRut}
              onChange={(e) => setProveedorRut(e.target.value)}
              placeholder="12.345.678-9"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Fecha Factura
            </label>
            <DatePicker value={fecha} onChange={setFecha} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Fecha Recepción
            </label>
            <DatePicker value={fechaRecepcion} onChange={setFechaRecepcion} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Proyecto
            </label>
            <Select
              value={proyectoId}
              onChange={(val) => {
                setProyectoId(val);
                setObraId(undefined); // reset obra when project changes
              }}
              placeholder="Selecciona proyecto"
              options={proyectos.map((p) => ({
                value: p.id,
                label: p.nombre,
              }))}
              allowClear
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Obra (opcional)
            </label>
            <Select
              value={obraId}
              onChange={(val) => {
                setObraId(val);
                // auto-fill proyecto if not set
                if (val && !proyectoId) {
                  const obra = obras.find((o) => o.id === val);
                  if (obra) setProyectoId(obra.proyectoId);
                }
              }}
              placeholder="Selecciona obra"
              options={(proyectoId
                ? obras.filter((o) => o.proyectoId === proyectoId)
                : obras
              ).map((o) => ({ value: o.id, label: o.nombre }))}
              allowClear
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              IVA %
            </label>
            <InputNumber value={impuesto} onChange={(val) => setImpuesto(val || 0)} min={0} max={100} className="w-full" />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Notas
          </label>
          <Input.TextArea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Observaciones sobre la compra"
          />
        </div>

        {/* Ítems */}
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-gray-900">Ítems de Factura</h3>

          <Table
            columns={columnas}
            dataSource={lineas}
            pagination={false}
            size="small"
            bordered
            rowKey="id"
            className="bg-white"
          />

          <div className="mt-3">
            <Button
              type="dashed"
              size="large"
              icon={<Plus size={16} />}
              onClick={handleAgregarLinea}
              className="w-full"
            >
              Agregar ítem
            </Button>
          </div>
        </div>

        {/* Totales */}
        <div className="flex flex-col items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex gap-8 text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="w-40 text-right font-semibold text-gray-900">
              ${subtotal.toLocaleString("es-MX")}
            </span>
          </div>
          <div className="flex gap-8 text-sm">
            <span className="text-gray-600">
              IVA ({impuesto}%):
            </span>
            <span className="w-40 text-right font-semibold text-gray-900">
              ${montoImpuesto.toLocaleString("es-MX")}
            </span>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <div className="flex gap-8 text-lg">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="w-40 text-right text-xl font-bold text-emerald-600">
                ${total.toLocaleString("es-MX")}
              </span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={() => {
              setNumero("");
              setProveedorNombre("");
              setProveedorRut("");
              setFecha(dayjs());
              setFechaRecepcion(null);
              setProyectoId(undefined);
              setImpuesto(19);
              setNotas("");
              setLineas([]);
              onClose();
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="default"
            onClick={() => handleSubmit(true)}
            loading={loading}
          >
            Guardar como Borrador
          </Button>
          <Button
            type="primary"
            onClick={() => handleSubmit(false)}
            loading={loading}
          >
            Aprobar Factura
          </Button>
        </div>
      </div>

      {/* Modal para agregar nuevo material */}
      <AgregarMaterialModal
        open={agregarMaterialOpen}
        onClose={() => {
          setAgregarMaterialOpen(false);
          setLineaSeleccionada(null);
        }}
        onMaterialCreado={handleMaterialCreado}
      />
    </Modal>
  );
}
