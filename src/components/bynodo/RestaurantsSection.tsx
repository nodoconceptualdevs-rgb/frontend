'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './RestaurantsSection.module.css';
import { getByNodoRestaurantes } from '@/services/landing';
import { getStrapiMediaUrl } from '@/lib/strapi';
import type { RestauranteItem } from '@/types/landing';

interface RestaurantCard {
  id: number;
  name: string;
  image: string;
  description: string;
  slug: string;
}

const ITEMS_PER_PAGE = 3;

function RestaurantsSkeleton() {
  return (
    <section className={styles.restaurantsSection}>
      <div className={styles.header}>
        <div 
          className="shimmer-effect"
          style={{ 
            height: 36, 
            background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)', 
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
            borderRadius: 8, 
            width: 220, 
            margin: '0 auto',
            opacity: 0.6
          }} 
        />
      </div>
      <div className={styles.restaurantsGrid}>
        {[1, 2, 3].map((i) => (
          <article 
            key={i}
            className={styles.restaurantCard}
            style={{
              overflow: 'hidden',
              borderRadius: '16px',
              background: 'rgba(40, 40, 40, 0.3)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)',
            }}
          >
            {/* Image skeleton */}
            <div
              className="shimmer-effect"
              style={{
                height: '240px',
                background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s linear infinite',
                opacity: 0.7,
                width: '100%'
              }}
            />
            
            {/* Content skeleton */}
            <div 
              style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Title skeleton */}
              <div
                className="shimmer-effect"
                style={{
                  height: '24px',
                  width: '70%',
                  background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s linear infinite',
                  opacity: 0.8,
                  borderRadius: '4px'
                }}
              />
              
              {/* Description lines skeleton */}
              {[1, 2, 3].map((j) => (
                <div
                  key={`desc-${i}-${j}`}
                  className="shimmer-effect"
                  style={{
                    height: '12px',
                    width: j === 3 ? '60%' : '90%',
                    background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s linear infinite',
                    opacity: 0.6,
                    borderRadius: '4px'
                  }}
                />
              ))}
              
              {/* Button skeleton */}
              <div
                className="shimmer-effect"
                style={{
                  height: '36px',
                  width: '120px',
                  background: 'linear-gradient(110deg, #333 8%, #444 18%, #333 33%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s linear infinite',
                  opacity: 0.5,
                  borderRadius: '20px',
                  marginTop: '0.5rem',
                  alignSelf: 'flex-end'
                }}
              />
            </div>
          </article>
        ))}
      </div>
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </section>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function fetchRestaurants() {
      try {
        const data = await getByNodoRestaurantes();
        if (cancelled) return;

        const items = (data?.Restaurantes || []) as RestauranteItem[];

        const parsed: RestaurantCard[] = items.map((item) => {
          const firstPhoto = Array.isArray(item.Fotos_Restaurante) && item.Fotos_Restaurante.length > 0
            ? item.Fotos_Restaurante[0]
            : null;

          return {
            id: item.id,
            name: item.Nombre_Restaurante || 'Restaurante',
            image: getStrapiMediaUrl(firstPhoto?.url, '/restaurante1.png'),
            description: item.Descripcion || '',
            slug: slugify(item.Nombre_Restaurante || `restaurante-${item.id}`),
          };
        });

        setRestaurants(parsed);
      } catch (error) {
        console.error('Error cargando restaurantes:', error);
        setRestaurants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRestaurants();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <RestaurantsSkeleton />;

  if (restaurants.length === 0) {
    return (
      <section className={styles.restaurantsSection}>
        <div className={styles.header}>
          <h1 className={styles.title}>Restaurantes</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#999' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }}>
            <path d="M3 3h18v18H3z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Próximamente</p>
          <p style={{ fontSize: 14 }}>Estamos preparando nuestros restaurantes para ti.</p>
        </div>
      </section>
    );
  }

  const totalPages = Math.ceil(restaurants.length / ITEMS_PER_PAGE);
  const paginatedRestaurants = restaurants.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <section className={styles.restaurantsSection}>
      <div className={styles.header}>
        <h1 className={styles.title}>Restaurantes</h1>
      </div>
      
      <div className={styles.restaurantsGrid}>
        {paginatedRestaurants.map((restaurant, index) => (
          <article
            key={restaurant.id}
            className={`${styles.restaurantCard} ${index % 2 === 0 ? styles.leftAlign : styles.rightAlign}`}
          >
            <div className={styles.imageContainer}>
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                width={600}
                height={400}
                className={styles.restaurantImage}
                priority={index === 0}
              />
              <div className={styles.overlay}></div>
            </div>
            
            <div className={styles.contentContainer}>
              <h2 className={styles.restaurantName}>{restaurant.name}</h2>
              {restaurant.description && (
                <p className={styles.description}>{restaurant.description}</p>
              )}
              
              <Link 
                href={`/bynodo/${restaurant.slug}`}
                prefetch={true}
                className={styles.verMasBtn}
              >
                Ver más
              </Link>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, paddingBottom: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: p === page ? '2px solid #ab2731' : '1px solid #ddd',
                background: p === page ? '#ab2731' : '#fff',
                color: p === page ? '#fff' : '#333',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
