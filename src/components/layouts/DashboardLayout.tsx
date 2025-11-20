"use client";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Menu, MenuProps } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import styles from "./DashboardLayout.module.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuProps["items"];
}

export default function DashboardLayout({ children, menuItems }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    const { logout } = await import("@/services/auth");
    await logout();
    localStorage.removeItem("name");
    router.push("/login");
  }, [router]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.header}>
            <div className={styles.logoWrapper}>
              <Image
                src={collapsed ? "/isologo.svg" : "/logo.svg"}
                alt="Nodo Conceptual"
                width={collapsed ? 32 : 120}
                height={collapsed ? 32 : 40}
                className={styles.logo}
              />
            </div>
            <button
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              onClick={toggleCollapsed}
              className={styles.toggleButton}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            className={styles.menu}
            inlineCollapsed={collapsed}
          />
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleLogout}
            className={`${styles.logoutButton} ${collapsed ? styles.logoutCollapsed : ""}`}
          >
            <LogoutOutlined className={styles.logoutIcon} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
