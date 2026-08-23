# Auditoría Completa del Proyecto TBV-CMR

> **Proyecto**: Triana Balonmano Vivero - Plataforma de gestión del club  
> **Fecha**: 4 de agosto de 2026  
> **Versión analizada**: 0.1.0  
> **Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Supabase (PostgreSQL) + Tailwind CSS v4

---

## 📊 Resumen Ejecutivo

| Dimensión | Puntuación (1-10) | Estado |
|-----------|-------------------|--------|
| Arquitectura y estructura | 8 | ✅ Sólida |
| Seguridad | 8 | ✅ Buena |
| Calidad de código | 7 | 🟡 Mejorable |
| Base de datos | 8 | ✅ Buena |
| Performance | 6 | 🟡 Requiere atención |
| Testing | 3 | 🔴 Crítico |
| DX / Developer Experience | 7 | 🟡 Mejorable |
| Accesibilidad y UI | 7 | 🟡 Mejorable |
| Observabilidad | 4 | 🔴 Crítico |
| Deployment | 7 | 🟡 Mejorable |

### **Puntuación Global: 6.5 / 10**

> **Conclusión**: Proyecto funcional y bien estructurado con arquitectura moderna, pero con **deuda técnica significativa en testing, observabilidad y performance**. Requiere inversión inmediata en tests automatizados, logging estructurado y optimización de queries antes de escalar.

---

## 🔍 Hallazgos Detallados por Área

---

### 1. Arquitectura y Estructura 🟢 (8/10)

#### ✅ Fortalezas
- **Next.js 16 App Router** bien adoptado: Server Components por defecto, Server Actions para mutaciones, Streaming con `Suspense`
- **Separación de responsabilidades clara**:
  - `src/lib/` → Lógica de negocio, clientes Supabase, validaciones, helpers de auth
  - `src/components/` → UI reutilizable (ui/, sanitario/, providers/)
  - `src/app/` → Rutas y páginas (Server Components)
  - `supabase/migrations/` → Esquema versionado
- **Path aliases** (`@/*`) configurados en `tsconfig.json`
- **Patrón Server Actions** para formularios (eliminar, crear, actualizar) → reduce superficie de API
- **Middleware** de auth centralizado (`src/middleware.ts`) protege todas las rutas

#### 🟡 Mejoras
- **Duplicación de queries** en páginas (ej. `usuarios/page.tsx` hace 4-5 queries separadas que podrían combinarse)
- **Falta de capa de servicios/repositorios** → lógica de datos mezclada en Server Components
- **Componentes de UI** dispersos entre `src/components/ui/` y `src/components/` sin criterio claro
- **No hay `src/types/` centralizado** → tipos definidos inline o en `validations.ts`

#### 🔴 Crítico
- **Ninguno**

---

### 2. Seguridad 🟢 (8/10)

#### ✅ Fortalezas
- **RLS (Row Level Security) habilitado en TODAS las tablas** (ver migraciones)
- **Sistema de permisos granular**: `permisos` → `rol_permiso` → `usuarios.rol_id` + `usuario_permisos` para overrides
- **Usuario `master`** con acceso total bypassando RLS via `es_master` flag
- **Middleware de auth** en `src/middleware.ts` protege rutas server-side
- **Validación de entrada con Zod** en `src/lib/validations.ts` (350+ líneas, schemas exhaustivos)
- **Cliente admin (`supabase-admin.ts`)** usado SOLO en Server Actions críticas (crear usuarios, audit log)
- **Sanitización implícita** via Supabase/PostgREST (parameterized queries)
- **Contraseñas** hasheadas por Supabase Auth (no almacenadas en claro)

#### 🟡 Mejoras
- **Rate limiting** ausente en login y Server Actions sensibles
- **CSP (Content Security Policy)** no configurado en `next.config.ts`
- **Headers de seguridad** (HSTS, X-Frame-Options, etc.) no explícitos
- **Validación de archivo** en upload (`formacion/upload/route.ts`) solo por extensión, sin verificación MIME real
- **Logout** solo client-side (`LogoutButton`), sin revocación de sesión server-side

#### 🔴 Crítico
- **Ninguno detectado** (arquitectura de seguridad sólida)

---

### 3. Calidad de Código 🟡 (7/10)

#### ✅ Fortalezas
- **TypeScript `strict: true`** habilitado
- **Zod para validación runtime + tipos TypeScript** (single source of truth)
- **ESLint** con `eslint-config-next` (core-web-vitals + typescript)
- **Componentes UI** basados en `@base-ui/react` (headless, accesibles)
- **Path aliases** evitan imports relativos profundos
- **Utilidades tipadas** (`cn` en `utils.ts`, `validateFormData` en `validate.ts`)

#### 🟡 Mejoras
- **Duplicación de lógica de query** en páginas (ej. `jugadoras/page.tsx` filtra en memoria tras traer todo)
- **Tipos `any`** en varios puntos (ej. `auditoria/page.tsx` línea 89, `usuarios/page.tsx` línea 56)
- **Catch silenciosos** en `audit.ts` línea 30-32 (auditoría no debe romper flujo, pero debería loggear)
- **No hay Prettier** configurado → formato inconsistente
- **No hay Husky/Commitlint** → commits sin estandarizar

#### 🔴 Crítico
- **Solo 1 archivo de test** (`validations.test.ts` con 7 tests) → **cobertura ~0%**

---

### 4. Base de Datos 🟢 (8/10)

#### ✅ Fortalezas
- **7 migraciones** versionadas cronológicamente con nombres descriptivos
- **Convención naming**: snake_case tablas/columnas, UUID PKs, FKs explícitas
- **Índices** en columnas de filtro frecuente (`usuario_id`, `created_at`, `tabla/registro_id`)
- **Constraints CHECK** en enums (ej. `categoria IN ('tactica', 'fisico', ...)`)
- **Audit log** completo con `datos_anteriores`/`datos_nuevos` JSONB
- **Triggers de updated_at** ausentes → se maneja en aplicación (acceptable)
- **Storage bucket** configurado para formación con RLS

#### 🟡 Mejoras
- **Falta `updated_at` automático** en varias tablas (ej. `entrenadores`, `ejercicios`, `scouting_criterios`)
- **Índices compuestos** faltantes en queries frecuentes (ej. `jugadora_equipo_temporada` por `jugadora_id + temporada`)
- **No hay migraciones de rollback** documentadas (solo `IF NOT EXISTS`)
- **Datos semilla** hardcodeados en SQL (IDs UUID fijos) → frágil en entornos nuevos

#### 🔴 Crítico
- **Ninguno**

---

### 5. Performance 🟡 (6/10)

#### ✅ Fortalezas
- **Server Components por defecto** → menos JS al cliente
- **Streaming con Suspense** en `convocatorias/page.tsx`
- **Paginación server-side** en `auditoria/page.tsx` (limit 50)
- **Índices DB** en columnas de filtro
- **Imágenes** con `next/image` (hero, logo, avatares)

#### 🟡 Mejoras
- **N+1 queries** en `usuarios/page.tsx`:
  - Query 1: usuarios
  - Query 2: usuario_permisos (loop en JS)
  - Query 3: roles
  - Query 4: permisos
  - Query 5: rol_permiso
  → **5 round-trips** por carga de página
- **Filtrado en memoria** en `jugadoras/page.tsx` (línea 50-64): trae TODAS las jugadoras y filtra en JS
- **Sin caching** (no `revalidatePath` granular, no `unstable_cache`, no Redis)
- **Bundle size**: dependencias pesadas (`jspdf`, `jspdf-autotable`, `@base-ui/react`, `lucide-react`) sin code-splitting visible
- **`sharp` en dependencies** (no devDependencies) → aumenta bundle server
- **Queries sin `select` específico** en algunos casos (traen columnas innecesarias)

#### 🔴 Crítico
- **Página `jugadoras` carga todo sin paginación DB** → fallará con >1000 registros

---

### 6. Testing 🔴 (3/10)

#### ✅ Fortalezas
- **Vitest configurado** (`package.json`: `test`, `test:watch`)
- **Tests de validación** en `validations.test.ts` (7 tests básicos)

#### 🟡 Mejoras
- **Configuración Vitest** ausente (`vitest.config.ts`) → usa defaults
- **No hay tests de integración** (Server Actions, API routes, RLS policies)
- **No hay tests E2E** (Playwright/Cypress)
- **No hay coverage reporting** configurado

#### 🔴 Crítico
- **Cobertura real ~0%** (solo validadores Zod testados)
- **CI/CD no ejecuta tests** (no hay `.github/workflows/` ni `.gitlab-ci.yml`)
- **Regresiones probables** al refactorizar

---

### 7. DX / Developer Experience 🟡 (7/10)

#### ✅ Fortalezas
- **Scripts npm** completos: `dev`, `build`, `start`, `lint`, `test`, `test:watch`
- **TypeScript strict** + path aliases → autocompletado excelente
- **Hot reload** Next.js 16 (Turbopack en dev)
- **Componentes UI** consistentes (Button, FormCard, Field, SelectField, etc.)
- **Theme switching** (light/dark/system) con `next-themes`
- **Notificaciones in-app** con bell icon y real-time feel

#### 🟡 Mejoras
- **README genérico** (template create-next-app) → sin docs del proyecto
- **No hay `CONTRIBUTING.md`**, `ARCHITECTURE.md`, `DEPLOYMENT.md`
- **No hay `.env.example`** → onboarding manual
- **No hay Prettier** → debates de formato en PRs
- **No hay Husky** → pre-commit hooks ausentes
- **Error handling** inconsistente: algunos `try/catch` silenciosos, otros redirect con query params

#### 🔴 Crítico
- **Ninguno**

---

### 8. Accesibilidad y UI 🟡 (7/10)

#### ✅ Fortalezas
- **Base UI** (headless, ARIA-compliant) como base de componentes
- **Semantic HTML** en tablas, forms, navigation
- **Focus visible** styles en buttons/inputs (`focus-visible:ring`)
- **Responsive design** con Tailwind (breakpoints `md:`, `lg:`)
- **Theme support** (light/dark/system) persistido
- **Skeletons** para loading states (`components/skeletons.tsx`)
- **ARIA labels** en iconos solo (ej. `NotificationBell`, `SearchGlobal`)

#### 🟡 Mejoras
- **Contraste de colores** no verificado (paleta personalizada `#9b1b30`)
- **Keyboard navigation** en `SearchGlobal` (Ctrl+K) pero sin focus trap en modal
- **Screen readers**: algunos iconos sin `aria-hidden` + texto visible
- **Form labels** asociados correctamente, pero **error messages** no vinculados con `aria-describedby`
- **Tablas** sin `scope="col"` en `<th>` (accesibilidad tabla)
- **Modales/Dialogs** sin focus management (Base UI debería manejarlo, verificar)

#### 🔴 Crítico
- **Ninguno**

---

### 9. Observabilidad 🔴 (4/10)

#### ✅ Fortalezas
- **Audit log** completo en DB (`audit_log` tabla + RLS)
- **Console.error** en middleware y Server Actions

#### 🟡 Mejoras
- **Logging estructurado** ausente (JSON, niveles, correlation IDs)
- **No hay error tracking** (Sentry, LogRocket, etc.)
- **No hay métricas** (performance, business, errors)
- **No hay health checks** endpoint
- **No hay tracing** (OpenTelemetry importado `@opentelemetry/api` pero no usado)

#### 🔴 Crítico
- **Cero visibilidad en producción** → debugging reactivo, no proactivo
- **Errores de usuario** solo via `console.error` → se pierden en logs de Vercel/Netlify

---

### 10. Deployment 🟡 (7/10)

#### ✅ Fortalezas
- **Vercel/Netlify ready**: `next.config.ts` minimal, `serverExternalPackages` configurado
- **Environment variables** usadas correctamente (`NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Build output** standalone compatible (Next.js default)
- **PWA ready**: `manifest.json`, `sw.js`, icons en `public/`

#### 🟡 Mejoras
- **No hay `.env.example`** → riesgo de secrets en repo
- **No hay CI/CD pipeline** (GitHub Actions, GitLab CI, etc.)
- **No hay staging/preview deployments** configurados
- **No hay rollback strategy** documentado
- **Build time** no optimizado (no `next build --profile` analizado)

#### 🔴 Crítico
- **Ninguno**

---

## 📋 Plan de Acción Priorizado

### 🔴 INMEDIATO (Semana 1-2) - *Crítico para producción*

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | **Configurar Vitest + coverage + CI** (GitHub Actions) | 8h | Alto |
| 2 | **Añadir Sentry/LogRocket** para error tracking | 4h | Alto |
| 3 | **Fix N+1 en `usuarios/page.tsx`** (query única con joins) | 4h | Alto |
| 4 | **Paginación DB en `jugadoras/page.tsx`** (`.range()`) | 3h | Alto |
| 5 | **Crear `.env.example`** documentando variables requeridas | 1h | Medio |
| 6 | **Rate limiting** en login y Server Actions sensibles | 6h | Alto |

### 🟡 CORTO PLAZO (Mes 1) - *Calidad y mantenibilidad*

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 7 | **Tests de integración** para Server Actions críticas (usuarios, auth) | 16h | Alto |
| 8 | **Tests E2E** (Playwright) para flujos core: login, crear jugadora, convocatoria | 24h | Alto |
| 9 | **Logging estructurado** (pino/winston) + correlation IDs | 8h | Medio |
| 10 | **Prettier + Husky + Commitlint** | 4h | Medio |
| 11 | **Optimizar bundle**: code-split `jspdf`, mover `sharp` a devDependencies | 6h | Medio |
| 12 | **Health check endpoint** `/api/health` | 2h | Bajo |
| 13 | **Documentación**: `README.md` real, `ARCHITECTURE.md`, `DEPLOYMENT.md` | 8h | Medio |
| 14 | **CSP Headers** en `next.config.ts` | 3h | Medio |

### 🟢 MEDIO PLAZO (Mes 2-3) - *Escalabilidad y excelencia*

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 15 | **Capa de repositorios/servicios** para separar lógica de datos de UI | 24h | Alto |
| 16 | **Caching strategy** (Redis/Upstash) para queries frecuentes | 16h | Alto |
| 17 | **Métricas de negocio** (eventos/semana, usuarios activos, etc.) | 12h | Medio |
| 18 | **Auditoría de accesibilidad** completa (axe-core, testing manual) | 16h | Medio |
| 19 | **CI/CD pipeline** completo (lint, test, build, deploy preview, deploy prod) | 16h | Alto |
| 20 | **Backup/Restore strategy** Supabase documentada y testeada | 8h | Alto |
| 21 | **Performance budgets** + bundle analyzer en CI | 6h | Medio |
| 22 | **Storybook** para componentes UI | 12h | Bajo |

---

## 📈 Estimación de Esfuerzo Total

| Prioridad | Horas | Semanas (1 dev) |
|-----------|-------|-----------------|
| Inmediato | ~26h | 1 |
| Corto plazo | ~87h | 2-3 |
| Medio plazo | ~114h | 3-4 |
| **Total** | **~227h** | **6-8 semanas** |

> **Nota**: Estimación para 1 developer senior full-time. En paralelo, varias tareas pueden hacerse concurrentemente.

---

## 🎯 Quick Wins (≤2h cada uno)

1. **`.env.example`** - 30 min
2. **`sharp` → devDependencies** - 15 min + test build
3. **`vitest.config.ts`** con coverage - 1h
4. **GitHub Actions** básico (lint + test + build) - 1h
5. **Health check endpoint** - 30 min
6. **CSP headers** básicos - 1h
7. **Prettier config** - 30 min
8. **Husky + commitlint** - 1h

---

## 🔐 Checklist de Seguridad Pre-Producción

- [ ] Rate limiting en `/login` y Server Actions
- [ ] CSP headers configurados
- [ ] Headers de seguridad (HSTS, X-Frame-Options, Referrer-Policy)
- [ ] Verificación MIME real en uploads
- [ ] Revocación de sesión server-side en logout
- [ ] Secrets rotados (service role key, JWT secret)
- [ ] RLS policies testeadas con usuario no-master
- [ ] Audit log inmutable (no DELETE/UPDATE policies para usuarios normales)

---

## 📝 Próximos Pasos Recomendados

1. **Esta semana**: Ejecutar Quick Wins + configurar CI + Sentry
2. **Próximas 2 semanas**: Tests críticos + fix performance queries
3. **Mes 1**: Documentación + Prettier/Husky + Tests E2E
4. **Mes 2**: Repositorios + Caching + CI/CD completo
5. **Continuo**: Métricas, accesibilidad, performance budgets

---

*Informe generado tras auditoría estática de código, configuración y migraciones. No incluye testing dinámico ni revisión de infraestructura Supabase/Vercel.*