import {
  Partida,
  Obra,
  LineaPersonal,
  LineaMaterial,
  ObrasResumen,
  ValuacionFinal,
  ValuacionPartida,
  ValuacionDoc,
  ValuacionLineaPartida,
  ReporteDiario,
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

  const costoReal = partidas.reduce((s, p) => s + p.montoEjecutado, 0);
  const variacionTotal = costoReal - obra.presupuestoTotal;
  const totalMontoPresup = partidas.reduce((s, p) => s + p.montoPresupuestado, 0);
  const totalMontoEjec = partidas.reduce((s, p) => s + p.montoEjecutado, 0);
  const porcentajeEjecucion = totalMontoPresup > 0 ? (totalMontoEjec / totalMontoPresup) * 100 : 0;

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
  const totalPresup = obra.partidas.reduce((s, p) => s + p.cantidadPresupuestada * p.precioUnitario, 0);
  const totalEjec = obra.partidas.reduce((s, p) => s + p.cantidadEjecutada * p.precioUnitario, 0);
  return totalPresup > 0 ? (totalEjec / totalPresup) * 100 : 0;
}

export function calcularValuacionDocConReportes(
  obra: Obra,
  reportesPendientes: ReporteDiario[],
  id: number,
  numero: number,
  notas?: string
): ValuacionDoc {
  // Mapa: partidaId → suma de cantidades ejecutadas en este ciclo
  const cantidadesCiclo = new Map<number, number>();

  for (const reporte of reportesPendientes) {
    const partida = obra.partidas.find((p) => p.id === reporte.partidaId);
    if (!partida) continue;
    const cantidadEnEsteReporte =
      (reporte.avanceLogrado / 100) * partida.cantidadPresupuestada;
    cantidadesCiclo.set(
      reporte.partidaId,
      (cantidadesCiclo.get(reporte.partidaId) || 0) + cantidadEnEsteReporte
    );
  }

  const lineas: ValuacionLineaPartida[] = obra.partidas.map((p) => {
    const esExtra = p.esExtra ?? false;
    const cantidadPresupuestada = esExtra ? 0 : p.cantidadPresupuestada;
    const montoPresupuestado = cantidadPresupuestada * p.precioUnitario;
    const cantidadEjecutada = cantidadesCiclo.get(p.id) || 0;
    const montoEjecutado = cantidadEjecutada * p.precioUnitario;

    let aumento: number | undefined;
    let montoAumento: number | undefined;
    let disminucion: number | undefined;
    let montoDisminucion: number | undefined;

    if (!esExtra) {
      const diff = cantidadEjecutada - cantidadPresupuestada;
      if (diff > 0.001) {
        aumento = diff;
        montoAumento = diff * p.precioUnitario;
      } else if (diff < -0.001) {
        disminucion = Math.abs(diff);
        montoDisminucion = Math.abs(diff) * p.precioUnitario;
      }
    }

    return {
      partidaId: p.id,
      codigo: p.codigo,
      descripcion: p.descripcion,
      unidad: p.unidad,
      esExtra,
      cantidadPresupuestada,
      precioUnitario: p.precioUnitario,
      montoPresupuestado,
      cantidadEjecutada,
      montoEjecutado,
      aumento,
      montoAumento,
      disminucion,
      montoDisminucion,
    };
  });

  const normales = lineas.filter((l) => !l.esExtra);
  const extras = lineas.filter((l) => l.esExtra);

  const totalPresupuesto = normales.reduce((s, l) => s + l.montoPresupuestado, 0);
  const totalEjecutado = normales.reduce((s, l) => s + l.montoEjecutado, 0);
  const totalAumentos = normales.reduce((s, l) => s + (l.montoAumento ?? 0), 0);
  const totalDisminuciones = normales.reduce((s, l) => s + (l.montoDisminucion ?? 0), 0);
  const totalExtras = extras.reduce((s, l) => s + l.montoEjecutado, 0);
  const presupuestoModificado =
    totalPresupuesto + totalAumentos - totalDisminuciones + totalExtras;

  return {
    id,
    obraId: obra.id,
    numero,
    fecha: new Date().toISOString(),
    lineas,
    totalPresupuesto,
    totalEjecutado,
    totalAumentos,
    totalDisminuciones,
    totalExtras,
    presupuestoModificado,
    notas,
  };
}

