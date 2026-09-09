# TBV-CMR — Triana Balonmano Vivero

Plataforma de gestión integral del club Triana Balonmano Vivero.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`)
- **Estilos:** Tailwind CSS v4 + shadcn/ui
- **Base de datos:** Supabase (PostgreSQL, RLS habilitado)
- **Autenticación:** Supabase Auth + JWT custom middleware (service role key)
- **Email:** Resend (API key send-only, requiere dominio verificado para envío a todos)
- **Rate limiting:** Upstash Redis + fallback in-memory
- **Testing:** Vitest (217 tests) + Playwright (E2E)
- **Deploy:** Vercel
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)

## Módulos

| Módulo | Descripción | Permisos |
|--------|-------------|----------|
| **Equipos** | Gestión de equipos por categoría y temporada | `equipos.leer/editar` |
| **Jugadoras** | Fichas, tallas, historial, tutoría | `jugadoras.leer/editar` |
| **Convocatorias** | Eventos, entrenamientos, partidos, emails ICS | `convocatorias.leer/editar` |
| **Ejercicios** | Biblioteca, variantes, valoraciones, sesiones | `equipos.leer/editar` |
| **Entrenadores** | Cuerpo técnico, asignaciones, biblioteca | `entrenadores.leer/editar` |
| **Scouting** | Fichas ojeo, informes, rivales, criterios | `scouting.leer/editar` |
| **Sanitario** | Lesiones, seguimientos, reconocimientos, psicología | `sanitario.leer/editar` |
| **Formación** | Cursos, lecciones, quizzes, progreso, certificados | `formacion.leer/editar` |
| **Logística** | Artículos, stock, movimientos | `logistica.leer/editar` |
| **Mensajes** | Comunicaciones con confirmación de lectura | `mensajes.leer/editar` |
| **Socios** | CRUD, pagos, autoinscripción pública, RGPD | `socios.leer/editar` |
| **Auditoría** | Log completo de cambios (tabla `audit_log`) | `usuarios.gestionar` |
| **Usuarios** | Gestión de roles, permisos, master users | `usuarios.gestionar` |

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
npm run test            # Vitest (unit + integration)
npm run test:coverage   # Con reporte de cobertura
npm run test:e2e        # Playwright (requiere servidor corriendo)

# Calidad de código
npm run lint            # ESLint + Prettier
npm run typecheck       # TypeScript strict check

# Build
npm run build
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las más importantes:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase (cliente) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server, bypass RLS) | ✅ |
| `SUPABASE_MANAGEMENT_TOKEN` | PAT para migraciones via Management API | ❌ |
| `RESEND_API_KEY` | API key de Resend (send-only, requiere dominio verificado) | ✅ |
| `EMAIL_FROM` | Remitente emails (ej: `Club <noreply@dominio.com>`) | ❌ |
| `UPSTASH_REDIS_REST_URL` | URL de Upstash Redis para rate limiting | ❌ |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash Redis | ❌ |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (para links en emails) | ✅ |

## Estructura del proyecto

```
src/
├── app/                      # App Router (páginas y API routes)
│   ├── api/                  # API endpoints (auth, health, setup, export)
│   │   ├── auth/             # login, logout, me, change-password
│   │   └── socios/           # export CSV
│   ├── (public)/             # Rutas públicas (sin auth)
│   │   └── socios/           # inscribirme, verificar-email, consentir
│   ├── convocatorias/        # [id], nueva
│   ├── ejercicios/           # [id], nueva, editar
│   ├── equipos/              # [id], nueva
│   ├── entrenadores/         # [id], nueva, ejercicios/
│   ├── jugadoras/            # [id], nueva
│   ├── logistica/            # articulos/, movimientos/
│   ├── mensajes/             # [id], nuevo, confirmar/[token]
│   ├── perfil/               # Perfil usuario + cambio password
│   ├── sanitario/            # lesiones/, reconocimientos/, psicologia/
│   ├── scouting/             # fichas/, informes/, rivales/
│   ├── socios/               # [id], editar, nueva, inscribirme
│   └── usuarios/             # editar
├── components/               # Componentes React reutilizables
│   ├── ui/                   # shadcn/ui primitives (Button, Input, Select, etc.)
│   ├── confirm-dialog.tsx    # Diálogo confirmación con focus management
│   ├── sidebar*.tsx          # Sidebar responsive + navegación
│   ├── toast-handler.tsx     # Toasts globales (sonner)
│   ├── skeletons.tsx         # Skeletons para Suspense
│   └── ...                   # Form fields, dialogs, etc.
├── lib/                      # Utilidades, server actions, validaciones
│   ├── validations.ts        # Zod schemas (200+ líneas)
│   ├── socios-actions.ts     # CRUD socios + emails
│   ├── socios-inscripcion-action.ts    # Autoinscripción pública
│   ├── socios-verificar-email-action.ts # Verificación email
│   ├── supabase-server.ts    # Cliente Supabase (service role)
│   ├── supabase-admin.ts     # Cliente admin (Management API)
│   ├── auth-helpers.ts       # getUsuarioActual, tienePermiso
│   ├── rate-limit.ts         # Upstash + fallback in-memory
│   ├── resend.ts             # Cliente Resend
│   └── ...                   # logger, rate-limit, etc.
├── middleware.ts             # Auth, CSRF, security headers, static files
├── hooks/                    # Custom hooks (useTheme, etc.)
├── providers/                # ThemeProvider, etc.
└── types/                    # Tipos TypeScript globales
```

## Seguridad

- **JWT middleware** con decodificación local (sin llamadas a Supabase por request)
- **Rate limiting** dual: Upstash Redis + fallback in-memory (3 req/h IP para inscripciones)
- **CSRF protection** via origin header validation
- **CSP headers** configurados en `next.config.ts`
- **Validación Zod** en todos los formularios (schemas estrictos: DNI, teléfono, CP, contraseña fuerte)
- **HTML encoding** en emails para prevenir inyección
- **Logging de auditoría** en todas las mutaciones (`audit_log` table)
- **Middleware** excluye archivos estáticos (`.*\.[a-zA-Z]+$`) y rutas públicas
- **Permisos master**: 3 usuarios con `es_master=true` → 100% permisos

## Flujo de emails (Resend)

> ⚠️ **Importante**: La API key de Resend configurada es **send-only**. Para que los emails lleguen a **cualquier destinatario** (no solo al owner de la cuenta Resend):
>
> 1. Ir a [resend.com/domains](https://resend.com/domains)
> 2. Añadir dominio (ej: `trianabalonmanovivero.com`)
> 2. Añadir registros DNS (SPF, DKIM, DMARC) que Resend indique
> 3. Verificar dominio
> 4. En Vercel: `EMAIL_FROM = "Triana Balonmano Vivero <noreply@trianabalonmanovivero.com>"`

Sin dominio verificado, Resend free tier solo entrega al email del owner de la cuenta.

## Flujo Socios (RGPD + Autoinscripción)

1. **Público** accede a `/socios/inscribirme` (sin auth)
2. Rellena formulario → valida Zod (DNI, email, teléfono, CP)
3. Rate limit: 3 inscripciones/IP/hora (Upstash)
4. Crea socio: `activo=false`, `email_verificado=false`, `consentimiento_estado='aceptado'`
5. Auto-crea pago pendiente ("Cuota de socio 2026")
6. Envía email verificación (fire-and-forget, token UUID)
6. Usuario clic link `/socios/verificar-email/[token]` → marca `email_verificado=true`
7. Directiva ve badges: "Pendiente", "Verificado", "Pagado"
8. Directiva puede reenviar verificación/consentimiento
9. Al confirmar pago → auto-activa socio

## Base de datos - Tablas clave

```sql
-- Socios
socios (
  id, numero_socio, nombre, apellidos, dni UNIQUE, email UNIQUE,
  telefono, fecha_nacimiento, direccion, ciudad, codigo_postal,
  activo, consentimiento_estado, consentimiento_fecha, consentimiento_ip,
  email_verificado, email_verificacion_token, token_consentimiento
)

-- Pagos socios
socios_pagos (socio_id FK, concepto, importe, estado, fecha_pago, metodo_pago)

-- Convocatorias (junction eventos-jugadoras)
convocatorias (evento_id, jugadora_id, convocada, confirmada, asistio, notificacion_enviada)

-- Ejercicios
ejercicios (categoria, titulo, imagen_url, objetivo_principal, entrenador_creador_id)

-- Auditoría
audit_log (tabla, registro_id, operacion, usuario_id, datos_anteriores, datos_nuevos)
```

## Despliegue en Vercel

1. **Conectar repo** GitHub → Vercel
2. **Environment Variables** → añadir todas las de `.env.example`
3. **Build Command**: `npm run build` (auto-detectado)
4. **Output Directory**: `.next` (auto)
5. **Deploy** → Vercel asigna `https://tbv-cmr.vercel.app`

### Variables críticas en Vercel

| Variable | Valor ejemplo |
|----------|---------------|
| `NEXT_PUBLIC_APP_URL` | `https://tbv-cmr.vercel.app` |
| `EMAIL_FROM` | `Triana Balonmano Vivero <noreply@tudominio.com>` |

### Post-deploy

- Verificar `/api/health` → `{"status":"healthy"}`
- Probar login con usuarios master
- Probar inscripción pública `/socios/inscribirme`

## Comandos útiles

```bash
# Migraciones Supabase (via Management API)
node scripts/run-migration.js supabase/migrations/nueva_migracion.sql

# Ver logs Vercel
vercel logs --follow

# Test E2E contra producción
PLAYWRIGHT_TEST_BASE_URL=https://tbv-cmr.vercel.app npx playwright test

# Ver cobertura tests
npm run test:coverage && open coverage/lcov-report/index.html
```

## Usuarios master (alpha test)

| Usuario | Email | Password | Auth ID |
|---------|-------|----------|---------|
| Admin | admin@tbv.test | TbvTest2026! | 730cd1b6... |
| Kike | kikemix@gmail.com | Test1234! | ffcab922... |
| JPL | jplama1979@gmail.com | Test1234! | 72b0046c... |

Todos tienen `es_master=true` → acceso total.

## Licencia

Privado — Triana Balonmano Vivero