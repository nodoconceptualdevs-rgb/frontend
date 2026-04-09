"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, RoleType } from '@/types/auth';
import { login as loginService, logout as logoutService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { ROLES, isAdminRole, isClientRole } from '@/constants/roles';
import Cookies from 'js-cookie';

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar usuario al inicio desde localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Error cargando datos de usuario:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
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
      // Llamar a server action login que maneja las cookies
      // Este endpoint ya hace internamente la llamada a /users/me?populate=role
      // y devuelve la información completa del usuario con su rol
      const response = await loginService({ identifier: email, password });
      
      // Mapear datos del usuario asegurando que el rol esté presente
      const userData: User = {
        id: parseInt(response.user.id.toString()),
        username: response.user.username,
        email: response.user.email,
        name: response.user.name,
        role: {
          // Usar valores por defecto si no existe el rol
          id: response.user.role?.id || 0,
          name: response.user.role?.name || 'authenticated',
          type: (response.user.role?.type as RoleType) || 'authenticated',
          description: response.user.role?.description || '',
        },
        confirmed: response.user.confirmed,
        blocked: response.user.blocked,
      };
      // Guardar en estado local
      setUser(userData);
      setToken(response.jwt);

      // Guardar en localStorage
      localStorage.setItem('token', response.jwt);
      localStorage.setItem('userId', response.user.id.toString());
      localStorage.setItem('role', response.user.role.type);
      localStorage.setItem('name', response.user.name || response.user.username);
      localStorage.setItem('user', JSON.stringify(userData));

      // También guardar en cookies del cliente para producción
      try {
        // Cookies con configuración cross-domain
        Cookies.set('token', response.jwt, { 
          expires: 30, 
          sameSite: 'none', 
          secure: true,
          domain: undefined 
        });
        Cookies.set('userId', response.user.id.toString(), { 
          expires: 30, 
          sameSite: 'none', 
          secure: true,
          domain: undefined
        });
        Cookies.set('role', response.user.role.type, { 
          expires: 30, 
          sameSite: 'none', 
          secure: true,
          domain: undefined
        });
      } catch (e) {
        console.error('❌ Error guardando cookies:', e);
      }

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
      setToken(null);

      // Limpiar localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('name');

      // Limpiar cookies del cliente
      Cookies.remove('token');
      Cookies.remove('userId');
      Cookies.remove('role');

      // Redireccionar a login
      router.push('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      // Intentar limpiar localStorage y cookies de todos modos
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      Cookies.remove('token');
      Cookies.remove('userId');
      Cookies.remove('role');
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
