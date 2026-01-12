import api from "@/lib/api";
import { getAuthHeaders } from "@/lib/getAuthToken";

interface User {
  id: number;
  username: string;
  email: string;
}

interface Course {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  price?: number;
}

export interface Transaction {
  id: number;
  purchase_date: string;
  amount: number;
  payment_method: "Paypal" | "Stripe" | "Pago movil";
  user?: User;
  course?: Course;
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
  const res = await api.get("/transactions?populate=*&sort=purchase_date:desc", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener una transacción por ID
 */
export async function getTransactionById(id: number) {
  const res = await api.get(`/transactions/${id}?populate=*`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Crear una nueva transacción
 */
export async function createTransaction(data: CreateTransactionPayload) {
  const res = await api.post("/transactions", { data }, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener transacciones de un usuario
 */
export async function getTransactionsByUser(userId: number) {
  const res = await api.get(`/transactions?filters[user][id][$eq]=${userId}&populate=*&sort=purchase_date:desc`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener transacciones de un curso
 */
export async function getTransactionsByCourse(courseId: number) {
  const res = await api.get(`/transactions?filters[course][id][$eq]=${courseId}&populate=*&sort=purchase_date:desc`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

/**
 * Obtener cursos comprados por el usuario logueado
 */
export async function getMisCursosComprados() {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener todas las transacciones del usuario con los cursos poblados
  // Usar populate=* es más simple y funciona en Strapi v4/v5
  // En Strapi v5, documentId se incluye automáticamente en cada documento
  const res = await api.get(`/transactions?filters[user][id][$eq]=${userId}&populate[course][fields][0]=id&populate[course][fields][1]=documentId&populate[course][fields][2]=title&populate[course][fields][3]=description&populate[course][fields][4]=price&populate[course][fields][5]=number_lessons`, {
    headers: getAuthHeaders(),
  });

  // Extraer los cursos únicos de las transacciones
  // Strapi v4+ devuelve los datos en res.data.data
  const responseData = res.data as { data?: Transaction[] } | Transaction[];
  const transactions: Transaction[] = (responseData && 'data' in responseData) ? (responseData.data || []) : (Array.isArray(responseData) ? responseData : []);
  const cursosMap = new Map<string, Course>();
  
  transactions.forEach((transaction) => {
    if (transaction.course && transaction.course.documentId && transaction.course.title) {
      // Solo agregar cursos que tienen datos completos (no fueron eliminados)
      // Usar documentId como clave ya que es único en Strapi v5
      cursosMap.set(transaction.course.documentId, transaction.course);
    }
  });

  const cursos = Array.from(cursosMap.values());
  
  // Filtrar cursos que no tienen título o documentId (fueron eliminados o datos incompletos)
  return cursos.filter(curso => curso.title && curso.title.trim() !== '' && curso.documentId);
}
