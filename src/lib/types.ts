export type User = {
  id: string;
  username?: string;
  email: string;
  role?: string | { name?: string };
};

export type Curso = {
  id: string;
  slug?: string;
  titulo: string;
  descripcion?: string;
  precio?: number;
  activo?: boolean;
};
