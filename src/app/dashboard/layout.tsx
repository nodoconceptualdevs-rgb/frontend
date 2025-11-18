"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  BookOutlined,
  CreditCardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const menuItems = [
    {
      key: "/dashboard/mis-cursos",
      icon: <BookOutlined />,
      label: "Mis Cursos",
    },
    {
      key: "/dashboard/mis-pagos",
      icon: <CreditCardOutlined />,
      label: "Mis Pagos",
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: collapsed ? 80 : 220,
          background: "#fafafa",
          borderRight: "1px solid #eee",
          padding: collapsed ? "16px 0 16px 0" : "32px 0 32px 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "width 0.2s, padding 0.2s",
        }}
      >
        <div>
          <div
            style={{
              padding: collapsed ? "0 0 24px 0" : "0 24px 24px 24px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              height: 56,
              gap: collapsed ? 8 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: collapsed ? 48 : "auto",
                height: 48,
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <Image
                src={collapsed ? "/isologo.svg" : "/logo.svg"}
                alt="Nodo Conceptual"
                width={collapsed ? 32 : 120}
                height={collapsed ? 32 : 40}
                style={{
                  objectFit: "contain",
                  display: "block",
                  margin: "auto",
                }}
              />
            </div>
            <button
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              onClick={() => setCollapsed((c) => !c)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginLeft: collapsed ? 0 : 8,
                fontSize: 22,
                color: "#ab2731",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                width: 48,
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => {
              router.push(key);
            }}
            style={{ border: "none", background: "transparent", fontSize: 16 }}
            inlineCollapsed={collapsed}
          />
        </div>
        <div
          style={{
            padding: collapsed ? "0 0 24px 0" : "24px",
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={async () => {
              await (await import("@/services/auth")).logout();
              localStorage.removeItem("name");
              router.push("/");
            }}
            style={{
              width: collapsed ? 48 : "100%",
              height: collapsed ? 48 : "auto",
              background: "#ab2731",
              color: "#fff",
              border: "none",
              borderRadius: collapsed ? "50%" : 20,
              padding: collapsed ? 0 : "12px 0",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: collapsed ? 0 : 10,
              transition: "all 0.2s",
            }}
          >
            <LogoutOutlined style={{ fontSize: 22 }} />
            {!collapsed && <span style={{ marginLeft: 8 }}>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
