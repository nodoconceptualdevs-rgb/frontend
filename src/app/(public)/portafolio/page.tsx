"use client";
import { useState, useEffect } from "react";
import Project3DList from "@/components/portafolio/Project3DList";
import Pagination from "@/components/portafolio/Pagination";
import CategoryFilter from "@/components/portafolio/CategoryFilter";
import { getTrabajosRealizados } from "@/services/landing";
import { Spin, Empty } from "antd";
import { Construction } from "lucide-react";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { ProyectoItem } from "@/types/landing";

export default function PortafolioPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<ProyectoItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const pageSize = 6;

  const transformProyectoToCard = (proyecto: ProyectoItem) => {
    // Obtener las URLs de las imágenes
    const images: string[] = [];
    
    if (proyecto.Imagenes && Array.isArray(proyecto.Imagenes)) {
      proyecto.Imagenes.forEach((imagen) => {
        if (imagen && imagen.url) {
          const imageUrl = fixCloudinaryURL(imagen.url);
          if (imageUrl) {
            images.push(imageUrl);
          }
        }
      });
    }

    // Crear descripción mejorada con categoría
    const categoria = proyecto.Categorias || "Sin categoría";
    const descripcionBase = proyecto.Descripcion || "";
    const descripcionMejorada = descripcionBase 
      ? `${descripcionBase.substring(0, 100)}${descripcionBase.length > 100 ? "..." : ""}`
      : `Proyecto de categoría ${categoria}`;

    // Si no hay imágenes, mostrar placeholder
    if (images.length === 0) {
      return {
        id: proyecto.id,
        title: proyecto.Titulo,
        subtitle: `${categoria} • ${proyecto.subtitulo || "Proyecto Destacado"}`,
        description: descripcionMejorada,
        cta: "Ver detalles",
        icon: "📋",
        images: [],
        tipoArchivo: 'none',
        proyecto: proyecto
      };
    }

    // Determinar texto del botón según la cantidad de imágenes
    const ctaText = images.length === 1 ? '1 imagen' : `Galería (${images.length} imágenes)`;
    const icon = '📸';

    return {
      id: proyecto.id,
      title: proyecto.Titulo,
      subtitle: `${categoria} • ${proyecto.subtitulo || "Proyecto Destacado"}`,
      description: descripcionMejorada,
      cta: ctaText,
      icon: icon,
      images: images,
      tipoArchivo: 'imagen',
      proyecto: proyecto
    };
  };

  const loadProjects = async (page: number, category: string | null = null) => {
    try {
      setLoading(true);
      const trabajosData = await getTrabajosRealizados();
      
      // Obtener todos los proyectos del landing
      const allProjectsData = trabajosData?.proyectos || [];
      setAllProjects(allProjectsData);
      
      // Extraer categorías únicas
      const uniqueCategories = Array.from(
        new Set(
          allProjectsData
            .map(p => p.Categorias)
            .filter((cat): cat is string => Boolean(cat))
        )
      ).sort();
      setCategories(uniqueCategories);
      
      // Filtrar por categoría si se selecciona una
      const filteredProjects = category 
        ? allProjectsData.filter(p => p.Categorias === category)
        : allProjectsData;
      
      // Aplicar paginación en el frontend
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
      
      const transformedProjects = paginatedProjects.map(transformProyectoToCard);
      setProjects(transformedProjects);
      setTotalProjects(filteredProjects.length);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
      setProjects([]);
      setAllProjects([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(currentPage, selectedCategory);
  }, [currentPage, selectedCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Resetear a la primera página cuando cambia la categoría
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

      {/* Filtro de categorías */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        loading={loading}
      />

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
                    {selectedCategory 
                      ? `No hay proyectos en la categoría "${selectedCategory}"`
                      : "No hay proyectos disponibles"
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedCategory 
                      ? "Prueba seleccionando otra categoría"
                      : "Pronto compartiremos nuestros proyectos más recientes"
                    }
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
