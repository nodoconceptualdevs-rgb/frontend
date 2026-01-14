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
    console.log('🔄 Iniciando login con:', data.identifier);
    
    // 1. Iniciar login con API - IMPORTANTE: withCredentials debe estar en true en api.ts
    const res = await api.post("/auth/local", data, {
      withCredentials: true
    });
    
    console.log('✅ Login exitoso, procesando respuesta');
    const responseData = res.data as LoginResponse;
    const token = responseData.jwt;
    
    // 2. Guardar token en localStorage y document.cookie para redundancia
    if (typeof window !== 'undefined') {
      // En localStorage
      localStorage.setItem('token', token);
      
      // También en cookie para mayor compatibilidad
      document.cookie = `token=${token}; path=/; max-age=2592000`; // 30 días
      
      console.log('✅ Token guardado:', token.substring(0, 10) + '...');
    }
    
    // 3. Obtener usuario completo con rol usando el token
    console.log('🔄 Obteniendo datos de usuario...');
    const userRes = await api.get("/users/me?populate=role", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
    console.log('✅ Datos de usuario obtenidos');
    const user = userRes.data as UserResponse;
    
    // 4. Verificar que el token está disponible para futuras peticiones
    console.log('🔄 Verificando token:', localStorage.getItem('token') ? '✅ Presente en localStorage' : '❌ No encontrado en localStorage');
    
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
