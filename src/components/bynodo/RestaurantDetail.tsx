'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaArrowLeft, FaMapMarkerAlt, FaPhone, FaClock, FaInstagram } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import SectionTitle from './SectionTitle';
import styles from './RestaurantDetail.module.css';
import { getByNodoRestaurantes } from '@/services/landing';
import { getStrapiMediaUrl } from '@/lib/strapi';
import type { RestauranteItem } from '@/types/landing';

interface RestaurantDetailProps {
  slug: string;
}

interface RestaurantViewData {
  name: string;
  hero: string;
  description: string;
  images: string[];
  phone: string;
  instagram: string;
  address: string;
  hours: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function DetailSkeleton() {
  return (
    <div className={styles.detailContainer}>
      {/* Title section skeleton */}
      <div className="skeleton-section" style={{ 
        height: 60, 
        padding: '0 clamp(1rem, 5vw, 5rem)',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Back button skeleton */}
        <div style={{
          width: 40,
          height: 40,
          background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          borderRadius: '50%',
          opacity: 0.5
        }} />
        
        {/* Title text skeleton */}
        <div style={{
          marginLeft: '2rem',
          width: 180,
          height: 24,
          background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          borderRadius: 8,
          opacity: 0.6
        }} />
      </div>
      
      {/* Hero image skeleton */}
      <div
        style={{
          width: '100%',
          height: 350,
          background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          position: 'relative',
          opacity: 0.7
        }}
      >
        {/* Hero overlay skeleton */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40%',
          height: 40,
          background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          borderRadius: 8,
          opacity: 0.8
        }} />
      </div>
      
      {/* Content section skeleton */}
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Section title skeleton */}
        <div style={{
          height: 28,
          width: '30%',
          background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          borderRadius: 8,
          opacity: 0.7,
          margin: '0 auto 16px'
        }} />
        
        {/* Description paragraph skeleton - multiple lines */}
        {[1, 2, 3, 4].map(i => (
          <div 
            key={`text-${i}`}
            style={{
              height: 14,
              background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s linear infinite',
              borderRadius: 6,
              width: i % 2 === 0 ? '85%' : '90%',
              opacity: 0.5,
              margin: '0 auto'
            }}
          />
        ))}
      </div>
      
      {/* Carousel section skeleton */}
      <div style={{
        padding: '32px 0',
        width: '100%',
        background: 'rgba(50, 50, 50, 0.1)'
      }}>
        {/* Section title skeleton */}
        <div style={{
          height: 28,
          width: 150,
          background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
          borderRadius: 8,
          opacity: 0.7,
          margin: '0 auto 24px'
        }} />
        
        {/* Carousel skeleton */}
        <div style={{
          display: 'flex',
          gap: '15px',
          padding: '0 24px',
          overflow: 'hidden'
        }}>
          {[1, 2, 3].map(i => (
            <div 
              key={`slide-${i}`}
              style={{
                flex: '0 0 auto',
                width: 'calc(33.33% - 10px)',
                aspectRatio: '16/10',
                background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s linear infinite',
                borderRadius: 16,
                opacity: 0.6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>
      </div>
      
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}

export default function RestaurantDetail({ slug }: RestaurantDetailProps) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<RestaurantViewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchRestaurant() {
      try {
        const data = await getByNodoRestaurantes();
        if (cancelled) return;

        const items = (data?.Restaurantes || []) as RestauranteItem[];
        const match = items.find((item) => slugify(item.Nombre_Restaurante || '') === slug);

        if (match) {
          const photos = Array.isArray(match.Fotos_Restaurante)
            ? match.Fotos_Restaurante.map((p) => getStrapiMediaUrl(p.url))
            : [];

          setRestaurant({
            name: match.Nombre_Restaurante || 'Restaurante',
            hero: photos.length > 0 ? photos[0] : '/restaurante1.png',
            description: match.Descripcion || '',
            images: photos.length > 0 ? photos : ['/restaurante1.png'],
            phone: match.Num_Contacto || '',
            instagram: match.Instagram || '',
            address: match.Direccion || '',
            hours: match.Horarios || '',
          });
        }
      } catch (error) {
        console.error('Error cargando detalle restaurante:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRestaurant();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <DetailSkeleton />;

  if (!restaurant) {
    return (
      <div className={styles.detailContainer}>
        <section className={styles.titleSection}>
          <button
            className={styles.backButton}
            onClick={() => router.push('/bynodo')}
            aria-label="Volver a restaurantes"
          >
            <FaArrowLeft />
          </button>
          <div className={styles.titleContainer}>
            <h1 className={styles.restaurantName}>Restaurantes</h1>
          </div>
        </section>
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#999' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#555' }}>Restaurante no encontrado</p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>No pudimos encontrar la información de este restaurante.</p>
          <button
            onClick={() => router.push('/bynodo')}
            style={{
              padding: '10px 24px',
              background: '#ab2731',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver todos los restaurantes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailContainer}>
      {/* Title Section with Back Button */}
      <section className={styles.titleSection}>
        <button
          className={styles.backButton}
          onClick={() => router.push('/bynodo')}
          aria-label="Volver a restaurantes"
        >
          <FaArrowLeft />
        </button>
        <div className={styles.titleContainer}>
          <h1 className={styles.restaurantName}>Restaurantes</h1>
        </div>
      </section>

      {/* Hero Image */}
      <section className={styles.heroSection}>
        <Image
          src={restaurant.hero}
          alt={restaurant.name}
          width={1920}
          height={500}
          className={styles.heroImage}
          priority
        />
        <div className={styles.heroOverlay}>
          <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{restaurant.name}</h2>
        </div>
      </section>

      {/* Content Container */}
      <div className={styles.contentWrapper}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{restaurant.name}</h2>
          {restaurant.description ? (
            <p className={styles.sectionContent}>{restaurant.description}</p>
          ) : (
            <p className={styles.sectionContent}>
              <em>Próximamente más información sobre este restaurante.</em>
            </p>
          )}
        </section>
      </div>

      {/* Espacios Section */}
      {restaurant.images.length > 0 && (
        <section className={styles.espaciosSection}>
          <div className={styles.espaciosWrapper}>
            <SectionTitle title="Espacios" />
          </div>
          <div className={styles.carouselContainer}>
            <Swiper
              modules={[Autoplay]}
              slidesPerView={1.2}
              spaceBetween={20}
              loop={restaurant.images.length > 1}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              centeredSlides={true}
              breakpoints={{
                640: { slidesPerView: 1.5, spaceBetween: 20 },
                1024: { slidesPerView: 2.5, spaceBetween: 30 },
                1280: { slidesPerView: 3, spaceBetween: 30 },
              }}
              className={styles.swiper}
            >
              {restaurant.images.map((img, idx) => (
                <SwiperSlide key={`space-${idx}`}>
                  <div className={styles.carouselSlide}>
                    <Image
                      src={img}
                      alt={`Espacio ${idx + 1}`}
                      width={400}
                      height={300}
                      className={styles.slideImage}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Información de Contacto Section */}
      <section className={styles.contactSection}>
        <div className={styles.contactWrapper}>
          <h2 className={styles.contactTitle}>Información de contacto</h2>
          <div className={styles.contactGrid}>
            {restaurant.phone && (
              <div className={styles.contactItem}>
                <FaPhone className={styles.contactIcon} />
                <div>
                  <p className={styles.contactLabel}>Reservas</p>
                  <p className={styles.contactText}>{restaurant.phone}</p>
                </div>
              </div>
            )}
            {restaurant.address && (
              <div className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <div>
                  <p className={styles.contactLabel}>Dirección</p>
                  <p className={styles.contactText}>{restaurant.address}</p>
                </div>
              </div>
            )}
            {restaurant.instagram && (
              <div className={styles.contactItem}>
                <FaInstagram className={styles.contactIcon} />
                <div>
                  <p className={styles.contactLabel}>Instagram</p>
                  <p className={styles.contactText}>{restaurant.instagram}</p>
                </div>
              </div>
            )}
            {restaurant.hours && (
              <div className={styles.contactItem}>
                <FaClock className={styles.contactIcon} />
                <div>
                  <p className={styles.contactLabel}>Horarios</p>
                  <p className={styles.contactText}>{restaurant.hours}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
