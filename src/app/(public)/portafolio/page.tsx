"use client";
import { useState, useEffect } from "react";
import Project3DList from "@/components/portafolio/Project3DList";
import Pagination from "@/components/portafolio/Pagination";
import { getTrabajosRealizados } from "@/services/landing";
import { Spin, Empty } from "antd";
import { Construction } from "lucide-react";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { ProyectoItem } from "@/types/landing";

export default function PortafolioPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const pageSize = 6;

  const transformProyectoToCard = (proyecto: ProyectoItem) => {
    // Obtener la URL del render (puede ser imagen, video o modelo 3D)
    let modelUrl = null;
    let tipoArchivo = '3d';

    if (proyecto.Render) {
      const renderUrl = typeof proyecto.Render === 'string' ? proyecto.Render : proyecto.Render.url;
      modelUrl = fixCloudinaryURL(renderUrl);
      
      // Determinar tipo de archivo basado en la extensión
      if (renderUrl) {
        const extension = renderUrl.toLowerCase().split('.').pop();
        const formatos3D = ['glb', 'gltf', 'fbx', 'obj', 'dae', '3ds', 'blend'];
        const formatosCAD = ['dwg', 'dxf', 'skp', 'step', 'stp', 'iges', 'igs'];
        const formatosImagen = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
        const formatosVideo = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
        
        if (formatos3D.includes(extension || '')) {
          tipoArchivo = '3d';
        } else if (formatosCAD.includes(extension || '')) {
          tipoArchivo = 'cad';
        } else if (formatosVideo.includes(extension || '')) {
          tipoArchivo = 'video';
        } else if (formatosImagen.includes(extension || '')) {
          tipoArchivo = 'imagen';
        } else {
          tipoArchivo = '3d'; // Por defecto asumir 3D
        }
      }
    }

    // Si no hay render, NO mostrar nada (eliminar modelo por defecto)
    if (!modelUrl) {
      return {
        id: proyecto.id,
        title: proyecto.Titulo,
        subtitle: proyecto.subtitulo || "Proyecto Destacado",
        description: proyecto.Descripcion || "Proyecto destacado de nuestro portafolio",
        cta: "Ver detalles",
        icon: "📋",
        model: null,
        tipoArchivo: 'none', // Nuevo tipo para indicar que no hay media
        proyecto: proyecto
      };
    }

    // Determinar texto del botón según el tipo
    let ctaText = 'Ver modelo 3D';
    switch (tipoArchivo) {
      case 'cad':
        ctaText = 'Ver modelo CAD';
        break;
      case '3d':
        ctaText = 'Ver modelo 3D';
        break;
      case 'video':
        ctaText = 'Ver video';
        break;
      case 'imagen':
        ctaText = 'Ver imagen';
        break;
      default:
        ctaText = 'Ver modelo 3D';
    }

    // Determinar icono según el tipo
    let icon = '🏗️';
    switch (tipoArchivo) {
      case 'cad':
        icon = '📐';
        break;
      case '3d':
        icon = '🏗️';
        break;
      case 'video':
        icon = '🎥';
        break;
      case 'imagen':
        icon = '🖼️';
        break;
      default:
        icon = '🏗️';
    }

    return {
      id: proyecto.id,
      title: proyecto.Titulo,
      subtitle: proyecto.subtitulo || "Proyecto Destacado",
      description: proyecto.Descripcion || "Proyecto destacado de nuestro portafolio",
      cta: ctaText,
      icon: icon,
      model: modelUrl,
      tipoArchivo,
      proyecto: proyecto
    };
  };

  const loadProjects = async (page: number) => {
    try {
      setLoading(true);
      const trabajosData = await getTrabajosRealizados();
      
      // Obtener todos los proyectos del landing
      const allProjects = trabajosData?.proyectos || [];
      
      // Aplicar paginación en el frontend
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedProjects = allProjects.slice(startIndex, endIndex);
      
      const transformedProjects = paginatedProjects.map(transformProyectoToCard);
      setProjects(transformedProjects);
      setTotalProjects(allProjects.length);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <main className="flex flex-col gap-4" style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
      <div>
        <h2
          className="font-serif text-gray-700 mb-1"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          Nuestro portafolio
        </h2>
        <hr className="border-dotted border-t border-gray-400 mb-4" />
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Spin size="large" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <Empty
              image={<Construction size={64} className="text-gray-400" />}
              description={
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    No hay proyectos disponibles
                  </p>
                  <p className="text-sm text-gray-500">
                    Pronto compartiremos nuestros proyectos más recientes
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <Project3DList items={projects} mode="list" bgGray />
            <Pagination
              current={currentPage}
              total={totalProjects}
              pageSize={pageSize}
              onChange={handlePageChange}
              loading={loading}
            />
          </>
        )}
      </div>
    </main>
  );
}
