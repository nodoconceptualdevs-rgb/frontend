"use client";

import Image from "next/image";
import { RedButton } from "../CustomButtons";
import styles from "./Menu.module.css";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

export default function Menu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Determinar activo
  const isHome = pathname === "/" || pathname === "/#quienes-somos";
  const isPortafolio = pathname.startsWith("/portafolio");
  const isCursos = pathname.startsWith("/cursos");
  const isQuienes = pathname === "/#quienes-somos";

  const handleNav = (cb: () => void) => {
    setOpen(false);
    cb();
  };

  return (
    <div style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
      <nav className={styles.menuContainer}>
        <div className={styles.menuContent}>
          <div
            className={styles.logoSection}
            onClick={() => handleNav(() => router.push("/"))}
          >
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
  );
}
