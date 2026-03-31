import React from "react";
import styles from "./LoginForm.module.css";
import { useForm, Controller } from "react-hook-form";
import CustomInput from "./CustomInput";
import { RedButton } from "./CustomButtons";
import Image from "next/image";
import Link from "next/link";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading, error }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.logoWrapper}>
        <Image
          src="/isologo.svg"
          alt="Isologo"
          width={56}
          height={56}
          priority
        />
      </div>
      <h2 className={styles.title}>Inicia sesión</h2>
      {error && <div className={styles.errorMsg}>{error}</div>}
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
      <Controller
        name="password"
        control={control}
        rules={{ required: "Contraseña requerida" }}
        render={({ field }) => (
          <CustomInput
            {...field}
            label="Contraseña"
            placeholder="contraseña"
            error={errors.password?.message as string}
            type="password"
            autoComplete="current-password"
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
        Iniciar sesión
      </RedButton>
      <div style={{ width: "100%", textAlign: "right", marginTop: 8 }}>
        <Link href="/olvide-contrasena" style={{ color: "#f5b940", fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <div className={styles.registerLink}>
        ¿No tienes una cuenta? <Link href="/registro">Regístrate</Link>
      </div>
    </form>
  );
};

export default LoginForm;
