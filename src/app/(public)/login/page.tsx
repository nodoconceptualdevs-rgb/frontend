"use client";

import React, { useState } from "react";
import LoginForm from "../../../components/LoginForm";
import styles from "./loginPage.module.css";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  interface LoginFormData {
    email: string;
    password: string;
  }

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    try {
      console.log('💬 Iniciando login con:', data.email);
      
      // Intentar login y capturar respuesta
      await login(data.email, data.password);
      
      // Verificar que el token se guardó (para depurar)
      const token = localStorage.getItem('token');
      const cookieToken = document.cookie.includes('token=');
      
      console.log('✅ Login procesado:', {
        tokenEnLocalStorage: !!token,
        tokenEnCookies: cookieToken,
        cookieCompleta: document.cookie
      });
      
      // La redirección se maneja automáticamente en AuthContext según el rol
    } catch (err: unknown) {
      console.error('❌ ERROR EN LOGIN:', err);
      
      // Detallar el error
      if (err instanceof Error) {
        console.error('💬 Mensaje de error:', err.message);
        console.error('💬 Stack:', err.stack);
      }
      
      // El error ya viene formateado desde auth.ts
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Error al iniciar sesión. Por favor, intenta nuevamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      </div>
    </div>
  );
}
