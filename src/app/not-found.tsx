"use client";

import React from "react";
import Link from "next/link";
import { RedButton } from "@/components/CustomButtons";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <h1
        style={{
          fontSize: 48,
          color: "#ab2731",
          marginBottom: 16,
          fontWeight: 700,
        }}
      >
        ¡Página no encontrada!
      </h1>
      <p
        style={{
          fontSize: 20,
          color: "#664a4a",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Asegúrate que la URL sea correcta.
        <br />
        Si crees que esto es un error, contacta al administrador.
      </p>
      <Link href="/">
        <RedButton style={{ padding: "0 2.5em", fontSize: 18, height: 48 }}>
          Ir a inicio
        </RedButton>
      </Link>
    </div>
  );
  // ...existing code...
}
