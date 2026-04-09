"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { confirmEmail } from "@/services/auth";
import styles from "../login/loginPage.module.css";
import formStyles from "@/components/LoginForm.module.css";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token de confirmación no encontrado");
        setLoading(false);
        return;
      }

      try {
        await confirmEmail(token);
        setSuccess(true);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Error al confirmar el email");
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ color: "#666" }}>Confirmando tu email...</div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 className={styles.title} style={{ color: "#ef4444" }}>
            Error en la confirmación
          </h2>
          <p style={{ color: "#666", fontSize: 15, lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            marginTop: 18,
            background: "#6b7280",
            color: "white",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 24,
            padding: "12px 32px",
            textDecoration: "none",
          }}
        >
          Volver al login
        </Link>
      </>
    );
  }

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
