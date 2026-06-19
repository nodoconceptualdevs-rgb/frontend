"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, TrendingUp, DollarSign, FileText, Layers } from "lucide-react";
import dayjs from "dayjs";
import type { Obra, EstadoObra, ValuacionFinal } from "@/types/obras";
import { ESTADO_OBRA_LABEL } from "@/types/obras";

// ─── Estado badge config ──────────────────────────────────────────────────────

const ESTADO_STYLE: Record<EstadoObra, { dot: string; bg: string; text: string; border: string }> = {
  PREPARACION: { dot: "bg-slate-400",  bg: "bg-slate-700/60",  text: "text-slate-200",  border: "border-slate-600" },
  EN_CURSO:    { dot: "bg-blue-400",   bg: "bg-blue-900/50",   text: "text-blue-200",   border: "border-blue-700" },
  PAUSADA:     { dot: "bg-amber-400",  bg: "bg-amber-900/40",  text: "text-amber-200",  border: "border-amber-700" },
  COMPLETADA:  { dot: "bg-emerald-400",bg: "bg-emerald-900/40",text: "text-emerald-200",border: "border-emerald-700" },
};

// ─── Tab definition ───────────────────────────────────────────────────────────

const TABS = [
  { key: "partidas",    label: "Partidas" },
  { key: "reportes",   label: "Reportes" },
  { key: "personal",   label: "Personal" },
  { key: "valuaciones",label: "Valuaciones" },
  { key: "analitica",  label: "Analítica" },
  { key: "inventario", label: "Inventario" },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-4 py-3 transition-colors min-w-0">
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-amber-500/20" : "bg-white/10"}`}>
        <span className={accent ? "text-amber-400" : "text-slate-300"}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-1">{label}</p>
        <p className={`font-mono text-base font-bold leading-none tabular-nums truncate ${accent ? "text-amber-400" : "text-white"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Main Banner ──────────────────────────────────────────────────────────────

interface Props {
  obra: Obra;
  valuacion: ValuacionFinal | null;
  activeTab: string;
  onTabChange: (key: string) => void;
  onEstadoChange: (estado: EstadoObra) => void;
}

export default function ObraHeroBanner({ obra, valuacion, activeTab, onTabChange, onEstadoChange }: Props) {
  const router = useRouter();
  const estadoStyle = ESTADO_STYLE[obra.estado];
  const pct = valuacion ? Math.round(valuacion.porcentajeEjecucion) : 0;

  const ESTADOS: EstadoObra[] = ["PREPARACION", "EN_CURSO", "PAUSADA", "COMPLETADA"];

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${(n / 1000).toFixed(0)}k`;

  return (
    <div className="relative overflow-hidden bg-slate-900">
      {/* ── dot pattern ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* ── amber left accent ───────────────────────────────────── */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500/60 to-transparent" />

      {/* ── diagonal highlight ──────────────────────────────────── */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
      />

      <div className="relative px-6 pt-5 pb-0">
        {/* Back + estado */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-medium transition-colors group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Obras
          </button>

          {/* Estado selector inline */}
          <div className="flex items-center gap-1.5">
            {ESTADOS.map((e) => {
              const s = ESTADO_STYLE[e];
              const active = obra.estado === e;
              return (
                <button
                  key={e}
                  onClick={() => !active && onEstadoChange(e)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                    ${active
                      ? `${s.bg} ${s.text} ${s.border} ring-1 ring-white/10`
                      : "bg-transparent text-slate-600 border-transparent hover:text-slate-400 hover:border-slate-700"}
                  `}
                >
                  {active && <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />}
                  {ESTADO_OBRA_LABEL[e]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Obra identity */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] font-bold text-amber-400 tracking-[0.15em] uppercase">
              Obra #{obra.id}
            </span>
            <span className="text-slate-700 text-sm">·</span>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
              {obra.proyectoNombre}
            </span>
          </div>
          <h1 className="text-white text-xl font-bold leading-snug line-clamp-2 max-w-2xl">
            {obra.nombre}
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
            <Calendar size={11} />
            <span className="font-mono">
              {dayjs(obra.fechaInicio).format("DD MMM YYYY")}
            </span>
            <span className="text-slate-700">→</span>
            <span className="font-mono">
              {dayjs(obra.fechaFinPlanificada).format("DD MMM YYYY")}
            </span>
            {obra.fechaFinReal && (
              <>
                <span className="text-slate-700 mx-1">·</span>
                <span className="text-emerald-500 font-mono">
                  Completada {dayjs(obra.fechaFinReal).format("DD MMM YYYY")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <KpiCard
            icon={<DollarSign size={15} />}
            label="Presupuesto"
            value={fmt(obra.presupuestoTotal)}
            accent
          />
          <KpiCard
            icon={<DollarSign size={15} />}
            label="Costo Real"
            value={fmt(obra.presupuestoConsumido)}
          />
          <KpiCard
            icon={<TrendingUp size={15} />}
            label="Ejecución"
            value={`${pct}%`}
          />
          <KpiCard
            icon={<FileText size={15} />}
            label="Reportes"
            value={String(obra.reportes.length)}
          />
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="flex items-end gap-0 -mb-px overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`
                  relative flex-shrink-0 px-4 py-2.5 text-[13px] font-semibold transition-all
                  whitespace-nowrap border-b-2
                  ${active
                    ? "text-white border-amber-400"
                    : "text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600"}
                `}
              >
                {active && (
                  <span className="absolute inset-x-2 top-1 bottom-0 rounded-t-md bg-white/5 -z-0" />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
