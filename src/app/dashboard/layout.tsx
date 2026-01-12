"use client";
import React from "react";
import {
  BookOutlined,
  DollarOutlined,
  UserOutlined,
  ProjectOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/constants/roles";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Definir items del menú según el rol
  const menuItems = React.useMemo(() => {
    const items = [];

    // Gerente de Proyecto ve Mi Proyecto, Gestión de Cursos y Mi Perfil
    if (user?.role.type === ROLES.GERENTE_PROYECTO) {
      items.push(
        {
          key: "/dashboard/mi-proyecto",
          icon: <ProjectOutlined />,
          label: "Mi Proyecto",
        },
        {
          key: "/dashboard/gerente-cursos",
          icon: <VideoCameraOutlined />,
          label: "Gestión de Cursos",
        },
        {
          key: "/dashboard/mi-perfil",
          icon: <UserOutlined />,
          label: "Mi Perfil",
        }
      );
    } else {
      // Clientes ven todo
      items.push(
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
        }
      );
    }

    return items;
  }, [user?.role.type]);

  return <DashboardLayout menuItems={menuItems}>{children}</DashboardLayout>;
}
