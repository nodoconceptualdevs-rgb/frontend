"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

type RegisterPayload = {
  username?: string;
  email: string;
  password: string;
  name?: string;
};
type LoginPayload = { identifier: string; password: string };

export async function register(data: RegisterPayload) {
  const res = await api.post("/auth/local/register", data);
  return res.data;
}

export async function logout() {
  // Borra cookies httpOnly desde el servidor
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("userId");
}
export async function updateUserName(
  userId: number,
  name: string,
  jwt: string
) {
  return api.put(
    `/users/${userId}`,
    { name },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );
}

export async function login(data: LoginPayload) {
  // Strapi default: POST /auth/local
  const res = await api.post("/auth/local", data);
  const responseData = res.data as { jwt?: string; [key: string]: any };
  const token = responseData.jwt;
  const idUser = responseData.user.id;
  const name = responseData.user.name;
  const cookieStore = await cookies();
  if (token) {
    cookieStore.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
    cookieStore.set("userId", idUser, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  }

  return { ...responseData, name };
}

export async function getSession() {
  // Example: Strapi user endpoint (requires Authorization)
  try {
    const res = await api.get("/users/me");
    return res.data;
  } catch (err) {
    return null;
  }
}
