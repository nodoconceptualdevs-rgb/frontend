"use client";
import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import styles from "../landing/RenderCarousel.module.css";

function HouseModel({ model }: { model: string }) {
  const { scene } = useGLTF(model);
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });
  return <primitive ref={ref} object={scene} scale={1.2} />;
}

function ImageViewer({ src, alt }: { src: string; alt: string }) {
  return (
    <img 
      src={src} 
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '12px'
      }}
    />
  );
}

function VideoViewer({ src }: { src: string }) {
  return (
    <video
      src={src}
      controls
      autoPlay
      muted
      loop
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '12px'
      }}
    />
  );
}

function CADViewer({ src }: { src: string }) {
  // Para archivos CAD, mostramos un preview con opción de descarga
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      border: '2px dashed #d0d0d0'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📐</div>
      <p style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#666' }}>
        Archivo CAD<br />
        <small>No se puede previsualizar</small>
      </p>
      <a 
        href={src} 
        download
        style={{
          padding: '8px 16px',
          backgroundColor: '#1890ff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        Descargar archivo
      </a>
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
  model: string | null;
  tipoArchivo?: '3d' | 'imagen' | 'video' | 'cad' | 'none';
  bgGray?: boolean;
  flip?: boolean;
  proyecto?: any;
}

export default function Project3DCard({
  title,
  subtitle,
  description,
  model,
  tipoArchivo = '3d',
  bgGray = false,
  flip = false,
}: Project3DCardProps) {
  
  const getButtonText = () => {
    switch (tipoArchivo) {
      case 'imagen':
        return '🖼️ Ver Imagen';
      case 'video':
        return '🎥 Ver Video';
      case 'cad':
        return '📐 Ver CAD';
      case 'none':
        return '📋 Ver detalles';
      case '3d':
      default:
        return '⟳ Modelo 3D';
    }
  };

  const renderMedia = () => {
    switch (tipoArchivo) {
      case 'imagen':
        return model ? <ImageViewer src={model} alt={title} /> : null;
      case 'video':
        return model ? <VideoViewer src={model} /> : null;
      case 'cad':
        return model ? <CADViewer src={model} /> : null;
      case 'none':
        // No mostrar nada cuando no hay render
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
            Sin render disponible
          </div>
        );
      case '3d':
      default:
        // Solo renderizar Canvas si hay un modelo válido
        if (!model) {
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
              Modelo 3D no disponible
            </div>
          );
        }
        return (
          <Canvas
            camera={{ position: [2, 2, 4], fov: 40 }}
            style={{ background: "#fff" }}
          >
            <ambientLight intensity={0.7} />
            <Stage environment={null} intensity={0.8}>
              <HouseModel model={model} />
            </Stage>
            <OrbitControls enablePan={false} enableZoom={false} />
          </Canvas>
        );
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
