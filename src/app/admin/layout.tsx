"use client";
import React, { useMemo } from "react";
import {
  ProjectOutlined,
  BookOutlined,
  DollarOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = useMemo(() => {
    return [
      {
        key: "/admin/proyectos",
        icon: <ProjectOutlined />,
        label: "Proyectos",
      },
      {
        key: "/admin/productividad",
        icon: <BarChartOutlined />,
        label: "Tareas",
      },
      {
        key: "/admin/inventario",
        icon: <ShoppingCartOutlined />,
        label: "Inventario",
      },
      {
        key: "/admin/obras",
        icon: <BuildOutlined />,
        label: "Obras",
      },
      {
        key: "/admin/historial",
        icon: <HistoryOutlined />,
        label: "Historial",
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
  }, []);

  return <DashboardLayout menuItems={menuItems}>{children}</DashboardLayout>;
}
