"use client";
import React, { useMemo } from "react";
import {
  ProjectOutlined,
  BookOutlined,
  DollarOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  const menuItems = useMemo(() => {
    const isAdmin = user?.role?.type === "admin";
    
    const adminMenuItems = [
      {
        key: "/admin/proyectos",
        icon: <ProjectOutlined />,
        label: "Proyectos",
      },
      {
        key: "/admin/cursos",
        icon: <BookOutlined />,
        label: "Cursos",
      },
      {
        key: "/admin/transacciones",
        icon: <DollarOutlined />,
        label: "Transacciones",
      },
      {
        key: "/admin/usuarios",
        icon: <TeamOutlined />,
        label: "Usuarios",
      },
      {
        key: "/admin/mi-perfil",
        icon: <UserOutlined />,
        label: "Mi Perfil",
      },
    ];
    
    const gerenteMenuItems = [
      {
        key: "/admin/proyectos",
        icon: <ProjectOutlined />,
        label: "Proyectos",
      },
      {
        key: "/admin/mi-perfil",
        icon: <UserOutlined />,
        label: "Mi Perfil",
      },
    ];
    
    return isAdmin ? adminMenuItems : gerenteMenuItems;
  }, [user?.role?.type]);

  return <DashboardLayout menuItems={menuItems}>{children}</DashboardLayout>;
}
