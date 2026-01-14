"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, RoleType } from '@/types/auth';
import { loginClient as loginService } from '@/services/auth-client';
import { logout as logoutService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { ROLES, isAdminRole, isClientRole } from '@/constants/roles';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar usuario al inicio desde localStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch {
        // Si hay error, limpiar storage silenciosamente
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  /**
   * Redireccionar según el rol del usuario
   */
  const redirectByRole = useCallback((roleType: string) => {
    if (roleType === ROLES.ADMIN) {
      // Solo Admin va a /admin/proyectos
      router.push('/admin/proyectos');
    } else if (roleType === ROLES.GERENTE_PROYECTO) {
      // Gerente va a su dashboard
      router.push('/dashboard/mi-proyecto');
    } else if (isClientRole(roleType)) {
      // Cliente ve cursos por defecto
      router.push('/dashboard/cursos');
    } else {
      // Por defecto, redirigir a login
      router.push('/login');
    }
  }, [router]);

  /**
   * Login de usuario
   */
  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 Iniciando login...');
      const response = await loginService({ identifier: email, password });
      console.log('✅ Login exitoso, procesando respuesta:', response);
      
      const userData: User = {
        id: parseInt(response.user.id.toString()),
        username: response.user.username,
        email: response.user.email,
        name: response.user.name,
        role: {
          id: response.user.role.id,
          name: response.user.role.name,
          type: response.user.role.type as RoleType,
          description: response.user.role.description,
        },
        confirmed: response.user.confirmed,
        blocked: response.user.blocked,
      };

      // Guardar en estado
      setUser(userData);
      setToken(response.jwt);
      
      // Guardar en localStorage (IMPORTANTE para peticiones futuras)
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.jwt);
      localStorage.setItem('userId', response.user.id.toString());
      localStorage.setItem('name', response.user.name || response.user.username);
      localStorage.setItem('role', response.user.role.type);
      
      // Guardar en cookies para mayor compatibilidad
      const isProduction = window.location.protocol === 'https:';
      const cookieOptions = isProduction 
        ? 'path=/; max-age=2592000; SameSite=None; Secure' // Producción (HTTPS)
        : 'path=/; max-age=2592000'; // Desarrollo (HTTP)
      
      // Establecer cookies con la configuración correcta para el entorno
      document.cookie = `token=${response.jwt}; ${cookieOptions}`;
      document.cookie = `userId=${response.user.id}; ${cookieOptions}`;
      document.cookie = `role=${response.user.role.type}; ${cookieOptions}`;

      // Verificar que los datos se guardaron
      console.log('💾 Datos guardados:',
        '\nToken:', localStorage.getItem('token') ? '✅' : '❌',
        '\nUser:', localStorage.getItem('user') ? '✅' : '❌',
        '\nCookies:', document.cookie ? '✅' : '❌'
      );
      
      // Redireccionar según rol
      console.log('🚀 Redirigiendo a rol:', response.user.role.type);
      redirectByRole(response.user.role.type);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout de usuario
   */
  const logout = async () => {
    try {
      // Primero limpiar cookies del servidor
      await logoutService();
    } catch {
      // Ignorar errores de logout silenciosamente
    } finally {
      // Limpiar estado
      setUser(null);
      setToken(null);
      
      // Limpiar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('name');
      
      // Intentar limpiar todas las cookies del lado del cliente
      // (aunque sean httpOnly, no hace daño intentarlo)
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Redireccionar a login
      router.push('/login');
    }
  };

  // Helpers de rol
  const isAdmin = user?.role.type === ROLES.ADMIN;
  const isGerente = user?.role.type === ROLES.GERENTE_PROYECTO;
  const isCliente = isClientRole(user?.role.type);
  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
    isAdmin,
    isGerente,
    isCliente,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
