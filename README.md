# TBV-CMR — Triana Balonmano Vivero

Plataforma de gestión integral del club Triana Balonmano Vivero.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos:** Tailwind CSS v4 + shadcn/ui
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth + JWT custom middleware
- **Email:** Resend
- **Rate limiting:** Upstash Redis
- **Testing:** Vitest + Playwright
- **Deploy:** Vercel

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Equipos | Gestión de equipos por categoría y temporada |
| Jugadoras | Fichas de jugadoras, tallas, historial |
| Convocatorias | Eventos, entrenamientos, partidos |
| Ejercicios | Biblioteca de ejercicios con variantes y valoraciones |
| Entrenadores | Gestión de cuerpo técnico |
| Scouting | Fichas de ojeo con criterios personalizados |
| Sanitario | Lesiones, seguimiento médico, gráficas de evolución |
| Formación | Cursos, lecciones, progreso |
| Logística | Movimientos de stock, material |
| Mensajes | Comunicaciones internas con confirmación de lectura |
| Auditoría | Registro de cambios del sistema |

## Desarrollo

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Desarrollo
npm run dev

# Tests
npm run test
npm run test:coverage
npm run test:e2e

# Lint
npm run lint
npm run typecheck

# Build
npm run build
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las más importantes:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server) |
| `RESEND_API_KEY` | API key de Resend para emails |
| `UPSTASH_REDIS_REST_URL` | URL de Upstash Redis para rate limiting |

## Estructura

```
src/
├── app/              # App Router (páginas y API routes)
│   ├── api/          # API endpoints (auth, health, setup)
│   ├── convocatorias/
│   ├── ejercicios/
│   ├── equipos/
│   ├── entrenadores/
│   ├── jugadoras/
│   ├── logistica/
│   ├── mensajes/
│   ├── sanitario/
│   ├── scouting/
│   └── usuarios/
├── components/       # Componentes React reutilizables
├── lib/              # Utilidades, server actions, validaciones
└── middleware.ts     # Auth, CSRF, headers de seguridad
```

## Seguridad

- JWT middleware con decodificación local
- Rate limiting (Upstash Redis + fallback in-memory)
- CSRF protection (origin validation)
- CSP headers configurados
- Validación Zod en todos los formularios
- HTML encoding en emails para prevenir inyección
- Logging de auditoría en todas las mutaciones

## Licencia

Privado — Triana Balonmano Vivero
