"use client";
import React, { useEffect, useState } from "react";
import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { key: "/dashboard/mis-cursos", label: "Mis Cursos" },
    { key: "/dashboard/mis-pagos", label: "Mis Pagos" },
  ];

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
            onClick={({ key }) => {
              console.log(key);
              router.push(key);
            }}
            style={{ border: "none", background: "transparent" }}
          />
        </div>
        <div style={{ padding: 24, borderTop: "1px solid #eee" }}>
          <button
            type="button"
            onClick={async () => {
              await (await import("@/services/auth")).logout();
              localStorage.removeItem("role");
              router.push("/");
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
