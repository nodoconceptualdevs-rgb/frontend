"use client";

import React, { useState } from "react";
import LoginForm from "../../../components/LoginForm";
import styles from "./loginPage.module.css";
import { login } from "@/services/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  interface LoginFormData {
    email: string;
    password: string;
  }

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await login({
        identifier: data.email,
        password: data.password,
      });
      console.log("Login response:", res?.redirectTo);
      if (res?.redirectTo) {
        router.push(res.redirectTo);
      } else {
        setError("No se pudo determinar la ruta de redirección");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || "Error al iniciar sesión"
      );
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
