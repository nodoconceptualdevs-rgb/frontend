import axios from "axios";

// Determinar la URL base para la API
// Usar variable de entorno o fallback a la URL de producción
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-2ce7.up.railway.app/api";

// Log para desarrollo que muestra la URL base utilizada
console.info(`🔌 API conectada a: ${API_URL}`);

// Crear instancia de axios con configuración mejorada para producción
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // Aumentar timeout para producción
  withCredentials: false, // Desactivado para permitir peticiones cross-domain
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});


// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = [
  '/auth/local',
  '/auth/local/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Variable en memoria para almacenar el token
let inMemoryToken: string | null = null;

/**
 * Función para establecer el token JWT en memoria
 * Se usa para actualizar el token desde el AuthContext
 */
export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

/**
 * Función para obtener el token JWT
 * Estrategia en capas: primero memoria, luego localStorage
 */
export function getAuthToken(): string | null {
  // 1. Si estamos en el servidor, no hay token
  if (typeof window === 'undefined') return null;
  
  // 2. Si tenemos token en memoria, usarlo (más rápido y seguro)
  if (inMemoryToken) return inMemoryToken;
  
  // 3. Intentar recuperar desde localStorage como respaldo
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Actualizar token en memoria para futuras peticiones
      inMemoryToken = token;
      return token;
    }
  } catch (e) {
    console.warn('Error accediendo a localStorage:', e);
  }
  
  return null;
}

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    // Verificar si la ruta es pública
    const isPublicRoute = PUBLIC_ROUTES.some(route => config.url?.includes(route));
    
    // Obtener token usando la función robusta
    const token = getAuthToken();
    
    // Agregar token a los headers si existe
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      // En desarrollo, log de verificación
      if (process.env.NODE_ENV === 'development') {
        console.info('🔑 Autorizando petición con token JWT');
      }
    } else if (!isPublicRoute) {
      // Solo mostrar warning si NO es una ruta pública
      console.warn('⚠️ No hay token JWT disponible para:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('❌ Error 403: Acceso denegado');
      console.error('URL:', error.config?.url);
      console.error('Headers:', error.config?.headers);
      console.error('Verifica que el token JWT esté presente y sea válido');
    }
    return Promise.reject(error);
  }
);

export default api;
