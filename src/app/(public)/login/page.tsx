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
      // Intentar login con credenciales
      await login(data.email, data.password);
      
      // La redirección se maneja automáticamente en AuthContext según el rol
    } catch (err: unknown) {
      console.error('❌ Error de login:', err);
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
        backgroundImage: "url(/bgFooter.jpg)",
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
