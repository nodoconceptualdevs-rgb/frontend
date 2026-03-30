"use client";
import { useState } from "react";
import styles from "../landing/RenderCarousel.module.css";

function ImageSlider({ images, title }: { images: string[]; title: string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        color: '#999',
        fontSize: '14px'
      }}>
        Sin imágenes disponibles
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: '12px' }}>
      <img 
        src={images[currentImageIndex]} 
        alt={`${title} - Imagen ${currentImageIndex + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '12px',
          transition: 'opacity 0.3s ease'
        }}
      />
      
      {images.length > 1 && (
        <>
          {/* Botones de navegación */}
          <button
            onClick={prevImage}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Imagen anterior"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextImage}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Siguiente imagen"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Indicadores */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '20px',
            backdropFilter: 'blur(8px)'
          }}>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: index === currentImageIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Contador */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '500',
            backdropFilter: 'blur(8px)'
          }}>
            {currentImageIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

export interface Project3DCardProps {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  cta?: string;
  icon?: string;
  images: string[]; // Array de imágenes en lugar de model string
  tipoArchivo?: 'imagen' | 'none';
  bgGray?: boolean;
  flip?: boolean;
  proyecto?: any;
}

export default function Project3DCard({
  title,
  subtitle,
  description,
  images,
  tipoArchivo = 'imagen',
  bgGray = false,
  flip = false,
}: Project3DCardProps) {
  
  const getButtonText = () => {
    switch (tipoArchivo) {
      case 'imagen':
        if (images.length === 1) {
          return '📸 1 imagen';
        } else {
          return `📸 Galería (${images.length} imágenes)`;
        }
      case 'none':
        return '📋 Ver detalles';
      default:
        return '📸 1 imagen';
    }
  };

  const renderMedia = () => {
    switch (tipoArchivo) {
      case 'imagen':
        return <ImageSlider images={images} title={title} />;
      case 'none':
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '12px',
            color: '#999',
            fontSize: '14px'
          }}>
            Sin imágenes disponibles
          </div>
        );
      default:
        return <ImageSlider images={images} title={title} />;
    }
  };
  return (
    <div
      className={styles.carouselContainer}
      style={
        bgGray
          ? {
              background: "#EFEFEF",
              borderRadius: 24,
              border: "1px solid #E0E0E0",
              paddingBottom: 60,
            }
          : undefined
      }
    >
      {flip ? (
        <>
          <div className={styles.rightText}>
            <div className={styles.subtitle}>{subtitle}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
          </div>
          <div className={styles.left3d}>
            {tipoArchivo !== 'none' && (
              <button className={styles.btn360} type="button">
                <span className={styles.icon360}>{getButtonText().split(' ')[0]}</span> {getButtonText().split(' ').slice(1).join(' ')}
              </button>
            )}
            <div className={styles.threeWrapper}>
              {renderMedia()}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.left3d}>
            {tipoArchivo !== 'none' && (
              <button className={styles.btn360} type="button">
                <span className={styles.icon360}>{getButtonText().split(' ')[0]}</span> {getButtonText().split(' ').slice(1).join(' ')}
              </button>
            )}
            <div className={styles.threeWrapper}>
              {renderMedia()}
            </div>
          </div>
          <div className={styles.rightText}>
            <div className={styles.subtitle}>{subtitle}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
          </div>
        </>
      )}
    </div>
  );
}
