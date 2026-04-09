"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Input, Space, Tag, message, Switch, Tooltip, Select, Popconfirm } from "antd";
import { SearchOutlined, PlusOutlined, UserSwitchOutlined, CheckCircleOutlined, StopOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { User, Role } from "@/services/users";
import { getUsers, getRoles } from "@/services/users";
import { toggleBlockUser, deleteUser } from "@/services/adminUsers";
import { adminResetUserPassword } from "@/services/auth";
import { alerts } from "@/lib/alerts";
import AdminHeader from "@/components/admin/AdminHeader";
import AddUserModal from "@/components/admin/AddUserModal";

// Componente para manejar la selección de roles de usuarios
interface RoleSelectorProps {
  record: User;
  roles: Role[];
  isUpdating: boolean;
  loadingRoles: boolean;
  onChangeRole: (userId: number, roleId: number) => void;
}

const RoleSelector = ({ record, roles, isUpdating, loadingRoles, onChangeRole }: RoleSelectorProps) => {
  // Colores para los diferentes tipos de roles
  const colors: Record<string, string> = {
    admin: "red",
    gerente_de_proyecto: "orange",
    authenticated: "blue",
    client: "green",
    public: "default",
  };

  // Determinar el ID y tipo de rol actual
  const roleId = useMemo(() => {
    // Si el rol es un número (ID), usarlo directamente
    if (typeof record.role === 'number') {
      return record.role;
    }
    // Si el rol es un objeto, usar su ID
    if (record.role && typeof record.role === 'object') {
      return record.role.id;
    }
    // Valor predeterminado: ID del rol Cliente (authenticated)
    return 4; // Este es normalmente el ID del rol authenticated/cliente
  }, [record.role]);

  // Determinar el tipo de rol
  const roleType = useMemo(() => {
    // Si el rol es un objeto con tipo, usarlo
    if (record.role && typeof record.role === 'object' && record.role.type) {
      return record.role.type;
    }
    
    // Si tenemos un ID de rol, intentar encontrar el tipo en la lista de roles
    if (typeof roleId === 'number') {
      const foundRole = roles.find(r => r.id === roleId);
      if (foundRole) {
        return foundRole.type;
      }
    }
    
    // Valor predeterminado
    return "authenticated";
  }, [record.role, roleId, roles]);

  // Determinar el nombre a mostrar
  const roleName = useMemo(() => {
    // Si el rol es un objeto con nombre, usarlo
    if (record.role && typeof record.role === 'object' && record.role.name) {
      return record.role.name;
    }
    
    // Si tenemos un ID, buscar el nombre en la lista de roles
    if (typeof roleId === 'number') {
      const foundRole = roles.find(r => r.id === roleId);
      if (foundRole) {
        // Para el rol client, mostrar "Cliente"
        return foundRole.type === "client" ? "Cliente" : foundRole.name;
      }
    }
    
    // Valor predeterminado
    return "Cliente";
  }, [record.role, roleId, roles]);

  // Verificar si es un admin
  const isAdmin = roleType === "admin";

  // Para administradores, mostrar solo la etiqueta sin posibilidad de cambio
  if (isAdmin) {
    return (
      <Tooltip title="El rol de administrador no se puede cambiar">
        <Tag color={colors[roleType]}>
          {roleName}
        </Tag>
      </Tooltip>
    );
  }

  // Para usuarios normales, mostrar selector
  return (
    <Select
      value={roleId}
      style={{ minWidth: 180 }}
      onChange={(value: number) => onChangeRole(record.id, value)}
      loading={loadingRoles}
      disabled={loadingRoles || isUpdating}
      optionFilterProp="label"
      optionLabelProp="label"
      options={roles
        .filter(role => role.type === "gerente_de_proyecto" || role.type === "client")
        .map(role => ({
          value: role.id,
          label: role.type === "client" ? "Cliente" : role.name,
        }))}
      suffixIcon={<UserSwitchOutlined />}
      placeholder="Seleccionar rol"
    />
  );
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  useEffect(() => {
    // Primero cargar los roles, luego los usuarios
    const initialize = async () => {
      await loadRoles();
      await loadUsers();
    };
    initialize();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers() as User[];
      
      // Procesar los usuarios para normalizar los roles
      const processedUsers = response?.map(user => {
        // Si el rol es solo un número (ID), buscar el objeto de rol correspondiente
        if (typeof user.role === 'number') {
          const roleId = user.role;
          const matchedRole = roles.find(r => r.id === roleId);
          if (matchedRole) {
            return {
              ...user,
              role: matchedRole
            };
          }
        }
        return user;
      }) || [];
      
      setUsers(processedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      alerts.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading roles:", error);
      alerts.error("Error al cargar los roles disponibles");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      setUpdatingRole(userId);
      
      // Actualizar el rol del usuario
      const { updateUser } = await import("@/services/adminUsers");
      await updateUser(userId, { role: roleId });
      
      // Actualizar el usuario localmente
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          const selectedRole = roles.find(r => r.id === roleId);
          if (selectedRole) {
            return {
              ...user,
              role: selectedRole
            };
          }
        }
        return user;
      }));
      
      alerts.success("Rol actualizado correctamente");
    } catch (error) {
      console.error("Error updating user role:", error);
      alerts.error("Error al actualizar el rol del usuario");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleToggleBlock = async (userId: number, currentBlocked: boolean) => {
    try {
      await toggleBlockUser(userId, !currentBlocked);
      loadUsers(); // Recargar la lista
    } catch (error) {
      console.error("Error toggling user block:", error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      loadUsers(); // Recargar la lista
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleResetPassword = async (userId: number, email: string) => {
    try {
      await adminResetUserPassword(userId);
      alerts.success(`Contraseña temporal enviada a ${email}`);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      alerts.error(error?.response?.data?.error?.message || "Error al restablecer la contraseña");
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
        // Componente RoleSelector especializado para manejar diferentes formatos de roles
        return <RoleSelector 
          record={record} 
          roles={roles} 
          isUpdating={updatingRole === record.id}
          loadingRoles={loadingRoles}
          onChangeRole={handleRoleChange}
        />
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
    {
      title: "Acciones",
      key: "actions",
      align: "center" as const,
      render: (_: unknown, record: User) => {
        const isAdmin = record.role?.type === "admin";
        
        return (
          <Space>
            {!isAdmin && (
              <Popconfirm
                title="¿Restablecer contraseña?"
                description="Se enviará una contraseña temporal por email"
                onConfirm={() => handleResetPassword(record.id, record.email)}
                okText="Sí, restablecer"
                cancelText="Cancelar"
              >
                <Tooltip title="Restablecer contraseña">
                  <Button
                    type="link"
                    icon={<ReloadOutlined />}
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            
            {!isAdmin && (
              <Popconfirm
                title="¿Estás seguro de eliminar este usuario?"
                description="Esta acción no se puede deshacer"
                onConfirm={() => handleDeleteUser(record.id)}
                okText="Sí, eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Eliminar usuario">
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
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
        subtitulo={`${stats.total} usuarios`}
      />

      <main className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Botón agregar usuario en la esquina */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <p className="text-gray-500 text-xs sm:text-sm mb-1">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <p className="text-gray-500 text-xs sm:text-sm mb-1">Activos</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <p className="text-gray-500 text-xs sm:text-sm mb-1">Bloqueados</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.blocked}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <p className="text-gray-500 text-xs sm:text-sm mb-1">Confirmados</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
        </div>

        {/* Botón agregar usuario en la esquina */}
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddUserModal(true)}
            style={{ 
              background: "#f5b940", 
              borderColor: "#f5b940",
              color: "#000",
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            Agregar Usuario
          </Button>
        </div>

        {/* Barra de búsqueda */}
        <div style={{ marginBottom: "24px" }}>
          <Input
            placeholder="Buscar por usuario, nombre o email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400, width: "100%" }}
            allowClear
          />
        </div>

        {/* Tabla con scroll responsive */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} usuarios`,
              responsive: true,
            }}
            scroll={{ x: 900 }}
            bordered
            size="middle"
          />
        </div>
      </main>

      <AddUserModal 
        visible={showAddUserModal}
        onCancel={() => {
          setShowAddUserModal(false);
        }}
        onSuccess={() => {
          loadUsers();
          setShowAddUserModal(false);
        }}
        roles={roles}
      />
    </div>
  );
}
