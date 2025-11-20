"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

export interface Transaction {
  id: number;
  purchase_date: string;
  amount: number;
  payment_method: "Paypal" | "Stripe" | "Pago movil";
  user?: any;
  course?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  purchase_date: string;
  amount: number;
  payment_method: "Paypal" | "Stripe" | "Pago movil";
  user: number;
  course: number;
}

/**
 * Obtener todas las transacciones
 */
export async function getTransactions() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get("/transactions?populate=*&sort=purchase_date:desc", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener una transacción por ID
 */
export async function getTransactionById(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get(`/transactions/${id}?populate=*`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Crear una nueva transacción
 */
export async function createTransaction(data: CreateTransactionPayload) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.post("/transactions", { data }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener transacciones de un usuario
 */
export async function getTransactionsByUser(userId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get(`/transactions?filters[user][id][$eq]=${userId}&populate=*&sort=purchase_date:desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener transacciones de un curso
 */
export async function getTransactionsByCourse(courseId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await api.get(`/transactions?filters[course][id][$eq]=${courseId}&populate=*&sort=purchase_date:desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * Obtener cursos comprados por el usuario logueado
 */
export async function getMisCursosComprados() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userId = cookieStore.get("userId")?.value;

  // Obtener todas las transacciones del usuario con los cursos poblados
  // Usar populate=* es más simple y funciona en Strapi v4
  const res: any = await api.get(`/transactions?filters[user][id][$eq]=${userId}&populate=*`, {
    headers: { Authorization: `Bearer ${token}` },
  });


  // Extraer los cursos únicos de las transacciones
  // Strapi v4+ devuelve los datos en res.data.data
  const transactions = res.data?.data || res.data || [];
  const cursosMap = new Map();
  
  
  transactions.forEach((transaction: any) => {
   
    if (transaction.course && transaction.course.id) {
      // Usar Map para eliminar duplicados por ID
      cursosMap.set(transaction.course.id, transaction.course);
    }
  });

  const cursos = Array.from(cursosMap.values());
  
  // Convertir el Map a array de cursos
  return cursos;
}
