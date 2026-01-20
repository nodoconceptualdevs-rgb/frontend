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
    
    // Verificar respuesta
    const user = userRes.data as UserResponse;
    console.log('📊 Datos de usuario obtenidos:', {
      id: user.id,
      role: user.role?.type || 'SIN ROL',
      tieneRol: !!user.role,
      username: user.username
    });
    
    // 4. Guardar todo en localStorage (NO depender de cookies en producción)
    if (typeof window !== 'undefined') {
      // Asegurar que userId es string
      const userIdString = String(user.id);
      
      // 4.A. Verificar estructura de user.role
      if (!user.role) {
        console.error('⚠️ Usuario no tiene role definido:', user);
      } else if (!user.role.type) {
        console.error('⚠️ Role no tiene type definido:', user.role);
      }
      
      // 4.B. GUARDAR CADA ELEMENTO EN LOCALSTORAGE POR SEPARADO
      console.log('💾 Guardando en localStorage...');
      
      // Token (ya fue guardado antes)
      console.log('✓ Token ya guardado');  
      
      // UserId
      try { 
        localStorage.setItem('userId', userIdString);
        console.log('✓ UserId guardado:', userIdString);
      } catch (e) {
        console.error('❌ Error guardando userId:', e);
      }
      
      // Role (con verificación extra)
      try { 
        const roleValue = user.role?.type || 'authenticated';
        localStorage.setItem('role', roleValue);
        console.log('✓ Role guardado:', roleValue);
      } catch (e) {
        console.error('❌ Error guardando role:', e);
      }
      
      // Name
      try { 
        const nameValue = user.name || user.username || '';
        localStorage.setItem('name', nameValue);
        console.log('✓ Name guardado:', nameValue);
      } catch (e) {
        console.error('❌ Error guardando name:', e);
      }
      
      // User completo
      try { 
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✓ User JSON guardado');
      } catch (e) {
        console.error('❌ Error guardando user JSON:', e);
      }
      
      // 4.C. Verificación final del localStorage
      console.log('📋 Estado final de localStorage:', {
        token: localStorage.getItem('token') ? '✓' : '❌',
        userId: localStorage.getItem('userId'),
        role: localStorage.getItem('role'),
        name: localStorage.getItem('name'),
        user: localStorage.getItem('user') ? '✓' : '❌'
      });
      
      // CRÍTICO: Las cookies SON necesarias para server components
      const isProduction = window.location.protocol === 'https:';
      
      try {
        if (isProduction) {
          // MÉTODO 1: js-cookie (puede fallar en algunos navegadores)
          try {
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
            console.log('🍪 Cookies seteadas con js-cookie');
          } catch (e) {
            console.error('Error con js-cookie:', e);
          }
          
          // MÉTODO 2: document.cookie lo más simple posible
          try {
            const roleValue = user.role?.type || 'authenticated';
            document.cookie = `token=${token}; path=/;`;
            document.cookie = `userId=${userIdString}; path=/;`;
            document.cookie = `role=${roleValue}; path=/;`;
            console.log('🍪 Cookies básicas seteadas correctamente');
          } catch (e) {
            console.error('❌ Error seteando cookies básicas:', e);
          }
          
          // Verificar estado de las cookies
          console.log('🔍 Verificación final de cookies:', { 
            raw: document.cookie,
            token: document.cookie.includes('token='),
            userId: document.cookie.includes('userId='),
            role: document.cookie.includes('role=') 
          });
          
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
