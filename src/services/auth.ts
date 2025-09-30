"use server";
import api, { setAuthToken } from "@/lib/api";
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
  cookieStore.delete("role");
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
  if (token) setAuthToken(token);

  // Obtener datos del usuario para el rol usando /users/:id?populate=role
  let roleName = "";
  let userId = responseData.user?.id;
  if (token && userId) {
    try {
      const userRes = await api.get(`/users/${userId}?populate=role`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      roleName = (userRes as any)?.data?.role?.name;
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  }

  // Setear cookies httpOnly (server action)
  const cookieStore = await cookies();
  if (token) {
    cookieStore.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  }
  if (roleName) {
    cookieStore.set("role", roleName, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  }
  console.log("Set cookies: token and role", { token, roleName });
  // Redirección según rol
  let redirectTo = "/dashboard";
  if (roleName === "Admin") {
    redirectTo = "/dashboard/admin";
  }

  return { ...responseData, role: roleName, redirectTo };
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
