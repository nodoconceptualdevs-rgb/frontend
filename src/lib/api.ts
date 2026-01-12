import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
