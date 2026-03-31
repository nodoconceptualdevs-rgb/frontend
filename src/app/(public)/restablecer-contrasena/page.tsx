"use client";

import { useState, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/auth";
import CustomInput from "@/components/CustomInput";
import { RedButton } from "@/components/CustomButtons";
import Image from "next/image";
import Link from "next/link";
import styles from "../login/loginPage.module.css";
import formStyles from "@/components/LoginForm.module.css";

interface ResetPasswordData {
  password: string;
  passwordConfirmation: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordData>();

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordData) => {
    if (!code) {
      setError("Código de restablecimiento no encontrado. Solicita un nuevo enlace.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPassword(code, data.password, data.passwordConfirmation);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Error al restablecer la contraseña. El enlace puede haber expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (!code) {
    return (
      <div style={{ textAlign: "center" }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h2 className={styles.title}>
          Enlace inválido
        </h2>
        <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
          El enlace de restablecimiento no es válido o ha expirado. Solicita uno nuevo.
        </p>
        <Link
          href="/olvide-contrasena"
          style={{ color: "#f5b940", fontWeight: 600, textDecoration: "underline", fontSize: 15 }}
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return success ? (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className={styles.title}>
          Contraseña restablecida
        </h2>
        <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
          Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
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
  ) : (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 className={styles.title}>
        Nueva contraseña
      </h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 24, textAlign: "center" }}>
        Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
      </p>

      {error && (
        <div className={styles.errorMsg}>
          {error}
        </div>
      )}

      <Controller
        name="password"
        control={control}
        rules={{
          required: "Contraseña requerida",
          minLength: { value: 6, message: "Mínimo 6 caracteres" },
        }}
        render={({ field }) => (
          <CustomInput
            {...field}
            label="Nueva contraseña"
            placeholder="Nueva contraseña"
            error={errors.password?.message as string}
            type="password"
            autoComplete="new-password"
          />
        )}
      />

      <Controller
        name="passwordConfirmation"
        control={control}
        rules={{
          required: "Confirma tu contraseña",
          validate: (value) => value === password || "Las contraseñas no coinciden",
        }}
        render={({ field }) => (
          <CustomInput
            {...field}
            label="Confirmar contraseña"
            placeholder="Confirmar contraseña"
            error={errors.passwordConfirmation?.message as string}
            type="password"
            autoComplete="new-password"
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
        Restablecer contraseña
      </RedButton>

      <div style={{ marginTop: 18, fontSize: 15, textAlign: "center" }}>
        <Link href="/login" style={{ color: "#f5b940", fontWeight: 600, textDecoration: "underline" }}>
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}

export default function RestablecerContrasenaPage() {
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
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
