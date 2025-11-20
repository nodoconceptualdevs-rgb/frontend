"use client";

import { useState, useEffect } from "react";
import { Card, Form, Input, Button, message, Descriptions, Tag } from "antd";
import { UserOutlined, MailOutlined, IdcardOutlined } from "@ant-design/icons";

interface ProfileFormProps {
  user: any;
  onUpdate?: (values: any) => Promise<void>;
  showFullInfo?: boolean;
}

export default function ProfileForm({ user, onUpdate, showFullInfo = true }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        username: user.username,
        email: user.email,
      });
    }
  }, [user, form]);

  const handleUpdate = async (values: any) => {
    try {
      setLoading(true);
      if (onUpdate) {
        await onUpdate(values);
        message.success("Perfil actualizado correctamente");
      } else {
        // TODO: Implementar actualización de perfil por defecto
        message.info("Funcionalidad de actualización próximamente");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (roleType: string) => {
    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      gerente_de_proyecto: "Gerente de Proyecto",
      authenticated: "Cliente",
      client: "Cliente",
    };
    return roleLabels[roleType] || roleType;
  };

  const getRoleColor = (roleType: string) => {
    const roleColors: Record<string, string> = {
      admin: "red",
      gerente_de_proyecto: "orange",
      authenticated: "blue",
      client: "green",
    };
    return roleColors[roleType] || "default";
  };

  return (
    <>
      {/* Información del Usuario */}
      {showFullInfo && (
        <Card
          title="Información de la Cuenta"
          style={{ marginBottom: "24px" }}
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Nombre">
              {user?.name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Usuario">
              {user?.username}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {user?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Rol">
              <Tag color={getRoleColor(user?.role?.type || "")}>
                {getRoleLabel(user?.role?.type || "")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={user?.confirmed ? "success" : "warning"}>
                {user?.confirmed ? "Verificado" : "Pendiente de verificación"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Formulario de Actualización */}
      <Card title="Actualizar Información">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          style={{ maxWidth: "600px" }}
        >
          <Form.Item
            label="Nombre Completo"
            name="name"
            rules={[{ required: true, message: "El nombre es requerido" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Ingresa tu nombre"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true, message: "El usuario es requerido" }]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Nombre de usuario"
              size="large"
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "El email es requerido" },
              { type: "email", message: "Email inválido" }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="tu@email.com"
              size="large"
              disabled
            />
          </Form.Item>

          <Form.Item>
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
              Actualizar Perfil
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Información Adicional */}
      <Card
        style={{
          marginTop: "24px",
          background: "#f0f9ff",
          borderColor: "#3b82f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
          <div style={{ fontSize: "24px" }}>ℹ️</div>
          <div>
            <h3 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
              Información de Seguridad
            </h3>
            <p style={{ margin: 0, color: "#1e40af", fontSize: "14px" }}>
              Para cambiar tu contraseña o email, contacta al administrador del sistema.
              Tu nombre de usuario no puede ser modificado una vez creado.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
