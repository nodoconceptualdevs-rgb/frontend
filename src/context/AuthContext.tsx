"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, RoleType } from '@/types/auth';
import { login as loginService, logout as logoutService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { ROLES, isAdminRole, isClientRole } from '@/constants/roles';
import { useTokenStorage } from '@/hooks/useTokenStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Usar el hook personalizado para gestionar tokens
  const { 
    token, 
    setToken, 
    setUserId, 
    setRole, 
    clearTokens 
  } = useTokenStorage();

  // Cargar usuario al inicio desde localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error cargando datos de usuario:', error);
      localStorage.removeItem('user');
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, [token, clearTokens]);

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
      // Llamar a server action login que maneja las cookies
      const response = await loginService({ identifier: email, password });
      
      // Mapear datos del usuario
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

      // Guardar en estado local y tokens usando el hook especializado
      setUser(userData);
      setToken(response.jwt); // Actualiza tanto el estado local como localStorage
      setUserId(response.user.id.toString());
      setRole(response.user.role.type);
      
      // Guardar datos adicionales
      localStorage.setItem('name', response.user.name || response.user.username);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Verificar que se guardó correctamente
      console.log('✅ Verificación después de login:', { 
        token: !!response.jwt,
        user: !!userData,
        localStorage: {
          user: !!localStorage.getItem('user'),
          token: !!localStorage.getItem('token')
        }
      });
      
      // Redireccionar según rol
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
      // Llamar al server action para limpiar cookies
      await logoutService();
      
      // Limpiar estado local
      setUser(null);
      
      // Limpiar tokens usando el hook especializado
      clearTokens();
      
      // Limpiar datos adicionales
      localStorage.removeItem('name');
      
      // Redireccionar a login
      router.push('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      // Intentar limpiar tokens de todos modos
      setUser(null);
      clearTokens();
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
