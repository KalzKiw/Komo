# CafeteriaSolo

Aplicación web para gestión de pedidos anticipados en cafeterías escolares. Incluye frontend React móvil instalable como PWA, API Express backend, base de datos PostgreSQL (Supabase), integración Stripe para pagos y ticketing de cocina.

**Documentación ampliada:**
- **Guía funcional y técnica**: [README_APP.md](README_APP.md)
- **Memoria académica del proyecto**: [Memoria.md](Memoria.md)
- **Resumen de memoria y seguimiento**: [README_MEMORIA_PROYECTO.md](README_MEMORIA_PROYECTO.md)
- **Documentación técnica**: [documentacion/01-Documentacion-Tecnica.md](documentacion/01-Documentacion-Tecnica.md)
- **Manual de usuario**: [documentacion/09-Manual-Usuario.md](documentacion/09-Manual-Usuario.md)
- **Manual de administrador**: [documentacion/10-Manual-Administrador.md](documentacion/10-Manual-Administrador.md)
- **Explicación del ERD**: [documentacion/11-Explicacion-ERD.md](documentacion/11-Explicacion-ERD.md)
- **Pruebas**: [documentacion/05-Pruebas.md](documentacion/05-Pruebas.md)
- **Empaquetado Android APK**: [documentacion/08-Android-APK.md](documentacion/08-Android-APK.md)
- **Changelog completo**: [documentacion/07-Changelog.md](documentacion/07-Changelog.md)

## Stack tecnológico

- **Frontend**: React 19 + Vite 8 + Tailwind CSS v4 (puerto 5173)
- **Backend**: Node.js + Express + TypeScript (puerto 3001)
- **Base de datos**: Supabase/PostgreSQL
- **Pagos**: Stripe API (SetupIntent + PaymentIntent)
- **PWA**: manifest, iconos instalables y service worker
- **Android**: Capacitor 8 para generar APK a partir de la build Vite
- **Tickets**: impresión AVP-TC300 y preview PDF de prueba
- **Documentación API**: Swagger UI + swagger-jsdoc

## Estructura de carpetas

```
client/               ← App React (Vite)
  screens/            ← Pantallas completas
  components/         ← Componentes reutilizables
  context/            ← AuthContext, CartContext, ToastContext
  hooks/              ← useApi
  lib/                ← utilidades (money, allergens, family, etc.)

src/                  ← Backend Express + TypeScript
  routes/             ← Rutas por dominio (auth, orders, family, payment, etc.)
  controllers/        ← Handlers de endpoints
  services/           ← Lógica de negocio
  middlewares/        ← auth, error, require-role, order-time-window
  validators/         ← Schemas Zod
  config/             ← env, supabase, swagger

db/                   ← Base de datos
  schema.sql          ← DDL completo
  seed.sql            ← Datos iniciales
  migrations/         ← Incrementales por fecha
  erd.mmd             ← Diagrama relacional

documentacion/        ← Documentación del proyecto
```

## Arranque

### Configuración local

```bash
# Copiar variables de entorno (requiere SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
cp .env.example .env

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Terminal 1: backend (3001)
npm run dev

# Terminal 2: frontend (5173)
npm run dev:client
```

**Acceso:**
- **Frontend**: http://localhost:5173
- **Backend + Swagger**: http://localhost:3001/api-docs
- **Acceso rápido**: alumno (`student1@cafes.app`), padre (`parent1@cafes.app`), admin (`admin1@cafes.app`)

### Producción

```bash
npm run build       # Compila backend + frontend
npm run start       # Inicia server en puerto 3001 (sirve frontend compilado)
```

### Android APK

```bash
npm run android:apk:debug
```

El APK debug se genera en `android/app/build/outputs/apk/debug/app-debug.apk`. Antes de usarlo en móvil real, configura `VITE_API_BASE_URL` en `.env.android` con una API accesible desde el dispositivo. La APK de pruebas está configurada con nombre visible **KOMOAPK**, icono de la app, pantalla completa y navegación móvil con botón atrás/gestos.

### Variables de entorno

```
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...              (opcional, para pagos)
VITE_STRIPE_PUBLISHABLE_KEY=...    (opcional, para pagos)
VITE_API_BASE_URL=...              (necesario para APK o frontend/API separados)
BYPASS_ORDER_CUTOFF=true           (salta límites horarios en dev)
```

## Autenticación mock (desarrollo)

Los endpoints protegidos inyectan automáticamente:
- `x-user-id`: UUID del usuario
- `x-user-role`: STUDENT | PARENT | ADMIN | STAFF | DELEGATE
- `x-user-beneficiary`: true/false (opcional)

Los 3 usuarios demo en LoginScreen:
- **Alumno**: `student1@cafes.app` (STUDENT, color sky)
- **Padre**: `parent1@cafes.app` (PARENT, Carmen García, color violet)
- **Admin**: `admin1@cafes.app` (ADMIN, color amber)

## Migraciones

Las migraciones se aplican automáticamente al crear la base de datos. Si necesitas aplicar una migración específica:

```sql
-- Ejemplo (ya incluida):
\i db/migrations/20260325_order_items_customizations.sql
```

**Migraciones disponibles:**
- `20260325_order_items_customizations.sql` — Personalización de pedidos y notas de cocina
- `20260326_remove_official_menu.sql` — Limpieza de modelo
- `20260402_family_linking_tokens.sql` — Sistema de vínculos familiares
- `20260402_settings_table.sql` — Configuración global
- `20260429_complete_allergens_list.sql` — Alérgenos EU 14 completos
- `20260501_family_links_active_unique.sql` — Restricciones de integridad
- `20260503_order_cutoff_rules.sql` — Horarios de corte por turno
- `20260503_product_media_and_info.sql` — Fichas sanitarias e imágenes
- `20260503_real_school_menu_catalog.sql` — Catálogo de menú escolar
- `20260503_seed_product_info_catalog.sql` — Población de fichas sanitarias
- `20260503_wallet_profile_persistence.sql` — Teléfono, tarjeta, movimientos de monedero

## API completa

Consulta [documentacion/01-Documentacion-Tecnica.md](documentacion/01-Documentacion-Tecnica.md) para la lista completa de endpoints (autenticación, perfil, alérgenos, productos, pedidos, sistema familiar, pagos Stripe, tickets, PWA y admin).

## Pruebas

```bash
npm test
```

Estado documentado: 3 ficheros de test y 11 pruebas superadas. Consulta [documentacion/05-Pruebas.md](documentacion/05-Pruebas.md).

## Despliegue

Ver [documentacion/06-Despliegue.md](documentacion/06-Despliegue.md) para instrucciones de despliegue en Vercel o Node autohospedado.

Para publicar una versión segura y de solo lectura en un portfolio, consulta [documentacion/13-Demo-Portfolio-Vercel.md](documentacion/13-Demo-Portfolio-Vercel.md).
