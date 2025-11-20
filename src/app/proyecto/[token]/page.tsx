"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProjectTimeline from "@/components/proyecto/ProjectTimeline";
import ProjectHeader from "@/components/proyecto/ProjectHeader";
import CommentSection from "@/components/proyecto/CommentSection";

// Mock data - Esto será reemplazado por la llamada real al backend
const MOCK_PROYECTO = {
  id: 1,
  nombre_proyecto: "Remodelación Apartamento Las Mercedes",
  cliente_nombre: "María González",
  ultimo_avance: "Instalación de pisos de madera en habitaciones principales completada",
  estado_general: "En Ejecución",
  fecha_inicio: "2025-01-15",
  gerente_asignado: {
    nombre: "Carlos Ramírez",
    email: "carlos@nodoconceptual.com",
    telefono: "+58 414 123-4567",
  },
  hitos: [
    {
      id: 1,
      nombre: "Conceptualización (Diseño)",
      orden: 1,
      estado_completado: true,
      fecha_actualizacion: "2025-02-10",
      descripcion_avance: "<p>Concepto inicial aprobado con paleta de colores neutros y toques de madera natural. El cliente optó por un estilo minimalista moderno con énfasis en iluminación natural.</p>",
      contenido_multimedia: [
        {
          id: 1,
          titulo_seccion: "Moodboard de Inspiración",
          tipo_contenido: "Galería Fotos",
          archivos: [
            { url: "/moodboard-1.jpg", nombre: "Inspiración Sala" },
            { url: "/moodboard-2.jpg", nombre: "Inspiración Cocina" },
            { url: "/moodboard-3.jpg", nombre: "Paleta de Colores" },
          ],
        },
      ],
    },
    {
      id: 2,
      nombre: "Planificación (Técnico)",
      orden: 2,
      estado_completado: true,
      fecha_actualizacion: "2025-03-05",
      descripcion_avance: "<p>Planos arquitectónicos, de iluminación e instalaciones finalizados y aprobados. Se realizaron ajustes en la distribución de la cocina según solicitud del cliente.</p>",
      contenido_multimedia: [
        {
          id: 2,
          titulo_seccion: "Planos Finales",
          tipo_contenido: "Documento",
          archivos: [
            { url: "/planos-arquitectura.pdf", nombre: "Planos Arquitectura.pdf" },
            { url: "/planos-iluminacion.pdf", nombre: "Planos Iluminación.pdf" },
            { url: "/planos-instalaciones.pdf", nombre: "Planos Instalaciones.pdf" },
          ],
        },
      ],
    },
    {
      id: 3,
      nombre: "Visualización 3D",
      orden: 3,
      estado_completado: true,
      fecha_actualizacion: "2025-03-20",
      descripcion_avance: "<p>Renderizado fotorealista completado. El cliente aprobó el diseño 3D con pequeños ajustes en el color de las paredes del dormitorio principal.</p>",
      enlace_tour_360: "https://my.matterport.com/show/?m=SxQL3iGyoDo",
      contenido_multimedia: [
        {
          id: 3,
          titulo_seccion: "Tour Virtual 360°",
          tipo_contenido: "Tour 360",
          descripcion: "Explora el proyecto en realidad virtual antes de la construcción",
        },
        {
          id: 4,
          titulo_seccion: "Renders Fotorealistas",
          tipo_contenido: "Galería Fotos",
          archivos: [
            { url: "/render-sala.jpg", nombre: "Render Sala" },
            { url: "/render-cocina.jpg", nombre: "Render Cocina" },
            { url: "/render-habitacion.jpg", nombre: "Render Habitación Principal" },
          ],
        },
      ],
    },
    {
      id: 4,
      nombre: "Adquisición de Materiales",
      orden: 4,
      estado_completado: true,
      fecha_actualizacion: "2025-04-15",
      descripcion_avance: "<p>Materiales seleccionados y adquiridos: pisos de madera roble, cerámica italiana para baños, grifería premium y sistema de iluminación LED inteligente.</p>",
      contenido_multimedia: [
        {
          id: 5,
          titulo_seccion: "Muestras de Materiales Aprobadas",
          tipo_contenido: "Galería Fotos",
          archivos: [
            { url: "/material-piso.jpg", nombre: "Piso Madera Roble" },
            { url: "/material-ceramica.jpg", nombre: "Cerámica Baños" },
            { url: "/material-griferia.jpg", nombre: "Grifería Premium" },
          ],
        },
      ],
    },
    {
      id: 5,
      nombre: "Ejecución (Obra Gris)",
      orden: 5,
      estado_completado: true,
      fecha_actualizacion: "2025-10-01",
      descripcion_avance: "<p>Obra gruesa completada: demolición de paredes no estructurales, instalación de nuevos sistemas eléctricos y de plomería, preparación de superficies.</p>",
      contenido_multimedia: [
        {
          id: 6,
          titulo_seccion: "Diario de Obra - Semana 1-8",
          tipo_contenido: "Galería Fotos",
          archivos: [
            { url: "/obra-1.jpg", nombre: "Demolición Inicial" },
            { url: "/obra-2.jpg", nombre: "Instalaciones Eléctricas" },
            { url: "/obra-3.jpg", nombre: "Instalaciones de Plomería" },
            { url: "/obra-4.jpg", nombre: "Estructura Lista" },
          ],
        },
        {
          id: 7,
          titulo_seccion: "Video Walkthrough - Progreso Mes 1",
          tipo_contenido: "Video",
          archivos: [
            { url: "/video-progreso-1.mp4", nombre: "Walkthrough Obra Gris" },
          ],
        },
      ],
    },
    {
      id: 6,
      nombre: "Acabados y Decoración",
      orden: 6,
      estado_completado: false,
      fecha_actualizacion: "2025-11-15",
      descripcion_avance: "<p>En proceso: Instalación de pisos de madera en habitaciones principales (80% completado). Próximos pasos: pintura de paredes, instalación de gabinetes de cocina y colocación de cerámica en baños.</p>",
      contenido_multimedia: [
        {
          id: 8,
          titulo_seccion: "Diario de Obra - Acabados en Progreso",
          tipo_contenido: "Galería Fotos",
          archivos: [
            { url: "/acabado-1.jpg", nombre: "Instalación Pisos - Habitación 1" },
            { url: "/acabado-2.jpg", nombre: "Instalación Pisos - Habitación 2" },
            { url: "/acabado-3.jpg", nombre: "Preparación Paredes para Pintura" },
          ],
        },
      ],
    },
    {
      id: 7,
      nombre: "Entrega Final",
      orden: 7,
      estado_completado: false,
      fecha_actualizacion: null,
      descripcion_avance: null,
      contenido_multimedia: [],
    },
  ],
  comentarios: [
    {
      id: 1,
      contenido: "Me encanta cómo está quedando la sala, exactamente como lo imaginé. ¿Cuándo instalan la iluminación?",
      autor: "María González",
      fecha: "2025-11-10",
      es_cliente: true,
      respuestas: [
        {
          id: 2,
          contenido: "Nos alegra que te guste María. La iluminación será instalada la próxima semana, una vez terminemos con la pintura de las paredes.",
          autor: "Carlos Ramírez (Gerente)",
          fecha: "2025-11-10",
          es_cliente: false,
        },
      ],
    },
    {
      id: 3,
      contenido: "¿Es posible ver una muestra del color final de las paredes antes de pintar todo el apartamento?",
      autor: "María González",
      fecha: "2025-11-12",
      es_cliente: true,
      respuestas: [],
    },
  ],
};

export default function ProyectoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proyecto, setProyecto] = useState<typeof MOCK_PROYECTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de datos
    // TODO: Reemplazar con llamada real al backend
    const loadProyecto = async () => {
      try {
        setLoading(true);
        
        // Simulamos una llamada API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Validar token (mock)
        const token = params.token as string;
        if (token !== "demo-token-123") {
          setError("Token de acceso inválido. Verifica tu tarjeta NFC.");
          return;
        }
        
        setProyecto(MOCK_PROYECTO);
      } catch (err) {
        setError("Error al cargar el proyecto. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    loadProyecto();
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando tu proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "No se pudo cargar el proyecto."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Proyecto */}
      <ProjectHeader proyecto={proyecto} />

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Timeline de Hitos */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Progreso del Proyecto
          </h2>
          <p className="text-gray-600 mb-8">
            Sigue cada etapa de tu proyecto en tiempo real
          </p>
          <ProjectTimeline hitos={proyecto.hitos} />
        </section>

        {/* Sección de Comentarios */}
        <section>
          <CommentSection
            proyectoId={proyecto.id}
            comentarios={proyecto.comentarios}
            gerenteInfo={proyecto.gerente_asignado}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Nodo Conceptual. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
