"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Drawer } from "antd";
import { TrendingUp, TrendingDown, Minus, Clock, X } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { getHistorialPrecios } from "@/services/obras";
import type { PrecioHistorial, Partida } from "@/types/obras";

dayjs.locale("es");

// ─── Step Chart ───────────────────────────────────────────────────────────────

function StepChart({ entries }: { entries: PrecioHistorial[] }) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()),
    [entries]
  );
  if (sorted.length < 2) return null;

  const W = 380, H = 110;
  const PAD = { top: 14, right: 16, bottom: 24, left: 58 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const prices = sorted.map((e) => e.precio);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const spread = rawMax - rawMin;
  const minP = rawMin - spread * 0.15;
  const maxP = rawMax + spread * 0.15;
  const pRange = maxP - minP || 1;

  const tStart = new Date(sorted[0].fecha_inicio).getTime();
  const tEnd = sorted[sorted.length - 1].fecha_fin
    ? new Date(sorted[sorted.length - 1].fecha_fin!).getTime()
    : Date.now();
  const tRange = tEnd - tStart || 1;

  const toX = (d: string | null) =>
    PAD.left + ((( d ? new Date(d).getTime() : Date.now()) - tStart) / tRange) * cW;
  const toY = (p: number) => PAD.top + cH - ((p - minP) / pRange) * cH;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;

  // Step path
  let linePath = "";
  let areaPath = "";
  const points: { x: number; y: number; entry: PrecioHistorial }[] = [];

  sorted.forEach((entry, i) => {
    const x1 = toX(entry.fecha_inicio);
    const x2 = toX(entry.fecha_fin);
    const y = toY(entry.precio);
    points.push({ x: x1, y, entry });
    if (i === 0) linePath += `M ${x1} ${y}`;
    else linePath += ` L ${x1} ${y}`;
    linePath += ` L ${x2} ${y}`;
  });

  const lastX = toX(sorted[sorted.length - 1].fecha_fin);
  const baseY = PAD.top + cH;
  areaPath = linePath + ` L ${lastX} ${baseY} L ${PAD.left} ${baseY} Z`;

  const gridLevels = [0.2, 0.5, 0.8].map((t) => minP + pRange * t);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* Grid */}
      {gridLevels.map((p, i) => {
        const y = toY(p);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3" />
            <text x={PAD.left - 5} y={y + 3.5} textAnchor="end" fontSize={9} fill="#94a3b8" fontFamily="ui-monospace,monospace">
              {fmt(p)}
            </text>
          </g>
        );
      })}
      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top + cH} x2={W - PAD.right} y2={PAD.top + cH} stroke="#e2e8f0" strokeWidth={1} />
      {/* Area */}
      <path d={areaPath} fill="rgba(245,158,11,0.07)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map(({ x, y, entry }, i) => {
        const isLast = i === points.length - 1;
        return (
          <g key={entry.id}>
            {isLast && <circle cx={x} cy={y} r={8} fill="rgba(245,158,11,0.15)" />}
            <circle
              cx={x} cy={y} r={isLast ? 4.5 : 3}
              fill={isLast ? "#f59e0b" : "#fff"}
              stroke={isLast ? "#d97706" : "#94a3b8"}
              strokeWidth={isLast ? 0 : 1.5}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  partida: Partida | null;
  onClose: () => void;
}

export default function PrecioHistorialDrawer({ open, partida, onClose }: Props) {
  const [historial, setHistorial] = useState<PrecioHistorial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !partida) return;
    setLoading(true);
    getHistorialPrecios(partida.id)
      .then(setHistorial)
      .catch(() => setHistorial([]))
      .finally(() => setLoading(false));
  }, [open, partida]);

  // sorted descending (newest first) for timeline display
  const sorted = useMemo(
    () => [...historial].sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()),
    [historial]
  );

  const vigente = sorted.find((e) => e.fecha_fin === null);
  const oldest = [...historial].sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())[0];

  const cambioTotal =
    vigente && oldest && oldest.precio !== 0 && vigente.id !== oldest.id
      ? ((vigente.precio - oldest.precio) / oldest.precio) * 100
      : null;

  const duracion = (e: PrecioHistorial) => {
    const fin = e.fecha_fin ? dayjs(e.fecha_fin) : dayjs();
    const d = fin.diff(dayjs(e.fecha_inicio), "day");
    return d === 0 ? "< 1 día" : `${d} día${d !== 1 ? "s" : ""}`;
  };

  const fmt = (n: number) =>
    "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

  if (!partida) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={null}
      width={440}
      placement="right"
      closeIcon={null}
      styles={{
        body: { padding: 0, display: "flex", flexDirection: "column" },
        wrapper: { boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" },
      }}
    >
      {/* ── Dark header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 px-6 pt-5 pb-6 flex-shrink-0">
        {/* dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        {/* amber accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-transparent" />

        <button
          onClick={onClose}
          className="relative mb-5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={15} />
        </button>

        <div className="relative space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-amber-400 tracking-[0.15em] uppercase">
              {partida.codigo}
            </span>
            <span className="text-slate-700 text-xs">·</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Historial de precios
            </span>
          </div>
          <p className="text-white font-semibold text-[15px] leading-snug line-clamp-2 pr-4">
            {partida.descripcion}
          </p>

          <div className="pt-3 flex items-end gap-3">
            {vigente ? (
              <>
                <span className="font-mono text-[28px] font-bold text-amber-400 leading-none tabular-nums">
                  {fmt(vigente.precio)}
                </span>
                {cambioTotal !== null && (
                  <div
                    className={`flex items-center gap-1 text-sm font-bold pb-1 ${
                      cambioTotal > 0
                        ? "text-rose-400"
                        : cambioTotal < 0
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    {cambioTotal > 0 ? (
                      <TrendingUp size={13} />
                    ) : cambioTotal < 0 ? (
                      <TrendingDown size={13} />
                    ) : (
                      <Minus size={13} />
                    )}
                    {Math.abs(cambioTotal).toFixed(1)}%
                  </div>
                )}
              </>
            ) : (
              <span className="text-slate-500 text-sm">Sin precio vigente</span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-slate-500">
              {historial.length} {historial.length === 1 ? "registro" : "cambios"}
            </span>
            {vigente && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-[11px] text-slate-500">
                  vigente desde {dayjs(vigente.fecha_inicio).format("DD MMM YYYY")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <TrendingUp size={18} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Sin historial de precios</p>
            <p className="text-xs text-slate-400 mt-1">Los cambios de precio aparecerán aquí</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* Chart */}
            {historial.length >= 2 && (
              <div className="bg-slate-50 rounded-xl px-4 pt-4 pb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-3">
                  Evolución del precio
                </p>
                <StepChart entries={historial} />
                <div className="flex justify-between mt-2 px-1">
                  {oldest && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dayjs(oldest.fecha_inicio).format("MMM YY")}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">hoy</span>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-4">
                Registro de cambios
              </p>

              <div className="relative">
                {/* vertical line */}
                <div className="absolute left-[6px] top-2 bottom-2 w-px bg-slate-100" />

                <div className="space-y-0">
                  {sorted.map((entry, i) => {
                    const isVigente = entry.fecha_fin === null;
                    const prev = sorted[i + 1];
                    const delta =
                      prev && prev.precio !== 0
                        ? ((entry.precio - prev.precio) / prev.precio) * 100
                        : null;

                    return (
                      <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* dot */}
                        <div className="relative z-10 flex-shrink-0 mt-[3px]">
                          {isVigente ? (
                            <>
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow" />
                              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                            </>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white" />
                          )}
                        </div>

                        {/* content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-mono text-base font-bold tabular-nums ${
                                  isVigente ? "text-slate-900" : "text-slate-400"
                                }`}
                              >
                                {fmt(entry.precio)}
                              </span>
                              {isVigente && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  vigente
                                </span>
                              )}
                            </div>
                            {delta !== null && Math.abs(delta) > 0.01 && (
                              <div
                                className={`flex items-center gap-0.5 text-[11px] font-bold flex-shrink-0 ${
                                  delta > 0 ? "text-rose-500" : "text-emerald-600"
                                }`}
                              >
                                {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(delta).toFixed(1)}%
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                            <span className="text-[11px] text-slate-400">
                              {dayjs(entry.fecha_inicio).format("DD MMM YYYY")}
                              {entry.fecha_fin
                                ? ` → ${dayjs(entry.fecha_fin).format("DD MMM YYYY")}`
                                : " → hoy"}
                            </span>
                            <span className="text-slate-300 text-xs">·</span>
                            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                              <Clock size={9} />
                              {duracion(entry)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
