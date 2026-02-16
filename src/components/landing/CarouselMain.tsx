"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "./CarouselMain.module.css";

import Image from "next/image";
import { RedButtonWithIcon } from "../CustomButtons";
import { getCarrousel } from "@/services/landing";
import { getStrapiMediaUrl } from "@/lib/strapi";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { SliderSlide } from "@/types/landing";

// Función auxiliar para procesar URLs de imágenes
function processImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;
  
  // Si es URL de Cloudinary, usar fixCloudinaryURL
  if (url.includes('cloudinary')) {
    return fixCloudinaryURL(url);
  }
  
  // Si no, usar getStrapiMediaUrl sin fallback
  return getStrapiMediaUrl(url, ''); // Pasamos string vacío para evitar fallback
}

/**
 * Componente para mostrar cuando no hay datos de carrusel
 */
function EmptyCarousel() {
  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyStateContent}>
          <h2 className={styles.emptyStateTitle}>Información no disponible</h2>
          <p className={styles.emptyStateText}>
            No hay contenido disponible para el carrusel. Por favor, configura la sección de carrusel en el panel de administración.
          </p>
        </div>
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className={styles.carouselWrapper}>
      <div
        style={{
          width: "100%",
          aspectRatio: "16/7",
          background: "linear-gradient(110deg, #e0e0e0 8%, #f0f0f0 18%, #e0e0e0 33%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s linear infinite",
          borderRadius: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", bottom: "15%", left: "5%", display: "flex", flexDirection: "column", gap: 16, width: "50%" }}>
          <div style={{ height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 8, width: "80%" }} />
          <div style={{ height: 16, background: "rgba(255,255,255,0.1)", borderRadius: 6, width: "60%" }} />
          <div style={{ height: 16, background: "rgba(255,255,255,0.1)", borderRadius: 6, width: "45%" }} />
        </div>
      </div>
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}

export default function Carousel() {
  const router = useRouter();
  const [slides, setSlides] = useState<SliderSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchSlides() {
      try {
        const data = await getCarrousel();
        if (cancelled) return;

        const parsed: SliderSlide[] = [];
        
        if (data) {
          // Convertimos a Record<string, any> para acceso dinámico a propiedades
          const rawData = data as unknown as Record<string, any>;
          
          // Iteramos sobre los campos para construir los slides
          for (let i = 1; i <= 3; i++) {
            const titulo = rawData[`titulo${i}`] as string | undefined;
            const contenido = rawData[`contenido${i}`] as string | undefined;
            const foto = rawData[`foto${i}`] as { url?: string, formats?: any } | null;
            
            if (titulo) {
              // Usar la función auxiliar para procesar URLs
              const imageUrl = foto?.url ? processImageUrl(foto.url) : null;
              
              parsed.push({
                title: titulo,
                content: contenido || "",
                image: imageUrl || "", // Aseguramos que sea string vacío si es null
              });
            }
          }
        }
        
        setSlides(parsed);
      } catch (error) {
        console.error("Error cargando slider principal:", error);
        setSlides([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSlides();
    return () => { cancelled = true; };
  }, []);

  /**
   * Componente para mostrar cuando una slide no tiene imagen
   */
  function NoImagePlaceholder({ title }: { title: string }) {
    return (
      <div className={styles.noImagePlaceholder}>
        <div className={styles.noImageIcon}>📷</div>
        <div className={styles.noImageText}>Imagen no disponible</div>
      </div>
    );
  }

  if (loading) return <CarouselSkeleton />;
  
  // Mostrar mensaje cuando no hay slides
  if (!slides || slides.length === 0) {
    return <EmptyCarousel />;
  }

  return (
    <div className={styles.carouselWrapper}>
      <Swiper
        cssMode={true}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        pagination={true}
        mousewheel={true}
        keyboard={true}
        loop={slides.length > 1}
        modules={[Navigation, Pagination, Mousewheel, Keyboard]}
        className={styles.mySwiper}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={`slide-${idx}`}>
            <div className={styles.slideContainer}>
              {slide.image ? (
                <>
                  {/* Imagen del slide */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={styles.slideImage}
                    style={{ 
                      objectFit: 'cover',
                      position: 'absolute',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <div className={styles.slideOverlay} />
                </>
              ) : (
                <NoImagePlaceholder title={slide.title} />
              )}
              
              {/* Contenido del slide (siempre se muestra) */}
              <div className={styles.slideContent}>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
                <p className={styles.slideText}>{slide.content}</p>
                <div className={styles.desktopButton}>
                  <RedButtonWithIcon onClick={() => router.push("/portafolio")}>
                    Ver portafolio
                  </RedButtonWithIcon>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        
        {/* Botones personalizados */}
        {slides.length > 1 && (
          <>
            <button
              className="swiper-button-prev"
              type="button"
              aria-label="Anterior"
            >
              <FaArrowLeft color="#ffffff" size={32} />
            </button>
            <button
              className="swiper-button-next"
              type="button"
              aria-label="Siguiente"
            >
              <FaArrowRight color="#ffffff" />
            </button>
          </>
        )}
      </Swiper>
    </div>
  );
}
