'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './RestaurantsSection.module.css';

const restaurantData = [
  {
    id: 1,
    name: 'Origen',
    logo: '/bynodo.svg',
    image: '/restaurante1.png',
    description: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam.',
    slug: 'origen'
  },
  {
    id: 2,
    name: 'Daniels',
    logo: '/isologo.svg',
    image: '/restaurante2.png',
    description: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam.',
    slug: 'daniels'
  },
  {
    id: 3,
    name: 'World Burger',
    logo: '/logo.svg',
    image: '/restaurante3.png',
    description: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam.',
    slug: 'world-burger'
  }
];

export default function RestaurantsSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <section className={styles.restaurantsSection}>
      <div className={styles.header}>
        <h1 className={styles.title}>Restaurantes</h1>
      </div>
      
      <div className={styles.restaurantsGrid}>
        {restaurantData.map((restaurant, index) => (
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
              <div className={styles.logoContainer}>
                <Image
                  src={restaurant.logo}
                  alt={`${restaurant.name} logo`}
                  width={203}
                  height={120}
                  className={styles.restaurantLogo}
                />
              </div>
              
              <h2 className={styles.restaurantName}>{restaurant.name}</h2>
              <p className={styles.description}>{restaurant.description}</p>
              
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
    </section>
  );
}
