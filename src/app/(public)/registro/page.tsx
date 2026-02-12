"use client";

import React, { useState } from "react";
import RegistroForm from "./RegistroForm";
import styles from "../login/loginPage.module.css";
import { register, updateUserName } from "@/services/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  interface RegistroFormData {
    email: string;
    nombre: string;
    password: string;
  }

  const handleRegistro = async (data: RegistroFormData) => {
    // setLoading(true);
    console.log(data);
    setError("");
    try {
      const res = await register({
        username: data.email + data.nombre,
        email: data.email,
        password: data.password,
      });
      
      toast.success("¡Registro exitoso!");
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err 
        ? (err.response as { data?: { error?: { message?: string } } })?.data?.error?.message 
        : undefined;
      setError(errorMessage || "Error al registrar");
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
        <RegistroForm
          onSubmit={handleRegistro}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
