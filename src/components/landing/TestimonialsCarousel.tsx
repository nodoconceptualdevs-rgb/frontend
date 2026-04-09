import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import styles from "./TestimonialsCarousel.module.css";
import { getResenas } from "@/services/landing";
import type { ComentarioClienteItem } from "@/types/landing";

interface TestimonialDisplay {
  text: string;
  name: string;
  role: string;
  avatar: string;
}


const AVATAR_POOL = ["/image1.jpg", "/image2.jpg", "/image3.jpg"];

function TestimonialsSkeleton() {
  return (
    <div className={styles.testimonialsBg}>
      <div style={{ display: "flex", gap: 32, padding: "0 16px", overflow: "hidden", width: "100%" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: "0 0 280px",
              height: 280,
              background: "linear-gradient(110deg, #e8e8e8 8%, #f5f5f5 18%, #e8e8e8 33%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
              borderRadius: 24,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}

export default function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<TestimonialDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchTestimonials() {
      try {
        const data = await getResenas();
        if (cancelled) return;

        const items = (data?.comentarios || []) as ComentarioClienteItem[];

        const parsed: TestimonialDisplay[] = items.map((item, idx) => ({
          text: item.Comentario || "",
          name: item.Nombre || "Cliente",
          role: item.Empresa || "",
          avatar: AVATAR_POOL[idx % AVATAR_POOL.length],
        }));

        setTestimonials(parsed.length > 0 ? parsed : []);
      } catch (error) {
        console.error("Error cargando testimonios:", error);
        setTestimonials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTestimonials();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <TestimonialsSkeleton />;

  if (testimonials.length === 0) {
    return (
      <div className={styles.testimonialsBg}>
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#999" }}>
          <p style={{ fontSize: 18, fontWeight: 500 }}>Próximamente compartiremos las experiencias de nuestros clientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.testimonialsBg}>
      <Swiper
        slidesPerView={1}
        spaceBetween={32}
        loop={testimonials.length > 1}
        breakpoints={{
          700: { slidesPerView: Math.min(2, testimonials.length) },
          1100: { slidesPerView: Math.min(4, testimonials.length) },
        }}
        className={styles.mySwiper}
      >
        {testimonials.map((t, idx) => (
          <SwiperSlide key={`testimonial-${idx}`}>
            <div className={styles.card}>
              <div className={styles.quoteIcon}>&ldquo;</div>
              <div className={styles.text}>{t.text}</div>
              <div className={styles.userRow}>
                <img src={t.avatar} alt={t.name} className={styles.avatar} />
                <div>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.role}>{t.role}</div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
