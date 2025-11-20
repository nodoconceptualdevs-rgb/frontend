"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, RoleType } from '@/types/auth';
import { login as loginService, logout as logoutService } from '@/services/auth';
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
    if (isAdminRole(roleType)) {
      // Admin y Gerente gestionan proyectos en la misma interfaz
      router.push('/admin/proyectos');
    } else if (isClientRole(roleType)) {
      // Cliente ve cursos por defecto
      router.push('/dashboard/mis-cursos');
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
      const response = await loginService({ identifier: email, password });
      
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
      
      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.jwt);
      localStorage.setItem('name', response.user.name || response.user.username);
      
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
