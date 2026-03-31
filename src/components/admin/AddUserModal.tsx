import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, message, Checkbox } from "antd";
import { UserOutlined, MailOutlined, IdcardOutlined, SendOutlined } from "@ant-design/icons";
import { adminCreateUserWithEmail } from "@/services/auth";
import { alerts } from "@/lib/alerts";
import { Role } from "@/services/users";

interface AddUserModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  roles: Role[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  roles,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | undefined>();

  // Filtrar roles para mostrar solo los relevantes (no admin)
  const availableRoles = roles.filter(
    (role) => role.type === "gerente_de_proyecto" || role.type === "client"
  );

  const handleSubmit = async (values: any) => {
    if (!selectedRole) {
      message.error("Por favor selecciona un rol");
      return;
    }

    setLoading(true);
    try {
      await adminCreateUserWithEmail({
        username: values.username,
        email: values.email,
        name: values.name,
        role: selectedRole,
        sendEmail: true, // Siempre envía email
      });

      alerts.success("Usuario creado y credenciales enviadas por email");
      form.resetFields();
      setSelectedRole(undefined);
      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || "Error al crear el usuario";
      alerts.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedRole(undefined);
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined />
          <span>Agregar Nuevo Usuario</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          label="Nombre de Usuario"
          name="username"
          rules={[
            { required: true, message: "Por favor ingresa un nombre de usuario" },
            { min: 3, message: "Mínimo 3 caracteres" }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="ej: juan_perez123"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Nombre Completo"
          name="name"
          rules={[
            { required: true, message: "Por favor ingresa el nombre completo" },
            { min: 3, message: "Mínimo 3 caracteres" }
          ]}
        >
          <Input
            prefix={<IdcardOutlined />}
            placeholder="ej: Juan Pérez"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Correo Electrónico"
          name="email"
          rules={[
            { required: true, message: "Por favor ingresa un correo" },
            { type: "email", message: "Correo inválido" }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="correo@ejemplo.com"
            size="large"
          />
        </Form.Item>

        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#0958d9' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <SendOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <strong style={{ color: '#0958d9' }}>Envío automático de credenciales</strong>
          </div>
          Se generará una contraseña temporal automáticamente y las credenciales se enviarán por correo electrónico al usuario.
        </div>

        <Form.Item
          label="Rol del Usuario"
          required
          help="Selecciona el rol que tendrá el usuario en el sistema"
        >
          <Select
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Selecciona un rol"
            size="large"
            style={{ width: "100%" }}
            dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
            options={availableRoles.map((role) => ({
              value: role.id,
              label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>
                    {role.type === "client" ? "Cliente" : role.name}
                  </span>
                </div>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} size="large">
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{ background: "#f5b940", borderColor: "#f5b940", color: "#000" }}
            >
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddUserModal;
