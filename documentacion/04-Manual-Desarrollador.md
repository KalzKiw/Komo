# Manual de Desarrollador

## Requisitos

- Node.js 22 o compatible.
- npm.
- Proyecto Supabase con las tablas del esquema.
- Variables de entorno configuradas.
- JDK 21 y Android SDK si se va a generar APK con Capacitor.

## Instalación Local

```bash
git clone <url-repositorio>
cd CafeteriaSolo
npm install
cp .env.example .env
```

Variables principales:

- `PORT`: puerto del backend. Por defecto `3001`.
- `NODE_ENV`: `development`, `test` o `production`.
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave de servicio.
- `SUPABASE_ANON_KEY`: clave pública anon para login con Supabase Auth.
- `STRIPE_SECRET_KEY`: clave secreta de Stripe en modo test (`sk_test_...`) para pagos de recarga.
- `BYPASS_ORDER_CUTOFF`: permite omitir el cierre horario durante pruebas.
- `VITE_API_BASE_URL`: vacío si frontend y backend comparten dominio; URL absoluta si se separan.
- `VITE_STRIPE_PUBLISHABLE_KEY`: clave pública de Stripe en modo test (`pk_test_...`) para el formulario de tarjeta.

Para Android se usa `.env.android`, no versionado. Debe incluir al menos:

- `VITE_API_BASE_URL`: URL pública de la API, por ejemplo Railway.
- `VITE_STRIPE_PUBLISHABLE_KEY`: clave pública si se prueban pagos Stripe desde la APK.

## Ejecución en Desarrollo

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm run dev:client
```

El frontend se abre en `http://localhost:5173` y usa proxy hacia `http://localhost:3001`. Son dos procesos separados: usa dos terminales durante desarrollo.

## Scripts Útiles

- `npm run dev`: backend en modo desarrollo.
- `npm run dev:client`: frontend Vite.
- `npm run build`: compila backend y frontend.
- `npm run build:client`: compila solo frontend.
- `npm run build:android`: compila el frontend usando modo Android.
- `npm run cap:sync`: sincroniza la build con Capacitor.
- `npm run android:apk:debug`: genera APK debug.
- `npm start`: arranca `dist/server.js`.
- `npm test`: ejecuta tests Vitest.

## Flujo Backend

La API sigue una estructura por capas:

1. Rutas en `src/routes`.
2. Controladores en `src/controllers`.
3. Validación con Zod en `src/validators`.
4. Lógica de negocio en `src/services`.
5. Acceso a Supabase desde `src/config/supabase.ts`.

## Despliegue

### Vercel

El frontend se genera en `client-dist`. La configuración está en `vercel.json`.

- Build command: `npm run build:client`.
- Output directory: `client-dist`.
- `/api/*` se reescribe hacia una única función `api/index.ts`, que delega en Express.

### Node

Para despliegue como servicio Node:

```bash
npm run build
npm start
```

El backend servirá la build React desde `client-dist`.

### Android

Para generar APK:

```bash
npm run android:apk:debug
```

El resultado queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Capacitor Android 8 requiere JDK 21. Si el móvil debe conectarse a producción o Railway, configura `.env.android` antes de compilar.

## Base de Datos

1. Ejecutar `db/schema.sql`.
2. Aplicar migraciones de `db/migrations`.
3. Cargar datos demo con `db/seed.sql` si se necesita entorno de pruebas.

La migración `20260501_family_links_active_unique.sql` permite revocar y volver a crear vínculos familiares sin duplicar relaciones activas.

## Buenas Prácticas

- Mantener `.env` fuera de Git.
- Mantener `.env.android` fuera de Git.
- Validar cambios con `npm run build` y `npm test`.
- Para cambios de APK, validar también `npm run android:apk:debug`.
- Documentar endpoints y reglas de negocio.
- Evitar duplicar lógica entre frontend y backend.
