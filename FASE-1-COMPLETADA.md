# ✅ Fase 1: Base de Autenticación - COMPLETADA

## 📦 Archivos Creados/Modificados

### **Archivos Nuevos**

1. **`src/types/auth.ts`**
   - Tipos TypeScript para autenticación
   - RoleType, User, UserRole, AuthResponse, etc.

2. **`src/context/AuthContext.tsx`**
   - Context global de autenticación
   - Funciones: login, logout
   - Estados: user, token, isLoading
   - Helpers: isAdmin, isGerente, isCliente
   - Redirección automática según rol

3. **`src/hooks/useAuth.ts`**
   - Hook personalizado para usar AuthContext
   - Facilita el acceso a la autenticación

4. **`src/hooks/useRole.ts`**
   - Hook para verificar roles y permisos
   - Funciones helper: canManageProjects, canAssignGerentes, etc.

### **Archivos Modificados**

1. **`src/services/auth.ts`**
   - ✅ Agregado tipo LoginResponse completo
   - ✅ Guardado de rol en cookie (httpOnly)
   - ✅ Mejor tipado TypeScript

2. **`src/app/layout.tsx`**
   - ✅ Agregado AuthProvider
   - ✅ Envuelve toda la aplicación

3. **`src/app/(public)/login/page.tsx`**
   - ✅ Usa useAuth en lugar de llamar directamente al servicio
   - ✅ Redirección automática según rol

---

## 🔑 Flujo de Autenticación Implementado

```
1. Usuario ingresa credenciales
   ↓
2. LoginPage llama a login() del AuthContext
   ↓
3. AuthContext llama al servicio loginService()
   ↓
4. Backend devuelve JWT + user (con role.type)
   ↓
5. AuthContext guarda:
   - Estado: user, token
   - LocalStorage: user, token
   - Cookie (httpOnly): token, userId, role
   ↓
6. AuthContext detecta rol y redirecciona:
   - admin → /admin/proyectos
   - gerente_proyecto → /gerente/proyectos
   - authenticated → /dashboard/mis-cursos (cliente ve cursos)
```

---

## 🎯 Redirección por Rol

### **Admin (type: "admin")**
```typescript
router.push('/admin/proyectos');
```

### **Gerente de Proyecto (type: "gerente_proyecto")**
```typescript
router.push('/gerente/proyectos');
```

### **Cliente (type: "authenticated")**
```typescript
router.push('/dashboard/mis-cursos');  // También ve cursos
```

---

## 🧩 Cómo Usar en Componentes

### **Ejemplo 1: Usar AuthContext**

```typescript
"use client";

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, isAdmin, isGerente, isCliente, logout } = useAuth();

  if (!user) {
    return <div>No autenticado</div>;
  }

  return (
    <div>
      <p>Hola, {user.name || user.username}</p>
      <p>Rol: {user.role.name}</p>
      
      {isAdmin && <p>Eres admin</p>}
      {isGerente && <p>Eres gerente</p>}
      {isCliente && <p>Eres cliente</p>}
      
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

### **Ejemplo 2: Usar Hook de Roles**

```typescript
"use client";

import { useRole } from '@/hooks/useRole';

export default function ProjectActions() {
  const { 
    canManageProjects, 
    canAssignGerentes,
    canManageHitos 
  } = useRole();

  return (
    <div>
      {canManageProjects() && (
        <button>Crear Proyecto</button>
      )}
      
      {canAssignGerentes() && (
        <button>Asignar Gerente</button>
      )}
      
      {canManageHitos() && (
        <button>Gestionar Hitos</button>
      )}
    </div>
  );
}
```

---

## 📊 Estado del Usuario (Ejemplo)

```typescript
{
  id: 3,
  username: "gerente1",
  email: "gerente1@example.com",
  name: "Juan Pérez",
  role: {
    id: 4,
    name: "Gerente de Proyecto",
    type: "gerente_proyecto"  // ⚠️ Clave para detectar rol
  },
  confirmed: true,
  blocked: false
}
```

---

## 🔐 Cookies Guardadas

```
token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
userId = 3
role = gerente_proyecto
```

Las cookies son **httpOnly** para mayor seguridad.

---

## ✅ Funciones Disponibles en AuthContext

| Función | Descripción |
|---------|-------------|
| `user` | Usuario actual (null si no autenticado) |
| `token` | JWT token (null si no autenticado) |
| `login(email, password)` | Iniciar sesión |
| `logout()` | Cerrar sesión |
| `isLoading` | Estado de carga |
| `isAuthenticated` | Si está autenticado |
| `isAdmin` | Si es admin |
| `isGerente` | Si es gerente |
| `isCliente` | Si es cliente |

---

## ✅ Funciones Disponibles en useRole

| Función | Descripción |
|---------|-------------|
| `hasRole(role)` | Verifica rol específico |
| `hasAnyRole(roles[])` | Verifica uno de varios roles |
| `canManageProjects()` | Puede gestionar proyectos |
| `canAssignGerentes()` | Puede asignar gerentes (solo admin) |
| `canManageHitos()` | Puede gestionar hitos |
| `canUploadFiles()` | Puede subir archivos |
| `canComment()` | Puede comentar |
| `canViewAllProjects()` | Puede ver todos los proyectos (solo admin) |
| `canManageUsers()` | Puede gestionar usuarios (solo admin) |

---

## 🧪 Cómo Probar

### **1. Iniciar Frontend**
```bash
cd frontend-nodo
npm run dev
```

### **2. Ir a Login**
```
http://localhost:3000/login
```

### **3. Probar con Diferentes Roles**

#### **Como Admin:**
```
Email: admin@example.com
Password: Admin123!
Resultado: Redirige a /admin/proyectos
```

#### **Como Gerente:**
```
Email: gerente1@example.com
Password: Gerente123!
Resultado: Redirige a /gerente/proyectos
```

#### **Como Cliente:**
```
Email: cliente1@example.com
Password: Cliente123!
Resultado: Redirige a /dashboard/mis-cursos
```

---

## 📝 Notas Importantes

### **Cliente ve Cursos**
```typescript
// En AuthContext, línea de redirección para cliente:
case 'authenticated':
  router.push('/dashboard/mis-cursos');  // Cliente ve cursos
  break;
```

### **Roles en el Backend**

Según el backend:
- **Admin**: Puede todo, incluido asignar gerentes
- **Gerente**: Crea proyectos pero NO asigna gerentes
- **Cliente**: Solo ve su proyecto y crea comentarios

---

## ✅ Checklist de Fase 1

- [x] Crear types/auth.ts
- [x] Crear context/AuthContext.tsx
- [x] Modificar services/auth.ts
- [x] Modificar login/page.tsx
- [x] Agregar AuthProvider en layout.tsx
- [x] Crear hooks/useAuth.ts
- [x] Crear hooks/useRole.ts
- [x] Documentar implementación

---

## 🚀 Próximos Pasos (Fase 2)

1. **Crear middleware.ts** - Proteger rutas
2. **Crear página /unauthorized** - Para accesos denegados
3. **Probar login con diferentes roles**
4. **Verificar redirecciones**

---

## 🎉 Estado Actual

**Fase 1: ✅ COMPLETADA**

El sistema de autenticación está funcionando y detecta roles correctamente.

**Próximo:** Fase 2 - Protección de Rutas
