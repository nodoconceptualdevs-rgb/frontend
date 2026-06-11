"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Select, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import type { Herramienta, HerramientaFormValues } from "@/types/inventario";

interface HerramientaModalProps {
  open: boolean;
  herramienta?: Herramienta;
  onClose: () => void;
  onSubmit: (values: HerramientaFormValues) => Promise<void>;
}

export default function HerramientaModal({
  open,
  herramienta,
  onClose,
  onSubmit,
}: HerramientaModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
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
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={
          herramienta
            ? {
                ...herramienta,
                fechaAdquisicion: herramienta.fechaAdquisicion
                  ? dayjs(herramienta.fechaAdquisicion)
                  : undefined,
              }
            : {
                estado: "DISPONIBLE",
              }
        }
      >
        <Form.Item
          label="Nombre"
          name="nombre"
          rules={[{ required: true, message: "El nombre es requerido" }]}
        >
          <Input placeholder="Ej: Grúa móvil 5 ton" size="large" />
        </Form.Item>

        <Form.Item label="Descripción" name="descripcion">
          <Input.TextArea
            placeholder="Descripción de la herramienta"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label="Categoría"
          name="categoria"
          rules={[{ required: true, message: "La categoría es requerida" }]}
        >
          <Select
            placeholder="Seleccionar categoría"
            options={[
              { label: "Equipo pesado", value: "Equipo pesado" },
              { label: "Mano de obra", value: "Mano de obra" },
              { label: "Transporte", value: "Transporte" },
              { label: "Medición", value: "Medición" },
              { label: "Seguridad", value: "Seguridad" },
              { label: "Otro", value: "Otro" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Fecha de Adquisición" name="fechaAdquisicion">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

      

        <div className="flex gap-3">
          <Button onClick={onClose} style={{ width: "50%" }}>
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: "50%" }}
          >
            {herramienta ? "Actualizar" : "Agregar"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
