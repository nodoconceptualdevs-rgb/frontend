import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { UserOutlined, MailOutlined, IdcardOutlined } from "@ant-design/icons";
import { updateUser, UpdateUserPayload } from "@/services/adminUsers";
import { User, Role } from "@/services/users";

interface EditUserModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  user: User | null;
  roles: Role[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  user,
  roles,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | undefined>();

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        name: user.name,
        role: typeof user.role === 'object' ? user.role.id : user.role,
      });
      setSelectedRole(typeof user.role === 'object' ? user.role.id : user.role);
    }
  }, [visible, user, form]);

  const handleSubmit = async (values: any) => {
    if (!user) return;

    setLoading(true);
    try {
      const userData: UpdateUserPayload = {
        username: values.username,
        email: values.email,
        name: values.name,
        role: selectedRole,
      };

      await updateUser(user.id, userData);
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

  // Filtrar roles para mostrar solo los relevantes (no admin para no admins)
  const availableRoles = roles.filter(
    (role) => role.type === "gerente_de_proyecto" || role.type === "client"
  );

  // Si el usuario es admin, permitir mantener su rol
  const userIsAdmin = user && typeof user.role === 'object' ? user.role.type === 'admin' : false;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined />
          <span>Editar Usuario</span>
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
            disabled={userIsAdmin} // No cambiar rol de admin
            options={(userIsAdmin ? roles : availableRoles).map((role) => ({
              value: role.id,
              label: role.type === "client" ? "Cliente" : role.name,
            }))}
          />
          {userIsAdmin && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              El rol de administrador no puede ser cambiado
            </div>
          )}
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
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditUserModal;
