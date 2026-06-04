import {
  Partida,
  Obra,
  LineaPersonal,
  LineaMaterial,
  ObrasResumen,
  ValuacionFinal,
  ValuacionPartida,
} from "@/types/obras";
import dayjs from "dayjs";

export function calcularMontoPresupuestado(partida: Partida): number {
  return partida.cantidadPresupuestada * partida.precioUnitario;
}

export function calcularMontoEjecutado(partida: Partida): number {
  return partida.cantidadEjecutada * partida.precioUnitario;
}

export function calcularAvancePartida(partida: Partida): number {
  if (partida.cantidadPresupuestada === 0) return 0;
  const avance =
    (partida.cantidadEjecutada / partida.cantidadPresupuestada) * 100;
  return Math.min(avance, 100);
}

export function calcularCostoManoObra(lineasPersonal: LineaPersonal[]): number {
  return lineasPersonal.reduce((sum, linea) => sum + linea.subtotal, 0);
}

export function calcularCostoMateriales(
  lineasMaterial: LineaMaterial[]
): number {
  return lineasMaterial.reduce((sum, linea) => sum + linea.subtotal, 0);
}

export function calcularResumenObras(obras: Obra[]): ObrasResumen {
  const ahora = dayjs();
  const unaSemanaaAtras = ahora.subtract(7, "days");

  const enCurso = obras.filter((o) => o.estado === "EN_CURSO").length;
  const completadas = obras.filter((o) => o.estado === "COMPLETADA").length;
  const pausadas = obras.filter((o) => o.estado === "PAUSADA").length;

  const presupuestoTotal = obras.reduce((sum, o) => sum + o.presupuestoTotal, 0);
  const presupuestoConsumido = obras.reduce(
    (sum, o) => sum + o.presupuestoConsumido,
    0
  );

  const reportesEstaSemanita = obras
    .flatMap((o) => o.reportes)
    .filter((r) => dayjs(r.fecha).isAfter(unaSemanaaAtras)).length;

  return {
    totalObras: obras.length,
    enCurso,
    completadas,
    pausadas,
    presupuestoTotal,
    presupuestoConsumido,
    reportesEstaSemanita,
  };
}

export function calcularValuacion(obra: Obra): ValuacionFinal {
  const ahora = dayjs();
  const inicio = dayjs(obra.fechaInicio);
  const diasPlanificados = dayjs(obra.fechaFinPlanificada).diff(inicio, "day");
  const diasTranscurridos = ahora.diff(inicio, "day");

  const partidas: ValuacionPartida[] = obra.partidas.map((p) => ({
    partidaId: p.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    montoPresupuestado: calcularMontoPresupuestado(p),
    montoEjecutado: calcularMontoEjecutado(p),
    variacion: calcularMontoEjecutado(p) - calcularMontoPresupuestado(p),
    avancePorcentaje: calcularAvancePartida(p),
  }));

  const costoReal = obra.presupuestoConsumido;
  const variacionTotal = costoReal - obra.presupuestoTotal;
  const porcentajeEjecucion =
    obra.presupuestoTotal > 0 ? (costoReal / obra.presupuestoTotal) * 100 : 0;

  const totalPersonalRegistros = obra.reportes.reduce(
    (sum, r) => sum + r.personal.length,
    0
  );
  const totalMaterialesConsumo = obra.reportes.reduce(
    (sum, r) => sum + r.materiales.length,
    0
  );

  return {
    obraId: obra.id,
    presupuestoTotal: obra.presupuestoTotal,
    costoReal,
    variacionTotal,
    porcentajeEjecucion,
    diasPlanificados,
    diasTranscurridos,
    totalReportes: obra.reportes.length,
    totalPersonalRegistros,
    totalMaterialesConsumo,
    partidas,
  };
}

export function calcularPorcentajeEjecucionTotal(obra: Obra): number {
  if (obra.presupuestoTotal === 0) return 0;
  return (obra.presupuestoConsumido / obra.presupuestoTotal) * 100;
}
