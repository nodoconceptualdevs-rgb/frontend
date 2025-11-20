"use client";

import Image from "next/image";
import { RedButton } from "../CustomButtons";
import styles from "./Menu.module.css";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import TransitionOverlay from "@/components/TransitionOverlay";
import { FaSync } from "react-icons/fa";

export default function Menu() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setIsTransitioning } = useTheme();
  const [open, setOpen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  // Determinar activo
  const isHome = pathname === "/" || pathname === "/#quienes-somos";
  const isPortafolio = pathname.startsWith("/portafolio");
  const isCursos = pathname.startsWith("/cursos");
  const isQuienes = pathname === "/#quienes-somos";
  const isBynodo = pathname.startsWith("/bynodo");

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
              <div onClick={() => handleNav(() => router.push("/bynodo"))}>
                <Image
                  src="/bynodo.svg"
                  alt="BYNODO"
                  width={220}
                  height={55}
                  priority
                  style={{ cursor: "pointer" }}
                />
              </div>
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
              <div onClick={() => handleNav(() => router.push("/"))}>
                <Image
                  src="/logo.svg"
                  alt="Nodo Conceptual"
                  width={220}
                  height={55}
                  priority
                  style={{ cursor: "pointer" }}
                />
              </div>
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
              <button
                type="button"
                className={isHome && !isQuienes ? styles.active : undefined}
                onClick={() => handleNav(() => router.push("/"))}
              >
                Inicio
              </button>
            </li>
            <li>
              <button
                type="button"
                className={isPortafolio ? styles.active : undefined}
                onClick={() => handleNav(() => router.push("/portafolio"))}
              >
                Portafolio
              </button>
            </li>
            <li>
              <button
                type="button"
                className={isQuienes ? styles.active : undefined}
                onClick={() =>
                  handleNav(() => {
                    if (pathname === "/") {
                      const section = document.getElementById("quienes-somos");
                      if (section) {
                        section.scrollIntoView({ behavior: "smooth" });
                      }
                    } else {
                      router.push("/#quienes-somos");
                    }
                  })
                }
              >
                Quiénes Somos
              </button>
            </li>
            <li>
              <button
                type="button"
                className={isCursos ? styles.active : undefined}
                onClick={() => handleNav(() => router.push("/cursos"))}
              >
                Cursos y Formaciones
              </button>
            </li>
          </ul>
          <div className={styles.buttonSection}>
            <RedButton style={{ padding: "0 60px", cursor: "pointer" }}>
              Contáctanos
            </RedButton>
          </div>
        </div>
      </nav>
    </div>
    </>
  );
}
