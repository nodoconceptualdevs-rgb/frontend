"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeLabelProps {
  codigo: string;
  nombre: string;
  unidad?: string;
}

export default function BarcodeLabel({ codigo, nombre, unidad }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, codigo, {
        format: "CODE128",
        width: 1.6,
        height: 40,
        fontSize: 12,
        margin: 4,
        displayValue: true,
      });
    } catch {
      // código inválido para el formato (no debería ocurrir con MAT-XXXXXX)
    }
  }, [codigo]);

  return (
    <div className="barcode-label flex flex-col items-center justify-center gap-1 rounded border border-gray-300 bg-white p-2 text-center">
      <p className="w-full truncate text-xs font-semibold text-gray-900">{nombre}</p>
      <svg ref={svgRef} />
      {unidad && <p className="text-[10px] text-gray-500">Unidad: {unidad}</p>}
    </div>
  );
}
