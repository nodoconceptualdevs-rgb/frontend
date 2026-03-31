"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { confirmEmail } from "@/services/auth";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/loginPage.module.css";
import formStyles from "@/components/LoginForm.module.css";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setError("Token de confirmación no encontrado.");
        setLoading(false);
        return;
      }

      try {
        await confirmEmail(token);
        setSuccess(true);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || "Token inválido o ya utilizado.");
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ margin: "0 auto 16px", width: 48, height: 48, border: "4px solid #e5e7eb", borderTop: "4px solid #f5b940", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <h2 className={styles.title}>
          Confirmando tu email...
        </h2>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (success) {
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

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <h2 className={styles.title}>
        Error de confirmación
      </h2>
      <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
        {error}
      </p>
      <Link
        href="/login"
        style={{ color: "#f5b940", fontWeight: 600, textDecoration: "underline", fontSize: 15 }}
      >
        Volver al inicio de sesión
      </Link>
    </div>
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
          <Suspense fallback={<div>Cargando...</div>}>
            <ConfirmEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
