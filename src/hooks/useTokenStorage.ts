"use client";

import { useState, useEffect } from 'react';
import { setAuthToken } from '@/lib/api';

/**
 * Hook personalizado para gestionar tokens de autenticación
 * Utiliza una estrategia en capas:
 * 1. Memoria para acceso rápido durante la sesión
 * 2. localStorage como persistencia entre recargas
 */
export function useTokenStorage() {
  // Estado en memoria
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [role, setRoleState] = useState<string | null>(null);

  // Inicializar desde localStorage al cargar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedToken = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');
      const storedRole = localStorage.getItem('role');
      
      if (storedToken) setTokenState(storedToken);
      if (storedUserId) setUserIdState(storedUserId);
      if (storedRole) setRoleState(storedRole);
    } catch (error) {
      console.error('Error cargando tokens desde localStorage:', error);
    }
  }, []);

  // Función para guardar token con persistencia
  const setToken = (newToken: string | null) => {
    // Actualizar estado en memoria
    setTokenState(newToken);
    
    // Actualizar el token en memoria para las peticiones API
    setAuthToken(newToken);
    
    // Actualizar localStorage para persistencia
    try {
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('✅ Token guardado en localStorage y memoria');
      } else {
        localStorage.removeItem('token');
        console.log('🗑 Token eliminado de localStorage y memoria');
      }
    } catch (error) {
      console.error('Error guardando token en localStorage:', error);
    }
  };

  // Función para guardar userId con persistencia
  const setUserId = (newUserId: string | null) => {
    // Actualizar estado en memoria
    setUserIdState(newUserId);
    
    // Actualizar localStorage para persistencia
    try {
      if (newUserId) {
        localStorage.setItem('userId', newUserId);
      } else {
        localStorage.removeItem('userId');
      }
    } catch (error) {
      console.error('Error guardando userId en localStorage:', error);
    }
  };

  // Función para guardar role con persistencia
  const setRole = (newRole: string | null) => {
    // Actualizar estado en memoria
    setRoleState(newRole);
    
    // Actualizar localStorage para persistencia
    try {
      if (newRole) {
        localStorage.setItem('role', newRole);
      } else {
        localStorage.removeItem('role');
      }
    } catch (error) {
      console.error('Error guardando role en localStorage:', error);
    }
  };

  // Función para limpiar todos los datos de autenticación
  const clearTokens = () => {
    setTokenState(null);
    setUserIdState(null);
    setRoleState(null);
    
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('name');
    } catch (error) {
      console.error('Error limpiando tokens de localStorage:', error);
    }
  };

  // Verificar si hay token disponible
  const hasToken = !!token;

  return {
    token,
    userId,
    role,
    setToken,
    setUserId,
    setRole,
    clearTokens,
    hasToken
  };
}
