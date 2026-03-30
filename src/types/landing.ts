// ============================================================
// Tipos para Single Types de Strapi - Landing Page
// ============================================================

/** Media de Strapi (imagen, video, etc.) */
export interface StrapiMedia {
  id: number;
  documentId?: string;
  url: string;
  alternativeText?: string | null;
  name?: string;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  };
}

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
}

// ============================================================
// Carrousel (Single Type) — /api/carrousel
// Fields: titulo1, contenido1, foto1, titulo2, contenido2, foto2, titulo3, contenido3, foto3
// ============================================================

export interface CarrouselData {
  titulo1: string;
  contenido1: string;
  foto1: StrapiMedia | null;
  titulo2: string;
  contenido2: string;
  foto2: StrapiMedia | null;
  titulo3: string;
  contenido3: string;
  foto3: StrapiMedia | null;
}

export interface SliderSlide {
  title: string;
  content: string;
  image: string;
}

// ============================================================
// Servicios (Single Type) — /api/servicio
// Fields: icono1-4 (Media), titulo1-4, imagen1-4 (Media)
// ============================================================

export interface ServiciosData {
  icono1: StrapiMedia | null;
  titulo1: string;
  imagen1: StrapiMedia | null;
  icono2: StrapiMedia | null;
  titulo2: string;
  imagen2: StrapiMedia | null;
  icono3: StrapiMedia | null;
  titulo3: string;
  imagen3: StrapiMedia | null;
  icono4: StrapiMedia | null;
  Titulo4: string;
  imagen4: StrapiMedia | null;
}

export interface ServicioItem {
  key: string;
  label: string;
  icon: string;
  image: string;
}

// ============================================================
// Trabajos Realizados (Single Type) — /api/trabajosrealizado
// Repeatable Component: proyectos (Proyecto)
// Fields: Titulo, Descripcion, Imagenes (Multiple Media), subtitulo
// ============================================================

export interface ProyectoItem {
  id: number;
  Titulo: string;
  Descripcion: string;
  Imagenes: StrapiMedia[]; // Array de imágenes en lugar de un solo Render
  subtitulo: string;
  Categorias?: string; // Campo de categoría agregado (con 's' como viene de la API)
}

export interface TrabajosRealizadosData {
  proyectos: ProyectoItem[];
}

// ============================================================
// By Nodo (Single Type) — /api/bynodorestaurante
// Repeatable Component: Restaurantes (Restaurante)
// Fields: Nombre_Restaurante, Description, Fotos_Restaurante (Multiple Media),
//         Num_Contacto, Direccion, Instagram, Horarios
// ============================================================

export interface RestauranteItem {
  id: number;
  Nombre_Restaurante: string;
  Descripcion: string;
  Fotos_Restaurante: StrapiMedia[];
  Num_Contacto: string;
  Direccion: string;
  Instagram: string;
  Horarios: string;
}

export interface ByNodoData {
  Restaurantes: RestauranteItem[];
}

// ============================================================
// Reseñas (Single Type) — /api/resena
// Repeatable Component: comentarios (Cliente)
// Fields: Nombre, Empresa, Comentario
// ============================================================

export interface ComentarioClienteItem {
  id: number;
  Nombre: string;
  Empresa: string;
  Comentario: string;
}

export interface ResenasData {
  comentarios: ComentarioClienteItem[];
}

// ============================================================
// Trabajadores (Single Type) — /api/trabajadore
// Repeatable Component: trabajadores (Trabajador)
// Fields: Nombre, Puesto, Foto (Media)
// ============================================================

export interface TrabajadorItem {
  id: number;
  Nombre: string;
  Puesto: string;
  Foto: StrapiMedia | null;
}

export interface TrabajadoresData {
  trabajadores: TrabajadorItem[];
}

// ============================================================
// Proyectos de Portafolio — /api/proyectos
// Fields: Titulo, Subtitulo, Descripcion, Imagenes (Multiple Media)
// ============================================================

export interface ProyectoPortafolioItem {
  id: number;
  documentId?: string;
  Titulo: string;
  Subtitulo: string;
  Descripcion: string;
  Imagenes: StrapiMedia[]; // Array de imágenes en lugar de Modelo3D
  CTA?: string; // Call-to-action texto
}

export interface ProyectoPortafolioData {
  data: ProyectoPortafolioItem[];
}
