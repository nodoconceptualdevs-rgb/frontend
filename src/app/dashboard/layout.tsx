"use client";
import React from "react";
import {
  BookOutlined,
  DollarOutlined,
  UserOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const menuItems = [
  {
    key: "/dashboard/cursos",
    icon: <BookOutlined />,
    label: "Mis Cursos",
  },
  {
    key: "/dashboard/mi-proyecto",
    icon: <ProjectOutlined />,
    label: "Mi Proyecto",
  },
  {
    key: "/dashboard/mis-pagos",
    icon: <DollarOutlined />,
    label: "Mis Pagos",
  },
  {
    key: "/dashboard/mi-perfil",
    icon: <UserOutlined />,
    label: "Mi Perfil",
  },
];

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout menuItems={menuItems}>{children}</DashboardLayout>;
}
