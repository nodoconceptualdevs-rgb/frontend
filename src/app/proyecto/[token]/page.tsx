"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CommentSection from "@/components/proyecto/CommentSection";
import api from "@/lib/api";
import { alerts } from "@/lib/alerts";
import { Toaster } from "react-hot-toast";
import {
  optimizeCloudinaryImage,
  isCloudinaryURL,
  fixCloudinaryURL
} from "@/lib/cloudinary";
import { determinarTipoDesdeURL, TipoArchivo } from "@/lib/fileUtils";
import LoginModal from "./login";

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

/** Formatos permitidos para subir archivos en hitos */
export const FORMATOS_PERMITIDOS = {
  imagen: {
    extensiones: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    descripcion: 'Imágenes (JPG, PNG, GIF, WebP, SVG)',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  video: {
    extensiones: ['.mp4', '.webm', '.mov'],
    descripcion: 'Videos (MP4, WebM, MOV)',
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  documento: {
    extensiones: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    descripcion: 'Documentos (PDF, Word, Excel)',
    maxSize: 25 * 1024 * 1024, // 25MB
  },
  modelo3d: {
    extensiones: ['.glb', '.gltf'],
    descripcion: 'Modelos 3D (GLB, GLTF)',
    maxSize: 50 * 1024 * 1024, // 50MB
  },
};


export default function ProyectoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proyecto, setProyecto] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  useEffect(() => {
    const loadProyecto = async () => {
      try {
        setLoading(true);
        
        const token = params.token as string;
        console.log('🔑 Validando token NFC:', token);
        
        // Preparar payload con JWT si está disponible
        const payload: any = { token };
        
        // Intentar obtener JWT del localStorage si existe una sesión activa
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          payload.jwt = storedToken;
          console.log('🔐 JWT encontrado en localStorage, enviando con la petición');
        }
        
        // Llamar al endpoint de autenticación NFC del backend (POST)
        const response = await api.post<any>('/proyectos/auth-nfc', payload);
        
        console.log('✅ Respuesta del backend:', response.data);
        
        // Verificar si el proyecto requiere autenticación
        if (response.data && response.data.requiresAuth) {
          console.log('🔒 El proyecto requiere autenticación');
          setRequiresAuth(true);
          setLoading(false);
          return;
        }
        
        if (response.data && response.data.data) {
          const proyectoData = response.data.data;
          
          // Transformar datos del backend al formato esperado por los componentes
          const proyectoFormateado = {
            id: proyectoData.id,
            nombre_proyecto: proyectoData.nombre_proyecto,
            cliente_nombre: proyectoData.cliente?.username || proyectoData.cliente?.email || "Cliente",
            ultimo_avance: proyectoData.ultimo_avance || "Proyecto en desarrollo",
            estado_general: proyectoData.estado_general,
            fecha_inicio: proyectoData.fecha_inicio,
            gerente_asignado: {
              nombre: proyectoData.gerente_proyecto?.username || proyectoData.gerente_proyecto?.email || "Gerente",
              email: proyectoData.gerente_proyecto?.email || "No disponible",
              telefono: proyectoData.gerente_proyecto?.telefono || "No disponible",
            },
            hitos: proyectoData.hitos || [],
            comentarios: proyectoData.comentarios || [],
          };
          
          setProyecto(proyectoFormateado);
        } else {
          setError("Token de acceso inválido. Verifica tu código NFC.");
        }
      } catch (err: any) {
        console.error('❌ Error al validar token:', err);
        
        if (err.response?.status === 404 || err.response?.status === 403) {
          setError("Token de acceso inválido o expirado. Por favor, verifica tu código NFC.");
        } else {
          setError("Error al cargar el proyecto. Intenta nuevamente más tarde.");
        }
        
        alerts.error("No se pudo acceder al proyecto");
      } finally {
        setLoading(false);
      }
    };

    loadProyecto();
  }, [params.token]);

  // Función para manejar autenticación exitosa
  const handleAuthSuccess = async (jwt: string) => {
    console.log('✅ Autenticación exitosa, recargando proyecto con JWT');
    setJwtToken(jwt);
    
    try {
      setLoading(true);
      
      const token = params.token as string;
      console.log('🔑 Validando token NFC con JWT:', token);
      
      // Llamar al endpoint de autenticación NFC del backend con JWT
      const response = await api.post<any>('/proyectos/auth-nfc', { 
        token,
        jwt 
      });
      
      console.log('✅ Respuesta del backend post-auth:', response.data);
      
      if (response.data && response.data.data) {
        const proyectoData = response.data.data;
        
        // Transformar datos del backend al formato esperado
        const proyectoFormateado = {
          id: proyectoData.id,
          nombre_proyecto: proyectoData.nombre_proyecto,
          cliente_nombre: proyectoData.cliente?.username || proyectoData.cliente?.email || "Cliente",
          ultimo_avance: proyectoData.ultimo_avance || "Proyecto en desarrollo",
          estado_general: proyectoData.estado_general,
          fecha_inicio: proyectoData.fecha_inicio,
          gerente_asignado: {
            nombre: proyectoData.gerente_proyecto?.username || proyectoData.gerente_proyecto?.email || "Gerente",
            email: proyectoData.gerente_proyecto?.email || "No disponible",
            telefono: proyectoData.gerente_proyecto?.telefono || "No disponible",
          },
          hitos: proyectoData.hitos || [],
          comentarios: proyectoData.comentarios || [],
        };
        
        setProyecto(proyectoFormateado);
        setRequiresAuth(false);
      } else {
        setError("No se pudo obtener la información del proyecto.");
      }
    } catch (err: any) {
      console.error('❌ Error post-autenticación:', err);
      setError("Error al cargar el proyecto después de autenticación.");
      alerts.error("No se pudo acceder al proyecto");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando tu proyecto...</p>
        </div>
      </div>
    );
  }

  // Mostrar login modal si el proyecto requiere autenticación
  if (requiresAuth && !jwtToken) {
    return (
      <LoginModal 
        tokenNfc={params.token as string} 
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (error || !proyecto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "No se pudo cargar el proyecto."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster />
      
      {/* Header Moderno */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {proyecto.nombre_proyecto}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(proyecto.fecha_inicio).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  proyecto.estado_general === 'Completado' ? 'bg-green-100 text-green-800' :
                  proyecto.estado_general === 'En Ejecución' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {proyecto.estado_general}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Gerente de Proyecto</p>
              <p className="font-semibold text-gray-900">{proyecto.gerente_asignado.nombre}</p>
              <p className="text-sm text-gray-600">{proyecto.gerente_asignado.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Progreso General */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Progreso del Proyecto
            </h2>
            <div className="space-y-4">
              {proyecto.hitos && proyecto.hitos.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {proyecto.hitos.filter((h: any) => h.estado_completado).length} de {proyecto.hitos.length} hitos completados
                    </span>
                    <span className="font-semibold text-red-600">
                      {Math.round((proyecto.hitos.filter((h: any) => h.estado_completado).length / proyecto.hitos.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(proyecto.hitos.filter((h: any) => h.estado_completado).length / proyecto.hitos.length) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Aún no hay hitos registrados</p>
              )}
            </div>
          </div>
        </section>

        {/* Hitos del Proyecto */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-white">
              Avances del Proyecto
            </h2>
          </div>
          <div className="space-y-4">
            {proyecto.hitos && proyecto.hitos.length > 0 ? (
              proyecto.hitos
                .sort((a: any, b: any) => a.orden - b.orden)
                .map((hito: any, index: number) => (
                  <HitoCard key={hito.id} hito={hito} index={index} />
                ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500">No hay hitos registrados aún</p>
              </div>
            )}
          </div>
        </section>

        {/* Sección de Comentarios */}
        <section>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Comentarios y Consultas
            </h2>
            <CommentSection
              proyectoId={proyecto.id}
              comentarios={proyecto.comentarios}
              gerenteInfo={proyecto.gerente_asignado}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Nodo Conceptual. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Extrae la URL de un objeto de archivo de Strapi
 */
function extraerURL(archivo: any): string | null {
  if (!archivo) return null;
  if (typeof archivo === 'string') return archivo;
  if (archivo.url) return archivo.url;
  if (archivo.data?.url) return archivo.data.url;
  if (archivo.data?.attributes?.url) return archivo.data.attributes.url;
  if (archivo.attributes?.url) return archivo.attributes.url;
  return null;
}

/**
 * Obtiene la URL corregida de Cloudinary
 */
function obtenerURLCorregida(archivo: any): string | null {
  const url = extraerURL(archivo);
  if (!url) return null;
  return fixCloudinaryURL(url);
}

/**
 * Obtiene la URL de descarga directa de Cloudinary
 */
function getCloudinaryDownloadUrl(url: string, filename: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Si ya tiene fl_attachment, devolverla
  if (url.includes('fl_attachment')) return url;
  
  // Agregar fl_attachment para forzar descarga
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${parts[0]}/upload/fl_attachment:${cleanFilename}/${parts[1]}`;
  }
  
  return url;
}

/**
 * Descarga un archivo - usa URL directa para Cloudinary
 */
async function descargarArchivo(url: string, nombreArchivo: string) {
  try {
    // Para Cloudinary, usar URL de descarga directa
    const downloadUrl = getCloudinaryDownloadUrl(url, nombreArchivo);
    
    // Crear link y forzar descarga
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = nombreArchivo;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error descargando archivo:', error);
    // Fallback: abrir en nueva pestaña
    window.open(url, '_blank');
  }
}

// ============================================================================
// COMPONENTES DE PREVISUALIZACIÓN
// ============================================================================

/**
 * Visor de Imagen con zoom
 */
function VisorImagen({ url, nombre }: { url: string; nombre: string }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const urlOptimizada = isCloudinaryURL(url)
    ? optimizeCloudinaryImage(url, { width: 800, height: 600, crop: 'fit' })
    : url;

  if (error) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-gray-500">Error al cargar imagen</span>
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => setModalOpen(true)}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}
        <img
          src={urlOptimizada}
          alt={nombre}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
            onClick={() => setModalOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={url}
            alt={nombre}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

/**
 * Visor de PDF - Muestra preview y botones de descarga/ver
 * Los PDFs de Cloudinary se sirven desde /image/upload/
 */
function VisorPDF({ url, nombre }: { url: string; nombre: string }) {
  const [previewError, setPreviewError] = useState(false);

  // Asegurar que la URL tenga el formato correcto
  const pdfUrl = fixCloudinaryURL(url);
  
  // Para preview: convertir el PDF a imagen JPG (primera página)
  // Cloudinary permite cambiar la extensión para convertir formatos
  const previewUrl = pdfUrl.replace(/\.pdf$/i, '.jpg');

  // Debug: mostrar URLs en consola
  console.log('📄 PDF URL original:', url);
  console.log('📄 PDF URL para abrir:', pdfUrl);
  console.log('📄 Preview URL:', previewUrl);

  // Función para abrir el PDF en nueva pestaña
  const handleOpenPDF = () => {
    console.log('🔗 Abriendo PDF:', pdfUrl);
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // Función para descargar el PDF
  const handleDownloadPDF = async () => {
    try {
      console.log('⬇️ Descargando PDF:', pdfUrl);
      
      // Usar fetch para descargar el archivo
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Error al descargar');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nombre.endsWith('.pdf') ? nombre : `${nombre}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      console.log('✅ Descarga completada');
    } catch (error) {
      console.error('❌ Error descargando:', error);
      // Fallback: abrir en nueva pestaña
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 flex items-center gap-3 border-b">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v4H8.5v-4zm2.5 0h1.5v4H11v-4zm2.5 0H15v4h-1.5v-4z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{nombre}</p>
          <p className="text-xs text-gray-500">Documento PDF</p>
        </div>
      </div>

      {/* Preview de la primera página del PDF como imagen */}
      <div className="relative bg-gray-100 p-4">
        <div className="flex justify-center">
          {!previewError ? (
            <img
              src={previewUrl}
              alt={`Vista previa de ${nombre}`}
              className="max-h-[400px] w-auto rounded-lg shadow-md object-contain cursor-pointer hover:opacity-90 transition"
              onError={() => setPreviewError(true)}
              onClick={handleOpenPDF}
              title="Click para abrir el PDF"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-24 h-24 text-red-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v4H8.5v-4zm2.5 0h1.5v4H11v-4zm2.5 0H15v4h-1.5v-4z"/>
              </svg>
              <p className="text-gray-500 text-sm">Vista previa no disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-4 bg-gray-50 border-t flex gap-3 justify-center flex-wrap">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar PDF
        </button>
        <button
          onClick={handleOpenPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Abrir en nueva pestaña
        </button>
      </div>
    </div>
  );
}

/**
 * Reproductor de Video
 */
function VisorVideo({ url, nombre }: { url: string; nombre: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400 mb-4">Error al cargar el video</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
        >
          Abrir video en nueva pestaña
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-black">
      <video
        src={url}
        controls
        className="w-full aspect-video"
        preload="metadata"
        onError={() => setError(true)}
      >
        <source src={url} type="video/mp4" />
        Tu navegador no soporta la reproducción de videos.
      </video>
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
        <span className="text-white text-sm truncate max-w-[200px]">{nombre}</span>
        <button
          onClick={() => descargarArchivo(url, nombre)}
          className="p-1.5 text-gray-400 hover:text-white transition"
          title="Descargar video"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Visor de Modelo 3D usando model-viewer
 */
function VisorModelo3D({ url, nombre }: { url: string; nombre: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Cargar el script de model-viewer si no está cargado
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-gray-900">
      {/* @ts-ignore - model-viewer es un web component */}
      <model-viewer
        src={url}
        alt={nombre}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{ width: '100%', height: '400px', backgroundColor: '#1a1a2e' }}
      />
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <span className="text-white text-sm truncate max-w-[200px]">{nombre}</span>
        </div>
        <button
          onClick={() => descargarArchivo(url, nombre)}
          className="p-1.5 text-gray-400 hover:text-white transition"
          title="Descargar modelo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Visor genérico de documento (Word, Excel, etc.)
 */
function VisorDocumento({ url, nombre, tipo }: { url: string; nombre: string; tipo: string }) {
  const iconos: Record<string, React.ReactNode> = {
    doc: <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9 13h6v2H9v-2zm0 4h6v2H9v-2z"/></svg>,
    xls: <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2v2H8v-2zm0 4h2v2H8v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z"/></svg>,
    default: <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  };

  const extension = nombre.split('.').pop()?.toLowerCase() || '';
  const icono = iconos[extension] || iconos.default;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center gap-4">
      {icono}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{nombre}</p>
        <p className="text-sm text-gray-500">{tipo.toUpperCase()}</p>
      </div>
      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Abrir
        </a>
        <button
          onClick={() => descargarArchivo(url, nombre)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          Descargar
        </button>
      </div>
    </div>
  );
}

// Componente para mostrar cada hito con su contenido
function HitoCard({ hito, index }: { hito: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`rounded-xl shadow-md overflow-hidden transition-all ${
      hito.estado_completado 
        ? 'bg-white border-2 border-green-300' 
        : 'bg-yellow-50 border-2 border-yellow-300'
    }`}>
      {/* Header del Hito */}
      <div
        className={`p-6 cursor-pointer transition ${
          hito.estado_completado ? 'hover:bg-gray-50' : 'hover:bg-yellow-100'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Ícono de estado */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            hito.estado_completado ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-800'
          }`}>
            {hito.estado_completado ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="font-bold text-lg">{index + 1}</span>
            )}
          </div>
          
          {/* Info del hito */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">{hito.nombre}</h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {hito.estado_completado && hito.fecha_actualizacion && (
              <p className="text-sm text-green-700">
                ✅ Completado el {new Date(hito.fecha_actualizacion).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            {!hito.estado_completado && (
              <p className="text-sm text-gray-500">⌛ En proceso</p>
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandible */}
      {expanded && hito.contenido && (
        <div className={`border-t p-6 ${
          hito.estado_completado 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          
          {/* Descripción del avance */}
          {hito.contenido.descripcion_avance && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Descripción del Avance</h4>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: hito.contenido.descripcion_avance }}
              />
            </div>
          )}

          {/* Tour 360 */}
          {hito.contenido.enlace_tour_360 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Tour Virtual 360°
              </h4>
              <a
                href={hito.contenido.enlace_tour_360}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Tour Virtual
              </a>
            </div>
          )}

          {/* Galería de Fotos - Previsualización directa */}
          {hito.contenido.galeria_fotos && hito.contenido.galeria_fotos.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📸</span>
                Galería de Fotos ({hito.contenido.galeria_fotos.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hito.contenido.galeria_fotos.map((foto: any, idx: number) => {
                  const url = obtenerURLCorregida(foto);
                  if (!url) return null;
                  return (
                    <VisorImagen 
                      key={foto.id || idx} 
                      url={url} 
                      nombre={foto.name || `Foto ${idx + 1}`} 
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Videos - Reproductor embebido */}
          {hito.contenido.videos_walkthrough && hito.contenido.videos_walkthrough.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🎥</span>
                Videos ({hito.contenido.videos_walkthrough.length})
              </h4>
              <div className="space-y-4">
                {hito.contenido.videos_walkthrough.map((video: any, idx: number) => {
                  const url = obtenerURLCorregida(video);
                  if (!url) return null;
                  return (
                    <VisorVideo 
                      key={video.id || idx} 
                      url={url} 
                      nombre={video.name || `Video ${idx + 1}`} 
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Documentación - PDFs embebidos, otros con descarga */}
          {hito.contenido.documentacion && hito.contenido.documentacion.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📄</span>
                Documentos ({hito.contenido.documentacion.length})
              </h4>
              <div className="space-y-4">
                {hito.contenido.documentacion.map((doc: any, idx: number) => {
                  const url = obtenerURLCorregida(doc);
                  if (!url) return null;
                  
                  const nombre = doc.name || `Documento ${idx + 1}`;
                  const tipoArchivo = determinarTipoDesdeURL(url);
                  const extension = nombre.split('.').pop()?.toLowerCase() || '';
                  const isPDF = extension === 'pdf' || url.toLowerCase().includes('.pdf');
                  const isModelo3D = tipoArchivo === 'modelo3d' || ['.glb', '.gltf'].some(ext => url.toLowerCase().includes(ext));
                  
                  // Renderizar según el tipo
                  if (isPDF) {
                    return <VisorPDF key={doc.id || idx} url={url} nombre={nombre} />;
                  }
                  
                  if (isModelo3D) {
                    return <VisorModelo3D key={doc.id || idx} url={url} nombre={nombre} />;
                  }
                  
                  // Otros documentos (Word, Excel, etc.)
                  return (
                    <VisorDocumento 
                      key={doc.id || idx} 
                      url={url} 
                      nombre={nombre} 
                      tipo={extension}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
