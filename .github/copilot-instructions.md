### Propósito del archivo

Este archivo documenta el enfoque frontend del proyecto LMS para Nodo Conceptual. Está pensado para guiar a desarrolladores y agentes (Copilot/IA) sobre rutas, flujos, convenciones y siguientes pasos antes de empezar a generar estructura y componentes.

### Resumen del proyecto (frontend)

- Stack: Next.js (App Router, Next 15), React 19, TypeScript, Tailwind (PostCSS).
- Alcance: Solo frontend. El backend ya existe (Strapi) — el frontend consumirá APIs públicas y privadas para cursos, usuarios y compras.

### Objetivos principales

- Crear una Landing informativa para la constructora: servicios, proyectos, cursos y contacto.
- Vender webinars/cursos (compras), y dar acceso a usuarios a sus cursos (contenido: videos/materiales).
- Panel de administración (frontend) para que admins gestionen cursos/usuarios/pagos.

### Rutas públicas recomendadas (App Router)

**Ahora todas las rutas públicas están bajo la carpeta especial `(public)` y comparten un layout general en `src/app/(public)/layout.tsx`.**

- `/` — Landing (one-page con secciones ancla): `src/app/(public)/landing/page.tsx` o `src/app/(public)/page.tsx` + subcomponentes en `src/app/landing/components/`.
- `/registro` — Registro: `src/app/(public)/registro/page.tsx` (POST a `/api/auth/register` del backend).
- `/login` — Login: `src/app/(public)/login/page.tsx` (POST a `/api/auth/login`).
- `/cursos` — Listado público de cursos (`SELECT WHERE activo = TRUE`): `src/app/(public)/cursos/page.tsx`.
- `/cursos/[slug]` — Detalle público del curso: `src/app/(public)/cursos/[slug]/page.tsx`.
- `/portafolio` — Portafolio de proyectos: `src/app/(public)/portafolio/page.tsx`.

### Rutas privadas (clientes y admin)

Usar middleware para proteger `/dashboard` y subrutas. Mantener roles (`admin`, `cliente`) en la sesión.

- `/dashboard` — Perfil cliente: `src/app/dashboard/page.tsx`.
- `/dashboard/mis-cursos` — Cursos comprados (JOIN entre `Compras` y `Cursos`): `src/app/dashboard/mis-cursos/page.tsx`.
- `/dashboard/mis-cursos/[cursoId]` — Contenido del curso (videos, materiales): `src/app/dashboard/mis-cursos/[cursoId]/page.tsx`.
- `/dashboard/mis-pagos` — Historial de pagos: `src/app/dashboard/mis-pagos/page.tsx`.

Rutas admin (bajo `/dashboard/admin`):

- `/dashboard/admin/cursos` — Dashboard de Cursos (lista completa).
- `/dashboard/admin/cursos/nuevo` — Crear curso.
- `/dashboard/admin/cursos/[id]/editar` — Editar curso.
- `/dashboard/admin/usuarios` — Gestión de usuarios.
- `/dashboard/admin/compras` — Historial de pagos.

### Esquema de datos tablas de strapi.

### Tabla: `User`

Esta tabla es el corazón del sistema, ya que gestiona a los administradores y a los clientes. Como no quieres guardar muchos datos, nos centraremos en lo mínimo y esencial.

- `id_usuario`: Un número único para cada persona. Es la clave principal (`PK`).
- `nombre`: El nombre completo del usuario.
- `email`: El correo electrónico del usuario. Será su identificador de inicio de sesión único.
- `password`: La contraseña del usuario, pero guardada de forma segura (encriptada). **Nunca** guardes contraseñas en texto plano.
- `role`: Un campo de texto que indicará si el usuario es `Administrador` o `Cliente`. Esto es crucial para la lógica de permisos.

### Tabla: `Cursos`

Aquí guardaremos toda la información de cada curso que se vende en tu sitio.

- `content_courses`: Un número único para el contenido de cada curso. Clave principal (`PK`).
- `transactions`: Un número único para cada transaccion. Clave principal (`PK`).
- `title`: El título del curso (por ejemplo, "AutoCAD: Nivel Básico").
- `description`: Una breve descripción que capture la atención del cliente.
- `price`: El costo del curso. Puedes usar un tipo de dato decimal.
- `cover`: La dirección web de la imagen de portada del curso.
- `isActive`: Para verificar si el curso esta activo o no.

### Tabla: `Transacciones`

Esta tabla es fundamental para registrar cada transacción y vincular a un usuario con los cursos que ha comprado. Como solo es una compra única, esta tabla nos servirá perfectamente para el historial de pagos.

- `user`: Un enlace a la tabla `User` (`Clave Foránea`). Esto nos permite saber quién hizo la compra.
- `course`: Un enlace a la tabla `Course` (`Clave Foránea`). Esto nos dice qué curso se compró.
- `purchase_date` La fecha en la que se realizó la compra.
- `amount` Monto de la compra.
- `payment_method` Metodo de pago.

### Tabla: `Contenidos`

Para que el cliente tenga el curso "de por vida en su perfil", necesitas una forma de guardar y organizar el material del curso (los videos, los PDFs, etc.). Esta tabla te ayudará a estructurar cada curso en módulos o lecciones.

- `course`Un enlace a la tabla `Course`(`Clave Foránea`).
- `lesson_title`: El nombre de la lección o video (ej. "Módulo 1: La Interfaz de AutoCAD").
- `video_lesson_url`: La dirección web donde está alojado el video de la lección.
- `order`: Un número para mantener las lecciones en el orden correcto.

### Autenticación y protección de rutas (frontend)

- Recomendado: usar JWT entregado por Strapi o NextAuth con provider Credentials que delegue la validación al backend.
- Guardar token en `httpOnly` cookie (recomendado) o en memoria + refresh token para seguridad.
- Implementar `src/middleware.ts` que proteja `/dashboard` y verifique la cookie/session. Para comprobaciones de rol, verificar en el server (getSession) o en cada API call.

### Estructura de carpetas propuesta

`src/app/` (rutas App Router)

- `(public)/` — rutas públicas (landing, registro, login, cursos, portafolio)
- `dashboard/` (admin y cliente)
- `src/components/` — componentes UI reutilizables (Button, Card, Form, Nav, Layouts)
- `src/lib/` — helpers (fetch wrapper, client API, auth helpers, stripe helper)
- `src/services/` — SDK/clients para el backend (api clients que usan `API_URL`)
- `src/styles/` — utilidades y tokens si son necesarios (en este repo usamos Tailwind + `globals.css`)

### Patrón de consumo de API

- Crear un wrapper `src/lib/api.ts` que incluya base URL desde `process.env.NEXT_PUBLIC_API_URL` y gestione headers (Authorization, content-type).
- Considerar SWR o React Query para caché, revalidación y manejo de estados (recomiendo React Query para flujos de compra y datos mutables).

MUY IMPORTANTE: usa siempre las mejores practicas de desarrollo, analizar en profundidad cada requerimiento y sugerir la mejor solución posible, no te limites a lo básico o a lo que ya conoces, investiga y aprende nuevas técnicas, patrones y librerías que puedan mejorar la calidad del código y la experiencia del usuario. tambien siempre pensar en el responsive design y la accesibilidad (a11y) en cada componente y página que generes. no hacer codigo innecesario o redundante, siempre optimizar y limpiar el código que generes.

MUCHO MAS IMPORTANTE AUN LIMITATE A HACER LO QUE TE PIDO, NO SUGIERAS NADA QUE NO TE HAYA PEDIDO, SIEMPRE PREGUNTA ANTES SI TIENES DUDAS, NO ASUMAS NADA, NO HAGAS NADA EXTRA, SOLO HAZ LO QUE TE DIGO.
