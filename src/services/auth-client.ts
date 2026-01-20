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
    console.log('🔐 Iniciando login con:', { 
      identifier: data.identifier,
      environment: window.location.hostname,
      protocol: window.location.protocol
    });
    
    // 1. Hacer login en Strapi
    const res = await api.post("/auth/local", data, {
      withCredentials: true
    });
    
    console.log('✅ Login exitoso, respuesta:', {
      status: res.status,
      hasJWT: !!(res.data as any)?.jwt,
      hasUser: !!(res.data as any)?.user,
      environment: window.location.hostname
    });
    
    const responseData = res.data as LoginResponse;
    const token = responseData.jwt;
    
    if (!token) {
      throw new Error('No se recibió token del servidor');
    }
    
    // 2. Guardar token en localStorage INMEDIATAMENTE
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('token', token);
        console.log('✅ Token guardado en localStorage inmediatamente');
      } catch (error) {
        console.error('❌ ERROR guardando token:', error);
        alert('Error guardando token. Verifica permisos de localStorage.');
        throw error;
      }
    }
    
    // 3. Obtener usuario completo con rol usando el token
    const userRes = await api.get("/users/me?populate=role", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true // Importante para enviar/recibir cookies
    });
    const user = userRes.data as UserResponse;
    
    // 4. Guardar todo en localStorage (NO depender de cookies en producción)
    if (typeof window !== 'undefined') {
      // Asegurar que userId es string
      const userIdString = String(user.id);
      
      try {
        // CRÍTICO: Guardar en localStorage SIEMPRE
        localStorage.setItem('userId', userIdString);
        localStorage.setItem('role', user.role.type);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('name', user.name || user.username);
        
        console.log('✅ LocalStorage guardado exitosamente:', {
          token: localStorage.getItem('token')?.substring(0, 20) + '...',
          userId: localStorage.getItem('userId'),
          role: localStorage.getItem('role'),
          name: localStorage.getItem('name')
        });
      } catch (error) {
        console.error('❌ ERROR CRÍTICO guardando en localStorage:', error);
        alert('Error guardando datos de sesión. Por favor, intenta de nuevo.');
        throw error;
      }
      
      // CRÍTICO: Las cookies SON necesarias para server components
      const isProduction = window.location.protocol === 'https:';
      
      try {
        if (isProduction) {
          // Producción: usar SameSite=None para cross-domain
          Cookies.set('token', token, { 
            expires: 30, 
            path: '/', 
            sameSite: 'None', 
            secure: true 
          });
          Cookies.set('userId', userIdString, { 
            expires: 30, 
            path: '/', 
            sameSite: 'None', 
            secure: true 
          });
          Cookies.set('role', user.role.type, { 
            expires: 30, 
            path: '/', 
            sameSite: 'None', 
            secure: true 
          });
          console.log('🍪 Cookies seteadas en PRODUCCIÓN con SameSite=None');
        } else {
          // Desarrollo: usar SameSite=Lax
          Cookies.set('token', token, { 
            expires: 30, 
            path: '/', 
            sameSite: 'Lax' 
          });
          Cookies.set('userId', userIdString, { 
            expires: 30, 
            path: '/', 
            sameSite: 'Lax' 
          });
          Cookies.set('role', user.role.type, { 
            expires: 30, 
            path: '/', 
            sameSite: 'Lax' 
          });
          console.log('🍪 Cookies seteadas en DESARROLLO');
        }
        
        // Verificar que se setearon
        console.log('✅ Cookies verificadas:', {
          token: !!Cookies.get('token'),
          userId: !!Cookies.get('userId'),
          role: !!Cookies.get('role')
        });
      } catch (error) {
        console.error('❌ ERROR CRÍTICO seteando cookies:', error);
        // No lanzar error, usar localStorage como fallback
      }
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
