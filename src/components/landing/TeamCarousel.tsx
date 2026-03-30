"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import styles from "./TeamCarousel.module.css";
import { getTrabajadores } from "@/services/landing";
import { getStrapiMediaUrl } from "@/lib/strapi";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { TrabajadorItem } from "@/types/landing";

/**
 * Procesa URL de imagen para determinar la fuente correcta
 */
function processImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  if (url.includes('cloudinary')) {
    return fixCloudinaryURL(url);
  }
  
  return getStrapiMediaUrl(url);
}

interface TeamMember {
  name: string;
  role: string;
  image: string | null;
}

/**
 * Componente para mostrar estado de carga
 */
function TeamSkeleton() {
  return (
    <div className={styles.teamCarouselWrapper}>
      <div className={styles.skeletonContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonInfo}>
              <div className={styles.skeletonName} />
              <div className={styles.skeletonRole} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}

/**
 * Componente para mostrar cuando no hay trabajadores
 */
function EmptyTeam() {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.emptyStateIcon}>👥</div>
      <h3 className={styles.emptyStateTitle}>
        Equipo en formación
      </h3>
      <p className={styles.emptyStateText} style={{ color: 'black' }}>
        Próximamente conocerás a nuestro equipo de profesionales.
      </p>
    </div>
  );
}

export default function TeamCarousel() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchTeam() {
      try {
        const data = await getTrabajadores();
        if (cancelled) return;

        if (data && Array.isArray(data.trabajadores) && data.trabajadores.length > 0) {
          // Mapear los datos a nuestro formato
          const parsedTeam = data.trabajadores.map((trabajador: TrabajadorItem) => {
            // Procesar URL de foto si existe
            const photoUrl = trabajador.Foto?.url ? processImageUrl(trabajador.Foto.url) : null;
            
            return {
              name: trabajador.Nombre || "Sin nombre",
              role: trabajador.Puesto || "Sin cargo",
              image: photoUrl
            };
          });
          
          setTeam(parsedTeam);
        } else {
          console.log("No se encontraron trabajadores en la API");
          setTeam([]);
        }
      } catch (error) {
        console.error("Error cargando datos de trabajadores:", error);
        setTeam([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchTeam();
    return () => { cancelled = true; };
  }, []);

  // Mostrar skeleton durante la carga
  if (loading) return <TeamSkeleton />;
  
  // Mostrar mensaje cuando no hay trabajadores
  if (team.length === 0) return <EmptyTeam />;

  return (
    <div className={styles.teamCarouselWrapper}>
      <Swiper
        slidesPerView={2}
        spaceBetween={0}
        loop={team.length > 3}
        navigation={false}
        pagination={false}
        breakpoints={{
          700: { slidesPerView: 3 },
          1100: { slidesPerView: 5 },
        }}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        className={styles.mySwiper}
        allowTouchMove={true}
        modules={[Autoplay]}
      >
        {team.map((member, idx) => (
          <SwiperSlide key={`team-member-${idx}`}>
            <div className={styles.card}>
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className={styles.img}
                />
              ) : (
                <div className={styles.placeholderImage}>
                  <span>👤</span>
                </div>
              )}
              <div className={styles.infoBox}>
                <div className={styles.name}>{member.name}</div>
                <div className={styles.role}>{member.role}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
