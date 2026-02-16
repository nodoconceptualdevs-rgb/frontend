"use client";
import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import styles from "./RenderCarousel.module.css";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTrabajosRealizados } from "@/services/landing";
import { getStrapiMediaUrl } from "@/lib/strapi";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { ProyectoItem } from "@/types/landing";

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
  renderUrl: string | null;
  model: "house1" | "house2";
}

/**
 * Componente de modelo 3D con rotación automática
 */
function HouseModel({ model }: { model: "house1" | "house2" }) {
  const { scene } = useGLTF(model === "house1" ? "/House1.glb" : "/House2.glb");
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });

  return <primitive ref={ref} object={scene} scale={1.2} />;
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
 * Componente para visualizar modelo 3D
 */
interface Model3DViewerProps {
  model: "house1" | "house2";
  onClose: () => void;
}

function Model3DViewer({ model, onClose }: Model3DViewerProps) {
  return (
    <div className={styles.modelOverlay}>
      <button 
        onClick={onClose}
        className={styles.closeButton}
      >
        ✕
      </button>
      
      <div className={styles.modelLabel}>
        Modelo 3D
      </div>
      
      <Canvas
        camera={{ position: [2, 2, 4], fov: 40 }}
        style={{ background: "#fff" }}
      >
        <ambientLight intensity={0.7} />
        <Stage environment={null} intensity={0.8}>
          <HouseModel model={model} />
        </Stage>
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
}

/**
 * Componente de placeholder para renderizar cuando no hay imagen
 */
interface PlaceholderProps {
  onShowModel: () => void;
}

function ProjectPlaceholder({ onShowModel }: PlaceholderProps) {
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholderIcon}>
        🏠
      </div>
      <p className={styles.placeholderTitle}>
        Render no disponible
      </p>
      <p className={styles.placeholderText}>
        Visualiza este proyecto a través de un modelo 3D interactivo
      </p>
      <button
        onClick={onShowModel}
        className={styles.modelButton}
      >
        <span className={styles.modelIcon}>⟳</span>
        Ver modelo 3D
      </button>
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
          No hay proyectos disponibles
        </h3>
        <p className={styles.noDataText}>
          En este momento no hay proyectos para mostrar. Vuelve pronto para ver nuestros trabajos destacados.
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
  const [showModel, setShowModel] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchProyectos() {
      try {
        const data = await getTrabajosRealizados();
        if (cancelled) return;
        
        if (data && Array.isArray(data.proyectos) && data.proyectos.length > 0) {
          const items = data.proyectos as ProyectoItem[];
          const models: Array<"house1" | "house2"> = ["house1", "house2"];
          
          // Solo mostrar los primeros 2 en landing
          const parsed: ProjectSlide[] = items.slice(0, 2).map((item, idx) => {
            // Procesar URL de render si existe
            let renderUrl = null;
            if (item.Render && item.Render.url) {
              renderUrl = processImageUrl(item.Render.url);
              // Verificación adicional para asegurar que no se muestra imagen cuando no corresponde
              console.log(`Procesando render para proyecto ${item.Titulo}:`, {
                original: item.Render.url,
                procesada: renderUrl
              });
            } else {
              console.log(`Proyecto ${item.Titulo || "sin título"} sin imagen de render`);
            }
            
            return {
              title: item.Titulo || "Proyecto",
              subtitle: item.subtitulo || "Proyecto Destacado",
              description: item.Descripcion || "",
              renderUrl: renderUrl,
              model: models[idx % models.length],
            };
          });
          
          setSlides(parsed);
        } else {
          setSlides([]);
        }
      } catch (error) {
        setSlides([]);
      } finally {
        if (!cancelled) setLoading(false);
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
                  <span className={styles.icon360}>⟳</span> Imagen 360°
                </button>
                <div className={styles.threeWrapper}>
                  {slide.renderUrl ? (
                    <img
                      src={slide.renderUrl}
                      alt={slide.title}
                      className={styles.projectImage}
                    />
                  ) : (
                    <ProjectPlaceholder 
                      onShowModel={() => setShowModel(idx)}
                    />
                  )}
                  
                  {/* Mostrar modelo 3D cuando se haga clic en el botón */}
                  {showModel === idx && (
                    <Model3DViewer 
                      model={slide.model}
                      onClose={() => setShowModel(null)}
                    />
                  )}
                </div>
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
