/**
 * Tipos de autenticación y roles
 */

export type RoleType = 'admin' | 'gerente_de_proyecto' | 'authenticated' | 'client';

export interface UserRole {
  id: number;
  name: string;
  type: RoleType;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: UserRole;
  confirmed?: boolean;
  blocked?: boolean;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGerente: boolean;
  isCliente: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
