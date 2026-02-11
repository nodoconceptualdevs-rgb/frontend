"use client";

import React from "react";
import { AntdProvider } from "./AntdProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

/**
 * Este componente agrupa todos los providers del lado cliente
 * Separado para evitar errores de "Maximum update depth exceeded"
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AntdProvider>{children}</AntdProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
