"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import styles from "./RenderCarousel.module.css";
import { getTrabajosRealizados, getProyectosPortafolio } from "@/services/landing";
import { getStrapiMediaUrl } from "@/lib/strapi";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { ProyectoItem, ProyectoPortafolioItem } from "@/types/landing";

/**
 * Procesa URL de imagen para determinar la fuente correcta
 * Retorna null si la URL es inválida o no existe
 */
function processImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;
  
  // Verificar formato de URL
  try {
    // Para URLs de Cloudinary, usar función específica
    if (url.includes('cloudinary')) {
      return fixCloudinaryURL(url);
    }
    
    // Para otras URLs, usar la función de Strapi pero sin fallback
    const processedUrl = getStrapiMediaUrl(url, '');
    // Si la función devuelve string vacío (era un fallback), retornar null
    return processedUrl && processedUrl.trim() !== '' ? processedUrl : null;
  } catch (error) {
    console.error('Error procesando URL de imagen:', error);
    return null;
  }
}

interface ProjectSlide {
  title: string;
  subtitle: string;
  description: string;
  images: string[]; // Array de URLs de imágenes
}

/**
 * Componente de slider de imágenes para un proyecto
 */
interface ImageSliderProps {
  images: string[];
  title: string;
}

function ImageSlider({ images, title }: ImageSliderProps) {
  // En la landing, solo mostrar la primera imagen sin controles
  if (!images || images.length === 0) {
    return <ProjectPlaceholder />;
  }

  // Siempre mostrar solo la primera imagen en la landing
  return (
    <div className={styles.threeWrapper} style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
      <img
        src={images[0]}
        alt={`${title} - Imagen principal`}
        className={styles.projectImage}
      />
    </div>
  );
}

/**
 * Placeholder mientras se cargan los datos
 */
function RenderSkeleton() {
  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.skeletonContainer}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonContent}>
          <div className={styles.skeletonSubtitle} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} />
        </div>
      </div>
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}


/**
 * Componente de placeholder para renderizar cuando no hay imagen
 */
function ProjectPlaceholder() {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholderIcon}>
        📸
      </div>
      <p className={styles.placeholderTitle}>
        Sin imágenes disponibles
      </p>
      <p className={styles.placeholderText}>
        Trabajo realizado de nuestro portafolio
      </p>
    </div>
  );
}

/**
 * Estado vacío cuando no hay proyectos
 */
function NoProjects() {
  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.noDataContainer}>
        <div className={styles.noDataIcon}>
          📦
        </div>
        <h3 className={styles.noDataTitle}>
          No hay trabajos realizados disponibles
        </h3>
        <p className={styles.noDataText}>
          En este momento no hay trabajos realizados para mostrar. Vuelve pronto para ver nuestros proyectos destacados.
        </p>
      </div>
    </div>
  );
}

/**
 * Componente principal de carrusel de proyectos
 */
export default function RenderCarousel() {
  const [slides, setSlides] = useState<ProjectSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchProyectos() {
      try {
        const data = await getTrabajosRealizados();
        if (cancelled) return;
        
        if (data && Array.isArray(data.proyectos) && data.proyectos.length > 0) {
          const items = data.proyectos as ProyectoItem[];
          
          // Solo mostrar los primeros 4 en landing
          const parsed: ProjectSlide[] = items.slice(0, 4).map((item) => {
            // Procesar URLs de imágenes si existen
            const images: string[] = [];
            
            if (item.Imagenes && Array.isArray(item.Imagenes)) {
              item.Imagenes.forEach((imagen: any) => {
                if (imagen && imagen.url) {
                  const processedUrl = processImageUrl(imagen.url);
                  if (processedUrl) {
                    images.push(processedUrl);
                  }
                }
              });
            }
            
            console.log(`Procesando imágenes para trabajo realizado ${item.Titulo}:`, {
              cantidad: images.length,
              urls: images
            });
            
            return {
              title: item.Titulo || "Trabajo Realizado",
              subtitle: item.subtitulo || "Trabajo Destacado",
              description: item.Descripcion || "",
              images: images,
              cta: "Ver más detalles", // Valor fijo ya que ProyectoItem no tiene CTA
              model: null,
              tipoArchivo: images.length > 0 ? 'imagen' : 'none'
            };
          });
          
          setSlides(parsed);
        } else {
          console.warn('No se encontraron trabajos realizados o el formato es incorrecto');
          setSlides([]);
        }
      } catch (error) {
        console.error('Error fetching trabajos realizados:', error);
        setSlides([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchProyectos();
    return () => { cancelled = true; };
  }, []);

  // Mostrar skeleton mientras carga
  if (loading) return <RenderSkeleton />;

  // Mostrar mensaje cuando no hay proyectos
  if (slides.length === 0) {
    return <NoProjects />;
  }

  return (
    <div className={styles.carouselWrapper}>
      <Swiper
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        pagination={{
          clickable: true,
        }}
        modules={[Navigation, Pagination]}
        className={styles.mySwiper}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={`project-${idx}`}>
            <div className={styles.carouselContainer}>
              <div className={styles.left3d}>
                <button className={styles.btn360} type="button">
                  <span className={styles.icon360}>📸</span> {slide.images.length === 1 ? '1 imagen' : `Galería (${slide.images.length} imágenes)`}
                </button>
                <ImageSlider 
                  images={slide.images}
                  title={slide.title}
                />
              </div>
              <div className={styles.rightText}>
                <div className={styles.subtitle}>{slide.subtitle}</div>
                <div className={styles.title}>{slide.title}</div>
                <div className={styles.description}>{slide.description}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        {/* Botones personalizados */}
        <button
          className="swiper-button-prev"
          type="button"
          aria-label="Anterior"
        >
          <FaArrowLeft color="#ffffff" className={styles.arrowIcon} />
        </button>
        <button
          className="swiper-button-next"
          type="button"
          aria-label="Siguiente"
        >
          <FaArrowRight color="#ffffff" className={styles.arrowIcon} />
        </button>
      </Swiper>
    </div>
  );
}
