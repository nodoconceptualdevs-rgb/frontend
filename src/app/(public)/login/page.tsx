"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoginForm from "../../../components/LoginForm";
import styles from "./loginPage.module.css";
import { useAuth } from "@/context/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  }, [searchParams]);

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

  return <LoginForm onSubmit={handleLogin} loading={loading} error={error} />;
}

export default function LoginPage() {
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
        <Suspense fallback={null}>
          <LoginPageContent />
        </Suspense>
      </div>
    </div>
  );
}
