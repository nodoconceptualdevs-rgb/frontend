// auth.ts - Versión 100% client-side
import api from "@/lib/api";
import { RegisterPayload, LoginPayload, AuthResponse, User } from "@/types/auth";
import Cookies from 'js-cookie';

/**
 * Registrar un nuevo usuario
 */
export async function register(data: RegisterPayload) {
  const res = await api.post("/auth/local/register", data);
  return res.data;
}

/**
 * Cerrar sesión del usuario
 * Elimina tokens del localStorage y cookies
 */
export async function logout() {
  // Limpiar cookies
  Cookies.remove('token');
  Cookies.remove('userId');
  Cookies.remove('role');
  
  // Limpiar localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('name');
  }
  
  return true;
}

/**
 * Actualizar nombre de usuario
 */
export async function updateUserName(
  userId: number,
  name: string,
  jwt: string
) {
  return api.put(
    `/users/${userId}`,
    { name },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
}

/**
 * Actualizar perfil del usuario
 */
export async function updateUserProfile(name: string) {
  // Obtener token y userId del localStorage
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (!token || !userId) {
    throw new Error("No autenticado");
  }

  const res = await api.put(
    `/users/${userId}`,
    { name },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  return res.data;
}

/**
 * Login del usuario
 * Esta función maneja la autenticación completa del usuario
 */
export async function login(data: LoginPayload): Promise<AuthResponse> {
  try {
    // 1. Hacer login en Strapi
    const res = await api.post("/auth/local", data);
    const responseData = res.data as AuthResponse;
    const token = responseData.jwt;
    
    if (!token) {
      throw new Error('No se recibió token del servidor');
    }
    
    // 2. Obtener usuario completo con rol usando el token
    const userRes = await api.get("/users/me?populate=role", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const user = userRes.data as User;
    
    // 3. Retornar JWT y usuario para que el cliente pueda manejarlos
    return {
      jwt: token,
      user: user
    };
  } catch (error) {
    // Extraer mensaje de error específico de Strapi
    const err = error as { response?: { data?: { error?: { message?: string } } } };
    const errorMessage = err?.response?.data?.error?.message || 
                        'Credenciales incorrectas. Verifica tu correo y contraseña.';
    
    // Lanzar error con mensaje específico
    const customError = new Error(errorMessage) as Error & { response?: unknown };
    customError.response = err?.response;
    throw customError;
  }
}

/**
 * Solicitar restablecimiento de contraseña
 */
export async function forgotPassword(email: string) {
  const res = await api.post("/email-auth/forgot-password", { email });
  return res.data;
}

/**
 * Restablecer contraseña con token
 */
export async function resetPassword(code: string, password: string, passwordConfirmation: string) {
  const res = await api.post("/email-auth/reset-password", { code, password, passwordConfirmation });
  return res.data;
}

/**
 * Enviar email de confirmación
 */
export async function sendConfirmationEmail(email: string) {
  const res = await api.post("/email-auth/send-confirmation", { email });
  return res.data;
}

/**
 * Confirmar email con token (endpoint nativo de Strapi)
 */
export async function confirmEmail(token: string) {
  const res = await api.get(`/auth/email-confirmation?confirmation=${token}`);
  return res.data;
}

/**
 * Admin: Crear usuario y enviar credenciales por email
 */
export async function adminCreateUserWithEmail(data: {
  username: string;
  email: string;
  name?: string;
  role: number;
  sendEmail?: boolean;
}) {
  const res = await api.post("/email-auth/admin-create-user", data);
  return res.data;
}

/**
 * Admin: Restablecer contraseña de un usuario
 */
export async function adminResetUserPassword(userId: number) {
  const res = await api.post("/email-auth/admin-reset-password", { userId });
  return res.data;
}

/**
 * Obtener sesión actual del usuario
 */
export async function getSession() {
  try {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    // Obtener datos del usuario
    const res = await api.get("/users/me?populate=role", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch {
    return null;
  }
}
