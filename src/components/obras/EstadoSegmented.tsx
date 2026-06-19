import React from "react";
import { Segmented } from "antd";
import type { EstadoObra } from "@/types/obras";

interface Props {
  value: EstadoObra;
  onChange: (value: EstadoObra) => void;
}

export default function EstadoSegmented({ value, onChange }: Props) {
  const estadoColors: Record<EstadoObra, { bg: string; text: string }> = {
    PREPARACION: { bg: "bg-gray-100", text: "text-gray-700" },
    EN_CURSO: { bg: "bg-blue-100", text: "text-blue-700" },
    PAUSADA: { bg: "bg-amber-100", text: "text-amber-700" },
    COMPLETADA: { bg: "bg-green-100", text: "text-green-700" },
  };

  const options: Array<{ label: React.ReactNode; value: EstadoObra }> = [
    {
      label: (
        <div
          className={`px-3 py-1 rounded font-medium transition-all ${
            value === "PREPARACION"
              ? estadoColors["PREPARACION"].bg + " " + estadoColors["PREPARACION"].text
              : "text-gray-600"
          }`}
        >
          Preparación
        </div>
      ),
      value: "PREPARACION",
    },
    {
      label: (
        <div
          className={`px-3 py-1 rounded font-medium transition-all ${
            value === "EN_CURSO"
              ? estadoColors["EN_CURSO"].bg + " " + estadoColors["EN_CURSO"].text
              : "text-gray-600"
          }`}
        >
          En Curso
        </div>
      ),
      value: "EN_CURSO",
    },
    {
      label: (
        <div
          className={`px-3 py-1 rounded font-medium transition-all ${
            value === "PAUSADA"
              ? estadoColors["PAUSADA"].bg + " " + estadoColors["PAUSADA"].text
              : "text-gray-600"
          }`}
        >
          Pausada
        </div>
      ),
      value: "PAUSADA",
    },
    {
      label: (
        <div
          className={`px-3 py-1 rounded font-medium transition-all ${
            value === "COMPLETADA"
              ? estadoColors["COMPLETADA"].bg + " " + estadoColors["COMPLETADA"].text
              : "text-gray-600"
          }`}
        >
          Completada
        </div>
      ),
      value: "COMPLETADA",
    },
  ];

  return (
    <Segmented<EstadoObra>
      value={value}
      onChange={onChange}
      options={options}
      style={{
        backgroundColor: "transparent",
        padding: "4px",
      }}
    />
  );
}
