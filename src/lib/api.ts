import axios from "axios";

// Determinar la URL base para la API
//https://backend-production-2ce7.up.railway.app/api
const API_URL =  "https://backend-production-2ce7.up.railway.app/api";

// Crear instancia de axios con configuración mejorada para producción
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // Aumentar timeout para producción
  withCredentials: true, // Necesario para enviar/recibir cookies
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Log para desarrollo que muestra la URL base utilizada
console.info(`🔌 API conectada a: ${API_URL}`);

// Rutas públicas que NO requieren autenticación
const PUBLIC_ROUTES = [
  '/auth/local',
  '/auth/local/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Función para obtener el token de múltiples fuentes
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 1. Intentar obtener desde localStorage (principal)
  let token = localStorage.getItem('token');
  
  // 2. Si no existe, intentar obtener de las cookies
  if (!token) {
    const tokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='));
    
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
    }
  }
  
  return token;
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
