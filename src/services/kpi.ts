/**
 * Servicio KPI — versión MOCK (en memoria).
 *
 * La UI de Productividad se construye contra estas funciones con datos
 * simulados. Cuando exista el backend Strapi `api::kpi.tarea-diseno`, se
 * reemplaza SOLO el cuerpo de cada función por llamadas a `api` (axios),
 * manteniendo las mismas firmas.
 */

import type {
  Arquitecto,
  ArchivoProyecto,
  Cliente,
  EstadoTarea,
  HitoOpcion,
  ProyectoOpcion,
  PublicarHitoValues,
  RechazoValues,
  ReprogramarValues,
  TareaConKpi,
  TareaDiseno,
  TareaFormValues,
} from "@/types/kpi";
import { conKpi } from "@/lib/kpi";

// ---------------------------------------------------------------------------
// Datos de referencia (mock)
// ---------------------------------------------------------------------------

const ARQUITECTOS: Arquitecto[] = [
  { id: 1, name: "Juan Pérez" },
  { id: 2, name: "María González" },
  { id: 3, name: "Carlos Ramírez" },
  { id: 4, name: "Lucía Fernández" },
];

const CLIENTES: Cliente[] = [
  { id: 101, name: "Familia Restrepo" },
  { id: 102, name: "Inversiones del Sur S.A." },
  { id: 103, name: "Andrea Molina" },
];

const PROYECTOS: ProyectoOpcion[] = [
  { id: 1, nombre: "Casa Moderna", clienteId: 101, clienteNombre: "Familia Restrepo" },
  { id: 2, nombre: "Edificio Comercial", clienteId: 102, clienteNombre: "Inversiones del Sur S.A." },
  { id: 3, nombre: "Reforma Apartamento", clienteId: 103, clienteNombre: "Andrea Molina" },
];

const HITOS: HitoOpcion[] = [
  { id: 11, nombre: "Conceptualización (Diseño)", proyectoId: 1, proyectoNombre: "Casa Moderna" },
  { id: 12, nombre: "Visualización 3D", proyectoId: 1, proyectoNombre: "Casa Moderna" },
  { id: 13, nombre: "Planificación (Técnico)", proyectoId: 1, proyectoNombre: "Casa Moderna" },
  { id: 21, nombre: "Conceptualización (Diseño)", proyectoId: 2, proyectoNombre: "Edificio Comercial" },
  { id: 22, nombre: "Visualización 3D", proyectoId: 2, proyectoNombre: "Edificio Comercial" },
  { id: 31, nombre: "Acabados y Decoración", proyectoId: 3, proyectoNombre: "Reforma Apartamento" },
];

const BIBLIOTECA_PROYECTO: Record<number, ArchivoProyecto[]> = {
  1: [
    {
      id: "bib-1-001",
      nombre: "Especificaciones_Materiales_CasaModerna_v2.pdf",
      tamaño: 2_450_000,
      subidoEn: hace(20),
      proyectoId: 1,
      etiquetas: ["especificaciones", "materiales"],
    },
    {
      id: "bib-1-002",
      nombre: "Plano_Sitio_CasaModerna.dwg",
      tamaño: 890_000,
      subidoEn: hace(18),
      proyectoId: 1,
      etiquetas: ["planos"],
    },
    {
      id: "bib-1-003",
      nombre: "Referencia_Fachada_Contemporanea.jpg",
      tamaño: 3_100_000,
      subidoEn: hace(15),
      proyectoId: 1,
      etiquetas: ["referencias", "fachada"],
    },
    {
      id: "bib-1-004",
      nombre: "Brief_Cliente_Restrepo.pdf",
      tamaño: 540_000,
      subidoEn: hace(25),
      proyectoId: 1,
      etiquetas: ["brief"],
    },
  ],
  2: [
    {
      id: "bib-2-001",
      nombre: "Normativa_Comercial_Zona_Industrial.pdf",
      tamaño: 1_200_000,
      subidoEn: hace(30),
      proyectoId: 2,
      etiquetas: ["normativa"],
    },
    {
      id: "bib-2-002",
      nombre: "Topografia_Lote_Comercial.dwg",
      tamaño: 760_000,
      subidoEn: hace(22),
      proyectoId: 2,
      etiquetas: ["planos", "topografia"],
    },
  ],
  3: [
    {
      id: "bib-3-001",
      nombre: "Fotos_Estado_Actual_Apt.zip",
      tamaño: 45_000_000,
      subidoEn: hace(8),
      proyectoId: 3,
      etiquetas: ["fotos", "estado-actual"],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

function dentro(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

function delay<T>(valor: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

function proyectoDe(proyectoId?: number): ProyectoOpcion | undefined {
  return PROYECTOS.find((p) => p.id === proyectoId);
}

function hitoDe(hitoId?: number): HitoOpcion | undefined {
  return HITOS.find((h) => h.id === hitoId);
}

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

let SECUENCIA = 100;
function nuevoId(): number {
  SECUENCIA += 1;
  return SECUENCIA;
}

let TAREAS: TareaDiseno[] = [
  {
    id: 1,
    titulo: "Boceto conceptual de fachada principal",
    descripcion: "Propuesta inicial de fachada con lenguaje contemporáneo.",
    estado: "COMPLETADA",
    tipo: "CLIENTE",
    clienteId: 101,
    clienteNombre: "Familia Restrepo",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna",
    hitoId: 11,
    hitoNombre: "Conceptualización (Diseño)",
    arquitectos: [ARQUITECTOS[0]],
    fechaRequerimiento: hace(14),
    fechaInicio: hace(12),
    fechaEntregaOriginal: hace(7),
    fechaEntregaEstimada: hace(7),
    fechaCompletacion: hace(7), // a tiempo, sin retrabajo → ALTA
    historialEntregas: [],
    contadorRechazos: 0,
    historialRechazos: [],
    archivos: [],
    notasInternas: "Entregada en la fecha comprometida.",
    publicacion: {
      hitoId: 11,
      hitoNombre: "Conceptualización (Diseño)",
      fecha: hace(6),
      archivoIds: ["bib-1-001", "bib-1-002", "bib-1-003"],
    },
    orden: 0,
  },
  {
    id: 2,
    titulo: "Render 3D de sala principal",
    descripcion: "Visualización fotorrealista de la sala con iluminación diurna.",
    estado: "COMPLETADA",
    tipo: "CLIENTE",
    clienteId: 101,
    clienteNombre: "Familia Restrepo",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna",
    hitoId: 12,
    hitoNombre: "Visualización 3D",
    arquitectos: [ARQUITECTOS[1], ARQUITECTOS[2]],
    fechaRequerimiento: hace(16),
    fechaInicio: hace(14),
    fechaEntregaOriginal: hace(7),
    fechaEntregaEstimada: hace(7),
    fechaCompletacion: hace(7),
    historialEntregas: [],
    contadorRechazos: 1, // 1 retrabajo → MEDIA
    historialRechazos: [
      {
        categoria: "NO_CUMPLE_EXPECTATIVAS",
        motivo: "La temperatura de color no coincidía con la referencia del cliente.",
        registradoEn: hace(10),
      },
    ],
    archivos: [],
    orden: 1,
  },
  {
    id: 3,
    titulo: "Planos técnicos de instalaciones",
    estado: "EN_PROCESO",
    tipo: "CLIENTE",
    clienteId: 101,
    clienteNombre: "Familia Restrepo",
    proyectoId: 1,
    proyectoNombre: "Casa Moderna",
    hitoId: 13,
    hitoNombre: "Planificación (Técnico)",
    arquitectos: [ARQUITECTOS[2]],
    fechaRequerimiento: hace(5),
    fechaInicio: hace(3),
    fechaEntregaOriginal: dentro(4),
    fechaEntregaEstimada: dentro(4), // en plazo, sin retrabajo → ALTA
    historialEntregas: [],
    contadorRechazos: 0,
    historialRechazos: [],
    archivos: [],
    orden: 0,
  },
  {
    id: 4,
    titulo: "Render 3D de fachada nocturna",
    descripcion: "Versión nocturna con iluminación arquitectónica.",
    estado: "EN_PROCESO",
    tipo: "CLIENTE",
    clienteId: 102,
    clienteNombre: "Inversiones del Sur S.A.",
    proyectoId: 2,
    proyectoNombre: "Edificio Comercial",
    hitoId: 22,
    hitoNombre: "Visualización 3D",
    arquitectos: [ARQUITECTOS[1]],
    fechaRequerimiento: hace(12),
    fechaInicio: hace(9),
    fechaEntregaOriginal: hace(2),
    fechaEntregaEstimada: hace(1), // vencida → EN RIESGO
    historialEntregas: [
      {
        fechaAnterior: hace(5),
        fechaNueva: hace(2),
        motivo: "Retraso por carga de trabajo del arquitecto.",
        registradoEn: hace(6),
      },
      {
        fechaAnterior: hace(2),
        fechaNueva: hace(1),
        motivo: "Pendiente de aprobación de materialidad.",
        registradoEn: hace(3),
      },
    ],
    contadorRechazos: 1, // 2 reprogramaciones + 1 rechazo → BAJA
    historialRechazos: [
      {
        categoria: "BRIEF_POCO_CLARO",
        motivo: "El brief no especificaba el tipo de iluminación esperada.",
        registradoEn: hace(7),
      },
    ],
    archivos: [],
    notasInternas: "Necesita seguimiento, va atrasada.",
    orden: 1,
  },
  {
    id: 5,
    titulo: "Moodboard de acabados interiores",
    descripcion: "Selección de materiales, texturas y paleta para interiores.",
    estado: "PENDIENTE",
    tipo: "CLIENTE",
    clienteId: 103,
    clienteNombre: "Andrea Molina",
    proyectoId: 3,
    proyectoNombre: "Reforma Apartamento",
    hitoId: 31,
    hitoNombre: "Acabados y Decoración",
    arquitectos: [ARQUITECTOS[3]],
    fechaRequerimiento: hace(1),
    fechaEntregaOriginal: dentro(10),
    fechaEntregaEstimada: dentro(10),
    historialEntregas: [],
    contadorRechazos: 0,
    historialRechazos: [],
    archivos: [],
    orden: 0,
  },
  // --- Tareas INDEPENDIENTES (trabajo interno, sin cliente) ---
  {
    id: 6,
    titulo: "Plantilla base de presentación de proyectos",
    descripcion: "Maqueta reutilizable para entregas a clientes.",
    estado: "EN_PROCESO",
    tipo: "INDEPENDIENTE",
    arquitectos: [ARQUITECTOS[0], ARQUITECTOS[3]],
    fechaRequerimiento: hace(6),
    fechaInicio: hace(4),
    fechaEntregaOriginal: dentro(5),
    fechaEntregaEstimada: dentro(5),
    historialEntregas: [],
    contadorRechazos: 0,
    historialRechazos: [],
    archivos: [],
    notasInternas: "Mejora de procesos internos.",
    orden: 2,
  },
  {
    id: 7,
    titulo: "Biblioteca de bloques CAD del estudio",
    estado: "PENDIENTE",
    tipo: "INDEPENDIENTE",
    arquitectos: [ARQUITECTOS[2]],
    fechaRequerimiento: hace(2),
    fechaEntregaOriginal: dentro(14),
    fechaEntregaEstimada: dentro(14),
    historialEntregas: [],
    contadorRechazos: 0,
    historialRechazos: [],
    archivos: [],
    orden: 1,
  },
];

// ---------------------------------------------------------------------------
// Ordenamiento por columna
// ---------------------------------------------------------------------------

function ordenarTareas(tareas: TareaDiseno[]): TareaDiseno[] {
  return [...tareas].sort((a, b) => a.orden - b.orden);
}

// ---------------------------------------------------------------------------
// API mock — catálogos
// ---------------------------------------------------------------------------

export async function getArquitectos(): Promise<Arquitecto[]> {
  return delay([...ARQUITECTOS]);
}

export async function getClientes(): Promise<Cliente[]> {
  return delay([...CLIENTES]);
}

export async function getProyectos(): Promise<ProyectoOpcion[]> {
  return delay([...PROYECTOS]);
}

export async function getHitos(proyectoId?: number): Promise<HitoOpcion[]> {
  const lista = proyectoId
    ? HITOS.filter((h) => h.proyectoId === proyectoId)
    : HITOS;
  return delay([...lista]);
}

export async function getBibliotecaProyecto(
  proyectoId: number,
): Promise<ArchivoProyecto[]> {
  const archivos = BIBLIOTECA_PROYECTO[proyectoId] ?? [];
  return delay([...archivos]);
}

// ---------------------------------------------------------------------------
// API mock — tareas
// ---------------------------------------------------------------------------

export async function getTareas(): Promise<TareaConKpi[]> {
  return delay(ordenarTareas(TAREAS).map(conKpi));
}

/** Construye los campos de relación según el tipo y proyecto/hito elegidos. */
function camposRelacion(values: TareaFormValues) {
  if (values.tipo === "INDEPENDIENTE") {
    return {
      tipo: "INDEPENDIENTE" as const,
      clienteId: undefined,
      clienteNombre: undefined,
      proyectoId: undefined,
      proyectoNombre: undefined,
      hitoId: undefined,
      hitoNombre: undefined,
    };
  }
  const proyecto = proyectoDe(values.proyectoId);
  const hito = hitoDe(values.hitoId);
  return {
    tipo: "CLIENTE" as const,
    clienteId: proyecto?.clienteId,
    clienteNombre: proyecto?.clienteNombre,
    proyectoId: proyecto?.id,
    proyectoNombre: proyecto?.nombre,
    hitoId: hito?.id,
    hitoNombre: hito?.nombre,
  };
}

export async function createTarea(
  values: TareaFormValues,
): Promise<TareaConKpi> {
  const arquitectos = ARQUITECTOS.filter((a) =>
    values.arquitectoIds.includes(a.id),
  );
  const ordenMax = Math.max(
    -1,
    ...TAREAS.filter((t) => t.estado === "PENDIENTE").map((t) => t.orden),
  );

  const nueva: TareaDiseno = {
    id: nuevoId(),
    titulo: values.titulo,
    descripcion: values.descripcion,
    estado: "PENDIENTE",
    arquitectos,
    fechaRequerimiento: new Date().toISOString(), // el brief llega ahora
    fechaEntregaOriginal: values.fechaEntregaEstimada,
    fechaEntregaEstimada: values.fechaEntregaEstimada,
    historialEntregas: [],
    contadorRechazos: 0,
    historialRechazos: [],
    archivos: [],
    notasInternas: values.notasInternas,
    orden: ordenMax + 1,
    ...camposRelacion(values),
  };

  TAREAS = [...TAREAS, nueva];
  return delay(conKpi(nueva));
}

export async function updateTarea(
  id: number,
  values: TareaFormValues,
): Promise<TareaConKpi> {
  const arquitectos = ARQUITECTOS.filter((a) =>
    values.arquitectoIds.includes(a.id),
  );

  TAREAS = TAREAS.map((t) =>
    t.id === id
      ? {
          ...t,
          titulo: values.titulo,
          descripcion: values.descripcion,
          arquitectos,
          notasInternas: values.notasInternas,
          // La fecha de entrega NO se cambia aquí; usar reprogramarEntrega.
          ...camposRelacion(values),
        }
      : t,
  );

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada));
}

/**
 * Cambia el estado de una tarea (drag & drop entre columnas) y aplica las
 * reglas de fechas KPI. `orden` es la nueva posición dentro de la columna destino.
 */
export async function updateEstadoTarea(
  id: number,
  estado: EstadoTarea,
  orden: number,
): Promise<TareaConKpi> {
  const ahora = new Date().toISOString();

  TAREAS = TAREAS.map((t) => {
    if (t.id !== id) return t;
    const next: TareaDiseno = { ...t, estado, orden };
    if (!next.fechaRequerimiento) next.fechaRequerimiento = ahora;

    if (estado === "EN_PROCESO") {
      if (!next.fechaInicio) next.fechaInicio = ahora;
      next.fechaCompletacion = undefined;
    } else if (estado === "COMPLETADA") {
      if (!next.fechaInicio) next.fechaInicio = ahora;
      next.fechaCompletacion = ahora; // entrega real
    } else {
      next.fechaInicio = undefined;
      next.fechaCompletacion = undefined;
    }
    return next;
  });

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada), 120);
}

/** Reordena las tareas de una columna según el array de ids dado. */
export async function reordenarColumna(
  estado: EstadoTarea,
  idsOrdenados: number[],
): Promise<void> {
  TAREAS = TAREAS.map((t) =>
    t.estado === estado && idsOrdenados.includes(t.id)
      ? { ...t, orden: idsOrdenados.indexOf(t.id) }
      : t,
  );
  return delay(undefined, 80);
}

/**
 * Reprograma la fecha de entrega de una tarea. Deja un registro en el
 * historial (con motivo obligatorio) — penaliza el cumplimiento de fechas.
 */
export async function reprogramarEntrega(
  id: number,
  values: ReprogramarValues,
): Promise<TareaConKpi> {
  TAREAS = TAREAS.map((t) => {
    if (t.id !== id) return t;
    const fechaAnterior = t.fechaEntregaEstimada;
    return {
      ...t,
      fechaEntregaOriginal: t.fechaEntregaOriginal ?? fechaAnterior,
      fechaEntregaEstimada: values.fechaNueva,
      historialEntregas: [
        ...t.historialEntregas,
        {
          fechaAnterior,
          fechaNueva: values.fechaNueva,
          motivo: values.motivo,
          registradoEn: new Date().toISOString(),
        },
      ],
    };
  });

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada));
}

/**
 * Registra un rechazo / retrabajo (rediseño): incrementa el contador con su
 * motivo y categoría, y devuelve la tarea a EN_PROCESO (se está retrabajando).
 */
export async function registrarRechazo(
  id: number,
  values: RechazoValues,
): Promise<TareaConKpi> {
  const ahora = new Date().toISOString();
  TAREAS = TAREAS.map((t) =>
    t.id === id
      ? {
          ...t,
          estado: "EN_PROCESO",
          fechaInicio: t.fechaInicio ?? ahora,
          fechaCompletacion: undefined,
          contadorRechazos: t.contadorRechazos + 1,
          historialRechazos: [
            ...t.historialRechazos,
            {
              categoria: values.categoria,
              motivo: values.motivo,
              registradoEn: ahora,
            },
          ],
        }
      : t,
  );

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada));
}

/**
 * Publica una tarea en un hito: lleva su información (descripción + IDs de archivos)
 * al hito, que es lo que ve el cliente.
 */
export async function publicarEnHito(
  id: number,
  values: PublicarHitoValues,
): Promise<TareaConKpi> {
  const hito = hitoDe(values.hitoId);
  const ahora = new Date().toISOString();

  TAREAS = TAREAS.map((t) =>
    t.id === id
      ? {
          ...t,
          estado: "COMPLETADA",
          fechaInicio: t.fechaInicio ?? ahora,
          fechaCompletacion: t.fechaCompletacion ?? ahora,
          descripcion: values.descripcionAvance || t.descripcion,
          publicacion: {
            hitoId: values.hitoId,
            hitoNombre: hito?.nombre ?? "Hito",
            fecha: ahora,
            archivoIds: values.archivoIds,
          },
        }
      : t,
  );

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada));
}

export async function eliminarTarea(id: number): Promise<void> {
  TAREAS = TAREAS.filter((t) => t.id !== id);
  return delay(undefined, 150);
}

/**
 * Agregar archivos a una tarea. Los archivos se acumulan en el array.
 */
export async function agregarArchivosATarea(
  id: number,
  archivos: import("@/types/kpi").Archivo[],
): Promise<TareaConKpi> {
  TAREAS = TAREAS.map((t) =>
    t.id === id
      ? {
          ...t,
          archivos: [...t.archivos, ...archivos],
        }
      : t,
  );

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada));
}

/**
 * Eliminar un archivo de una tarea.
 */
export async function eliminarArchivoDeTarea(
  id: number,
  archivoId: string,
): Promise<TareaConKpi> {
  TAREAS = TAREAS.map((t) =>
    t.id === id
      ? {
          ...t,
          archivos: t.archivos.filter((a) => a.id !== archivoId),
        }
      : t,
  );

  const actualizada = TAREAS.find((t) => t.id === id)!;
  return delay(conKpi(actualizada));
}
