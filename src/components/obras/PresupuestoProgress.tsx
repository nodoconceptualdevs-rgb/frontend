import React from "react";

interface Props {
  presupuestado: number;
  ejecutado: number;
}

export default function PresupuestoProgress({
  presupuestado,
  ejecutado,
}: Props) {
  const porcentaje =
    presupuestado > 0 ? (ejecutado / presupuestado) * 100 : 0;
  const restante = Math.max(0, presupuestado - ejecutado);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 h-6 rounded-lg overflow-hidden bg-gray-100">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
        {porcentaje < 100 && (
          <div
            className="bg-gray-300"
            style={{ width: `${Math.max(0, 100 - porcentaje)}%` }}
          />
        )}
        {porcentaje > 100 && (
          <div
            className="bg-red-500"
            style={{ width: `${Math.min(porcentaje - 100, 100)}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          ${ejecutado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
        </span>
        <span className="font-medium">
          {Math.round(porcentaje)}% · ${restante.toLocaleString("es-CO", {
            maximumFractionDigits: 0,
          })}{" "}
          restante
        </span>
      </div>
    </div>
  );
}
