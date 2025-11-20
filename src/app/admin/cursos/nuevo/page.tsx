"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, InputNumber, Switch, Button, Upload, message } from "antd";
import { ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons";
import { createCourse } from "@/services/courses";

const { TextArea } = Input;

export default function NuevoCursoPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { title: string; description: string; price: number; isActive?: boolean; number_lessons?: number }) => {
    try {
      setLoading(true);
      const payload = {
        title: values.title,
        description: values.description,
        price: values.price,
        isActive: values.isActive || false,
        number_lessons: values.number_lessons || 0,
      };

      await createCourse(payload);
      message.success("Curso creado correctamente");
      router.push("/admin/cursos");
    } catch (error) {
      console.error("Error creating course:", error);
      message.error("Error al crear el curso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "#1f2937",
        padding: "32px",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: "16px" }}
        >
          Volver
        </Button>
        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 600, margin: 0 }}>
          Crear Nuevo Curso
        </h1>
      </div>

      {/* Formulario */}
      <div style={{
        background: "#fff",
        padding: "32px",
        borderRadius: "8px",
        maxWidth: "800px",
      }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: false,
            number_lessons: 0,
            price: 0,
          }}
        >
          <Form.Item
            label="Título del Curso"
            name="title"
            rules={[{ required: true, message: "El título es requerido" }]}
          >
            <Input placeholder="Ej: Introducción a React" size="large" />
          </Form.Item>

          <Form.Item
            label="Descripción"
            name="description"
            rules={[{ required: true, message: "La descripción es requerida" }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe el contenido del curso..."
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Precio (USD)"
            name="price"
            rules={[{ required: true, message: "El precio es requerido" }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="$"
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Número de Lecciones"
            name="number_lessons"
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Estado"
            name="isActive"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Activo"
              unCheckedChildren="Inactivo"
            />
          </Form.Item>

          <Form.Item
            label="Imagen de Portada"
            name="cover"
            tooltip="Funcionalidad de subida de archivos pendiente"
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              disabled
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Subir</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => router.back()} size="large">
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{
                  background: "#f5b940",
                  borderColor: "#f5b940",
                  color: "#222",
                  fontWeight: 600,
                }}
              >
                Crear Curso
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
