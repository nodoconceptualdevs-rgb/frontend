"use client";
import React, { useState, useEffect } from "react";
import styles from "./ServiciosSelector.module.css";
import Image from "next/image";
import { ArrowRightOutlined } from "@ant-design/icons";
import { getServicios } from "@/services/landing";
import { getStrapiMediaUrl } from "@/lib/strapi";
import { fixCloudinaryURL } from "@/lib/cloudinary";
import type { ServicioItem as BaseServicioItem } from "@/types/landing";

// Extendemos la interfaz para permitir valores nulos
interface ServicioItem extends Omit<BaseServicioItem, 'icon' | 'image'> {
  icon: string | null;
  image: string | null;
}

// Función auxiliar para procesar URLs de imágenes sin fallback
function processImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;
  
  // Si es URL de Cloudinary, usar fixCloudinaryURL directamente
  if (url.includes('cloudinary')) {
    return fixCloudinaryURL(url);
  }
  
  // Para URLs locales o relativas, usar getStrapiMediaUrl sin fallback
  return getStrapiMediaUrl(url, ''); // String vacío en lugar de fallback
}

function ServiciosSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 72,
              background: "linear-gradient(110deg, #f0f0f0 8%, #fafafa 18%, #f0f0f0 33%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
              borderRadius: 12,
              marginBottom: 8,
            }}
          />
        ))}
      </div>
      <div className={styles.right}>
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 300,
            background: "linear-gradient(110deg, #e8e8e8 8%, #f5f5f5 18%, #e8e8e8 33%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s linear infinite",
            borderRadius: 16,
          }}
        />
      </div>
      <style>{`@keyframes shimmer { to { background-position-x: -200%; } }`}</style>
    </div>
  );
}

export default function ServiciosSelector() {
  const [servicios, setServicios] = useState<ServicioItem[]>([]);
  const [selected, setSelected] = useState<ServicioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchServicios() {
      try {
        const data = await getServicios();
        if (cancelled) return;

        const parsed: ServicioItem[] = [];
        
        if (data) {
          // Convertimos a Record<string, any> para acceso dinámico
          const raw = data as unknown as Record<string, any>;
          
          const tituloKeys = ["titulo1", "titulo2", "titulo3", "Titulo4"];
          for (let i = 1; i <= 4; i++) {
            const titulo = raw[tituloKeys[i - 1]] as string | undefined;
            const icono = raw[`icono${i}`] as { url?: string } | null;
            const imagen = raw[`imagen${i}`] as { url?: string } | null;

            if (titulo) {
              // Procesar URLs de iconos e imágenes
              const iconUrl = icono?.url ? processImageUrl(icono.url) : null;
              const imageUrl = imagen?.url ? processImageUrl(imagen.url) : null;
              
              parsed.push({
                key: `servicio-${i}`,
                label: titulo,
                icon: iconUrl,
                image: imageUrl,
              });
            }
          }
        }

        // Usar solo datos reales, no fallback cuando no hay datos
        setServicios(parsed);
        if (parsed.length > 0) {
          setSelected(parsed[0]);
        }
      } catch (error) {
        console.error("Error cargando servicios:", error);
        // No usar fallback en caso de error, mostrar estado vacío
        setServicios([]);
        setSelected(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchServicios();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (servicios.length === 0 || !selected) return;
    const interval = setInterval(() => {
      setSelected((prev) => {
        if (!prev) return servicios[0];
        const idx = servicios.findIndex((s) => s.key === prev.key);
        return servicios[(idx + 1) % servicios.length];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [servicios, selected]);

  if (loading) return <ServiciosSkeleton />;
  
  // Mostrar mensaje cuando no hay servicios disponibles
  if (servicios.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>
            No hay servicios disponibles
          </h3>
          <p className={styles.emptyStateText}>
            En este momento no hay servicios para mostrar. Próximamente agregaremos más información.
          </p>
        </div>
      </div>
    );
  }
  
  if (!selected) return null;

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        {servicios.map((servicio) => (
          <button
            key={servicio.key}
            className={
              styles.servicioBtn +
              (selected?.key === servicio.key ? " " + styles.dark : "")
            }
            onClick={() => setSelected(servicio)}
            type="button"
          >
            <span className={styles.iconBox}>
              {servicio.icon ? (
                <img
                  src={servicio.icon}
                  alt={servicio.label}
                  width={48}
                  height={48}
                  className={styles.icon}
                />
              ) : (
                <div className={styles.iconPlaceholder}>
                  📊
                </div>
              )}
            </span>
            <span className={styles.label}>{servicio.label}</span>
            <ArrowRightOutlined className={styles.arrow} />
          </button>
        ))}
      </div>
      <div className={styles.right}>
        <div className={styles.mainImageWrapper}>
          {selected.image ? (
            <img
              src={selected.image}
              alt={selected.label}
              className={styles.mainImage}
              style={{ 
                position: 'absolute',
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <div className={styles.placeholderContent}>
                <div className={styles.placeholderIcon}>🎨</div>
                <div className={styles.placeholderText}>Imagen no disponible</div>
              </div>
            </div>
          )}
          <div className={styles.ctaBox}>
            <div className={styles.ctaText}>
              ¿Te gustaría iniciar tu proyecto con nosotros?
            </div>
            <button className={styles.ctaBtn} type="button">
              Contacta con nuestros profesionales
              <span className={styles.ctaBtnIcon}>
                <ArrowRightOutlined />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
