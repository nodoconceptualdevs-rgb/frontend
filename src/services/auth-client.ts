import api from "@/lib/api";

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

/**
 * Login desde el cliente (sin cookies server-side)
 * Esta función se ejecuta en el navegador y usa localStorage
 */
export async function loginClient(data: LoginPayload): Promise<LoginResponse> {
  try {
    // Hacer login en Strapi
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
