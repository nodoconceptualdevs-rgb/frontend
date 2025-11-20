"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import styles from "./ByNodoSection.module.css";
import { useTheme } from "@/contexts/ThemeContext";
import TransitionOverlay from "@/components/TransitionOverlay";

const images = [
  "/Restaurante1.png",
  "/Restaurante2.png",
  "/Restaurante3.png",
  "/Restaurante4.png",
  "/Restaurante5.png",
  "/image3.jpg",
  "/image1.jpg",
  "/image2.jpg",
];

export default function ByNodoSection() {
  const router = useRouter();
  const { setIsTransitioning } = useTheme();
  const [showOverlay, setShowOverlay] = useState(false);

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

      {/* Carrusel de imágenes */}
      <div className={styles.carouselWrapper}>
        <Swiper
          slidesPerView={2}
          spaceBetween={0}
          loop={true}
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
      </div>
    </div>
    </>
  );
}
