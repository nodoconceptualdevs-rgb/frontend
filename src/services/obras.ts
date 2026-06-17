import api from "@/lib/api";
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
  ValuacionDoc,
  ValuacionFormValues,
  EstadoObra,
} from "@/types/obras";
import {
  calcularMontoPresupuestado,
  calcularMontoEjecutado,
  calcularAvancePartida,
  calcularResumenObras,
  calcularValuacion,
  calcularValuacionDocConReportes,
  calcularCostoManoObra,
  calcularCostoMateriales,
} from "@/lib/obras";
import dayjs from "dayjs";
import { decrementarStock } from "./inventario";

// ─── Datos Semilla ────────────────────────────────────────────────────────────

let PERSONAL: Personal[] = [
  { id: 1, nombre: "Carlos Capataz",     cargo: "Capataz",      costoPorHora: 15000 },
  { id: 2, nombre: "Juan Albañil",        cargo: "Albañil",      costoPorHora: 12000 },
  { id: 3, nombre: "Pedro Fierrero",      cargo: "Fierrero",     costoPorHora: 13000 },
  { id: 4, nombre: "Luis Electricista",   cargo: "Electricista", costoPorHora: 14000 },
  { id: 5, nombre: "Miguel Plomero",      cargo: "Plomero",      costoPorHora: 12500 },
  { id: 6, nombre: "Antonio Ayudante",    cargo: "Ayudante",     costoPorHora: 8000  },
];

const hace = (dias: number) => dayjs().subtract(dias, "days").toISOString();
const dentro = (dias: number) => dayjs().add(dias, "days").toISOString();

// ─── Helpers para seed ────────────────────────────────────────────────────────
const p = (id: string, pId: string, nomId: string, nom: string, cargo: string, hrs: number, cph: number) => ({
  id, personalId: Number(pId), personalNombre: nom, cargo, horasTrabajadas: hrs, costoPorHora: cph, subtotal: hrs * cph,
});
const m = (id: string, mId: string, nomId: string, nom: string, ud: string, cant: number, pu: number) => ({
  id, materialId: Number(mId), materialNombre: nom, unidad: ud, cantidad: cant, precioUnitario: pu, subtotal: cant * pu,
});

let OBRAS: Obra[] = [
  // ─── OBRA 1: Casa García — EN_CURSO, 2 valuaciones concretadas + pendientes ──
  {
    id: 1,
    nombre: "Casa García",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna García",
    capatazId: 1,
    capatazNombre: "Carlos Capataz",
    estado: "EN_CURSO",
    fechaInicio: hace(55),
    fechaFinPlanificada: dentro(20),
    presupuestoTotal: 52400000,
    presupuestoConsumido: 26300000,
    notas: "Obra residencial de dos plantas. Suelo arcilloso requirió refuerzo adicional.",
    creadoEn: hace(55),
    partidas: [
      { id: 101, obraId: 1, codigo: "01.01", descripcion: "Excavación y movimiento de tierra", unidad: "m³", cantidadPresupuestada: 150, precioUnitario: 80000, montoPresupuestado: 12000000, cantidadEjecutada: 150, montoEjecutado: 12000000, avancePorcentaje: 100, esExtra: false },
      { id: 102, obraId: 1, codigo: "01.02", descripcion: "Estructura de acero principal", unidad: "ton", cantidadPresupuestada: 45, precioUnitario: 120000, montoPresupuestado: 5400000, cantidadEjecutada: 54, montoEjecutado: 6480000, avancePorcentaje: 100, esExtra: false },  // AUMENTO: 54 vs 45
      { id: 103, obraId: 1, codigo: "01.03", descripcion: "Concreto en losa y vigas", unidad: "m³", cantidadPresupuestada: 200, precioUnitario: 95000, montoPresupuestado: 19000000, cantidadEjecutada: 150, montoEjecutado: 14250000, avancePorcentaje: 75, esExtra: false },
      { id: 104, obraId: 1, codigo: "01.04", descripcion: "Mampostería y muros", unidad: "m²", cantidadPresupuestada: 400, precioUnitario: 40000, montoPresupuestado: 16000000, cantidadEjecutada: 60, montoEjecutado: 2400000, avancePorcentaje: 15, esExtra: false },
      { id: 105, obraId: 1, codigo: "OE-01", descripcion: "Refuerzo adicional de cimentación por suelo blando", unidad: "m³", cantidadPresupuestada: 20, precioUnitario: 110000, montoPresupuestado: 2200000, cantidadEjecutada: 20, montoEjecutado: 2200000, avancePorcentaje: 100, esExtra: true },
    ],
    reportes: [
      // ── V1: hace ~50-40 días (id valuacion = 10) ──────────────────────────────
      { id: 1001, obraId: 1, obraNombre: "Casa García", partidaId: 101, partidaCodigo: "01.01", partidaDescripcion: "Excavación y movimiento de tierra", fecha: hace(50), avanceLogrado: 40, observaciones: "Inicio de excavación zona norte. Sin inconvenientes.", personal: [p("a","1","1","Carlos Capataz","Capataz",8,15000), p("b","2","2","Juan Albañil","Albañil",8,12000), p("c","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","1","1","Cemento","kg",200,1000)], costoManoObra: 280000, costoMateriales: 200000, costoTotal: 480000, creadoEn: hace(50), valuacionId: 10 },
      { id: 1002, obraId: 1, obraNombre: "Casa García", partidaId: 101, partidaCodigo: "01.01", partidaDescripcion: "Excavación y movimiento de tierra", fecha: hace(46), avanceLogrado: 60, observaciones: "Completada zona sur. Total 100%.", personal: [p("a","1","1","Carlos Capataz","Capataz",8,15000), p("b","2","2","Juan Albañil","Albañil",8,12000)], materiales: [], costoManoObra: 216000, costoMateriales: 0, costoTotal: 216000, creadoEn: hace(46), valuacionId: 10 },
      { id: 1003, obraId: 1, obraNombre: "Casa García", partidaId: 102, partidaCodigo: "01.02", partidaDescripcion: "Estructura de acero principal", fecha: hace(44), avanceLogrado: 120, observaciones: "Acero colocado. Requirió 9ton adicionales por cambio de diseño estructural.", personal: [p("a","3","3","Pedro Fierrero","Fierrero",10,13000), p("b","1","1","Carlos Capataz","Capataz",10,15000)], materiales: [m("x","4","4","Acero","ton",9,2000000)], costoManoObra: 280000, costoMateriales: 18000000, costoTotal: 18280000, creadoEn: hace(44), valuacionId: 10 },
      // ── V2: hace ~30-20 días (id valuacion = 11) ──────────────────────────────
      { id: 1004, obraId: 1, obraNombre: "Casa García", partidaId: 103, partidaCodigo: "01.03", partidaDescripcion: "Concreto en losa y vigas", fecha: hace(30), avanceLogrado: 35, observaciones: "Colada losa primer piso. Tiempo de curado 7 días.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","1","1","Cemento","kg",3000,1000), m("y","2","2","Arena","m³",20,45000)], costoManoObra: 160000, costoMateriales: 3900000, costoTotal: 4060000, creadoEn: hace(30), valuacionId: 11 },
      { id: 1005, obraId: 1, obraNombre: "Casa García", partidaId: 103, partidaCodigo: "01.03", partidaDescripcion: "Concreto en losa y vigas", fecha: hace(25), avanceLogrado: 40, observaciones: "Losa segundo piso y vigas perimetrales.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","1","1","Cemento","kg",3500,1000), m("y","3","3","Grava","m³",15,55000)], costoManoObra: 160000, costoMateriales: 4325000, costoTotal: 4485000, creadoEn: hace(25), valuacionId: 11 },
      { id: 1006, obraId: 1, obraNombre: "Casa García", partidaId: 105, partidaCodigo: "OE-01", partidaDescripcion: "Refuerzo adicional de cimentación", fecha: hace(22), avanceLogrado: 100, observaciones: "Refuerzo completado. Solución aprobada por ingeniero.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","3","3","Pedro Fierrero","Fierrero",8,13000)], materiales: [m("x","1","1","Cemento","kg",1500,1000), m("y","4","4","Acero","ton",2,2000000)], costoManoObra: 200000, costoMateriales: 5500000, costoTotal: 5700000, creadoEn: hace(22), valuacionId: 11 },
      // ── PENDIENTES ────────────────────────────────────────────────────────────
      { id: 1007, obraId: 1, obraNombre: "Casa García", partidaId: 104, partidaCodigo: "01.04", partidaDescripcion: "Mampostería y muros", fecha: hace(10), avanceLogrado: 15, observaciones: "Inicio muros planta baja.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","1","1","Cemento","kg",800,1000), m("y","2","2","Arena","m³",5,45000)], costoManoObra: 160000, costoMateriales: 1025000, costoTotal: 1185000, creadoEn: hace(10), valuacionId: undefined },
      { id: 1008, obraId: 1, obraNombre: "Casa García", partidaId: 103, partidaCodigo: "01.03", partidaDescripcion: "Concreto en losa y vigas", fecha: hace(6), avanceLogrado: 0, observaciones: "Sin actividad — lluvia 3 días consecutivos.", personal: [], materiales: [], costoManoObra: 0, costoMateriales: 0, costoTotal: 0, creadoEn: hace(6), valuacionId: undefined },
      { id: 1009, obraId: 1, obraNombre: "Casa García", partidaId: 104, partidaCodigo: "01.04", partidaDescripcion: "Mampostería y muros", fecha: hace(3), avanceLogrado: 30, observaciones: "Muros planta alta avanzando.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","1","1","Cemento","kg",1200,1000), m("y","2","2","Arena","m³",8,45000)], costoManoObra: 160000, costoMateriales: 1560000, costoTotal: 1720000, creadoEn: hace(3), valuacionId: undefined },
    ],
  },

  // ─── OBRA 2: Edificio Comercial — EN_CURSO, 1 valuación + pendientes, AUMENTO en estructura ──
  {
    id: 2,
    nombre: "Edificio Comercial Centro",
    proyectoId: 2,
    proyectoNombre: "Edificio Comercial Centro",
    capatazId: 1,
    capatazNombre: "Carlos Capataz",
    estado: "EN_CURSO",
    fechaInicio: hace(70),
    fechaFinPlanificada: dentro(50),
    presupuestoTotal: 120000000,
    presupuestoConsumido: 35200000,
    notas: "Edificio de 5 pisos. Cambio en planos de estructura aumentó acero requerido.",
    creadoEn: hace(70),
    partidas: [
      { id: 201, obraId: 2, codigo: "02.01", descripcion: "Demolición de estructura existente", unidad: "m²", cantidadPresupuestada: 300, precioUnitario: 25000, montoPresupuestado: 7500000, cantidadEjecutada: 300, montoEjecutado: 7500000, avancePorcentaje: 100, esExtra: false },
      { id: 202, obraId: 2, codigo: "02.02", descripcion: "Cimentación y zapatas", unidad: "m³", cantidadPresupuestada: 180, precioUnitario: 95000, montoPresupuestado: 17100000, cantidadEjecutada: 198, montoEjecutado: 18810000, avancePorcentaje: 100, esExtra: false },  // AUMENTO
      { id: 203, obraId: 2, codigo: "02.03", descripcion: "Estructura metálica principal", unidad: "ton", cantidadPresupuestada: 120, precioUnitario: 150000, montoPresupuestado: 18000000, cantidadEjecutada: 48, montoEjecutado: 7200000, avancePorcentaje: 40, esExtra: false },
      { id: 204, obraId: 2, codigo: "02.04", descripcion: "Concreto estructural pisos", unidad: "m³", cantidadPresupuestada: 500, precioUnitario: 95000, montoPresupuestado: 47500000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
      { id: 205, obraId: 2, codigo: "02.05", descripcion: "Instalaciones eléctricas", unidad: "pto", cantidadPresupuestada: 200, precioUnitario: 150000, montoPresupuestado: 30000000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
      { id: 206, obraId: 2, codigo: "OE-01", descripcion: "Micropilotes por cambio de nivel freático", unidad: "ud", cantidadPresupuestada: 40, precioUnitario: 380000, montoPresupuestado: 15200000, cantidadEjecutada: 40, montoEjecutado: 15200000, avancePorcentaje: 100, esExtra: true },
    ],
    reportes: [
      // ── V1: hace ~65-45 días (id valuacion = 12) ──────────────────────────────
      { id: 2001, obraId: 2, obraNombre: "Edificio Comercial Centro", partidaId: 201, partidaCodigo: "02.01", partidaDescripcion: "Demolición de estructura existente", fecha: hace(65), avanceLogrado: 60, observaciones: "Demolición nivel 1 y 2.", personal: [p("a","1","1","Carlos Capataz","Capataz",8,15000), p("b","2","2","Juan Albañil","Albañil",8,12000)], materiales: [], costoManoObra: 216000, costoMateriales: 0, costoTotal: 216000, creadoEn: hace(65), valuacionId: 12 },
      { id: 2002, obraId: 2, obraNombre: "Edificio Comercial Centro", partidaId: 201, partidaCodigo: "02.01", partidaDescripcion: "Demolición de estructura existente", fecha: hace(60), avanceLogrado: 40, observaciones: "Demolición completada.", personal: [p("a","1","1","Carlos Capataz","Capataz",8,15000)], materiales: [], costoManoObra: 120000, costoMateriales: 0, costoTotal: 120000, creadoEn: hace(60), valuacionId: 12 },
      { id: 2003, obraId: 2, obraNombre: "Edificio Comercial Centro", partidaId: 202, partidaCodigo: "02.02", partidaDescripcion: "Cimentación y zapatas", fecha: hace(55), avanceLogrado: 110, observaciones: "Cimentación requirió 18m³ extra por corrección de cotas. Aprobado por dirección.", personal: [p("a","3","3","Pedro Fierrero","Fierrero",10,13000), p("b","2","2","Juan Albañil","Albañil",10,12000)], materiales: [m("x","1","1","Cemento","kg",5000,1000), m("y","3","3","Grava","m³",30,55000)], costoManoObra: 250000, costoMateriales: 6650000, costoTotal: 6900000, creadoEn: hace(55), valuacionId: 12 },
      { id: 2004, obraId: 2, obraNombre: "Edificio Comercial Centro", partidaId: 206, partidaCodigo: "OE-01", partidaDescripcion: "Micropilotes", fecha: hace(48), avanceLogrado: 100, observaciones: "Todos los micropilotes instalados.", personal: [p("a","3","3","Pedro Fierrero","Fierrero",10,13000)], materiales: [], costoManoObra: 130000, costoMateriales: 0, costoTotal: 130000, creadoEn: hace(48), valuacionId: 12 },
      // ── PENDIENTES ────────────────────────────────────────────────────────────
      { id: 2005, obraId: 2, obraNombre: "Edificio Comercial Centro", partidaId: 203, partidaCodigo: "02.03", partidaDescripcion: "Estructura metálica principal", fecha: hace(20), avanceLogrado: 25, observaciones: "Columnas nivel 1 y 2.", personal: [p("a","3","3","Pedro Fierrero","Fierrero",8,13000), p("b","1","1","Carlos Capataz","Capataz",8,15000)], materiales: [m("x","4","4","Acero","ton",15,2000000)], costoManoObra: 224000, costoMateriales: 30000000, costoTotal: 30224000, creadoEn: hace(20), valuacionId: undefined },
      { id: 2006, obraId: 2, obraNombre: "Edificio Comercial Centro", partidaId: 203, partidaCodigo: "02.03", partidaDescripcion: "Estructura metálica principal", fecha: hace(8), avanceLogrado: 15, observaciones: "Vigas nivel 3.", personal: [p("a","3","3","Pedro Fierrero","Fierrero",8,13000)], materiales: [m("x","4","4","Acero","ton",8,2000000)], costoManoObra: 104000, costoMateriales: 16000000, costoTotal: 16104000, creadoEn: hace(8), valuacionId: undefined },
    ],
  },

  // ─── OBRA 3: Reforma Casa Molina — COMPLETADA, 3 valuaciones cerradas ──────
  {
    id: 3,
    nombre: "Reforma Casa Molina",
    proyectoId: 3,
    proyectoNombre: "Reforma Casa Molina",
    capatazId: 2,
    capatazNombre: "Juan Albañil",
    estado: "COMPLETADA",
    fechaInicio: hace(110),
    fechaFinPlanificada: hace(10),
    fechaFinReal: hace(12),
    presupuestoTotal: 18000000,
    presupuestoConsumido: 17650000,
    notas: "Reforma completa de interiores. Finalizada 2 días antes del plazo.",
    creadoEn: hace(110),
    partidas: [
      { id: 301, obraId: 3, codigo: "03.01", descripcion: "Demolición interior completa", unidad: "m²", cantidadPresupuestada: 80, precioUnitario: 40000, montoPresupuestado: 3200000, cantidadEjecutada: 80, montoEjecutado: 3200000, avancePorcentaje: 100, esExtra: false },
      { id: 302, obraId: 3, codigo: "03.02", descripcion: "Nivelación de pisos", unidad: "m²", cantidadPresupuestada: 120, precioUnitario: 22000, montoPresupuestado: 2640000, cantidadEjecutada: 120, montoEjecutado: 2640000, avancePorcentaje: 100, esExtra: false },
      { id: 303, obraId: 3, codigo: "03.03", descripcion: "Acabados y pintura interior", unidad: "m²", cantidadPresupuestada: 200, precioUnitario: 35000, montoPresupuestado: 7000000, cantidadEjecutada: 200, montoEjecutado: 7000000, avancePorcentaje: 100, esExtra: false },
      { id: 304, obraId: 3, codigo: "03.04", descripcion: "Instalaciones eléctricas", unidad: "pto", cantidadPresupuestada: 35, precioUnitario: 150000, montoPresupuestado: 5250000, cantidadEjecutada: 28, montoEjecutado: 4200000, avancePorcentaje: 80, esExtra: false }, // DISMINUCIÓN: instalaron menos puntos
    ],
    reportes: [
      // ── V1: hace ~105-80 días (id valuacion = 13) ─────────────────────────────
      { id: 3001, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 301, partidaCodigo: "03.01", partidaDescripcion: "Demolición interior", fecha: hace(105), avanceLogrado: 50, observaciones: "Demolición cocina y baños.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000)], materiales: [], costoManoObra: 96000, costoMateriales: 0, costoTotal: 96000, creadoEn: hace(105), valuacionId: 13 },
      { id: 3002, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 301, partidaCodigo: "03.01", partidaDescripcion: "Demolición interior", fecha: hace(100), avanceLogrado: 50, observaciones: "Demolición habitaciones.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [], costoManoObra: 160000, costoMateriales: 0, costoTotal: 160000, creadoEn: hace(100), valuacionId: 13 },
      { id: 3003, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 302, partidaCodigo: "03.02", partidaDescripcion: "Nivelación de pisos", fecha: hace(90), avanceLogrado: 60, observaciones: "Pisos planta baja nivelados.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000)], materiales: [m("x","1","1","Cemento","kg",1000,1000)], costoManoObra: 96000, costoMateriales: 1000000, costoTotal: 1096000, creadoEn: hace(90), valuacionId: 13 },
      // ── V2: hace ~75-50 días (id valuacion = 14) ─────────────────────────────
      { id: 3004, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 302, partidaCodigo: "03.02", partidaDescripcion: "Nivelación de pisos", fecha: hace(75), avanceLogrado: 40, observaciones: "Pisos planta alta.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000)], materiales: [m("x","1","1","Cemento","kg",800,1000)], costoManoObra: 96000, costoMateriales: 800000, costoTotal: 896000, creadoEn: hace(75), valuacionId: 14 },
      { id: 3005, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 303, partidaCodigo: "03.03", partidaDescripcion: "Acabados y pintura", fecha: hace(65), avanceLogrado: 50, observaciones: "Primera mano planta baja.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [], costoManoObra: 160000, costoMateriales: 0, costoTotal: 160000, creadoEn: hace(65), valuacionId: 14 },
      { id: 3006, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 304, partidaCodigo: "03.04", partidaDescripcion: "Instalaciones eléctricas", fecha: hace(55), avanceLogrado: 45, observaciones: "Tablero principal y circuitos.", personal: [p("a","4","4","Luis Electricista","Electricista",8,14000)], materiales: [], costoManoObra: 112000, costoMateriales: 0, costoTotal: 112000, creadoEn: hace(55), valuacionId: 14 },
      // ── V3: hace ~45-15 días (id valuacion = 15) ─────────────────────────────
      { id: 3007, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 303, partidaCodigo: "03.03", partidaDescripcion: "Acabados y pintura", fecha: hace(45), avanceLogrado: 50, observaciones: "Segunda mano y acabados finales.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000)], materiales: [], costoManoObra: 96000, costoMateriales: 0, costoTotal: 96000, creadoEn: hace(45), valuacionId: 15 },
      { id: 3008, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 304, partidaCodigo: "03.04", partidaDescripcion: "Instalaciones eléctricas", fecha: hace(35), avanceLogrado: 35, observaciones: "Tomas y switchs. Cliente redujo 7 puntos por cambio de diseño.", personal: [p("a","4","4","Luis Electricista","Electricista",8,14000)], materiales: [], costoManoObra: 112000, costoMateriales: 0, costoTotal: 112000, creadoEn: hace(35), valuacionId: 15 },
      { id: 3009, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 303, partidaCodigo: "03.03", partidaDescripcion: "Acabados y pintura", fecha: hace(20), avanceLogrado: 0, observaciones: "Inspección final. Sin trabajo de campo.", personal: [], materiales: [], costoManoObra: 0, costoMateriales: 0, costoTotal: 0, creadoEn: hace(20), valuacionId: 15 },
      // ── REPORTES POSTERIORES (post-valuación, con consumo de materiales para InventarioTab) ──
      { id: 3010, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 301, partidaCodigo: "03.01", partidaDescripcion: "Demolición interior", fecha: hace(18), avanceLogrado: 0, observaciones: "Retiro de escombros y material reciclable. Cierre de partida.", personal: [p("a","2","2","Juan Albañil","Albañil",6,12000), p("b","6","6","Antonio Ayudante","Ayudante",6,8000)], materiales: [], costoManoObra: 120000, costoMateriales: 0, costoTotal: 120000, creadoEn: hace(18), valuacionId: undefined },
      { id: 3011, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 302, partidaCodigo: "03.02", descripcionPartida: "Nivelación de pisos", fecha: hace(16), avanceLogrado: 0, observaciones: "Instalación de tuberías PVC en piso nivelado.", personal: [p("a","5","5","Miguel Plomero","Plomero",8,12500)], materiales: [m("x","10","10","Tubo PVC 4in","m",120,8550), m("y","11","11","Cable THW","m",250,4200)], costoManoObra: 100000, costoMateriales: 1026000, costoTotal: 1126000, creadoEn: hace(16), valuacionId: undefined },
      { id: 3012, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 303, partidaCodigo: "03.03", partidaDescripcion: "Acabados y pintura", fecha: hace(14), avanceLogrado: 0, observaciones: "Pintura final y tratamiento de muros.", personal: [p("a","2","2","Juan Albañil","Albañil",10,12000)], materiales: [m("x","12","12","Pintura Latex","gl",85,28400), m("y","13","13","Masilla","kg",120,8900)], costoManoObra: 120000, costoMateriales: 3284000, costoTotal: 3404000, creadoEn: hace(14), valuacionId: undefined },
      { id: 3013, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 302, partidaCodigo: "03.02", descripcionPartida: "Nivelación de pisos", fecha: hace(12), avanceLogrado: 0, observaciones: "Aplicación de base de cemento Portland reforzado.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","1","1","Cemento Portland","kg",4500,2000), m("y","3","3","Arena gruesa","m3",35,58000)], costoManoObra: 160000, costoMateriales: 11030000, costoTotal: 11190000, creadoEn: hace(12), valuacionId: undefined },
      { id: 3014, obraId: 3, obraNombre: "Reforma Casa Molina", partidaId: 303, partidaCodigo: "03.03", partidaDescripcion: "Acabados y pintura", fecha: hace(10), avanceLogrado: 0, observaciones: "Colocación de cerámica de piso premium.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [m("x","14","14","Ceramica piso premium","m2",240,11090), m("y","15","15","Fragua blanca especial","kg",75,35640)], costoManoObra: 160000, costoMateriales: 4899600, costoTotal: 5059600, creadoEn: hace(10), valuacionId: undefined },
    ],
  },

  // ─── OBRA 4: Torre Residencial Palmeras — PAUSADA, 1 valuación, sin pendientes ──
  {
    id: 4,
    nombre: "Torre Residencial Palmeras",
    proyectoId: 4,
    proyectoNombre: "Proyecto Torre Palmeras",
    capatazId: 1,
    capatazNombre: "Carlos Capataz",
    estado: "PAUSADA",
    fechaInicio: hace(40),
    fechaFinPlanificada: dentro(80),
    presupuestoTotal: 85000000,
    presupuestoConsumido: 14200000,
    notas: "Pausada por disputa con proveedor de acero. Reanudación prevista en 2 semanas.",
    creadoEn: hace(40),
    partidas: [
      { id: 401, obraId: 4, codigo: "04.01", descripcion: "Estudios de suelo y topografía", unidad: "gl", cantidadPresupuestada: 1, precioUnitario: 4500000, montoPresupuestado: 4500000, cantidadEjecutada: 1, montoEjecutado: 4500000, avancePorcentaje: 100, esExtra: false },
      { id: 402, obraId: 4, codigo: "04.02", descripcion: "Excavación masiva", unidad: "m³", cantidadPresupuestada: 600, precioUnitario: 75000, montoPresupuestado: 45000000, cantidadEjecutada: 180, montoEjecutado: 13500000, avancePorcentaje: 30, esExtra: false },
      { id: 403, obraId: 4, codigo: "04.03", descripcion: "Pilotaje y cimentación profunda", unidad: "ml", cantidadPresupuestada: 400, precioUnitario: 80000, montoPresupuestado: 32000000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
      { id: 404, obraId: 4, codigo: "04.04", descripcion: "Estructura de concreto planta baja", unidad: "m³", cantidadPresupuestada: 250, precioUnitario: 140000, montoPresupuestado: 35000000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
    ],
    reportes: [
      // ── V1: hace ~38-25 días (id valuacion = 16) ─────────────────────────────
      { id: 4001, obraId: 4, obraNombre: "Torre Residencial Palmeras", partidaId: 401, partidaCodigo: "04.01", partidaDescripcion: "Estudios de suelo y topografía", fecha: hace(38), avanceLogrado: 100, observaciones: "Estudios completados. Informe entregado.", personal: [p("a","1","1","Carlos Capataz","Capataz",8,15000)], materiales: [], costoManoObra: 120000, costoMateriales: 0, costoTotal: 120000, creadoEn: hace(38), valuacionId: 16 },
      { id: 4002, obraId: 4, obraNombre: "Torre Residencial Palmeras", partidaId: 402, partidaCodigo: "04.02", partidaDescripcion: "Excavación masiva", fecha: hace(35), avanceLogrado: 20, observaciones: "Primera semana de excavación.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000), p("b","6","6","Antonio Ayudante","Ayudante",8,8000)], materiales: [], costoManoObra: 160000, costoMateriales: 0, costoTotal: 160000, creadoEn: hace(35), valuacionId: 16 },
      { id: 4003, obraId: 4, obraNombre: "Torre Residencial Palmeras", partidaId: 402, partidaCodigo: "04.02", partidaDescripcion: "Excavación masiva", fecha: hace(28), avanceLogrado: 10, observaciones: "Avance lento por terreno rocoso.", personal: [p("a","2","2","Juan Albañil","Albañil",8,12000)], materiales: [], costoManoObra: 96000, costoMateriales: 0, costoTotal: 96000, creadoEn: hace(28), valuacionId: 16 },
      // Sin reportes pendientes — se pausó después de V1
    ],
  },

  // ─── OBRA 5: Oficinas TechHub — PREPARACION, sin reportes ───────────────────
  {
    id: 5,
    nombre: "Oficinas TechHub",
    proyectoId: 5,
    proyectoNombre: "Oficinas Tecnológicas TechHub",
    capatazId: 3,
    capatazNombre: "Pedro Fierrero",
    estado: "PREPARACION",
    fechaInicio: dentro(5),
    fechaFinPlanificada: dentro(120),
    presupuestoTotal: 38000000,
    presupuestoConsumido: 0,
    notas: "En etapa de coordinación con proveedores. Inicio de obras en 5 días.",
    creadoEn: hace(10),
    partidas: [
      { id: 501, obraId: 5, codigo: "05.01", descripcion: "Demolición y adecuación planta existente", unidad: "m²", cantidadPresupuestada: 200, precioUnitario: 30000, montoPresupuestado: 6000000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
      { id: 502, obraId: 5, codigo: "05.02", descripcion: "Obra civil y divisiones", unidad: "m²", cantidadPresupuestada: 350, precioUnitario: 55000, montoPresupuestado: 19250000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
      { id: 503, obraId: 5, codigo: "05.03", descripcion: "Instalaciones eléctricas y voz/datos", unidad: "pto", cantidadPresupuestada: 80, precioUnitario: 160000, montoPresupuestado: 12800000, cantidadEjecutada: 0, montoEjecutado: 0, avancePorcentaje: 0, esExtra: false },
    ],
    reportes: [],
  },
];

let SECUENCIA_OBRA = 6;
let SECUENCIA_PARTIDA = 600;
let SECUENCIA_REPORTE = 5000;
let SECUENCIA_PERSONAL = 7;
let SECUENCIA_VALUACION = 20;

// ─── Construir VALUACIONES semilla a partir de los reportes marcados ──────────
function buildSeedValuaciones(): ValuacionDoc[] {
  const docs: ValuacionDoc[] = [];
  const conf: Array<{ obraIdx: number; vId: number; numero: number }> = [
    { obraIdx: 0, vId: 10, numero: 1 },
    { obraIdx: 0, vId: 11, numero: 2 },
    { obraIdx: 1, vId: 12, numero: 1 },
    { obraIdx: 2, vId: 13, numero: 1 },
    { obraIdx: 2, vId: 14, numero: 2 },
    { obraIdx: 2, vId: 15, numero: 3 },
    { obraIdx: 3, vId: 16, numero: 1 },
  ];
  for (const { obraIdx, vId, numero } of conf) {
    const obra = OBRAS[obraIdx];
    const reportes = obra.reportes.filter((r) => r.valuacionId === vId);
    if (reportes.length === 0) continue;
    docs.push(calcularValuacionDocConReportes(obra, reportes, vId, numero));
  }
  return docs;
}

let VALUACIONES: ValuacionDoc[] = buildSeedValuaciones();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = <T,>(valor: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), 280));

const uuidLocal = () => Math.random().toString(36).slice(2, 11);

// ─── Helper para mapear respuesta Strapi a tipo Obra ─────────────────────────
function mapStrapiObra(item: any): Obra {
  const partidas = (item.partidas || []).map((p: any) => ({
    id: p.id,
    obraId: item.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    unidad: p.unidad,
    cantidadPresupuestada: p.cantidadPresupuestada || 0,
    precioUnitario: p.precioUnitario || 0,
    montoPresupuestado: p.montoPresupuestado || 0,
    cantidadEjecutada: p.cantidadEjecutada || 0,
    montoEjecutado: p.montoEjecutado || 0,
    avancePorcentaje: p.avancePorcentaje || 0,
    esExtra: p.esExtra || false,
  }));

  return {
    id: item.id,
    nombre: item.nombre,
    proyectoId: item.proyecto?.id ?? 0,
    proyectoNombre: item.proyecto?.nombre_proyecto ?? '',
    capatazId: undefined,
    capatazNombre: undefined,
    estado: item.estado,
    fechaInicio: item.fecha_inicio,
    fechaFinPlanificada: item.fecha_fin_planificada,
    fechaFinReal: item.fecha_fin_real ?? undefined,
    presupuestoTotal: item.presupuesto_total,
    presupuestoConsumido: item.presupuesto_consumido ?? 0,
    notas: item.notas,
    creadoEn: item.createdAt,
    partidas,
    reportes: [],
  };
}

// ─── Obras CRUD ───────────────────────────────────────────────────────────────

export async function getObras(): Promise<Obra[]> {
  try {
    const res = await api.get('/obras?populate[proyecto]=*');
    return res.data.data.map(mapStrapiObra);
  } catch (error) {
    console.error('Error fetching obras:', error);
    throw error;
  }
}

export async function getObra(id: number): Promise<Obra> {
  const obra = OBRAS.find((o) => o.id === id);
  if (!obra) throw new Error(`Obra ${id} no encontrada`);
  return delay({ ...obra });
}

export async function createObra(values: ObraFormValues): Promise<Obra> {
  try {
    const res = await api.post('/obras', {
      data: {
        nombre: values.nombre,
        proyecto: values.proyectoId,
        estado: values.estado,
        fecha_inicio: values.fechaInicio,
        fecha_fin_planificada: values.fechaFinPlanificada,
        presupuesto_total: values.presupuestoTotal,
        presupuesto_consumido: 0,
        notas: values.notas,
      }
    });
    return mapStrapiObra(res.data.data);
  } catch (error) {
    console.error('Error creating obra:', error);
    throw error;
  }
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
  const obras = await getObras();
  // Convertir obras reales a formato esperado por calcularResumenObras
  const obrasConReportes: Obra[] = obras.map(o => ({
    ...o,
    reportes: o.reportes || []
  }));
  const resumen = calcularResumenObras(obrasConReportes);
  return resumen;
}

// ─── Partidas ─────────────────────────────────────────────────────────────────

export async function getPartidas(obraId: number): Promise<Partida[]> {
  try {
    const res = await api.get(`/obras/${obraId}/partidas`);
    return res.data.data;
  } catch (error) {
    console.error('Error fetching partidas:', error);
    throw error;
  }
}

export async function createPartida(
  obraId: number,
  values: PartidaFormValues
): Promise<Partida> {
  try {
    const montoPresupuestado = values.cantidadPresupuestada * values.precioUnitario;
    const res = await api.post(`/obras/${obraId}/partidas`, {
      data: {
        codigo: values.codigo,
        descripcion: values.descripcion,
        unidad: values.unidad,
        cantidadPresupuestada: values.cantidadPresupuestada,
        precioUnitario: values.precioUnitario,
        montoPresupuestado,
        esExtra: values.esExtra || false
      }
    });
    return res.data.data;
  } catch (error) {
    console.error('Error creating partida:', error);
    throw error;
  }
}

export async function updatePartida(
  obraId: number,
  partidaId: number,
  values: Partial<PartidaFormValues>
): Promise<Partida> {
  try {
    const montoPresupuestado = values.cantidadPresupuestada && values.precioUnitario
      ? values.cantidadPresupuestada * values.precioUnitario
      : undefined;

    const res = await api.put(`/obras/${obraId}/partidas/${partidaId}`, {
      data: {
        ...(values.codigo && { codigo: values.codigo }),
        ...(values.descripcion && { descripcion: values.descripcion }),
        ...(values.unidad && { unidad: values.unidad }),
        ...(values.cantidadPresupuestada !== undefined && { cantidadPresupuestada: values.cantidadPresupuestada }),
        ...(values.precioUnitario !== undefined && { precioUnitario: values.precioUnitario }),
        ...(montoPresupuestado !== undefined && { montoPresupuestado }),
        ...(values.esExtra !== undefined && { esExtra: values.esExtra })
      }
    });
    return res.data.data;
  } catch (error) {
    console.error('Error updating partida:', error);
    throw error;
  }
}

export async function deletePartida(
  obraId: number,
  partidaId: number
): Promise<void> {
  try {
    await api.delete(`/obras/${obraId}/partidas/${partidaId}`);
  } catch (error) {
    console.error('Error deleting partida:', error);
    throw error;
  }
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
    valuacionId: undefined,  // pendiente hasta ser concretado
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

// ─── Valuación (resumen operativo) ────────────────────────────────────────────

export async function getValuacion(obraId: number): Promise<ValuacionFinal> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);
  const valuacion = calcularValuacion(obra);
  return delay(valuacion);
}

// ─── Valuaciones Documentales ──────────────────────────────────────────────────

export async function getValuaciones(obraId: number): Promise<ValuacionDoc[]> {
  return delay(VALUACIONES.filter((v) => v.obraId === obraId));
}

export async function createValuacion(
  obraId: number,
  values: ValuacionFormValues
): Promise<ValuacionDoc> {
  const obra = OBRAS.find((o) => o.id === obraId);
  if (!obra) throw new Error(`Obra ${obraId} no encontrada`);

  // Tomar solo los reportes pendientes (sin valuacionId)
  const reportesPendientes = obra.reportes.filter((r) => !r.valuacionId);

  if (reportesPendientes.length === 0) {
    throw new Error("No hay reportes pendientes para concretar. Crea reportes diarios primero.");
  }

  const existentes = VALUACIONES.filter((v) => v.obraId === obraId);
  const numero = existentes.length + 1;
  const id = SECUENCIA_VALUACION++;

  const doc = calcularValuacionDocConReportes(
    obra,
    reportesPendientes,
    id,
    numero,
    values.notas
  );
  VALUACIONES.push(doc);

  // Marcar todos los reportes pendientes como concretados en esta valuación
  for (const reporte of reportesPendientes) {
    reporte.valuacionId = id;
  }

  return delay(doc);
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
      nombre: "Cemento Portland",
      unidad: "kg",
      stockActual: 2500,
      precioPromedio: 2000,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 2,
      nombre: "Arena",
      unidad: "m³",
      stockActual: 45,
      precioPromedio: 45000,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 3,
      nombre: "Arena gruesa",
      unidad: "m³",
      stockActual: 25,
      precioPromedio: 58000,
      estadoStock: "BAJO" as const,
    },
    {
      id: 4,
      nombre: "Acero",
      unidad: "ton",
      stockActual: 18,
      precioPromedio: 2000000,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 10,
      nombre: "Tubo PVC 4in",
      unidad: "m",
      stockActual: 85,
      precioPromedio: 8550,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 11,
      nombre: "Cable THW",
      unidad: "m",
      stockActual: 320,
      precioPromedio: 4200,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 12,
      nombre: "Pintura Latex",
      unidad: "gl",
      stockActual: 15,
      precioPromedio: 28400,
      estadoStock: "BAJO" as const,
    },
    {
      id: 13,
      nombre: "Masilla",
      unidad: "kg",
      stockActual: 280,
      precioPromedio: 8900,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 14,
      nombre: "Cerámica piso premium",
      unidad: "m²",
      stockActual: 120,
      precioPromedio: 11090,
      estadoStock: "NORMAL" as const,
    },
    {
      id: 15,
      nombre: "Fragua blanca especial",
      unidad: "kg",
      stockActual: 45,
      precioPromedio: 35640,
      estadoStock: "BAJO" as const,
    },
  ];
  return materiales;
}
