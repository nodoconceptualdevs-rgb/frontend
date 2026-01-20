"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType, RoleType } from '@/types/auth';
import { loginClient as loginService } from '@/services/auth-client';
import { logout as logoutService } from '@/services/auth';
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
      
      // CRÍTICO: Guardar en localStorage (principal método de persistencia)
      // Guardar cada valor por separado para que si falla uno, los otros sigan
      let storageSuccessful = true;
      
      try { localStorage.setItem('token', response.jwt); } catch (e) {
        console.error('Error guardando token:', e);
        storageSuccessful = false;
      }
      
      try { localStorage.setItem('userId', response.user.id.toString()); } catch (e) {
        console.error('Error guardando userId:', e);
        storageSuccessful = false;
      }
      
      try { localStorage.setItem('role', response.user.role.type); } catch (e) {
        console.error('Error guardando role:', e);
        storageSuccessful = false;
      }
      
      try { localStorage.setItem('name', response.user.name || response.user.username); } catch (e) {
        console.error('Error guardando name:', e);
        storageSuccessful = false;
      }
      
      try { localStorage.setItem('user', JSON.stringify(userData)); } catch (e) {
        console.error('Error guardando user:', e);
        storageSuccessful = false;
      }
      
      // Verificar qué se guardó
      console.log('✅ Estado de localStorage en AuthContext:', {
        token: localStorage.getItem('token')?.substring(0, 10) + '...' || 'NO GUARDADO',
        userId: localStorage.getItem('userId') || 'NO GUARDADO',
        role: localStorage.getItem('role') || 'NO GUARDADO',
        name: localStorage.getItem('name') || 'NO GUARDADO',
        user: !!localStorage.getItem('user'),
        storageExito: storageSuccessful
      });
      
      // CRÍTICO: Cookies necesarias para server components
      const isProduction = window.location.protocol === 'https:';
      
      try {
        if (isProduction) {
          // PRODUCCIÓN: MÚTLIPLES MÉTODOS PARA MAYOR COMPATIBILIDAD
          
          // MÉTODO 1: js-cookie
          try {
            // Método 1: js-cookie sin SameSite
            const cookieOptions = { 
              expires: 30, 
              path: '/',
              secure: true 
            };
            
            Cookies.set('token', response.jwt, cookieOptions);
            Cookies.set('userId', response.user.id.toString(), cookieOptions);
            Cookies.set('role', response.user.role.type, cookieOptions);
            console.log('🍪 [AuthContext] Cookies seteadas con js-cookie (sin SameSite)');
          } catch (e) {
            console.error('Error con js-cookie:', e);
          }
          
          // MÉTODO 2: document.cookie solo atributo Secure
          try {
            const maxAge = 30 * 24 * 60 * 60; // 30 días en segundos
            document.cookie = `token=${response.jwt}; path=/; max-age=${maxAge}; Secure`;
            document.cookie = `userId=${response.user.id}; path=/; max-age=${maxAge}; Secure`;
            document.cookie = `role=${response.user.role.type}; path=/; max-age=${maxAge}; Secure`;
            console.log('🍪 [AuthContext] Cookies seteadas con document.cookie (solo Secure)');
          } catch (e) {
            console.error('Error con document.cookie:', e);
          }
          
          // MÉTODO 3: Sin atributos extra - máxima compatibilidad
          try {
            document.cookie = `token=${response.jwt}; path=/;`;
            document.cookie = `userId=${response.user.id}; path=/;`;
            document.cookie = `role=${response.user.role.type}; path=/;`;
            console.log('🍪 [AuthContext] Cookies seteadas sin atributos extra');
            
            // Verificar cookies
            console.log('🔍 Estado de cookies (document.cookie):', { 
              raw: document.cookie,
              includes: {
                token: document.cookie.includes('token='),
                userId: document.cookie.includes('userId='),
                role: document.cookie.includes('role=')
              }
            });
          } catch (e) {
            console.error('Error con método simple:', e);
          }
          
        } else {
          // DESARROLLO: SameSite=Lax es suficiente
          const cookieOptions = { 
            expires: 30, 
            path: '/', 
            sameSite: 'Lax' as const
          };
          
          Cookies.set('token', response.jwt, cookieOptions);
          Cookies.set('userId', response.user.id.toString(), cookieOptions);
          Cookies.set('role', response.user.role.type, cookieOptions);
          console.log('🍪 Cookies seteadas en DESARROLLO');
        }
        
        console.log('✅ Verificación de cookies:', {
          token: !!Cookies.get('token'),
          userId: !!Cookies.get('userId'),
          role: !!Cookies.get('role'),
          documentCookie: document.cookie.includes('token')
        });
      } catch (error) {
        console.error('❌ ERROR CRÍTICO seteando cookies:', error);
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
      
      // Limpiar cookies con js-cookie
      Cookies.remove('token', { path: '/' });
      Cookies.remove('userId', { path: '/' });
      Cookies.remove('role', { path: '/' });
      
      // En producción, también intentar eliminar con opciones de SameSite
      if (window.location.protocol === 'https:') {
        Cookies.remove('token', { path: '/', sameSite: 'None' as const, secure: true });
        Cookies.remove('userId', { path: '/', sameSite: 'None' as const, secure: true });
        Cookies.remove('role', { path: '/', sameSite: 'None' as const, secure: true });
      }
      
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
