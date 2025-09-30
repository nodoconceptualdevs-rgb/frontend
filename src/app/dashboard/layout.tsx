"use client";
import React, { useEffect, useState } from "react";
import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Leer el rol desde la cookie (solo en cliente)
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
      setRole(match ? decodeURIComponent(match[1]) : null);
    }
  }, []);

  // Opciones de menú para cada rol
  const clientMenu = [
    { key: "/dashboard", label: "Mi Perfil" },
    { key: "/dashboard/mis-cursos", label: "Mis Cursos" },
    { key: "/dashboard/mis-pagos", label: "Mis Pagos" },
  ];
  const adminMenu = [
    { key: "/dashboard/admin", label: "Panel Admin" },
    { key: "/dashboard/admin/cursos", label: "Cursos" },
    { key: "/dashboard/admin/usuarios", label: "Usuarios" },
    { key: "/dashboard/admin/compras", label: "Compras" },
  ];

  const menuItems =
    role &&
    (role.toLowerCase() === "admin" || role.toLowerCase() === "administrador")
      ? adminMenu
      : clientMenu;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#fafafa",
          borderRight: "1px solid #eee",
          padding: "32px 0 32px 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ padding: "0 24px 24px 24px" }}>
            <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
            <p className="text-xs text-gray-600">Privado</p>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ border: "none", background: "transparent" }}
          />
        </div>
        <div style={{ padding: 24, borderTop: "1px solid #eee" }}>
          <a
            href="/dashboard"
            style={{
              display: "block",
              marginBottom: 16,
              color: "#ab2731",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Ver Perfil
          </a>
          <button
            type="button"
            onClick={async () => {
              await (await import("@/services/auth")).logout();
              window.location.href = "/";
            }}
            style={{
              width: "100%",
              background: "#ab2731",
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "12px 0",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
