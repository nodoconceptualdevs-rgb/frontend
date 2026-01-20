import api from "@/lib/api";
import Cookies from 'js-cookie';

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
    // 1. Hacer login en Strapi
    const res = await api.post("/auth/local", data, {
      withCredentials: true
    });
    const responseData = res.data as LoginResponse;
    
    const token = responseData.jwt;
    
    // 2. Guardar token temporalmente en localStorage
    if (typeof window !== 'undefined') {
      // En localStorage para el interceptor
      localStorage.setItem('token', token);
    }
    
    // 3. Obtener usuario completo con rol usando el token
    const userRes = await api.get("/users/me?populate=role", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true // Importante para enviar/recibir cookies
    });
    const user = userRes.data as UserResponse;
    
    // 4. Guardar TODAS las cookies necesarias inmediatamente
    if (typeof window !== 'undefined') {
      const isProduction = window.location.protocol === 'https:';
      
      if (isProduction) {
        // Producción (HTTPS) - usar SameSite=None para cross-domain
        const cookieOptions = {
          expires: 30, // 30 días
          path: '/',
          sameSite: 'None' as const,
          secure: true
        };
        
        Cookies.set('token', token, cookieOptions);
        Cookies.set('userId', user.id.toString(), cookieOptions);
        Cookies.set('role', user.role.type, cookieOptions);
      } else {
        // Desarrollo (HTTP)
        const cookieOptions = {
          expires: 30,
          path: '/',
          sameSite: 'Lax' as const
        };
        
        Cookies.set('token', token, cookieOptions);
        Cookies.set('userId', user.id.toString(), cookieOptions);
        Cookies.set('role', user.role.type, cookieOptions);
      }
      
      console.log('✅ Todas las cookies seteadas en auth-client:', {
        token: !!Cookies.get('token'),
        userId: !!Cookies.get('userId'),
        role: !!Cookies.get('role')
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
