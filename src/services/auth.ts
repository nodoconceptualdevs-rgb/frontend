"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";
import { RegisterPayload, LoginPayload, AuthResponse, User } from "@/types/auth";

export async function register(data: RegisterPayload) {
  const res = await api.post("/auth/local/register", data);
  return res.data;
}

export async function logout() {
  // Borra cookies httpOnly desde el servidor
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("userId");
  cookieStore.delete("role");
}

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
 * Actualizar perfil del usuario (server-side)
 */
export async function updateUserProfile(name: string) {
  "use server";
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;

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
 * Login del usuario (server-side)
 * Esta función maneja solo las cookies del lado del servidor.
 * El manejo de localStorage debe hacerse en el componente cliente.
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
    
    // 3. Guardar en cookies del servidor con configuración para cross-domain (producción)
    const cookieStore = await cookies();
    
    // Configuración optimizada para cross-domain en producción
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "none" as const,
      secure: true,         // Siempre usar HTTPS en producción
      domain: ".railway.app", // Dominio del backend (ajústalo según tu dominio real en Railway)
      maxAge: 30 * 24 * 60 * 60, // 30 días
    };
  
    if (token) {
      // Guardar token
      cookieStore.set("token", token, cookieOptions);
      
      // Guardar user ID
      cookieStore.set("userId", String(user.id), cookieOptions);
      
      // Guardar rol del usuario
      cookieStore.set("role", user.role.type, cookieOptions);
    }

    // 4. Retornar JWT y usuario para que el cliente pueda manejarlos
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

export async function getSession() {
  // Example: Strapi user endpoint (requires Authorization)
  try {
    const res = await api.get("/users/me");
    return res.data;
  } catch {
    return null;
  }
}
