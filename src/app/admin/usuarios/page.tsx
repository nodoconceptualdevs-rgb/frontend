"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Switch, Input, message, Space } from "antd";
import { SearchOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { getUsers, toggleBlockUser, User } from "@/services/users";

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers() as User[];
      setUsers(response || []);
    } catch (error) {
      console.error("Error loading users:", error);
      message.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId: number, currentBlocked: boolean) => {
    try {
      await toggleBlockUser(userId, !currentBlocked);
      message.success(
        !currentBlocked
          ? "Usuario bloqueado correctamente"
          : "Usuario desbloqueado correctamente"
      );
      loadUsers();
    } catch (error) {
      console.error("Error toggling user block:", error);
      message.error("Error al cambiar el estado del usuario");
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: "Usuario",
      dataIndex: "username",
      key: "username",
      sorter: (a: User, b: User) => a.username.localeCompare(b.username),
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string) => name || "—",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Rol",
      dataIndex: ["role", "name"],
      key: "role",
      render: (_: unknown, record: User) => {
        const roleType = record.role?.type || "public";
        const colors: Record<string, string> = {
          admin: "red",
          gerente_de_proyecto: "orange",
          authenticated: "blue",
          client: "green",
          public: "default",
        };
        const roleName = record.role?.name || "Público";
        return (
          <Tag color={colors[roleType]}>
            {roleName}
          </Tag>
        );
      },
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Gerente de Proyecto", value: "gerente_de_proyecto" },
        { text: "Cliente", value: "authenticated" },
      ],
      onFilter: (value: unknown, record: User) => record.role?.type === value,
    },
    {
      title: "Confirmado",
      dataIndex: "confirmed",
      key: "confirmed",
      align: "center" as const,
      render: (confirmed: boolean) => (
        <Tag icon={confirmed ? <CheckCircleOutlined /> : <StopOutlined />} color={confirmed ? "success" : "default"}>
          {confirmed ? "Sí" : "No"}
        </Tag>
      ),
      filters: [
        { text: "Confirmado", value: true },
        { text: "No confirmado", value: false },
      ],
      onFilter: (value: unknown, record: User) => record.confirmed === value,
    },
    {
      title: "Estado",
      dataIndex: "blocked",
      key: "blocked",
      align: "center" as const,
      render: (blocked: boolean, record: User) => (
        <Space direction="vertical" size="small" align="center">
          <Tag color={blocked ? "red" : "green"}>
            {blocked ? "Bloqueado" : "Activo"}
          </Tag>
          <Switch
            checked={!blocked}
            onChange={() => handleToggleBlock(record.id, blocked)}
            checkedChildren="Activo"
            unCheckedChildren="Bloqueado"
            disabled={record.role?.type === "admin"}
          />
        </Space>
      ),
    },
    {
      title: "Fecha de Registro",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("es-ES"),
      sorter: (a: User, b: User) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.blocked).length,
    blocked: users.filter((u) => u.blocked).length,
    confirmed: users.filter((u) => u.confirmed).length,
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
        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 600, margin: 0 }}>
          Gestión de Usuarios
        </h1>
        <div style={{ display: "flex", gap: "24px", marginTop: "16px" }}>
          <div>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>Total</p>
            <p style={{ color: "#fff", margin: 0, fontSize: "20px", fontWeight: 600 }}>{stats.total}</p>
          </div>
          <div>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>Activos</p>
            <p style={{ color: "#10b981", margin: 0, fontSize: "20px", fontWeight: 600 }}>{stats.active}</p>
          </div>
          <div>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>Bloqueados</p>
            <p style={{ color: "#ef4444", margin: 0, fontSize: "20px", fontWeight: 600 }}>{stats.blocked}</p>
          </div>
          <div>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>Confirmados</p>
            <p style={{ color: "#3b82f6", margin: 0, fontSize: "20px", fontWeight: 600 }}>{stats.confirmed}</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: "24px" }}>
        <Input
          placeholder="Buscar por usuario, nombre o email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} usuarios`,
        }}
        bordered
      />
    </div>
  );
}
