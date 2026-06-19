"use client";

import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, Divider, Popconfirm, Spin } from "antd";
import { Plus, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import type { Herramienta, HerramientaFormValues } from "@/types/inventario";
import {
  getCategoriasHerramienta,
  createCategoriaHerramienta,
  deleteCategoriaHerramienta,
} from "@/services/inventario";

interface HerramientaModalProps {
  open: boolean;
  herramienta?: Herramienta;
  onClose: () => void;
  onSubmit: (values: HerramientaFormValues) => Promise<void>;
}

export default function HerramientaModal({ open, herramienta, onClose, onSubmit }: HerramientaModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [categorias, setCategorias] = useState<{ id: number; documentId: string; nombre: string }[]>([]);
  const [cargando, setCargando] = useState(false);
  const [nuevaCat, setNuevaCat] = useState("");
  const [guardandoCat, setGuardandoCat] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCargando(true);
    getCategoriasHerramienta()
      .then((cats) => {
        setCategorias(cats);
        // Setear valores si es edición
        if (herramienta) {
          form.setFieldsValue({
            nombre: herramienta.nombre,
            descripcion: herramienta.descripcion,
            categoria: herramienta.categoria,
            fechaAdquisicion: herramienta.fechaAdquisicion ? dayjs(herramienta.fechaAdquisicion) : undefined,
            cantidad: herramienta.cantidad || 1,
            estado: herramienta.estado,
          });
        } else {
          form.resetFields();
          form.setFieldsValue({ estado: "DISPONIBLE", cantidad: 1 });
        }
      })
      .catch(() => toast.error("Error al cargar categorías"))
      .finally(() => setCargando(false));
  }, [open, herramienta, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await onSubmit({
        ...values,
        fechaAdquisicion: values.fechaAdquisicion?.toISOString(),
      });
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error al guardar herramienta:", error);
      toast.error("Error al guardar herramienta");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarCategoria = async () => {
    if (!nuevaCat.trim()) return;
    try {
      setGuardandoCat(true);
      const nueva = await createCategoriaHerramienta(nuevaCat.trim());
      setCategorias((prev) => [...prev, nueva]);
      form.setFieldValue("categoria", nueva.nombre);
      setNuevaCat("");
      toast.success("Categoría creada");
    } catch {
      toast.error("Error al crear categoría");
    } finally {
      setGuardandoCat(false);
    }
  };

  const handleEliminarCategoria = async (documentId: string, nombre: string) => {
    try {
      await deleteCategoriaHerramienta(documentId);
      setCategorias((prev) => prev.filter((c) => c.documentId !== documentId));
      if (form.getFieldValue("categoria") === nombre) {
        form.setFieldValue("categoria", undefined);
      }
      toast.success("Categoría eliminada");
    } catch {
      toast.error("Error al eliminar categoría");
    }
  };

  return (
    <Modal
      title={herramienta ? "Editar Herramienta" : "Agregar Herramienta"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Spin spinning={cargando}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={
            herramienta
              ? {
                  ...herramienta,
                  fechaAdquisicion: herramienta.fechaAdquisicion ? dayjs(herramienta.fechaAdquisicion) : undefined,
                }
              : { estado: "DISPONIBLE" }
          }
        >
          <Form.Item label="Nombre" name="nombre" rules={[{ required: true, message: "El nombre es requerido" }]}>
            <Input placeholder="Ej: Grúa móvil 5 ton" size="large" />
          </Form.Item>

          <Form.Item label="Descripción" name="descripcion">
            <Input.TextArea placeholder="Descripción de la herramienta" rows={3} />
          </Form.Item>

          <Form.Item label="Categoría" name="categoria" rules={[{ required: true, message: "La categoría es requerida" }]}>
            <Select
              placeholder="Seleccionar categoría"
              showSearch
              allowClear
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={categorias.map((c) => ({ value: c.nombre, label: c.nombre }))}
              optionRender={(option) => {
                const cat = categorias.find((c) => c.nombre === option.value);
                return (
                  <div className="flex items-center justify-between group">
                    <span>{option.label}</span>
                    <Popconfirm
                      title="¿Eliminar esta categoría?"
                      okText="Sí"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                      onConfirm={(e) => { e?.stopPropagation(); if (cat) handleEliminarCategoria(cat.documentId, cat.nombre); }}
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
                      placeholder="Nueva categoría"
                      value={nuevaCat}
                      onChange={(e) => setNuevaCat(e.target.value)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleAgregarCategoria(); }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={14} />}
                      loading={guardandoCat}
                      onClick={handleAgregarCategoria}
                    />
                  </div>
                </>
              )}
            />
          </Form.Item>

          <Form.Item label="Fecha de Adquisición" name="fechaAdquisicion">
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => current && current.isAfter(dayjs(), "day")}
            />
          </Form.Item>

          <Form.Item label="Cantidad" name="cantidad" rules={[{ required: false }]}>
            <Input type="number" placeholder="Ej: 50" min={1} />
          </Form.Item>

          <Form.Item label="Estado" name="estado" rules={[{ required: true, message: "El estado es requerido" }]}>
            <Select
              placeholder="Seleccionar estado"
              options={[
                { value: "DISPONIBLE", label: "Disponible" },
                { value: "EN_USO", label: "En uso" },
                { value: "MANTENIMIENTO", label: "Mantenimiento" },
                { value: "DESCARTADA", label: "Descartada" },
              ]}
            />
          </Form.Item>

          <div className="flex gap-3 mt-2">
            <Button onClick={onClose} style={{ width: "50%" }}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: "50%" }}>
              {herramienta ? "Actualizar" : "Agregar"}
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
}
