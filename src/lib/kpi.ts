/**
 * Lógica de cálculo de KPI (modelo basado en CUMPLIMIENTO DE FECHAS).
 *
 * IMPORTANTE: estas reglas son el "contrato de negocio". Cuando se implemente
 * el backend, el lifecycle hook de `tarea-diseno` debe replicar exactamente
 * estos cálculos para que el front pueda dejar de hacerlos.
 *
 * La eficiencia ya NO depende de rechazos, sino de:
 *  - nº de reprogramaciones de la fecha de entrega (señal principal)
 *  - días de desviación de la entrega real vs. la fecha comprometida original
 */

import type {
  Arquitecto,
  Eficiencia,
  KpiArquitecto,
  KpiResumen,
  TareaConKpi,
  TareaDiseno,
} from "@/types/kpi";

const MS_POR_DIA = 1000 * 60 * 60 * 24;

function difDias(desdeIso: string, hastaIso: string): number {
  return Math.round(
    (new Date(hastaIso).getTime() - new Date(desdeIso).getTime()) / MS_POR_DIA,
  );
}

/**
 * Días transcurridos de una tarea:
 * - COMPLETADA: desde fechaInicio hasta fechaCompletacion.
 * - EN_PROCESO: desde fechaInicio hasta hoy (días corriendo).
 * - PENDIENTE / sin fechaInicio: undefined.
 */
export function calcularTiempoDias(tarea: TareaDiseno): number | undefined {
  if (!tarea.fechaInicio) return undefined;
  const fin =
    tarea.estado === "COMPLETADA" && tarea.fechaCompletacion
      ? tarea.fechaCompletacion
      : new Date().toISOString();
  const dias = difDias(tarea.fechaInicio, fin);
  return dias < 0 ? 0 : dias;
}

/**
 * Load time: días desde que llegó el requerimiento/brief hasta la entrega
 * final. Es la métrica de tiempo "cara al cliente". Solo para completadas.
 */
export function calcularLoadTime(tarea: TareaDiseno): number | undefined {
  const inicio = tarea.fechaRequerimiento ?? tarea.fechaInicio;
  if (tarea.estado !== "COMPLETADA" || !tarea.fechaCompletacion || !inicio) {
    return undefined;
  }
  const dias = difDias(inicio, tarea.fechaCompletacion);
  return dias < 0 ? 0 : dias;
}

/** Días de desviación de la entrega real vs. la fecha comprometida original. */
export function calcularDesviacion(tarea: TareaDiseno): number | undefined {
  const referencia = tarea.fechaEntregaOriginal ?? tarea.fechaEntregaEstimada;
  if (tarea.estado !== "COMPLETADA" || !tarea.fechaCompletacion || !referencia) {
    return undefined;
  }
  return difDias(referencia, tarea.fechaCompletacion);
}

/** Días restantes hasta la fecha estimada (negativo = vencida). Solo no-completadas. */
export function calcularDiasRestantes(tarea: TareaDiseno): number | undefined {
  if (tarea.estado === "COMPLETADA" || !tarea.fechaEntregaEstimada) {
    return undefined;
  }
  return difDias(new Date().toISOString(), tarea.fechaEntregaEstimada);
}

/** EN_PROCESO y con fecha estimada ya vencida. */
export function estaEnRiesgo(tarea: TareaDiseno): boolean {
  if (tarea.estado !== "EN_PROCESO" || !tarea.fechaEntregaEstimada) return false;
  return difDias(new Date().toISOString(), tarea.fechaEntregaEstimada) < 0;
}

/**
 * Eficiencia combinada (dos dimensiones que pidió el cliente):
 *  - Cumplimiento de fechas: reprogramaciones + puntualidad.
 *  - Retrabajo: nº de rechazos (rediseños).
 *
 * penalización = reprogramaciones + rechazos
 *  - penalización >= 2                    => BAJA
 *  - penalización === 1                   => MEDIA
 *  - penalización === 0:
 *      · completada tarde (desviación>0)   => MEDIA
 *      · en proceso y vencida (en riesgo)  => MEDIA
 *      · resto                             => ALTA
 * PENDIENTE (sin iniciar) => undefined.
 */
export function calcularEficiencia(tarea: TareaDiseno): Eficiencia | undefined {
  if (tarea.estado === "PENDIENTE") return undefined;

  const penalizacion = tarea.historialEntregas?.length + tarea.contadorRechazos;
  if (penalizacion >= 2) return "BAJA";
  if (penalizacion === 1) return "MEDIA";

  const desviacion = calcularDesviacion(tarea);
  if (typeof desviacion === "number" && desviacion > 0) return "MEDIA";
  if (estaEnRiesgo(tarea)) return "MEDIA";
  return "ALTA";
}

/** Enriquece una tarea con sus KPI derivados. */
export function conKpi(tarea: TareaDiseno): TareaConKpi {
  return {
    ...tarea,
    tiempoTotalDias: calcularTiempoDias(tarea),
    loadTimeDias: calcularLoadTime(tarea),
    reprogramaciones: tarea.historialEntregas?.length,
    diasDesviacion: calcularDesviacion(tarea),
    diasRestantes: calcularDiasRestantes(tarea),
    enRiesgo: estaEnRiesgo(tarea),
    eficiencia: calcularEficiencia(tarea),
  };
}

/** Peso numérico de cada nivel de eficiencia, para promediar. */
const PESO_EFICIENCIA: Record<Eficiencia, number> = {
  ALTA: 2,
  MEDIA: 1,
  BAJA: 0,
};

function eficienciaDesdePromedio(promedio: number): Eficiencia {
  if (promedio >= 1.5) return "ALTA";
  if (promedio >= 0.5) return "MEDIA";
  return "BAJA";
}

/** Resumen global a partir de todas las tareas. */
export function calcularResumen(tareas: TareaDiseno[]): KpiResumen {
  const completadas = tareas.filter((t) => t.estado === "COMPLETADA");
  const enProceso = tareas.filter((t) => t.estado === "EN_PROCESO");
  const pendientes = tareas.filter((t) => t.estado === "PENDIENTE");

  // Load time: promedio de completadas. Si no hay, usar días transcurridos de en proceso.
  const loadTimesCompletadas = completadas
    .map((t) => calcularLoadTime(t))
    .filter((d): d is number => typeof d === "number");

  const loadTimesEnProceso = enProceso
    .map((t) => calcularTiempoDias(t))
    .filter((d): d is number => typeof d === "number");

  const todosLoadTimes = [...loadTimesCompletadas, ...loadTimesEnProceso];
  const loadTimePromedio =
    todosLoadTimes.length > 0
      ? Math.round(todosLoadTimes.reduce((a, b) => a + b, 0) / todosLoadTimes.length)
      : 0;

  const totalReprogramaciones = tareas.reduce(
    (a, t) => a + (t.historialEntregas?.length || 0),
    0,
  );
  const totalRechazos = tareas.reduce((a, t) => a + t.contadorRechazos, 0);

  // Tasa de retrabajo: sobre todas las tareas iniciadas (no solo completadas)
  const iniciadas = tareas.filter((t) => t.estado !== "PENDIENTE");
  const conRetrabajo = iniciadas.filter((t) => t.contadorRechazos > 0).length;
  const tasaRetrabajo =
    iniciadas.length > 0
      ? Math.round((conRetrabajo / iniciadas.length) * 100)
      : 0;

  // Entregas a tiempo: sobre completadas. Si no hay, mostrar % de no vencidas en proceso.
  let tasaEntregaATiempo = 0;
  if (completadas.length > 0) {
    const aTiempo = completadas.filter((t) => {
      const d = calcularDesviacion(t);
      return typeof d === "number" ? d <= 0 : true;
    }).length;
    tasaEntregaATiempo = Math.round((aTiempo / completadas.length) * 100);
  } else if (enProceso.length > 0) {
    // Alternativa: % de tareas en proceso que aún no están vencidas
    const noVencidas = enProceso.filter((t) => !estaEnRiesgo(t)).length;
    tasaEntregaATiempo = Math.round((noVencidas / enProceso.length) * 100);
  }

  return {
    totalTareas: tareas.length,
    completadas: completadas.length,
    enProceso: enProceso.length,
    pendientes: pendientes.length,
    loadTimePromedioDias: loadTimePromedio,
    totalReprogramaciones,
    totalRechazos,
    tasaRetrabajo,
    tareasEnRiesgo: enProceso.filter(estaEnRiesgo).length,
    tasaEntregaATiempo,
  };
}

/**
 * Agrega métricas por arquitecto. Una tarea con varios arquitectos cuenta
 * para cada uno de ellos.
 */
export function calcularKpiPorArquitecto(
  tareas: TareaDiseno[],
): KpiArquitecto[] {
  const mapa = new Map<
    number,
    { arquitecto: Arquitecto; tareas: TareaDiseno[] }
  >();

  for (const tarea of tareas) {
    for (const a of tarea.arquitectos) {
      if (!mapa.has(a.id)) mapa.set(a.id, { arquitecto: a, tareas: [] });
      mapa.get(a.id)!.tareas.push(tarea);
    }
  }

  const resultado: KpiArquitecto[] = [];

  for (const { arquitecto, tareas: suyas } of mapa.values()) {
    const completadas = suyas.filter((t) => t.estado === "COMPLETADA");
    const enProceso = suyas.filter((t) => t.estado === "EN_PROCESO");

    const loadTimesComp = completadas
      .map((t) => calcularLoadTime(t))
      .filter((d): d is number => typeof d === "number");
    const loadTimesProc = enProceso
      .map((t) => calcularTiempoDias(t))
      .filter((d): d is number => typeof d === "number");
    const todosLT = [...loadTimesComp, ...loadTimesProc];
    const loadTimePromedio =
      todosLT.length > 0
        ? Math.round(todosLT.reduce((a, b) => a + b, 0) / todosLT.length)
        : 0;

    const totalReprogramaciones = suyas.reduce(
      (a, t) => a + (t.historialEntregas?.length || 0),
      0,
    );
    const totalRechazos = suyas.reduce((a, t) => a + t.contadorRechazos, 0);

    const iniciadas = suyas.filter((t) => t.estado !== "PENDIENTE");
    const conRetrabajo = iniciadas.filter((t) => t.contadorRechazos > 0).length;
    const tasaRetrabajo =
      iniciadas.length > 0
        ? Math.round((conRetrabajo / iniciadas.length) * 100)
        : 0;

    const entregasATiempo = completadas.filter((t) => {
      const d = calcularDesviacion(t);
      return typeof d === "number" ? d <= 0 : true;
    }).length;

    // Promedio de eficiencia sobre las tareas iniciadas (en proceso o completadas).
    const pesos = iniciadas
      .map((t) => calcularEficiencia(t))
      .filter((e): e is Eficiencia => Boolean(e))
      .map((e) => PESO_EFICIENCIA[e]);
    const promedioPeso =
      pesos.length > 0 ? pesos.reduce((a, b) => a + b, 0) / pesos.length : 2;

    resultado.push({
      arquitectoId: arquitecto.id,
      nombre: arquitecto.name,
      tareasTotales: suyas.length,
      tareasCompletadas: completadas.length,
      tareasEnProceso: enProceso.length,
      loadTimePromedioDias: loadTimePromedio,
      totalReprogramaciones,
      totalRechazos,
      tasaRetrabajo,
      entregasATiempo,
      eficienciaPromedio: eficienciaDesdePromedio(promedioPeso),
    });
  }

  // Ranking: más eficientes y con menor load time primero.
  return resultado.sort((a, b) => {
    const ef =
      PESO_EFICIENCIA[b.eficienciaPromedio] -
      PESO_EFICIENCIA[a.eficienciaPromedio];
    if (ef !== 0) return ef;
    return a.loadTimePromedioDias - b.loadTimePromedioDias;
  });
}

/** Paleta de color por nivel de eficiencia (consistente en toda la UI). */
export const EFICIENCIA_COLOR: Record<
  Eficiencia,
  { bg: string; text: string; dot: string; label: string }
> = {
  ALTA: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Alta",
  },
  MEDIA: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Media",
  },
  BAJA: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Baja",
  },
};

/** Formatea una fecha ISO a algo legible en español. */
export function fmtFecha(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
