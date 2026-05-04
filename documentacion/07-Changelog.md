# Changelog

## 2026-05-04

### Añadido

- PWA instalable con `manifest.json`, iconos de 192/512 px con fondo blanco y service worker propio.
- KDS rediseñado para uso en tablet horizontal:
  - Modo pantalla completa.
  - Columnas de entrada, preparación y pedidos listos.
  - Visualización de extras, ingredientes retirados y notas de cocina.
- Estado `READY` para separar pedidos preparados de pedidos entregados.
- Impresión automática best-effort de ticket por pedido en impresora AVP-TC300 (`192.168.30.10:80`).
- Botón de depuración en Administración > Ajustes para imprimir un ticket de prueba.
- Botón de previsualización PDF del ticket de prueba.
- Pago familiar directo con tarjeta guardada para pedidos concretos sin recargar primero el monedero.
- Confirmación antes de ingresar dinero en el monedero para evitar recargas involuntarias.

### Cambiado

- Panel de pedidos de administración simplificado con filtros operativos: activos, listos, servidos y todos.
- Perfil de padre reorganizado: tarjeta de teléfono, tarjeta de pago y vínculos familiares con acceso a hijos.
- Perfil de alumno simplificado: se retiran notas frecuentes y el mensaje de privacidad queda al final.
- Familias en administración agrupadas por padre/madre para evitar duplicar pantalla con padres e hijos.

### Corregido

- La app vuelve a ser instalable desde navegador gracias a iconos válidos, manifest completo y service worker.
- El logo usado en headers e iconos mantiene fondo blanco para conservar legibilidad.

## 2026-05-03

### Añadido

- **Integraci\u00f3n Stripe completa** para pagos de recarga de monedero familiar:
  - 8 nuevos endpoints en `/api/payments/` para gesti\u00f3n de tarjetas y recargas.
  - SetupIntent para guardar tarjetas (sin cobro inicial).
  - PaymentIntent para recargas de monedero.
  - One-click recarga con tarjeta guardada.
- Persistencia de tel\u00e9fono y tarjeta resumida en el perfil del usuario.
- Endpoint de recarga real del monedero del alumno y movimientos `wallet_transactions`.
- Migraci\u00f3n `20260503_wallet_profile_persistence.sql` para perfil persistente y movimientos de monedero.
- Ficha alimentaria (sanitaria) e imagen editable desde el panel de administraci\u00f3n.
- Switch temporal en Administraci\u00f3n para desactivar los l\u00edmites de reserva.
- Migraciones adicionales:
  - `20260503_product_media_and_info.sql` \u2014 campos de imagen y fichas sanitarias.
  - `20260503_real_school_menu_catalog.sql` \u2014 cat\u00e1logo de menu escolar.
  - `20260503_seed_product_info_catalog.sql` \u2014 poblaci\u00f3n inicial de fichas sanitarias.

### Corregido

- El monedero del alumno ya no suma saldo solo en React: la recarga actualiza el backend.
- El input de recarga se sustituy\u00f3 por un control m\u00f3vil con botones de incremento/decremento.
- Alumno demo y padre demo quedan vinculados por seed/fallback de demo.
- Horarios de corte ajustados a ma\u00f1ana 09:00, tarde 15:00 y noche 18:00, sin minutos de gracia por defecto.

## 2026-05-01

### Añadido

- Frontend React/Vite como cliente principal.
- API Express conectada a Supabase.
- Despliegue Vercel con `client-dist`.
- Función serverless única para redirigir `/api/*` al backend Express.
- Sistema de alérgenos completo basado en los 14 alérgenos principales de la UE.
- Gestión familiar con códigos de vinculación.
- Panel de administración, KDS y previsión.

### Cambiado

- `npm run build` compila backend y frontend.
- Vite lee variables desde la raíz del proyecto.
- Se normalizaron colores Tailwind con sintaxis válida `[#hex]`.
- Se fijó tipografía global para mayor consistencia entre móvil y escritorio.
- Se alinearon tarjetas de productos con altura uniforme.

### Corregido

- Error de Vercel por output directory incorrecto.
- Error MIME de assets por rewrite demasiado amplio.
- Service worker antiguo que interceptaba recursos.
- Error de Railway/Node por import runtime de un archivo `.d.ts`.
- Límite de funciones serverless de Vercel Hobby.

## 2026-04-29 — Día 32: Rediseño de registro y alérgenos visuales

### Añadido

- **RegisterScreen.tsx** completo rediseño del flujo 3-pasos:
  - Paso 1: Email + Contraseña (con confirmación 2x).
  - Paso 2: Padre/Hijo selector (STUDENT/PARENT) + Tu nombre.
  - Paso 3: Selector de alérgenos (opcional, con iconos emoji).
  - Progress indicator visual (barra de 3 pasos).
  - Validaciones mejoradas con error handling.
- **ProfileScreenV2.tsx** con visualización completa de alérgenos (sin truncado).
- **AdminScreen.tsx** → ProductFormModal carga alérgenos REALES desde BD.
- **Alérgenos visuales** con iconos emoji consistentes en Registro, Perfil y Admin.

## 2026-04-02 — Día 9: Perfil hijo para padres + Stripe

### Añadido

- **ChildProfileScreen.tsx**: muestra avatar, stats (saldo/gastado/pedidos), badge beneficiario, chips de alérgenos.
- **Stripe integration starting**: setup inicial de payment.service.ts y payment.routes.ts.
- **Migraciones**:
  - `20260402_family_linking_tokens.sql` \u2014 tabla `linking_tokens` con token corto, single-use, 15 min.
  - `20260402_settings_table.sql` \u2014 tabla `settings` para horarios de corte y config global.

## 2026-04-01 — Día 8: Bypass horario + endpoints de alérgenos

### Añadido

- **Bypass del corte horario**: env var `BYPASS_ORDER_CUTOFF=true` en `.env`.
- Nuevos endpoints:
  - `GET /api/allergens` \u2014 lista todos los alérgenos del catálogo.
  - `PUT /api/me/allergies` \u2014 actualizar alérgenos del usuario.
  - `GET /api/family/children/:studentId/profile` \u2014 perfil completo del hijo.
- **AllergenPickerScreen.tsx**: carga paralela de alérgenos + UI de toggles con emojis.

## 2026-03-27 ~ 31 — Días 3-7: Migración a React + sistema familiar

### Cambios mayores

- **Migración completa del frontend** de HTML/JS a React 19 + Vite 8 + Tailwind v4.
  - Nuevo punto de entrada: `client/main.tsx`, config Vite con proxy `/api/*` → puerto 3001.
- **AuthContext** con `useAuth()`, LoginScreen con 3 botones de acceso rápido.
- **Sistema familiar completo** (backend + frontend):
  - `family.service.ts`, `family.controller.ts`, `family.routes.ts`.
  - Vinculación, desviculación, generación y canje de tokens.
  - Recarga de saldo, listado de hijos, recargas.
- **ProfileScreenWrapper** con enrutamiento por rol (STUDENT → familia, PARENT → gestión familia).
- **WalletScreen** con datos reales (saldo + movimientos).

## 2026-03-26 — Día 2: Limpieza de modelo de datos

### Corregido

- Eliminación de `is_official_menu` del modelo de productos (campo no usado).
- **Migración**: `20260326_remove_official_menu.sql` \u2014 `DROP COLUMN IF EXISTS is_official_menu`.

## 2026-03-25 — Día 1: Arranque y estructura base

### Añadido

- Diseño e implementación del shell móvil (header fijo, scroll interno, nav inferior).
- Backend Express + TypeScript con Supabase; estructura de rutas por dominio.
- Frontend inicial en HTML/CSS/JS (`frontend/`).
- Swagger / OpenAPI documentado con cabeceras mock (`x-user-id`, `x-user-role`).
- Ficha sanitaria tipada de productos (`frontend/productInfo.ts`).
- Modal de producto con alérgenos, resumen nutricional y tabla bajo demanda.
- Pantalla de Pedidos con filtros y detalle in-page.
- Perfil simplificado: sin dirección, sin historial directo, botón logout rediseñado.
- **Migración**: `20260325_order_items_customizations.sql` \u2014 `customization_json JSONB` + `kitchen_note TEXT`.
