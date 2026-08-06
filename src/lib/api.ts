import axios from "axios";

import Cookies from "js-cookie";

// Determinar la URL base para la API

// Usar variable de entorno o fallback a localhost para desarrollo

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-production-2ce7.up.railway.app/api";

// Crear instancia de axios con configuración mejorada para producción

const api = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 5 minutos para soportar uploads grandes a Bytescale
  withCredentials: false, // Desactivado para evitar problemas CORS en producción
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Log para desarrollo que muestra la URL base utilizada

console.info(`🔌 API conectada a: ${API_URL}`);

// Rutas públicas que NO requieren autenticación

const PUBLIC_ROUTES = [
  "/auth/local",

  "/auth/local/register",

  "/auth/forgot-password",

  "/auth/reset-password",

  "/email-auth/forgot-password",

  "/email-auth/reset-password",

  "/email-auth/send-confirmation",

  "/email-auth/confirm-email",

  // No usa el JWT de sesión para autorizar (recibe su propio "jwt" en el body
  // y puede responder 401 por motivos ajenos a la sesión actual del usuario)
  "/proyectos/auth-nfc",
];

// Función para obtener el token de múltiples fuentes

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Intentar obtener desde localStorage (principal)

  let token = localStorage.getItem("token");

  // 2. Si no existe en localStorage, intentar obtener de cookies

  if (!token) {
    token = Cookies.get("token") || null;
  }

  return token;
}

// Interceptor para agregar el token JWT a todas las peticiones

api.interceptors.request.use(
  (config) => {
    // Verificar si la ruta es pública

    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      config.url?.includes(route),
    );

    // Obtener token usando la función robusta

    const token = getAuthToken();

    // Agregar token a los headers si existe

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicRoute) {
      // Solo mostrar warning si NO es una ruta pública

      console.warn("⚠️ No hay token JWT disponible para:", config.url);
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores de autenticación

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        error.config?.url?.includes(route),
      );

      // Solo se trata como expiración de sesión si la ruta requiere el JWT
      // de sesión (evita loguear afuera al usuario por 401 de rutas ajenas
      // a su token, como auth-nfc).
      if (!isPublicRoute && typeof window !== "undefined") {
        const hadToken = getAuthToken();
        if (hadToken) {
          console.warn(
            "⚠️ Error 401: Token inválido o expirado - cerrando sesión",
          );

          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("userId");
          localStorage.removeItem("role");
          localStorage.removeItem("name");

          Cookies.remove("token");
          Cookies.remove("userId");
          Cookies.remove("role");

          // Notificar a la app (AuthContext) para limpiar el estado en
          // memoria y redirigir a /login, ya que este módulo no tiene
          // acceso al router ni al contexto de React.
          window.dispatchEvent(new Event("auth:session-expired"));
        }
      }
    }

    if (error.response?.status === 403) {
      console.error("❌ Error 403: Acceso denegado");

      console.error("URL:", error.config?.url);

      console.error("Headers:", error.config?.headers);

      console.error("Verifica que el token JWT esté presente y sea válido");
    }

    return Promise.reject(error);
  },
);

export default api;
