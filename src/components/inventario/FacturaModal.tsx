"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Modal, Input, DatePicker, Select, Button, Table, InputNumber, Divider, Popconfirm } from "antd";
import { Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import api from "@/lib/api";
import type { FacturaFormValues, LineaFacturaFormValues, MaterialCatalogo, FacturaCompra, Proveedor, ProveedorFormValues } from "@/types/inventario";
import AgregarMaterialModal from "./AgregarMaterialModal";
import { getProveedores, createProveedor, deleteProveedor } from "@/services/proveedores";

interface FacturaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FacturaFormValues) => Promise<void>;
  materiales: MaterialCatalogo[];
  proyectos?: Array<{ id: number; nombre: string }>;
  obras?: Array<{ id: number; nombre: string; proyectoId?: number; proyectoNombre?: string }>;
  facturaEditar?: FacturaCompra;
  mostrarSelectorObra?: boolean;
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
  facturaEditar,
  mostrarSelectorObra = false,
}: FacturaModalProps) {
  const [numero, setNumero] = useState("");
  const [proveedorId, setProveedorId] = useState<number | undefined>();
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [proveedorRut, setProveedorRut] = useState("");
  const [fecha, setFecha] = useState<any>(dayjs());
  const [fechaRecepcion, setFechaRecepcion] = useState<any>(null);
  const [proyectoId, setProyectoId] = useState<number | undefined>();
  const [proyectoNombre, setProyectoNombre] = useState<string | undefined>();
  const [obraId, setObraId] = useState<number | undefined>();
  const [impuesto, setImpuesto] = useState(19);
  const [notas, setNotas] = useState("");

  const [lineas, setLineas] = useState<LineaEditando[]>([]);
  const [loading, setLoading] = useState(false);
  const [agregarMaterialOpen, setAgregarMaterialOpen] = useState(false);
  const [materialesActualizados, setMaterialesActualizados] = useState<MaterialCatalogo[]>(materiales);
  const [lineaSeleccionada, setLineaSeleccionada] = useState<string | null>(null);

  // Proveedores
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState("");
  const [nuevoProveedorRut, setNuevoProveedorRut] = useState("");
  const [guardandoProveedor, setGuardandoProveedor] = useState(false);

  // Cargar proveedores al abrir
  useEffect(() => {
    if (!open) return;
    setCargandoProveedores(true);
    getProveedores()
      .then(setProveedores)
      .catch(() => toast.error("Error al cargar proveedores"))
      .finally(() => setCargandoProveedores(false));
  }, [open]);

  // Rellenar campos al editar o cargar próximo número al crear
  useEffect(() => {
    if (open && facturaEditar) {
      setNumero(facturaEditar.numero);
      setProveedorId(facturaEditar.proveedorId);
      setProveedorNombre(facturaEditar.proveedorNombre);
      setProveedorRut(facturaEditar.proveedorRut || "");
      setFecha(dayjs(facturaEditar.fecha));
      setFechaRecepcion(facturaEditar.fechaRecepcion ? dayjs(facturaEditar.fechaRecepcion) : null);
      setProyectoId(facturaEditar.proyectoId);
      setProyectoNombre(facturaEditar.proyectoNombre);
      setObraId(facturaEditar.obraId);
      setImpuesto(facturaEditar.impuesto || 19);
      setNotas(facturaEditar.notas || "");
      const lineasEdicion = facturaEditar.items.map((item) => ({
        id: item.id,
        materialId: item.materialId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        materialNombre: item.materialNombre,
        unidad: item.unidad,
        subtotal: item.subtotal,
      }));
      setLineas(lineasEdicion);
    } else if (open) {
      resetForm();
      // Si hay una sola obra, pre-seleccionarla
      if (obras && obras.length === 1) {
        console.log("🟢 Pre-seleccionando obra única:", obras[0]);
        setObraId(obras[0].id);
        if (obras[0].proyectoId) {
          console.log("🟢 Asignando proyectoId:", obras[0].proyectoId);
          setProyectoId(obras[0].proyectoId);
          setProyectoNombre(obras[0].proyectoNombre);
        }
      }
      // Obtener próximo número del backend
      api.get('/factura-compras/generar-numero')
        .then((res) => setNumero(res.data.data.numero))
        .catch(() => setNumero(""));
    }
  }, [open, facturaEditar, obras]);

  // Auto-completar proyecto cuando se selecciona una obra
  useEffect(() => {
    if (obraId && obras.length > 0) {
      const obraSeleccionada = obras.find((o) => o.id === obraId);
      if (obraSeleccionada?.proyectoId) {
        console.log("🔵 Obra seleccionada, actualizando proyectoId:", obraSeleccionada.proyectoId);
        setProyectoId(obraSeleccionada.proyectoId);
        setProyectoNombre(obraSeleccionada.proyectoNombre);
      }
    }
  }, [obraId, obras]);

  const resetForm = () => {
    setNumero("");
    setProveedorId(undefined);
    setProveedorNombre("");
    setProveedorRut("");
    setFecha(dayjs());
    setFechaRecepcion(null);
    setProyectoId(undefined);
    setProyectoNombre(undefined);
    setObraId(undefined);
    setImpuesto(19);
    setNotas("");
    setLineas([]);
  };

  const handleSeleccionarProveedor = (id: number) => {
    const p = proveedores.find((x) => x.id === id);
    if (p) {
      setProveedorId(p.id);
      setProveedorNombre(p.nombre);
      setProveedorRut(p.rut || "");
    }
  };

  const handleCrearProveedor = async () => {
    if (!nuevoProveedorNombre.trim()) {
      toast.error("El nombre del proveedor es requerido");
      return;
    }
    try {
      setGuardandoProveedor(true);
      const creado = await createProveedor({
        nombre: nuevoProveedorNombre.trim(),
        rut: nuevoProveedorRut.trim() || undefined,
      });
      setProveedores((prev) => [...prev, creado]);
      handleSeleccionarProveedor(creado.id);
      setNuevoProveedorNombre("");
      setNuevoProveedorRut("");
      toast.success("Proveedor creado");
    } catch {
      toast.error("Error al crear proveedor");
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const handleEliminarProveedor = async (id: number, documentId: string) => {
    try {
      await deleteProveedor(documentId);
      setProveedores((prev) => prev.filter((p) => p.id !== id));
      if (proveedorId === id) {
        setProveedorId(undefined);
        setProveedorNombre("");
        setProveedorRut("");
      }
      toast.success("Proveedor eliminado");
    } catch {
      toast.error("Error al eliminar proveedor");
    }
  };

  const handleAgregarLinea = useCallback(() => {
    const nuevaLinea: LineaEditando = {
      id: Math.random().toString(36).slice(2, 9),
      materialId: 0,
      cantidad: 1,
      precioUnitario: 0,
    };
    setLineas((prev) => [...prev, nuevaLinea]);
  }, []);

  const handleMaterialCreado = (material: MaterialCatalogo) => {
    setMaterialesActualizados((prev) => [...prev, material]);
    setAgregarMaterialOpen(false);
    if (lineaSeleccionada) {
      handleActualizarLinea(lineaSeleccionada, "materialId", material.id);
      setLineaSeleccionada(null);
    }
  };

  const handleEliminarLinea = useCallback((id: string) => {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleActualizarLinea = useCallback(
    (id: string, campo: keyof LineaEditando, valor: any) => {
      setLineas((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const actualizada = { ...l, [campo]: valor };
          if (campo === "materialId" && valor) {
            const material = materialesActualizados.find((m) => m.id === valor);
            if (material) {
              actualizada.materialNombre = material.nombre;
              actualizada.unidad = material.unidad;
            }
          }
          if (campo === "cantidad" || campo === "precioUnitario") {
            actualizada.subtotal = (actualizada.cantidad || 0) * (actualizada.precioUnitario || 0);
          }
          return actualizada;
        })
      );
    },
    [materialesActualizados]
  );

  const calcularTotales = () => {
    const subtotal = lineas.reduce((sum, l) => sum + (l.subtotal || 0), 0);
    const montoImpuesto = (subtotal * impuesto) / 100;
    return { subtotal, montoImpuesto, total: subtotal + montoImpuesto };
  };

  const { subtotal, montoImpuesto, total } = calcularTotales();

  const columnas = [
    {
      title: "Material",
      dataIndex: "materialId",
      key: "material",
      width: 280,
      render: (_: any, record: LineaEditando) => (
        <div className="flex gap-1">
          <Select
            value={record.materialId || undefined}
            onChange={(val) => handleActualizarLinea(record.id, "materialId", val)}
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
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 120,
      render: (_: any, record: LineaEditando) => (
        <InputNumber
          value={record.cantidad}
          onChange={(val) => handleActualizarLinea(record.id, "cantidad", val)}
          size="small"
          min={0}
          step={0.01}
        />
      ),
    },
    {
      title: "Precio Unitario",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      width: 140,
      render: (_: any, record: LineaEditando) => (
        <InputNumber
          value={record.precioUnitario}
          onChange={(val) => handleActualizarLinea(record.id, "precioUnitario", val)}
          size="small"
          min={0}
          step={0.01}
          prefix="$"
        />
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 120,
      render: (_: any, record: LineaEditando) => (
        <span className="font-semibold">${(record.subtotal || 0).toLocaleString("es-MX")}</span>
      ),
    },
    {
      title: "",
      key: "action",
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

  const handleSubmit = async () => {
    try {
      console.log("🔵 handleSubmit iniciado", { proveedorNombre, obraId, proyectoId, lineasCount: lineas.length });

      if (!proveedorNombre.trim()) {
        console.log("❌ Error: Proveedor vacío");
        toast.error("Proveedor es requerido");
        return;
      }
      if (!obraId) {
        console.log("❌ Error: obraId vacío", obraId);
        toast.error("Obra es requerida");
        return;
      }
      if (!proyectoId) {
        console.log("❌ Error: proyectoId vacío", proyectoId);
        toast.error("Proyecto es requerido");
        return;
      }
      if (lineas.length === 0) {
        console.log("❌ Error: Sin líneas");
        toast.error("Debe agregar al menos un ítem");
        return;
      }

      const values: FacturaFormValues = {
        numero: facturaEditar?.numero || "", // El backend generará el número si es nueva
        proveedorNombre,
        proveedorRut: proveedorRut || undefined,
        proveedorId,
        fecha: fecha.toISOString(),
        fechaRecepcion: fechaRecepcion?.toISOString(),
        // Si no hay selector de obra visible, dejar que el backend derive el proyectoId de la obra
        proyectoId: mostrarSelectorObra ? proyectoId : undefined,
        proyectoNombre: mostrarSelectorObra ? proyectoNombre : undefined,
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
      console.log("🟢 Enviando valores:", values);
      await onSubmit(values);
      console.log("✅ Factura guardada exitosamente");
    } catch (error) {
      console.error("❌ Error al guardar factura:", error);
      toast.error("Error al guardar factura: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={facturaEditar ? `Editar Factura: ${facturaEditar.numero}` : "Nueva Factura de Compra"}
      open={open}
      onCancel={() => { resetForm(); onClose(); }}
      width="90vw"
      style={{ maxWidth: "1600px" }}
      centered
      footer={null}
    >
      <div className="space-y-4">
        {/* Encabezado */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Número de Factura
            </label>
            <Input
              value={numero}
              disabled
              title="Se genera automáticamente"
            />
          </div>

          {/* Proveedor — Select dinámico con crear y eliminar */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Proveedor</label>
            <Select
              value={proveedorId}
              onChange={handleSeleccionarProveedor}
              placeholder="Selecciona proveedor"
              loading={cargandoProveedores}
              className="w-full"
              allowClear
              onClear={() => { setProveedorId(undefined); setProveedorNombre(""); setProveedorRut(""); }}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={proveedores.map((p) => ({
                value: p.id,
                label: `${p.nombre}${p.rut ? ` — ${p.rut}` : ""}`,
              }))}
              optionRender={(option) => {
                const prov = proveedores.find((p) => p.id === option.value);
                return (
                  <div className="flex items-center justify-between group">
                    <span>{option.label}</span>
                    <Popconfirm
                      title="¿Eliminar este proveedor?"
                      okText="Sí"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                      onConfirm={(e) => { e?.stopPropagation(); if (prov && prov.documentId) handleEliminarProveedor(prov.id, prov.documentId); }}
                      onPopupClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 size={13} />
                      </button>
                    </Popconfirm>
                  </div>
                );
              }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "6px 0" }} />
                  <div className="flex gap-2 px-2 pb-2">
                    <Input
                      size="small"
                      placeholder="Nombre proveedor"
                      value={nuevoProveedorNombre}
                      onChange={(e) => setNuevoProveedorNombre(e.target.value)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleCrearProveedor(); }}
                    />
                    <Input
                      size="small"
                      placeholder="RUT (opt)"
                      value={nuevoProveedorRut}
                      onChange={(e) => setNuevoProveedorRut(e.target.value)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleCrearProveedor(); }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={14} />}
                      loading={guardandoProveedor}
                      onClick={handleCrearProveedor}
                    />
                  </div>
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Factura</label>
            <DatePicker value={fecha} onChange={setFecha} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Recepción</label>
            <DatePicker value={fechaRecepcion} onChange={setFechaRecepcion} className="w-full" />
          </div>
          {/* Obra - Solo mostrar si estamos en modo inventario */}
          {mostrarSelectorObra && obras.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Obra</label>
              <Select
                value={obraId}
                onChange={setObraId}
                placeholder="Selecciona obra"
                options={obras.map((o) => ({ value: o.id, label: o.nombre }))}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                className="w-full"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">IVA %</label>
            <InputNumber value={impuesto} onChange={(val) => setImpuesto(val || 0)} min={0} max={100} className="w-full" />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
          <Input.TextArea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Observaciones" />
        </div>

        {/* Ítems */}
        <div className="mt-4">
          <h3 className="mb-3 font-semibold text-gray-900">Ítems de Factura</h3>
          <Table
            columns={columnas}
            dataSource={lineas.map((l) => ({ ...l, key: l.id }))}
            pagination={false}
            size="small"
            bordered
            rowKey="id"
          />
          <div className="mt-3">
            <Button type="dashed" size="large" icon={<Plus size={16} />} onClick={handleAgregarLinea} className="w-full">
              Agregar ítem
            </Button>
          </div>
        </div>

        {/* Totales */}
        <div className="flex flex-col items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex gap-8 text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="w-40 text-right font-semibold text-gray-900">${subtotal.toLocaleString("es-MX")}</span>
          </div>
          <div className="flex gap-8 text-sm">
            <span className="text-gray-600">IVA ({impuesto}%):</span>
            <span className="w-40 text-right font-semibold text-gray-900">${montoImpuesto.toLocaleString("es-MX")}</span>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <div className="flex gap-8 text-lg">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="w-40 text-right text-xl font-bold text-emerald-600">${total.toLocaleString("es-MX")}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={() => { resetForm(); onClose(); }} disabled={loading}>Cancelar</Button>
          {!facturaEditar ? (
            <Button type="primary" onClick={handleSubmit} loading={loading}>Crear Factura</Button>
          ) : (
            <Button type="primary" onClick={handleSubmit} loading={loading}>Actualizar Factura</Button>
          )}
        </div>
      </div>

      <AgregarMaterialModal
        open={agregarMaterialOpen}
        onClose={() => setAgregarMaterialOpen(false)}
        onMaterialCreado={handleMaterialCreado}
      />
    </Modal>
  );
}
