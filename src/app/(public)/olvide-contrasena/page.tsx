"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { forgotPassword } from "@/services/auth";
import CustomInput from "@/components/CustomInput";
import { RedButton } from "@/components/CustomButtons";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/loginPage.module.css";
import formStyles from "@/components/LoginForm.module.css";

interface ForgotPasswordData {
  email: string;
}

export default function OlvideContrasenaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>();

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setLoading(true);
      setError("");
      await forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Error al procesar la solicitud");
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
        <div className={formStyles.form}>
          {success ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h2 className={styles.title}>
                  Revisa tu correo
                </h2>
                <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
                  Si el correo ingresado está registrado, recibirás un enlace para restablecer tu contraseña.
                  Revisa también tu carpeta de spam.
                </p>
              </div>
              <Link
                href="/login"
                style={{
                  marginTop: 18,
                  color: "#f5b940",
                  fontWeight: 600,
                  textDecoration: "underline",
                  fontSize: 15,
                  textAlign: "center",
                  display: "block",
                }}
              >
                Volver al inicio de sesión
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h2 className={styles.title}>
                ¿Olvidaste tu contraseña?
              </h2>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 24, textAlign: "center" }}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
              </p>

              {error && (
                <div className={styles.errorMsg}>
                  {error}
                </div>
              )}

              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Correo requerido",
                  pattern: { value: /.+@.+\..+/, message: "Correo inválido" },
                }}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Correo electrónico"
                    placeholder="correo electrónico"
                    error={errors.email?.message as string}
                    type="email"
                    autoComplete="email"
                  />
                )}
              />

              <RedButton
                htmlType="submit"
                loading={loading}
                style={{
                  width: "100%",
                  background: "#f5b940",
                  color: "#222",
                  fontWeight: 600,
                  fontSize: 17,
                  borderRadius: 24,
                  border: "none",
                  marginTop: 10,
                  height: 48,
                }}
              >
                Enviar enlace
              </RedButton>

              <div style={{ marginTop: 18, fontSize: 15, textAlign: "center" }}>
                <Link href="/login" style={{ color: "#f5b940", fontWeight: 600, textDecoration: "underline" }}>
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
