"use client";
import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Menu, MenuProps } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = useCallback(async () => {
    const { logout } = await import("@/services/auth");
    await logout();
    localStorage.removeItem("name");
    router.push("/login");
  }, [router]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <div className={styles.container}>
      {/* Botón hamburguesa fijo en móvil */}
      <button
        className={styles.mobileMenuButton}
        onClick={toggleMobile}
        aria-label="Abrir menú"
      >
        <MenuOutlined />
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
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
            {/* Botón cerrar en móvil */}
            <button
              className={styles.mobileCloseButton}
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <CloseOutlined />
            </button>
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
            onClick={({ key }) => {
              router.push(key);
              setMobileOpen(false);
            }}
            className={styles.menu}
            inlineCollapsed={collapsed}
          />
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            onClick={() => {
              handleLogout();
              setMobileOpen(false);
            }}
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
