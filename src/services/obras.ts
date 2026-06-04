import {
  Obra,
  ObraFormValues,
  Partida,
  PartidaFormValues,
  ReporteDiario,
  ReporteFormValues,
  Personal,
  PersonalFormValues,
  ObrasResumen,
  MaterialDisponible,
  ValuacionFinal,
  EstadoObra,
} from "@/types/obras";
import {
  calcularMontoPresupuestado,
  calcularMontoEjecutado,
  calcularAvancePartida,
  calcularResumenObras,
  calcularValuacion,
  calcularCostoManoObra,
  calcularCostoMateriales,
} from "@/lib/obras";
import dayjs from "dayjs";
import { decrementarStock } from "./inventario";

// ─── Datos Semilla ────────────────────────────────────────────────────────────

let PERSONAL: Personal[] = [
  { id: 1, nombre: "Carlos Capataz", cargo: "Capataz", costoPorHora: 15000 },
  { id: 2, nombre: "Juan Albañil", cargo: "Albañil", costoPorHora: 12000 },
  { id: 3, nombre: "Pedro Fierrero", cargo: "Fierrero", costoPorHora: 13000 },
  { id: 4, nombre: "Luis Electricista", cargo: "Electricista", costoPorHora: 14000 },
  { id: 5, nombre: "Miguel Plomero", cargo: "Plomero", costoPorHora: 12500 },
  { id: 6, nombre: "Antonio Ayudante", cargo: "Ayudante", costoPorHora: 8000 },
];

const hace = (dias: number) => dayjs().subtract(dias, "days").toISOString();
const dentro = (dias: number) => dayjs().add(dias, "days").toISOString();

let OBRAS: Obra[] = [
  {
    id: 1,
    nombre: "Casa García",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna García",
    capatazId: 1,
    capatazNombre: "Carlos Capataz",
    estado: "EN_CURSO",
    fechaInicio: hace(45),
    fechaFinPlanificada: dentro(15),
    presupuestoTotal: 45000000,
    presupuestoConsumido: 18500000,
    partidas: [
      {
        id: 101,
        obraId: 1,
        codigo: "01.01",
        descripcion: "Excavación y movimiento de tierra",
        unidad: "m³",
        cantidadPresupuestada: 150,
        precioUnitario: 80000,
        montoPresupuestado: 12000000,
        cantidadEjecutada: 90,
        montoEjecutado: 7200000,
        avancePorcentaje: 60,
      },
      {
        id: 102,
        obraId: 1,
        codigo: "01.02",
        descripcion: "Estructura de acero",
        unidad: "ton",
        cantidadPresupuestada: 45,
        precioUnitario: 120000,
        montoPresupuestado: 5400000,
        cantidadEjecutada: 18,
        montoEjecutado: 2160000,
        avancePorcentaje: 40,
      },
      {
        id: 103,
        obraId: 1,
        codigo: "01.03",
        descripcion: "Concreto en losa",
        unidad: "m³",
        cantidadPresupuestada: 200,
        precioUnitario: 95000,
        montoPresupuestado: 19000000,
        cantidadEjecutada: 20,
        montoEjecutado: 1900000,
        avancePorcentaje: 10,
      },
      {
        id: 104,
        obraId: 1,
        codigo: "01.04",
        descripcion: "Acabados generales",
        unidad: "m²",
        cantidadPresupuestada: 400,
        precioUnitario: 40000,
        montoPresupuestado: 16000000,
        cantidadEjecutada: 0,
        montoEjecutado: 0,
        avancePorcentaje: 0,
      },
    ],
    reportes: [
      {
        id: 1001,
        obraId: 1,
        obraNombre: "Casa García",
        partidaId: 101,
        partidaCodigo: "01.01",
        partidaDescripcion: "Excavación y movimiento de tierra",
        fecha: hace(20),
        avanceLogrado: 15,
        observaciones: "Excavación sin inconvenientes",
        personal: [
          {
            id: "p1",
            personalId: 1,
            personalNombre: "Carlos Capataz",
            cargo: "Capataz",
            horasTrabajadas: 8,
            costoPorHora: 15000,
            subtotal: 120000,
          },
          {
            id: "p2",
            personalId: 2,
            personalNombre: "Juan Albañil",
            cargo: "Albañil",
            horasTrabajadas: 8,
            costoPorHora: 12000,
            subtotal: 96000,
          },
        ],
        materiales: [
          {
            id: "m1",
            materialId: 1,
            materialNombre: "Cemento",
            unidad: "kg",
            cantidad: 500,
            precioUnitario: 1000,
            subtotal: 500000,
          },
        ],
        costoManoObra: 216000,
        costoMateriales: 500000,
        costoTotal: 716000,
        creadoEn: hace(20),
      },
    ],
    notas: "Obra en progreso normal",
    creadoEn: hace(45),
  },
  {
    id: 2,
    nombre: "Edificio Comercial",
    proyectoId: 2,
    proyectoNombre: "Edificio Comercial Centro",
    capatazId: 1,
    capatazNombre: "Carlos Capataz",
    estado: "EN_CURSO",
    fechaInicio: hace(30),
    fechaFinPlanificada: dentro(60),
    presupuestoTotal: 120000000,
    presupuestoConsumido: 42000000,
    partidas: [
      {
        id: 201,
        obraId: 2,
        codigo: "02.01",
        descripcion: "Demolición de estructura existente",
        unidad: "m²",
        cantidadPresupuestada: 300,
        precioUnitario: 25000,
        montoPresupuestado: 7500000,
        cantidadEjecutada: 300,
        montoEjecutado: 7500000,
        avancePorcentaje: 100,
      },
      {
        id: 202,
        obraId: 2,
        codigo: "02.02",
        descripcion: "Estructura nueva",
        unidad: "ton",
        cantidadPresupuestada: 120,
        precioUnitario: 150000,
        montoPresupuestado: 18000000,
        cantidadEjecutada: 36,
        montoEjecutado: 5400000,
        avancePorcentaje: 30,
      },
      {
        id: 203,
        obraId: 2,
        codigo: "02.03",
        descripcion: "Concreto estructural",
        unidad: "m³",
        cantidadPresupuestada: 500,
        precioUnitario: 95000,
        montoPresupuestado: 47500000,
        cantidadEjecutada: 75,
        montoEjecutado: 7125000,
        avancePorcentaje: 15,
      },
    ],
    reportes: [],
    creadoEn: hace(30),
  },
  {
    id: 3,
    nombre: "Reforma Casa Molina",
    proyectoId: 3,
    proyectoNombre: "Reforma Casa Molina",
    capatazId: 2,
    capatazNombre: "Juan Albañil",
    estado: "COMPLETADA",
    fechaInicio: hace(90),
    fechaFinPlanificada: hace(5),
    fechaFinReal: hace(5),
    presupuestoTotal: 18000000,
    presupuestoConsumido: 17800000,
    partidas: [
      {
        id: 301,
        obraId: 3,
        codigo: "03.01",
        descripcion: "Demolición interior",
        unidad: "m²",
        cantidadPresupuestada: 80,
        precioUnitario: 40000,
        montoPresupuestado: 3200000,
        cantidadEjecutada: 80,
        montoEjecutado: 3200000,
        avancePorcentaje: 100,
      },
      {
        id: 302,
        obraId: 3,
        codigo: "03.02",
        descripcion: "Acabados y pintura",
        unidad: "m²",
        cantidadPresupuestada: 200,
        precioUnitario: 35000,
        montoPresupuestado: 7000000,
        cantidadEjecutada: 200,
        montoEjecutado: 7000000,
        avancePorcentaje: 100,
      },
      {
        id: 303,
        obraId: 3,
        codigo: "03.03",
        descripcion: "Instalaciones eléctricas",
        unidad: "punto",
        cantidadPresupuestada: 50,
        precioUnitario: 150000,
        montoPresupuestado: 7500000,
        cantidadEjecutada: 50,
        montoEjecutado: 7500000,
        avancePorcentaje: 100,
      },
    ],
    reportes: [],
    creadoEn: hace(90),
  },
];

let SECUENCIA_OBRA = 4;
let SECUENCIA_PARTIDA = 400;
let SECUENCIA_REPORTE = 2000;
let SECUENCIA_PERSONAL = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = <T,>(valor: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), 280));

const uuidLocal = () => Math.random().toString(36).slice(2, 11);

// ─── Obras CRUD ───────────────────────────────────────────────────────────────

export async function getObras(): Promise<Obra[]> {
  const result = OBRAS.map((o) => ({ ...o, reportes: [] }));
  return delay(result);
}

export async function getObra(id: number): Promise<Obra> {
  const obra = OBRAS.find((o) => o.id === id);
  if (!obra) throw new Error(`Obra ${id} no encontrada`);
  return delay({ ...obra });
}

export async function createObra(values: ObraFormValues): Promise<Obra> {
  const id = SECUENCIA_OBRA++;
  const obra: Obra = {
    id,
    nombre: values.nombre,
    proyectoId: values.proyectoId,
    proyectoNombre: `Proyecto ${values.proyectoId}`,
    capatazId: values.capatazId,
    capatazNombre: values.capatazId
      ? PERSONAL.find((p) => p.id === values.capatazId)?.nombre
      : undefined,
    estado: values.estado,
    fechaInicio: values.fechaInicio,
    fechaFinPlanificada: values.fechaFinPlanificada,
    presupuestoTotal: values.presupuestoTotal,
    presupuestoConsumido: 0,
    partidas: [],
    reportes: [],
    notas: values.notas,
    creadoEn: new Date().toISOString(),
  };
  OBRAS.push(obra);
  return delay(obra);
}

export async function updateObra(
  id: number,
  values: Partial<ObraFormValues>
): Promise<Obra> {
  const obra = OBRAS.find((o) => o.id === id);
  if (!obra) throw new Error(`Obra ${id} no encontrada`);
  Object.assign(obra, values);
  return delay(obra);
}

export async function updateEstadoObra(
  id: number,
  estado: EstadoObra
): Promise<Obra> {
  const obra = OBRAS.find((o) => o.id === id);
  if (!obra) throw new Error(`Obra ${id} no encontrada`);
  obra.estado = estado;
  if (estado === "COMPLETADA" && !obra.fechaFinReal) {
    obra.fechaFinReal = new Date().toISOString();
  }
  return delay(obra);
}

export async function getResumenObras(): Promise<ObrasResumen> {
  const resumen = calcularResumenObras(OBRAS);
  return delay(resumen);
}

// ─── Partidas ─────────────────────────────────────────────────────────────────

export async function getPartidas(obraId: number): Promise<Partida[]> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  return delay([...obra.partidas]);
}

export async function createPartida(
  obraId: number,
  values: PartidaFormValues
): Promise<Partida> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);

  const partida: Partida = {
    id: SECUENCIA_PARTIDA++,
    obraId,
    codigo: values.codigo,
    descripcion: values.descripcion,
    unidad: values.unidad,
    cantidadPresupuestada: values.cantidadPresupuestada,
    precioUnitario: values.precioUnitario,
    montoPresupuestado: values.cantidadPresupuestada * values.precioUnitario,
    cantidadEjecutada: 0,
    montoEjecutado: 0,
    avancePorcentaje: 0,
  };
  obra.partidas.push(partida);
  return delay(partida);
}

export async function updatePartida(
  obraId: number,
  partidaId: number,
  values: Partial<PartidaFormValues>
): Promise<Partida> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  const partida = obra.partidas.find((p) => p.id === partidaId);
  if (!partida) throw new Error(`Partida ${partidaId} no encontrada`);

  if (values.cantidadPresupuestada !== undefined) {
    partida.cantidadPresupuestada = values.cantidadPresupuestada;
  }
  if (values.precioUnitario !== undefined) {
    partida.precioUnitario = values.precioUnitario;
  }
  if (values.codigo !== undefined) partida.codigo = values.codigo;
  if (values.descripcion !== undefined) partida.descripcion = values.descripcion;
  if (values.unidad !== undefined) partida.unidad = values.unidad;

  partida.montoPresupuestado =
    partida.cantidadPresupuestada * partida.precioUnitario;
  partida.avancePorcentaje = calcularAvancePartida(partida);

  return delay(partida);
}

export async function deletePartida(
  obraId: number,
  partidaId: number
): Promise<void> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  obra.partidas = obra.partidas.filter((p) => p.id !== partidaId);
  return delay(undefined);
}

// ─── Reportes ─────────────────────────────────────────────────────────────────

export async function getReportes(obraId: number): Promise<ReporteDiario[]> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  return delay([...obra.reportes]);
}

export async function getReporte(
  obraId: number,
  reporteId: number
): Promise<ReporteDiario> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  const reporte = obra.reportes.find((r) => r.id === reporteId);
  if (!reporte) throw new Error(`Reporte ${reporteId} no encontrado`);
  return delay({ ...reporte });
}

export async function createReporte(values: ReporteFormValues): Promise<ReporteDiario> {
  const obra = OBRAS.find((o) => o.id === values.obraId);
  if (!obra) throw new Error(`Obra ${values.obraId} no encontrada`);

  const partida = obra.partidas.find((p) => p.id === values.partidaId);
  if (!partida) throw new Error(`Partida ${values.partidaId} no encontrada`);

  // Construir líneas de personal
  const personal = values.personal.map((lp) => {
    const per = PERSONAL.find((p) => p.id === lp.personalId);
    if (!per) throw new Error(`Personal ${lp.personalId} no encontrado`);
    const subtotal = lp.horasTrabajadas * per.costoPorHora;
    return {
      id: uuidLocal(),
      personalId: lp.personalId,
      personalNombre: per.nombre,
      cargo: per.cargo,
      horasTrabajadas: lp.horasTrabajadas,
      costoPorHora: per.costoPorHora,
      subtotal,
    };
  });

  // Construir líneas de materiales y decrementar stock
  const materiales = values.materiales.map((lm) => {
    const material = getMaterialesSync().find((m) => m.id === lm.materialId);
    if (!material) throw new Error(`Material ${lm.materialId} no encontrado`);

    const subtotal = lm.cantidad * lm.precioUnitario;

    // SIDE EFFECT: decrementar stock
    decrementarStock(lm.materialId, lm.cantidad);

    return {
      id: uuidLocal(),
      materialId: lm.materialId,
      materialNombre: material.nombre,
      unidad: material.unidad,
      cantidad: lm.cantidad,
      precioUnitario: lm.precioUnitario,
      subtotal,
    };
  });

  const costoManoObra = calcularCostoManoObra(personal);
  const costoMateriales = calcularCostoMateriales(materiales);
  const costoTotal = costoManoObra + costoMateriales;

  // Actualizar partida: incrementar cantidadEjecutada
  const cantidadPorAvance =
    (values.avanceLogrado / 100) * partida.cantidadPresupuestada;
  const cantidadAIncrementar = Math.max(0, cantidadPorAvance - partida.cantidadEjecutada);
  partida.cantidadEjecutada += cantidadAIncrementar;
  partida.montoEjecutado = calcularMontoEjecutado(partida);
  partida.avancePorcentaje = calcularAvancePartida(partida);

  // Actualizar obra: incrementar presupuestoConsumido
  obra.presupuestoConsumido += costoTotal;

  // Crear reporte
  const reporte: ReporteDiario = {
    id: SECUENCIA_REPORTE++,
    obraId: values.obraId,
    obraNombre: obra.nombre,
    partidaId: values.partidaId,
    partidaCodigo: partida.codigo,
    partidaDescripcion: partida.descripcion,
    fecha: values.fecha,
    avanceLogrado: values.avanceLogrado,
    observaciones: values.observaciones,
    personal,
    materiales,
    costoManoObra,
    costoMateriales,
    costoTotal,
    creadoEn: new Date().toISOString(),
  };

  obra.reportes.push(reporte);
  return delay(reporte);
}

// ─── Personal ─────────────────────────────────────────────────────────────────

export async function getPersonal(): Promise<Personal[]> {
  return delay([...PERSONAL]);
}

export async function createPersonal(values: PersonalFormValues): Promise<Personal> {
  const personal: Personal = {
    id: SECUENCIA_PERSONAL++,
    nombre: values.nombre,
    cargo: values.cargo,
    costoPorHora: values.costoPorHora,
  };
  PERSONAL.push(personal);
  return delay(personal);
}

export async function updatePersonal(
  id: number,
  values: Partial<PersonalFormValues>
): Promise<Personal> {
  const personal = PERSONAL.find((p) => p.id === id);
  if (!personal) throw new Error(`Personal ${id} no encontrado`);
  Object.assign(personal, values);
  return delay(personal);
}

// ─── Valuación ────────────────────────────────────────────────────────────────

export async function getValuacion(obraId: number): Promise<ValuacionFinal> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  const valuacion = calcularValuacion(obra);
  return delay(valuacion);
}

// ─── Selectores (cross-service) ────────────────────────────────────────────────

export async function getMaterialesDisponibles(): Promise<MaterialDisponible[]> {
  const materiales = getMaterialesSync();
  return delay(
    materiales.map((m) => ({
      materialId: m.id,
      materialNombre: m.nombre,
      unidad: m.unidad,
      stockActual: m.stockActual,
      precioPromedio: m.precioPromedio,
      estadoStock: m.estadoStock,
    }))
  );
}

export async function getProyectosParaObra(): Promise<
  { id: number; nombre: string }[]
> {
  return delay([
    { id: 1, nombre: "Casa Moderna García" },
    { id: 2, nombre: "Edificio Comercial Centro" },
    { id: 3, nombre: "Reforma Casa Molina" },
    { id: 4, nombre: "Casa de Playa" },
    { id: 5, nombre: "Oficinas Tecnológicas" },
  ]);
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function getMaterialesSync() {
  // Esta función es un hack para acceder a los materiales de inventario sin async
  // En un proyecto real, esto vendría de la API
  const materiales = [
    {
      id: 1,
      nombre: "Cemento",
      unidad: "kg",
      stockActual: 5000,
      precioPromedio: 1000,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 2,
      nombre: "Arena",
      unidad: "m³",
      stockActual: 150,
      precioPromedio: 45000,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 3,
      nombre: "Grava",
      unidad: "m³",
      stockActual: 100,
      precioPromedio: 55000,
      estadoStock: "BAJO" as const,
    },
    {
      id: 4,
      nombre: "Acero",
      unidad: "ton",
      stockActual: 30,
      precioPromedio: 2000000,
      estadoStock: "NORMAL" as const,
    },
  ];
  return materiales;
}
