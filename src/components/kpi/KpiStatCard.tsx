"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface KpiStatCardProps {
  label: string;
  value: string | number;
  sufijo?: string;
  icon: LucideIcon;
  /** Tono de acento. */
  tono?: "rojo" | "ambar" | "esmeralda" | "neutro";
  hint?: string;
}

const TONOS: Record<
  NonNullable<KpiStatCardProps["tono"]>,
  { bg: string; text: string }
> = {
  rojo: { bg: "bg-red-50", text: "text-red-600" },
  ambar: { bg: "bg-amber-50", text: "text-amber-600" },
  esmeralda: { bg: "bg-emerald-50", text: "text-emerald-600" },
  neutro: { bg: "bg-gray-100", text: "text-gray-600" },
};

export default function KpiStatCard({
  label,
  value,
  sufijo,
  icon: Icon,
  tono = "neutro",
  hint,
}: KpiStatCardProps) {
  const t = TONOS[tono];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.bg} ${t.text}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {sufijo && (
          <span className="text-sm font-medium text-gray-400">{sufijo}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
