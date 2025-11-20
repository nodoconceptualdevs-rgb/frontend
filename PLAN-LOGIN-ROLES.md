# 🔐 Plan de Implementación - Login Multi-Rol

## 🎯 Objetivo
Implementar un sistema de login que maneje 3 roles diferentes con dashboards y permisos específicos.

---

## 📊 Roles Confirmados del Backend

### **1. Super Admin**
```
✅ Acceso total
✅ Crear proyectos
✅ Asignar gerentes a proyectos
✅ Gestionar usuarios
✅ Acceso al panel de Strapi
```

### **2. Gerente de Proyecto**
```
✅ Crear proyectos (pero no asignar gerentes)
✅ Ver solo sus proyectos
✅ Editar/eliminar sus proyectos
✅ Gestionar hitos
✅ Subir archivos
✅ Responder comentarios
```

### **3. Cliente**
```
✅ Ver su proyecto
✅ Crear comentarios
❌ NO editar nada
```

---

## 🏗️ Arquitectura del Frontend

```
Login Page
    ↓
Detectar Rol (de la respuesta del backend)
    ↓
    ├─→ Super Admin → /admin/proyectos (gestión completa)
    ├─→ Gerente     → /gerente/proyectos (sus proyectos)
    └─→ Cliente     → /cliente/proyecto/:id (su proyecto)
```

---

## 📁 Estructura de Carpetas Propuesta

```
src/
├── app/
│   ├── (public)/
│   │   └── login/
│   │       └── page.tsx (✅ ya existe)
│   ├── admin/               (🆕 NUEVO)
│   │   ├── layout.tsx       (Proteger con middleware)
│   │   ├── proyectos/
│   │   │   ├── page.tsx     (Lista todos los proyectos)
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx (Crear proyecto + asignar gerente)
│   │   │   └── [id]/
│   │   │       └── page.tsx (Editar proyecto)
│   │   └── usuarios/
│   │       └── page.tsx     (Gestionar usuarios)
│   ├── gerente/             (🆕 NUEVO)
│   │   ├── layout.tsx       (Proteger con middleware)
│   │   ├── proyectos/
│   │   │   ├── page.tsx     (Lista sus proyectos)
│   │   │   ├── nuevo/
│   │   │   │   └── page.tsx (Crear proyecto, NO asignar gerente)
│   │   │   └── [id]/
│   │   │       ├── page.tsx (Ver/editar proyecto)
│   │   │       └── hitos/
│   │   │           └── page.tsx (Gestionar hitos)
│   │   └── perfil/
│   │       └── page.tsx     (Su perfil)
│   └── cliente/             (🆕 NUEVO)
│       ├── layout.tsx       (Proteger con middleware)
│       └── proyecto/
│           └── [id]/
│               ├── page.tsx (Ver proyecto)
│               └── comentarios/
│                   └── page.tsx (Crear comentarios)
├── components/
│   ├── LoginForm.tsx        (✅ ya existe)
│   ├── ProtectedRoute.tsx   (🆕 NUEVO)
│   ├── RoleGuard.tsx        (🆕 NUEVO)
│   └── Navbar/              (🆕 NUEVO)
│       ├── AdminNavbar.tsx
│       ├── GerenteNavbar.tsx
│       └── ClienteNavbar.tsx
├── context/                 (🆕 NUEVO)
│   └── AuthContext.tsx      (Contexto global de auth)
├── hooks/                   (🆕 NUEVO)
│   ├── useAuth.ts           (Hook de autenticación)
│   └── useRole.ts           (Hook de rol)
├── middleware.ts            (🆕 NUEVO - Proteger rutas)
├── services/
│   ├── auth.ts              (✅ ya existe - MODIFICAR)
│   ├── proyectos.ts         (🆕 NUEVO)
│   ├── hitos.ts             (🆕 NUEVO)
│   └── comentarios.ts       (🆕 NUEVO)
└── types/
    ├── auth.ts              (🆕 NUEVO)
    ├── proyecto.ts          (🆕 NUEVO)
    └── user.ts              (🆕 NUEVO)
```

---

## 🔄 Flujo de Login

### **1. Usuario Ingresa Credenciales**
```typescript
// LoginForm
{ email: "gerente@example.com", password: "123456" }
```

### **2. Backend Responde con JWT + User**
```typescript
{
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: 3,
    username: "gerente1",
    email: "gerente1@example.com",
    role: {
      id: 4,
      name: "Gerente de Proyecto",
      type: "gerente_proyecto"  // ⚠️ CLAVE para detectar rol
    }
  }
}
```

### **3. Frontend Guarda en Context + Cookies**
```typescript
// AuthContext
setUser({
  id: 3,
  username: "gerente1",
  email: "gerente1@example.com",
  role: "gerente_proyecto"
});
setToken(jwt);
```

### **4. Redirección Según Rol**
```typescript
switch (user.role.type) {
  case "admin":
    router.push("/admin/proyectos");
    break;
  case "gerente_proyecto":
    router.push("/gerente/proyectos");
    break;
  case "authenticated":
    // Buscar proyecto del cliente
    router.push(`/cliente/proyecto/${proyectoId}`);
    break;
}
```

---

## 🛡️ Protección de Rutas

### **Middleware (middleware.ts)**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const role = request.cookies.get('role');

  // Rutas públicas
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Sin token → redirect a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (role?.value !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Rutas de gerente
  if (request.nextUrl.pathname.startsWith('/gerente')) {
    if (role?.value !== 'gerente_proyecto' && role?.value !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Rutas de cliente
  if (request.nextUrl.pathname.startsWith('/cliente')) {
    if (role?.value !== 'authenticated' && role?.value !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/gerente/:path*', '/cliente/:path*']
};
```

---

## 📝 Tipos TypeScript

### **types/auth.ts**
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface UserRole {
  id: number;
  name: string;
  type: 'admin' | 'gerente_proyecto' | 'authenticated';
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
  isGerente: boolean;
  isCliente: boolean;
}
```

---

## 🔑 AuthContext (context/AuthContext.tsx)

```typescript
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types/auth';
import { login as loginService, logout as logoutService } from '@/services/auth';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar usuario al inicio
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Intentar obtener usuario desde cookies/session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginService({ identifier: email, password });
    
    const userData: User = {
      id: response.user.id,
      username: response.user.username,
      email: response.user.email,
      name: response.user.name,
      role: response.user.role
    };

    setUser(userData);
    setToken(response.jwt);
    
    // Guardar en localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Guardar rol en cookie para middleware
    document.cookie = `role=${response.user.role.type}; path=/`;
    
    // Redireccionar según rol
    redirectByRole(response.user.role.type);
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const redirectByRole = (roleType: string) => {
    switch (roleType) {
      case 'admin':
        router.push('/admin/proyectos');
        break;
      case 'gerente_proyecto':
        router.push('/gerente/proyectos');
        break;
      case 'authenticated':
        // Para clientes, necesitamos obtener su proyecto
        router.push('/cliente/mi-proyecto');
        break;
      default:
        router.push('/login');
    }
  };

  const isAdmin = user?.role.type === 'admin';
  const isGerente = user?.role.type === 'gerente_proyecto';
  const isCliente = user?.role.type === 'authenticated';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isLoading,
        isAdmin,
        isGerente,
        isCliente
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 🔄 Modificar services/auth.ts

```typescript
"use server";
import api from "@/lib/api";
import { cookies } from "next/headers";

type RegisterPayload = {
  username?: string;
  email: string;
  password: string;
  name?: string;
};

type LoginPayload = { 
  identifier: string; 
  password: string 
};

export async function register(data: RegisterPayload) {
  const res = await api.post("/auth/local/register", data);
  return res.data;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("userId");
  cookieStore.delete("role");  // 🆕 Eliminar rol
}

export async function login(data: LoginPayload) {
  const res = await api.post("/auth/local", data);
  const responseData = res.data as { 
    jwt?: string; 
    user: { 
      id: string; 
      name: string;
      username: string;
      email: string;
      role: {
        id: number;
        name: string;
        type: string;  // 🆕 Tipo de rol
      }
    } 
  };
  
  const token = responseData.jwt;
  const user = responseData.user;
  const cookieStore = await cookies();
  
  if (token) {
    // Guardar token
    cookieStore.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
    
    // Guardar user ID
    cookieStore.set("userId", user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
    
    // 🆕 Guardar rol
    cookieStore.set("role", user.role.type, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  }

  return responseData;
}

export async function getSession() {
  try {
    const res = await api.get("/users/me");
    return res.data;
  } catch {
    return null;
  }
}
```

---

## 📱 Dashboards por Rol

### **1. Admin Dashboard (/admin/proyectos)**

**Características:**
- ✅ Ver TODOS los proyectos
- ✅ Crear proyecto + asignar gerente
- ✅ Editar cualquier proyecto
- ✅ Eliminar cualquier proyecto
- ✅ Gestionar usuarios
- ✅ Ver estadísticas globales

**Componentes:**
```typescript
<AdminLayout>
  <AdminNavbar />
  <ProyectosList 
    proyectos={todosLosProyectos}
    canCreate={true}
    canEdit={true}
    canDelete={true}
    canAssignGerente={true}
  />
</AdminLayout>
```

### **2. Gerente Dashboard (/gerente/proyectos)**

**Características:**
- ✅ Ver SOLO sus proyectos
- ✅ Crear proyecto (sin asignar gerente)
- ✅ Editar sus proyectos
- ✅ Eliminar sus proyectos
- ✅ Gestionar hitos
- ✅ Subir archivos
- ✅ Responder comentarios

**Componentes:**
```typescript
<GerenteLayout>
  <GerenteNavbar />
  <ProyectosList 
    proyectos={misProyectos}
    canCreate={true}
    canEdit={true}
    canDelete={true}
    canAssignGerente={false}
  />
</GerenteLayout>
```

### **3. Cliente Dashboard (/cliente/proyecto/:id)**

**Características:**
- ✅ Ver SU proyecto
- ✅ Ver hitos y progreso
- ✅ Ver archivos multimedia
- ✅ Crear comentarios
- ❌ NO editar nada

**Componentes:**
```typescript
<ClienteLayout>
  <ClienteNavbar />
  <ProyectoDetail 
    proyecto={miProyecto}
    canEdit={false}
    canComment={true}
  />
</ClienteLayout>
```

---

## 🚀 Pasos de Implementación

### **Fase 1: Base de Autenticación**
1. ✅ Crear types/auth.ts
2. ✅ Crear context/AuthContext.tsx
3. ✅ Modificar services/auth.ts
4. ✅ Modificar login/page.tsx
5. ✅ Agregar AuthProvider en layout.tsx

### **Fase 2: Protección de Rutas**
1. ✅ Crear middleware.ts
2. ✅ Crear página /unauthorized

### **Fase 3: Dashboards**
1. ✅ Crear /admin/proyectos
2. ✅ Crear /gerente/proyectos
3. ✅ Crear /cliente/proyecto/:id

### **Fase 4: Servicios API**
1. ✅ Crear services/proyectos.ts
2. ✅ Crear services/hitos.ts
3. ✅ Crear services/comentarios.ts

### **Fase 5: Componentes**
1. ✅ Navbars por rol
2. ✅ Lista de proyectos
3. ✅ Formulario de proyecto
4. ✅ Gestión de hitos
5. ✅ Sistema de comentarios

---

## 🔑 Diferencias Clave por Rol

| Acción | Admin | Gerente | Cliente |
|--------|-------|---------|---------|
| Ver todos los proyectos | ✅ | ❌ Solo suyos | ❌ Solo el suyo |
| Crear proyecto | ✅ | ✅ | ❌ |
| Asignar gerente | ✅ | ❌ | ❌ |
| Editar proyecto | ✅ Cualquiera | ✅ Solo suyos | ❌ |
| Eliminar proyecto | ✅ Cualquiera | ✅ Solo suyos | ❌ |
| Gestionar hitos | ✅ | ✅ | ❌ |
| Subir archivos | ✅ | ✅ | ❌ |
| Crear comentarios | ✅ | ✅ | ✅ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

---

## 📊 Ejemplo de Respuesta del Backend

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "username": "gerente1",
    "email": "gerente1@example.com",
    "role": {
      "id": 4,
      "name": "Gerente de Proyecto",
      "type": "gerente_proyecto"  // ⚠️ Usar esto para redirección
    }
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear types/auth.ts
- [ ] Crear context/AuthContext.tsx
- [ ] Modificar services/auth.ts
- [ ] Modificar login/page.tsx
- [ ] Agregar AuthProvider
- [ ] Crear middleware.ts
- [ ] Crear /admin/proyectos
- [ ] Crear /gerente/proyectos
- [ ] Crear /cliente/proyecto/:id
- [ ] Crear servicios API
- [ ] Crear componentes compartidos
- [ ] Probar login con cada rol
- [ ] Verificar redirecciones
- [ ] Verificar protección de rutas

---

## 🎯 Próximos Pasos

1. **Empezar con Fase 1**: Crear base de autenticación
2. **Probar login**: Verificar que detecta roles correctamente
3. **Implementar middleware**: Proteger rutas
4. **Crear dashboards**: Uno por rol
5. **Integrar con backend**: Consumir endpoints

---

**¿Comenzamos con la Fase 1 (Base de Autenticación)?**
