"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Switch, Input, message, Space } from "antd";
import { SearchOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { getUsers, toggleBlockUser, User } from "@/services/users";
import AdminHeader from "@/components/admin/AdminHeader";

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
        <Switch
          checked={!blocked}
          onChange={() => handleToggleBlock(record.id, blocked)}
          checkedChildren="Activo"
          unCheckedChildren="Bloqueado"
          disabled={record.role?.type === "admin"}
        />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo="Gestión de Usuarios"
        subtitulo={`${stats.total} usuarios • ${stats.active} activos • ${stats.blocked} bloqueados`}
      />

      <main className="px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm mb-1">Activos</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm mb-1">Bloqueados</p>
            <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm mb-1">Confirmados</p>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div style={{ marginBottom: "24px" }}>
          <Input
            placeholder="Buscar por usuario, nombre o email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
            allowClear
          />
        </div>

        {/* Tabla con scroll responsive */}
        <div style={{ overflowX: "auto" }}>
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
            scroll={{ x: 1000 }}
            bordered
          />
        </div>
      </main>
    </div>
  );
}
