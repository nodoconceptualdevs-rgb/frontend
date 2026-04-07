"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../login/loginPage.module.css";
import formStyles from "@/components/LoginForm.module.css";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Como el backend ya valida y redirige aquí solo cuando es exitoso,
  // siempre mostramos el mensaje de éxito
  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className={styles.title}>
          Email confirmado
        </h2>
        <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
          Tu cuenta ha sido confirmada exitosamente. Ya puedes iniciar sesión.
        </p>
      </div>
      <Link
        href="/login"
        style={{
          display: "inline-block",
          marginTop: 18,
          background: "#f5b940",
          color: "#222",
          fontWeight: 600,
          fontSize: 16,
          borderRadius: 24,
          padding: "12px 32px",
          textDecoration: "none",
        }}
      >
        Iniciar sesión
      </Link>
    </>
  );
}

export default function ConfirmarEmailPage() {
  return (
    <div
      className={styles.bgContainer}
      style={{
        backgroundImage: "url(/bgFooter.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={styles.centeredBox} style={{ filter: "none" }}>
        <div className={formStyles.form}>
          <Suspense fallback={
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: "#666" }}>Cargando...</div>
            </div>
          }>
            <ConfirmEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
