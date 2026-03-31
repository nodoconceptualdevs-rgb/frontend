"use client";

import React, { useState } from "react";
import RegistroForm from "./RegistroForm";
import styles from "../login/loginPage.module.css";
import { register, sendConfirmationEmail } from "@/services/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const router = useRouter();

  interface RegistroFormData {
    email: string;
    nombre: string;
    password: string;
  }

  const handleRegistro = async (data: RegistroFormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await register({
        username: data.email + data.nombre,
        email: data.email,
        password: data.password,
      });
      
      // Enviar email de confirmación
      try {
        await sendConfirmationEmail(data.email);
      } catch (emailErr) {
        console.error("Error enviando email de confirmación:", emailErr);
      }

      setRegisteredEmail(data.email);
      setShowConfirmation(true);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err.response as { data?: { error?: { message?: string } } })?.data?.error?.message 
        : undefined;
      setError(errorMessage || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      await sendConfirmationEmail(registeredEmail);
      toast.success("Email de confirmación reenviado");
    } catch (err) {
      toast.error("Error al reenviar el email");
    }
  };

  return (
    <div
      className={styles.bgContainer}
      style={{
        backgroundImage: "url(/bgFooter.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={styles.centeredBox} style={{ filter: "none" }}>
        {showConfirmation ? (
          <div style={{
            width: "100%",
            maxWidth: 650,
            background: "#fff",
            borderRadius: 32,
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            padding: "48px 60px 38px 60px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f5b940" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#222", marginBottom: 12 }}>
              Confirma tu correo
            </h2>
            <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
              Hemos enviado un enlace de confirmación a:
            </p>
            <p style={{ color: "#222", fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
              {registeredEmail}
            </p>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Revisa tu bandeja de entrada (y carpeta de spam). Haz clic en el enlace para activar tu cuenta.
            </p>
            <button
              onClick={handleResendConfirmation}
              style={{
                background: "none",
                border: "none",
                color: "#f5b940",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
                marginBottom: 16,
              }}
            >
              Reenviar email de confirmación
            </button>
            <a
              href="/login"
              style={{
                color: "#666",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Ir al inicio de sesión
            </a>
          </div>
        ) : (
          <RegistroForm
            onSubmit={handleRegistro}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
