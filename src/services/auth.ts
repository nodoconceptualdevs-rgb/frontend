"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

type RegisterPayload = {
  username?: string;
  email: string;
  password: string;
  name?: string;
};

type LoginPayload = { 
  identifier: string; 
  password: string 
};

type UserResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  confirmed?: boolean;
  blocked?: boolean;
  role: {
    id: number;
    name: string;
    type: string;
    description?: string;
  };
};

type LoginResponse = {
  jwt: string;
  user: UserResponse;
};

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

export async function login(data: LoginPayload): Promise<LoginResponse> {
  // Strapi default: POST /auth/local
  
  try {
    const res = await api.post("/auth/local", data);
    const responseData = res.data as LoginResponse;

  
    const token = responseData.jwt;
    
    // Obtener usuario completo con rol usando el token
    const userRes = await api.get("/users/me?populate=role", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const user = userRes.data as UserResponse;
    
    const cookieStore = await cookies();
  
    if (token) {
      // Guardar token
      cookieStore.set("token", token, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
      });
      
      // Guardar user ID (convertir a string)
      cookieStore.set("userId", String(user.id), {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
      });
      
      // Guardar rol del usuario
      cookieStore.set("role", user.role.type, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
      });
    }

    // Retornar jwt con el usuario completo (con rol poblado)
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
