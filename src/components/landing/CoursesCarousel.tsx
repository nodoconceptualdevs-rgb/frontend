"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import styles from "./CoursesCarousel.module.css";
import CourseCard, { CourseCardProps } from "@/components/CourseCard";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

// Esta función debería implementarse en services
const getCourses = async (): Promise<CourseCardProps[]> => {
  // Aquí se haría la llamada al API
  // Por ahora retornamos un array vacío para probar el estado vacío
  return [];
};

// Componente para mostrar cuando no hay cursos
function EmptyCoursesState() {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.emptyStateIcon}>📚</div>
      <h3 className={styles.emptyStateTitle}>Próximamente cursos</h3>
      <p className={styles.emptyStateText}>
        Estamos preparando nuevos cursos para ti. ¡Vuelve pronto para descubrirlos!
      </p>
    </div>
  );
}

// Mantener esto solo para referencia mientras se implementa la API real
/* 
Esta sección es solo una referencia de cómo se vería la estructura de datos
de cursos cuando la API esté implementada.
*/

// Componente con skeleton loader para estado de carga
function CoursesSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonCard}></div>
      <div className={styles.skeletonCard}></div>
      <div className={styles.skeletonCard}></div>
    </div>
  );
}

export default function CoursesCarousel() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchCourses() {
      try {
        const data = await getCourses();
        if (!cancelled) {
          setCourses(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error cargando cursos:', error);
        if (!cancelled) {
          setCourses([]);
          setLoading(false);
        }
      }
    }
    
    fetchCourses();
    return () => { cancelled = true; };
  }, []);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="relative">
        <div className={styles.carouselWrapper}>
          <CoursesSkeleton />
        </div>
        <div className={styles.backgroundBlack}></div>
      </div>
    );
  }

  // Mostrar estado vacío si no hay cursos
  if (courses.length === 0) {
    return (
      <div className="relative">
        <div className={styles.carouselWrapper}>
          <EmptyCoursesState />
          <div className={styles.yellowCtaWrapper}>
            <button
              className={styles.yellowCtaBtn}
              type="button"
              onClick={() => router.push("/registro")}
            >
              Regístrate aquí para recibir notificaciones
              <span className={styles.arrowIcon}>
                <FaArrowRight color="#ffffffff" />
              </span>
            </button>
          </div>
        </div>
        <div className={styles.backgroundBlack}></div>
      </div>
    );
  }

  // Mostrar carrusel con cursos
  return (
    <div className="relative">
      <div className={styles.carouselWrapper}>
        <Swiper
          modules={[Navigation]}
          slidesPerView={1}
          spaceBetween={24}
          loop={courses.length > 3}
          cssMode={true}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          breakpoints={{
            700: { slidesPerView: 2 },
            1100: { slidesPerView: 3 },
          }}
          className={styles.mySwiper}
        >
          {courses.map((course, index) => (
            <SwiperSlide key={`course-${index}`}>
              <CourseCard {...course} />
            </SwiperSlide>
          ))}
          <button
            className="swiper-button-prev"
            type="button"
            aria-label="Anterior"
          >
            <FaArrowLeft color="#ffffff" />
          </button>
          <button
            className="swiper-button-next"
            type="button"
            aria-label="Siguiente"
          >
            <FaArrowRight color="#ffffff" />
          </button>
        </Swiper>
        <div className={styles.yellowCtaWrapper}>
          <button
            className={styles.yellowCtaBtn}
            type="button"
            onClick={() => router.push("/registro")}
          >
            Regístrate aquí para acceder a nuestros cursos
            <span className={styles.arrowIcon}>
              <FaArrowRight color="#ffffffff" />
            </span>
          </button>
        </div>
      </div>
      <div className={styles.backgroundBlack}></div>
    </div>
  );
}
