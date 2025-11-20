'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './RestaurantsSection.module.css';

const restaurants = [
  {
    id: 'origen',
    name: 'Origen',
    logo: '/restaurant-logos/origen.png',
    image: '/Restaurante1.png',
    description: 'Una experiencia gastronómica única que combina la tradición culinaria con técnicas modernas, ofreciendo platos que deleitan todos los sentidos.',
    slug: 'origen'
  },
  {
    id: 'daniels-food',
    name: "Daniel's Food",
    logo: '/restaurant-logos/daniels.png',
    image: '/Restaurante2.png',
    description: 'Sabores auténticos en un ambiente acogedor. Cada plato cuenta una historia de pasión y dedicación a la excelencia culinaria.',
    slug: 'daniels-food'
  },
  {
    id: 'world-burger',
    name: 'World Burger',
    logo: '/restaurant-logos/world-burger.png',
    image: '/Restaurante3.png',
    description: 'Las mejores hamburguesas artesanales del mundo, con ingredientes premium y combinaciones únicas que transforman cada bocado en una experiencia.',
    slug: 'world-burger'
  }
];

export default function RestaurantsSection() {
  const router = useRouter();

  return (
    <section className={styles.restaurantsSection}>
      <div className={styles.header}>
        <h1 className={styles.title}>Restaurantes</h1>
      </div>
      
      <div className={styles.restaurantsGrid}>
        {restaurants.map((restaurant, index) => (
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
              />
              <div className={styles.overlay}></div>
            </div>
            
            <div className={styles.contentContainer}>
              <div className={styles.logoContainer}>
                <Image
                  src={restaurant.logo}
                  alt={`${restaurant.name} logo`}
                  width={70}
                  height={70}
                  className={styles.restaurantLogo}
                />
              </div>
              
              <h2 className={styles.restaurantName}>{restaurant.name}</h2>
              <p className={styles.description}>{restaurant.description}</p>
              
              <button
                className={styles.verMasBtn}
                onClick={() => router.push(`/bynodo/${restaurant.slug}`)}
              >
                Ver más
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
