"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import styles from "./ByNodoSection.module.css";
import emptyStyles from "./EmptyStates.module.css";
import { useTheme } from "@/contexts/ThemeContext";
import TransitionOverlay from "@/components/TransitionOverlay";
import { getByNodoRestaurantes } from "@/services/landing";
import { getStrapiMediaUrl } from "@/lib/strapi";
import type { RestauranteItem } from "@/types/landing";

// Componente para mostrar cuando no hay imágenes de restaurantes
function EmptyRestaurantsState() {
  return (
    <div className={emptyStyles.emptyRestaurantsContainer}>
      <div className={emptyStyles.emptyRestaurantsIcon}>🍴</div>
      <div className={emptyStyles.emptyRestaurantsText}>Próximamente restaurantes</div>
    </div>
  );
}

export default function ByNodoSection() {
  const router = useRouter();
  const { setIsTransitioning } = useTheme();
  const [showOverlay, setShowOverlay] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchImages() {
      try {
        const data = await getByNodoRestaurantes();
        if (cancelled) return;

        const items = (data?.Restaurantes || []) as RestauranteItem[];
        // Array para guardar solo una imagen por restaurante
        const featuredPhotos: string[] = [];

        // Para cada restaurante, tomar solo la primera imagen
        items.forEach((item) => {
          if (Array.isArray(item.Fotos_Restaurante) && item.Fotos_Restaurante.length > 0) {
            const photo = item.Fotos_Restaurante[0];
            if (photo.url) {
              featuredPhotos.push(getStrapiMediaUrl(photo.url));
            }
          }
        });

        // Actualizar el estado con solo una imagen por restaurante (vacío si no hay)
        setImages(featuredPhotos);
      } catch (error) {
        console.error("Error cargando imágenes ByNodo:", error);
        setImages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchImages();
    return () => { cancelled = true; };
  }, []);

  const handleVerMas = () => {
    setShowOverlay(true);
    setIsTransitioning(true);
    
    // Navegar durante la animación para transición suave
    setTimeout(() => {
      router.push('/bynodo');
    }, 1500); // A mitad de la animación (3000ms / 2)
  };

  const handleTransitionComplete = () => {
    setShowOverlay(false);
    setIsTransitioning(false);
  };

  return (
    <>
      <TransitionOverlay 
        isVisible={showOverlay} 
        onComplete={handleTransitionComplete} 
      />
      <div className={styles.byNodoContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.background} />
          <div className={styles.innerContent}>
            {/* Logo BY NODO */}
            <div className={styles.logoWrapper}>
              <img 
                src="/bynodo.svg" 
                alt="BY NODO" 
                className={styles.logo}
              />
            </div>

            {/* Layout con líneas diagonalmente opuestas */}
            <div className={styles.linesTextWrapper}>
              <div className={styles.topLineContainer}>
                <div className={styles.dottedLineTop} />
                <div className={styles.spacer} />
              </div>
              <div className={styles.textContainer}>
                <img 
                  src="/letters.svg" 
                  alt="con el mismo compromiso" 
                  className={styles.letters}
                />
              </div>
              <div className={styles.bottomLineContainer}>
                <div className={styles.spacer} />
                <div className={styles.dottedLineBottom} />
              </div>
            </div>
          </div>
          
          {/* Botón Ver más - fuera de innerContent para que sobresalga */}
          <button 
            className={styles.verMasBtn}
            onClick={handleVerMas}
            type="button"
          >
            Ver más
          </button>
        </div>

      {/* Carrusel de imágenes o estado vacío */}
      <div className={styles.carouselWrapper}>
        {loading ? (
          // Skeleton loader mientras carga
          <div className={emptyStyles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={emptyStyles.skeletonCard} />
            ))}
          </div>
        ) : images.length > 0 ? (
          // Carrusel con imágenes
          <Swiper
            slidesPerView={2}
            spaceBetween={0}
            loop={images.length > 5}
            navigation={false}
            pagination={false}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 0 },
              1024: { slidesPerView: 5, spaceBetween: 0 },
            }}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            className={styles.mySwiper}
            allowTouchMove={true}
            modules={[Autoplay]}
          >
            {images.map((image, idx) => (
              <SwiperSlide key={idx}>
                <div className={styles.imageCard}>
                  <img
                    src={image}
                    alt={`ByNodo ${idx + 1}`}
                    className={styles.carouselImage}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          // Estado vacío cuando no hay imágenes
          <EmptyRestaurantsState />
        )}
      </div>
    </div>
    </>
  );
}
