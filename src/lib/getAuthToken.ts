/**
 * Helper para obtener el token JWT
 * Funciona tanto en server-side como client-side
 */
export function getAuthToken(): string | null {
  // Client-side: obtener de localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  
  // Server-side: no hay token disponible en server components
  // Las peticiones server-side deben pasar el token explícitamente
  return null;
}

/**
 * Headers de autenticación para peticiones API
 */
export function getAuthHeaders(token?: string) {
  const authToken = token || getAuthToken();
  
  if (!authToken) {
    console.warn('⚠️ No hay token JWT disponible');
    return {};
  }
  
  return {
    Authorization: `Bearer ${authToken}`,
  };
}
