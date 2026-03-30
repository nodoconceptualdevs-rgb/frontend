import api from "@/lib/api";
import type {
  CarrouselData,
  ServiciosData,
  TrabajosRealizadosData,
  ByNodoData,
  ResenasData,
  TrabajadoresData,
  ProyectoPortafolioData,
  ProyectoPortafolioItem
} from "@/types/landing";

/**
 * Obtener datos del Carrousel Principal (Hero Section)
 * Single Type: carrousel — /api/carrousel
 */
export async function getCarrousel(): Promise<CarrouselData | null> {
  try {
    const res = await api.get("/carrousel?populate=*");
    const body = res.data as Record<string, unknown>;
    return (body.data as CarrouselData) ?? (body as unknown as CarrouselData);
  } catch (error: any) {
    console.warn(`Error fetching carrousel data: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Obtener datos de Servicios
 * Single Type: servicios — /api/servicio
 */
export async function getServicios(): Promise<ServiciosData | null> {
  try {
    const res = await api.get("/servicio?populate=*");
    const body = res.data as Record<string, unknown>;
    return (body.data as ServiciosData) ?? (body as unknown as ServiciosData);
  } catch (error: any) {
    console.warn(`Error fetching servicios data: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Obtener datos de Trabajos Realizados (Proyectos Destacados)
 * Single Type: trabajos realizados — /api/trabajosrealizado
 * Repeatable Component: proyectos (Proyecto)
 */
export async function getTrabajosRealizados(): Promise<TrabajosRealizadosData | null> {
  try {
    const res = await api.get("/trabajosrealizado?populate[proyectos][populate]=*");
    const body = res.data as Record<string, unknown>;
    return (body.data as TrabajosRealizadosData) ?? (body as unknown as TrabajosRealizadosData);
  } catch (error: any) {
    console.warn(`Error fetching trabajosrealizado data: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Obtener datos de Restaurantes By Nodo
 * Single Type: by nodo — /api/bynodorestaurante
 * Repeatable Component: Restaurantes (Restaurante)
 */
export async function getByNodoRestaurantes(): Promise<ByNodoData | null> {
  try {
    const res = await api.get("/bynodorestaurante?populate[Restaurantes][populate]=*");
    const body = res.data as Record<string, unknown>;
    return (body.data as ByNodoData) ?? (body as unknown as ByNodoData);
  } catch (error: any) {
    console.warn(`Error fetching bynodorestaurante data: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Obtener datos de Reseñas (Testimonios)
 * Single Type: reseñas — /api/resena
 * Repeatable Component: comentarios (Cliente)
 */
export async function getResenas(): Promise<ResenasData | null> {
  try {
    const res = await api.get("/resena?populate[comentarios][populate]=*");
    const body = res.data as Record<string, unknown>;
    return (body.data as ResenasData) ?? (body as unknown as ResenasData);
  } catch (error: any) {
    console.warn(`Error fetching resena data: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Obtener datos de Trabajadores
 * Single Type: trabajadores — /api/trabajadore
 * Repeatable Component: trabajadores (Trabajador)
 */
export async function getTrabajadores(): Promise<TrabajadoresData | null> {
  try {
    const res = await api.get("/trabajadore?populate[trabajadores][populate]=*");
    const body = res.data as Record<string, unknown>;
    return (body.data as TrabajadoresData) ?? (body as unknown as TrabajadoresData);
  } catch (error: any) {
    console.warn(`Error fetching trabajadore data: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

/**
 * Obtener datos de Proyectos del Portafolio
 * Collection Type: proyectos — /api/proyectos
 * Fields: Titulo, Subtitulo, Descripcion, Imagenes (Multiple Media)
 */
export async function getProyectosPortafolio(): Promise<ProyectoPortafolioItem[]> {
  try {
    const res = await api.get("/proyectos?populate=*");
    const body = res.data as Record<string, unknown>;
    const proyectosData = body.data as any[];
    
    if (!Array.isArray(proyectosData)) {
      console.warn('Proyectos data is not an array');
      return [];
    }
    
    return proyectosData.map(proyecto => {
      const attributes = proyecto.attributes || {};
      return {
        id: proyecto.id,
        documentId: proyecto.documentId || `proyecto-${proyecto.id}`,
        Titulo: attributes.Titulo || 'Sin título',
        Subtitulo: attributes.Subtitulo || '',
        Descripcion: attributes.Descripcion || '',
        Imagenes: Array.isArray(attributes.Imagenes?.data) ? attributes.Imagenes.data : [],
        CTA: attributes.CTA || 'Ver más detalles'
      } as ProyectoPortafolioItem;
    });
  } catch (error: any) {
    console.warn(`Error fetching proyectos data: ${error?.message || 'Unknown error'}`);
    return [];
  }
}
