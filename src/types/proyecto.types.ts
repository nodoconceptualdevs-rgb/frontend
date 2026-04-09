/**
 * Tipos para el módulo de proyectos
 */

export interface Usuario {
  id: number;
  username: string;
  email: string;
  name?: string;
}

export interface ContenidoHito {
  id?: number;
  descripcion_avance?: string;
  enlace_tour_360?: string;
  galeria_fotos?: any[];
  videos_walkthrough?: any[];
  documentacion?: any[];
}

export interface Hito {
  id: number;
  nombre: string;
  orden: number;
  estado_completado: boolean;
  fecha_actualizacion: string | null;
  descripcion_avance?: string;
  enlace_tour_360?: string;
  contenido?: ContenidoHito;
  proyecto?: number;
}

export interface Proyecto {
  id: number;
  nombre_proyecto: string;
  token_nfc: string;
  estado_general: "En Planificación" | "En Ejecución" | "Completado";
  fecha_inicio: string;
  ultimo_avance?: string;
  clientes?: Usuario[] | number[];
  gerentes?: Usuario[] | number[];
  hitos?: Hito[];
  es_publico?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegenerarTokenResponse {
  data: {
    id: number;
    token_nfc: string;
  };
}

export interface ProyectoResponse {
  data: Proyecto;
  meta?: any;
}

export interface HitosReordenResponse {
  data: Hito[];
  message: string;
}

export interface CreateHitoPayload {
  nombre: string;
  orden: number;
  proyecto: number;
  estado_completado?: boolean;
}

export interface UpdateProyectoPayload {
  nombre_proyecto?: string;
  estado_general?: "En Planificación" | "En Ejecución" | "Completado";
  fecha_inicio?: string;
  clientes?: number[];
  gerentes?: number[];
  es_publico?: boolean;
}
