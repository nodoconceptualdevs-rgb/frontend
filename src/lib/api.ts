import axios from "axios";

// Determinar la URL base para la API
const API_URL =  "https://backend-production-2ce7.up.railway.app/api";

// Crear instancia de axios con configuración mejorada para producción
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // Aumentar timeout para producción
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

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    // Verificar si la ruta es pública
    const isPublicRoute = PUBLIC_ROUTES.some(route => config.url?.includes(route));
    
    // Obtener token del localStorage (guardado como 'token')
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
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
