"use client";

import Image from "next/image";
import Link from "next/link";
import { RedButton } from "../CustomButtons";
import styles from "./Menu.module.css";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import TransitionOverlay from "@/components/TransitionOverlay";
import { FaSync } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/constants/roles";

export default function Menu() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setIsTransitioning } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Determinar activo
  const isHome = pathname === "/" || pathname === "/#quienes-somos";
  const isPortafolio = pathname.startsWith("/portafolio");
  const isCursos = pathname.startsWith("/cursos");
  const isQuienes = pathname === "/#quienes-somos";
  const isBynodo = pathname.startsWith("/bynodo");
  const isLoginPage = pathname === "/login" || pathname === "/registro";

  const handleNav = (cb: () => void) => {
    setOpen(false);
    cb();
  };

  const handleThemeToggle = () => {
    setShowOverlay(true);
    setIsTransitioning(true);
    
    // Navegar durante la animación para transición suave
    setTimeout(() => {
      if (theme === 'nodo') {
        router.push('/bynodo');
      } else {
        router.push('/');
      }
    }, 1500); // A mitad de la animación (3000ms / 2)
  };

  const handleTransitionComplete = () => {
    setShowOverlay(false);
    setIsTransitioning(false);
  };

  /**
   * Manejar click en el botón principal
   */
  const handleMainButtonClick = () => {
    if (isAuthenticated && user) {
      // Usuario logueado - ir al panel correspondiente según rol
      if (user.role.type === ROLES.ADMIN) {
        router.push('/admin/proyectos');
      } else if (user.role.type === ROLES.GERENTE_PROYECTO) {
        router.push('/dashboard/mi-proyecto');
      } else {
        // Cliente o cualquier otro rol autenticado
        router.push('/dashboard/cursos');
      }
    } else {
      // Usuario no logueado - ir a login
      router.push('/login');
    }
  };

  // Si estamos en BYNODO, mostrar el menú simplificado
  if (isBynodo) {
    return (
      <>
        <TransitionOverlay 
          isVisible={showOverlay} 
          onComplete={handleTransitionComplete} 
        />
        <div style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
          <nav className={`${styles.menuContainer} ${styles.darkTheme} ${styles.bynodoMenu}`}>
            <div className={styles.bynodoMenuContent}>
              <Link href="/bynodo" onClick={() => setOpen(false)}>
                <Image
                  src="/bynodo.svg"
                  alt="BYNODO"
                  width={220}
                  height={55}
                  priority
                  style={{ cursor: "pointer" }}
                />
              </Link>
              <button
                className={styles.themeToggle}
                onClick={handleThemeToggle}
                aria-label="Volver a Nodo Conceptual"
                title="Volver a Nodo Conceptual"
              >
                <FaSync />
              </button>
            </div>
          </nav>
        </div>
      </>
    );
  }

  // Menú normal de Nodo Conceptual
  return (
    <>
      <TransitionOverlay 
        isVisible={showOverlay} 
        onComplete={handleTransitionComplete} 
      />
      <div style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
        <nav className={styles.menuContainer}>
          <div className={styles.menuContent}>
            <div className={styles.logoSection}>
              <Link href="/" onClick={() => setOpen(false)}>
                <Image
                  src="/logo.svg"
                  alt="Nodo Conceptual"
                  width={220}
                  height={55}
                  priority
                  style={{ cursor: "pointer" }}
                />
              </Link>
              <button
                className={styles.themeToggle}
                onClick={handleThemeToggle}
                aria-label="Ir a BYNODO"
                title="Ir a BYNODO"
              >
                <FaSync />
              </button>
            </div>
          <button
            className={styles.hamburger}
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <span />
            <span />
            <span />
          </button>
          <ul className={styles.menuLinks + (open ? " " + styles.open : "")}>
            <li>
              <Link
                href="/"
                className={isHome && !isQuienes ? styles.active : undefined}
                onClick={() => setOpen(false)}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/portafolio"
                className={isPortafolio ? styles.active : undefined}
                onClick={() => setOpen(false)}
              >
                Portafolio
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={isQuienes ? styles.active : undefined}
                onClick={() => {
                  setOpen(false);
                  if (pathname === "/") {
                    const section = document.getElementById("quienes-somos");
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    }
                  } else {
                    router.push("/#quienes-somos");
                  }
                }}
              >
                Quiénes Somos
              </button>
            </li>
            <li>
              <Link
                href="/cursos"
                className={isCursos ? styles.active : undefined}
                onClick={() => setOpen(false)}
              >
                Cursos y Formaciones
              </Link>
            </li>
          </ul>
          {!isLoginPage && (
            <div className={styles.buttonSection}>
              <RedButton 
                style={{ padding: "0 60px", cursor: "pointer" }}
                onClick={handleMainButtonClick}
              >
                {isAuthenticated ? "Ir al Panel" : "Iniciar sesión"}
              </RedButton>
            </div>
          )}
        </div>
      </nav>
    </div>
    </>
  );
}
