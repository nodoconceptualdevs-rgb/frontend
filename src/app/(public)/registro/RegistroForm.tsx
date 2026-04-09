import React from "react";
import styles from "./RegistroForm.module.css";
import { useForm, Controller } from "react-hook-form";
import CustomInput from "@/components/CustomInput";
import { RedButton } from "@/components/CustomButtons";
import Image from "next/image";
import Link from "next/link";

interface RegistroFormData {
  email: string;
  nombre: string;
  password: string;
  name: string;
}

interface RegistroFormProps {
  onSubmit: (data: RegistroFormData) => void;
  loading?: boolean;
  error?: string;
}

const RegistroForm: React.FC<RegistroFormProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroFormData>();

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
      <h2 className={styles.title}>Crea tu cuenta</h2>
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
        name="nombre"
        control={control}
        rules={{ required: "Nombre requerido" }}
        render={({ field }) => (
          <CustomInput
            {...field}
            label="Nombre completo"
            placeholder="Nombre completo"
            error={errors.nombre?.message as string}
            type="text"
            autoComplete="name"
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
            placeholder="Crea tu contraseña"
            error={errors.password?.message as string}
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
        Crear cuenta
      </RedButton>
      <div className={styles.loginLink}>
        ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
      </div>
    </form>
  );
};

export default RegistroForm;
