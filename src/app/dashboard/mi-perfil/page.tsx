"use client";

import { useAuth } from "@/context/AuthContext";
import ProfileForm from "@/components/ProfileForm";
import { updateUserProfile } from "@/services/auth";

export default function MiPerfilPage() {
  const { user } = useAuth();

  const handleUpdate = async (values: { name: string }) => {
    await updateUserProfile(values.name);
    // Recargar la página para actualizar el contexto
    window.location.reload();
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "#1f2937",
        padding: "32px",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 600, margin: 0 }}>
          Mi Perfil
        </h1>
        <p style={{ color: "#d1d5db", margin: "8px 0 0 0" }}>
          Información de tu cuenta
        </p>
      </div>

      {/* Componente de perfil reutilizable */}
      {user && <ProfileForm user={user} onUpdate={handleUpdate} showFullInfo={true} />}
    </div>
  );
}
