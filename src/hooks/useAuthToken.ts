'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para obtener el token JWT del localStorage
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Obtener token del localStorage (se guarda como 'token', no 'jwt')
    const storedToken = localStorage.getItem('token');
    console.log('useAuthToken - Token encontrado:', storedToken ? 'Sí' : 'No');
    setToken(storedToken);

    // Escuchar cambios en el localStorage
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      console.log('useAuthToken - Token actualizado:', newToken ? 'Sí' : 'No');
      setToken(newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return token;
}
