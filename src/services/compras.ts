"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

export async function getTransaccionesByUsuario(
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: unknown[]; meta?: { pagination?: { total: number } } }> {
  const cookieStore = await cookies();
  const usuarioId = cookieStore.get("userId")?.value;
  const token = cookieStore.get("token")?.value;
  if (!usuarioId || !token) throw new Error("No autenticado");
  const res = await api.get(
    `/transactions?filters[user][id][$eq]=${usuarioId}&populate[course][fields][0]=title&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data as { data: unknown[]; meta?: { pagination?: { total: number } } };
}

// Traer todas las transacciones del usuario con el curso y su contenido
export async function getCursosCompradosByUsuario(
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: unknown[] }> {
  const cookieStore = await cookies();
  const usuarioId = cookieStore.get("userId")?.value;
  const token = cookieStore.get("token")?.value;
  if (!usuarioId || !token) throw new Error("No autenticado");
  // populate profundo para traer curso y su contenido
  const res = await api.get(
    `/transactions?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data as { data: unknown[] };
}
