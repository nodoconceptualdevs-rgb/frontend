"use client";

import React, { useState } from "react";

interface Archivo {
  url: string;
  nombre: string;
}

interface ContenidoMultimedia {
  id: number;
  titulo_seccion: string;
  tipo_contenido: string;
  descripcion?: string;
  archivos?: Archivo[];
}

interface MultimediaGalleryProps {
  contenido: ContenidoMultimedia;
}

export default function MultimediaGallery({ contenido }: MultimediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (contenido.archivos) {
      setCurrentImageIndex((currentImageIndex + 1) % contenido.archivos.length);
    }
  };

  const prevImage = () => {
    if (contenido.archivos) {
      setCurrentImageIndex(
        (currentImageIndex - 1 + contenido.archivos.length) % contenido.archivos.length
      );
    }
  };

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case "Galería Fotos":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "Video":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case "Documento":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {getIconForType(contenido.tipo_contenido)}
        {contenido.titulo_seccion}
      </h4>

      {contenido.descripcion && (
        <p className="text-sm text-gray-600 mb-4">{contenido.descripcion}</p>
      )}

      {/* Galería de Fotos */}
      {contenido.tipo_contenido === "Galería Fotos" && contenido.archivos && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {contenido.archivos.map((archivo, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-90 transition group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                <span className="text-white text-xs font-medium truncate">
                  {archivo.nombre}
                </span>
              </div>
              {/* Placeholder - En producción sería una imagen real */}
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lista de Documentos */}
      {contenido.tipo_contenido === "Documento" && contenido.archivos && (
        <div className="space-y-2">
          {contenido.archivos.map((archivo, index) => (
            <a
              key={index}
              href={archivo.url}
              download
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition group"
            >
              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{archivo.nombre}</p>
                <p className="text-xs text-gray-500">Click para descargar</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Video */}
      {contenido.tipo_contenido === "Video" && contenido.archivos && contenido.archivos[0] && (
        <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <svg className="w-16 h-16 mx-auto mb-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <p className="text-sm">{contenido.archivos[0].nombre}</p>
            <p className="text-xs text-gray-400 mt-1">Video placeholder</p>
          </div>
        </div>
      )}

      {/* Lightbox para imágenes */}
      {lightboxOpen && contenido.archivos && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={closeLightbox}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 aspect-video rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl font-semibold">{contenido.archivos[currentImageIndex].nombre}</p>
                <p className="text-sm text-gray-400 mt-2">Imagen {currentImageIndex + 1} de {contenido.archivos.length}</p>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
