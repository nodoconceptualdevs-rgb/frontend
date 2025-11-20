'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaArrowLeft, FaMapMarkerAlt, FaEnvelope, FaPhone, FaClock } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import SectionTitle from './SectionTitle';
import styles from './RestaurantDetail.module.css';

interface RestaurantDetailProps {
  slug: string;
}

const restaurantData: { [key: string]: any } = {
  'origen': {
    name: 'Origen',
    logo: '/restaurant-logos/origen.png',
    hero: '/Restaurante1.png',
    description: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam. Morbi faucibus duis sed mus diam amet egestas. Integer sit consequat et erat.',
    sections: {
      origen: {
        title: 'Origen',
        content: `Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam. Morbi faucibus duis sed mus diam amet egestas. Integer sit consequat et erat. Proin ultrices eget auctor pellentesque molestie. Cursus ut vulputate vitae vestibulum. Ut nunc netus habitasse nunc. Facilisis imperdiet habitant vitae ultricies facilisis mauris ipsum. Molestie ornare facilisi integer venenatis tellus. Phasellus mauris sit turpis purus adipisicing quis netus. Nunc faucibus tempor tincidunt sed id sed porta vitae. Viverra nulla ac malesuada molestie dolor facilisi porta. Cursus id curabitur convallis integer a neque at porta. Nibh arcu sed amet ornare ultrices mauris habitant.

Netus eu nunc cursus euismod ac elit lorem. Cursus ut vulputate vitae vestibulum. Ut nunc netus habitasse nunc. Facilisis imperdiet habitant vitae ultricies facilisis mauris ipsum. Molestie ornare facilisi integer venenatis.`
      },
      espacios: {
        title: 'Espacios',
        images: ['/Restaurante1.png', '/Restaurante2.png', '/Restaurante3.png', '/Restaurante4.png']
      },
      contacto: {
        title: 'Información de contacto',
        phone: '+58 424 123 45 67',
        email: 'Instagram: @restorangen',
        address: 'Av. Lorem Ipsum, Calle Gran Roble Sabana Grande',
        hours: 'Viernes a domingo - 9:00 a 18:00 - 10:00 a 17:00'
      }
    }
  },
  'daniels-food': {
    name: "Daniel's Food",
    logo: '/restaurant-logos/daniels.png',
    hero: '/Restaurante2.png',
    description: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam.',
    sections: {
      origen: {
        title: 'Origen',
        content: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam. Morbi faucibus duis sed mus diam amet egestas.'
      },
      espacios: {
        title: 'Espacios',
        images: ['/Restaurante2.png', '/Restaurante1.png', '/Restaurante3.png', '/Restaurante4.png']
      },
      contacto: {
        title: 'Información de contacto',
        phone: '+58 424 123 45 67',
        email: 'Instagram: @danielsfood',
        address: 'Av. Lorem Ipsum, Calle Gran Roble',
        hours: 'Lunes a domingo - 9:00 a 22:00'
      }
    }
  },
  'world-burger': {
    name: 'World Burger',
    logo: '/restaurant-logos/world-burger.png',
    hero: '/Restaurante3.png',
    description: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam.',
    sections: {
      origen: {
        title: 'Origen',
        content: 'Lorem Ipsum dolor sit amet consectetur. Nunc integer est ridiculus arcu sit adipisicing tempor sed diam. Morbi faucibus duis sed mus diam amet egestas.'
      },
      espacios: {
        title: 'Espacios',
        images: ['/Restaurante3.png', '/Restaurante1.png', '/Restaurante2.png', '/Restaurante4.png']
      },
      contacto: {
        title: 'Información de contacto',
        phone: '+58 424 123 45 67',
        email: 'Instagram: @worldburger',
        address: 'Av. Lorem Ipsum, Calle Principal',
        hours: 'Martes a domingo - 11:00 a 23:00'
      }
    }
  }
};

export default function RestaurantDetail({ slug }: RestaurantDetailProps) {
  const router = useRouter();
  const restaurant = restaurantData[slug] || restaurantData['origen'];

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
      {/* Hero Image with Logo */}
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
          <Image
            src={restaurant.logo}
            alt={`${restaurant.name} logo`}
            width={120}
            height={120}
            className={styles.heroLogo}
          />
        </div>
      </section>

    

      {/* Content Container */}
      <div className={styles.contentWrapper}>
        {/* Origen Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{restaurant.sections.origen.title}</h2>
          <p className={styles.sectionContent}>
            {restaurant.sections.origen.content}
          </p>
        </section>

        {/* Espacios Section */}
      </div>
      
      <section className={styles.espaciosSection}>
        <div className={styles.espaciosWrapper}>
          <SectionTitle title={restaurant.sections.espacios.title} />
        </div>
        <div className={styles.carouselContainer}>
          <Swiper
            modules={[Autoplay]}
            slidesPerView={1.2}
            spaceBetween={20}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            centeredSlides={true}
            breakpoints={{
              640: {
                slidesPerView: 1.5,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 2.5,
                spaceBetween: 30,
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            }}
            className={styles.swiper}
          >
              {restaurant.sections.espacios.images.map((img: string, idx: number) => (
                <SwiperSlide key={idx}>
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
      
      {/* Información de Contacto Section */}
      
      <section className={styles.contactSection}>
        <div className={styles.contactWrapper}>
          <h2 className={styles.contactTitle}>{restaurant.sections.contacto.title}</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <FaPhone className={styles.contactIcon} />
              <div>
                <p className={styles.contactLabel}>Reservas</p>
                <p className={styles.contactText}>{restaurant.sections.contacto.phone}</p>
              </div>
            </div>
            <div className={styles.contactItem}>
              <FaMapMarkerAlt className={styles.contactIcon} />
              <div>
                <p className={styles.contactLabel}>Av. Lorem Ipsum, Calle</p>
                <p className={styles.contactText}>{restaurant.sections.contacto.address}</p>
              </div>
            </div>
            <div className={styles.contactItem}>
              <FaEnvelope className={styles.contactIcon} />
              <div>
                <p className={styles.contactLabel}>Contacto</p>
                <p className={styles.contactText}>{restaurant.sections.contacto.email}</p>
              </div>
            </div>
            <div className={styles.contactItem}>
              <FaClock className={styles.contactIcon} />
              <div>
                <p className={styles.contactLabel}>Horarios</p>
                <p className={styles.contactText}>{restaurant.sections.contacto.hours}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
