import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message, Tooltip } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, IdcardOutlined } from "@ant-design/icons";
import { createUser, CreateUserPayload } from "@/services/adminUsers";
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
      const userData: CreateUserPayload = {
        username: values.username,
        email: values.email,
        password: values.password,
        name: values.name,
        role: selectedRole,
      };

      await createUser(userData);
      form.resetFields();
      setSelectedRole(undefined);
      onSuccess();
    } catch (error) {
      // El error ya se maneja en el servicio
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

        <Form.Item
          label="Contraseña"
          name="password"
          rules={[
            { required: true, message: "Por favor ingresa una contraseña" },
            { min: 6, message: "Mínimo 6 caracteres" }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Mínimo 6 caracteres"
            size="large"
          />
        </Form.Item>

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
