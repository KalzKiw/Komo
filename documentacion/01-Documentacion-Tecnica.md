# Documentación Técnica

## Arquitectura General

CafeteriaSolo / KOMO es una aplicación web, PWA y APK Android para la gestión de pedidos anticipados en una cafetería escolar. La solución está organizada en capas principales:

- **Frontend**: aplicación React en `/client`, construida con Vite y Tailwind CSS.
- **Backend**: API Node.js/Express en `/src`, escrita en TypeScript.
- **Persistencia**: base de datos PostgreSQL gestionada mediante Supabase, con scripts SQL en `/db`.
- **Empaquetado móvil**: proyecto Android Capacitor en `/android`.

La aplicación puede ejecutarse como un servicio Node único que sirve tanto la API como la build del frontend, o como despliegue en Vercel mediante una función serverless que redirige las rutas `/api/*` al backend Express.

## Estructura de Carpetas

- `/client`: frontend principal en React.
- `/src`: backend Express, rutas, controladores, servicios, validadores y configuración.
- `/api`: entrada serverless para Vercel.
- `/android`: proyecto nativo Android generado con Capacitor.
- `/db`: esquema, migraciones, seed y diagrama ERD.
- `/documentacion`: documentación del proyecto.

## Tecnologías Usadas

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, lucide-react.
- **Backend**: Node.js, Express, TypeScript, Zod.
- **Base de datos**: Supabase/PostgreSQL.
- **Pagos**: Stripe API (SetupIntent y PaymentIntent).
- **PWA**: manifest, iconos instalables y service worker propio.
- **Android**: Capacitor 8, Gradle y JDK 21.
- **Documentación API**: Swagger UI y swagger-jsdoc.
- **Pruebas**: Vitest.
- **Despliegue**: Vercel, Railway y opción Node con `npm start`.

## API Endpoints Principales

### Autenticación
- `POST /api/auth/login`: login demo por email.
- `POST /api/auth/register`: registro de alumno o familiar.

### Perfil y alérgenos
- `GET /api/me`: perfil del usuario autenticado.
- `PATCH /api/me`: actualización de datos persistentes (teléfono, tarjeta resumida, etc.).
- `GET /api/me/allergies`: alérgenos del usuario.
- `PUT /api/me/allergies`: actualizar alérgenos declarados.
- `GET /api/allergens`: listado completo de alérgenos del catálogo.

### Monedero
- `GET /api/me/wallet-movements`: movimientos del monedero del alumno.
- `POST /api/me/wallet/topup`: recarga del monedero propio del alumno.

### Productos
- `GET /api/products`: catálogo activo con filtros opcionales.

### Pedidos
- `GET /api/me/orders`: pedidos del usuario.
- `POST /api/orders`: creación de pedido. Acepta `paymentMethod: "WALLET"` o `"CARD"` para permitir pago directo con tarjeta guardada en pedidos familiares.
- `GET /api/orders`: listado operativo para administración (con filtros).
- `GET /api/orders/:orderId`: detalle de pedido.
- `PATCH /api/orders/:orderId/status`: cambio de estado por administración.
- `PATCH /api/orders/:orderId/cancel`: cancelación de pedido.

### Sistema familiar
- `GET /api/family/children`: hijos vinculados a una cuenta familiar.
- `POST /api/family/token`: generar código temporal de vinculación.
- `POST /api/family/link`: canjear código de vinculación.
- `DELETE /api/family/links/:linkId`: desvinculación familiar.
- `GET /api/family/children/:studentId/orders`: pedidos del hijo.
- `GET /api/family/children/:studentId/profile`: perfil completo del hijo.
- `POST /api/family/topup`: recarga de saldo del hijo (transferencia directa).

### Pagos con Stripe
- `GET /api/payments/config`: obtener configuración de Stripe (clave pública).
- `POST /api/payments/profile/card-setup-intent`: crear SetupIntent para guardar tarjeta.
- `GET /api/payments/profile/cards`: listar tarjetas guardadas del usuario.
- `POST /api/payments/profile/card-setup-confirm`: confirmar tarjeta guardada.
- `DELETE /api/payments/profile/cards/:paymentMethodId`: eliminar tarjeta guardada.
- `POST /api/payments/family/topup-intent`: crear PaymentIntent para recarga de hijo.
- `POST /api/payments/family/topup-confirm`: confirmar recarga (procesa webhook de Stripe).
- `POST /api/payments/family/topup-saved-card`: recarga de hijo con tarjeta guardada (one-click).

### Administración
- `GET /api/admin/students`: listado de alumnos.
- `PATCH /api/admin/students/:studentId/delegate`: asignar delegado.
- `GET /api/admin/kds`: cola de cocina.
- `GET /api/admin/products`: gestión de productos.
- `POST /api/admin/products`: crear producto.
- `PATCH /api/admin/products/:productId`: actualizar producto.
- `GET /api/admin/print-test-ticket/preview`: previsualización PDF de ticket de prueba.
- `POST /api/admin/print-test-ticket`: impresión de ticket de prueba en la impresora configurada.

### Utilidades
- `GET /api/health`: comprobación de estado.
- `GET /api-docs`: documentación Swagger UI.

Los endpoints protegidos usan cabeceras de autenticación mock inyectadas por `mockAuthMiddleware`:

- `x-user-id`: UUID del usuario autenticado.
- `x-user-role`: rol del usuario (STUDENT, PARENT, ADMIN, STAFF, DELEGATE).
- `x-user-beneficiary`: (opcional) indica si el usuario es beneficiario de comida subvencionada.

## Esquema de Base de Datos

El modelo se basa en las siguientes entidades:

- `users`: usuarios con rol, saldo, teléfono, tarjeta resumida y curso.
- `courses`: cursos escolares.
- `products`: productos disponibles.
- `allergens`: catálogo de alérgenos.
- `product_allergens`: relación producto-alérgeno.
- `user_allergies`: alérgenos declarados por usuario.
- `orders`: pedidos.
- `order_items`: líneas de pedido.
- `family_links`: relación familiar entre padre/madre y alumno.
- `linking_tokens`: códigos temporales de vinculación familiar.
- `wallet_transactions`: movimientos de recarga del monedero (id, user_id, amount, concept, created_at).
- `settings`: configuración global (horarios de corte MORNING 09:00, AFTERNOON 15:00, NIGHT 18:00).
- Campos Stripe en `users`: `stripe_customer_id`, `stripe_payment_method_id` y `payment_card_last4`.

El diagrama se mantiene en `db/erd.mmd`.

## Reglas de Negocio Relevantes

- Los pedidos se organizan por turno: `MORNING`, `AFTERNOON` y `NIGHT`.
- Los límites de reserva por turno son configurables: mañana 09:00, tarde 15:00 y noche 18:00 por defecto.
- Administración puede desactivar temporalmente los límites de reserva para pruebas.
- Los estados de pedido son: `PENDING`, `IN_PREPARATION`, `READY`, `DELIVERED` y `CANCELLED`.
- La interfaz de administración agrupa los filtros de pedidos en vistas operativas: activos, listos, servidos y todos.
- El backend valida productos activos, cantidades, personalizaciones y alérgenos.
- La aplicación advierte cuando un producto contiene alérgenos declarados por el usuario.
- La cancelación puede generar devolución al monedero si cumple la ventana de cancelación.
- Las recargas de monedero actualizan el saldo en backend y se registran como movimientos.
- Teléfono y tarjeta se guardan en el perfil del usuario; por seguridad solo se conserva el último bloque visible de la tarjeta (ej: `****1234`).
- Administración y cocina pueden consultar la cola KDS. El KDS está pensado para tablet en horizontal y separa entrada, preparación y pedidos listos.
- Cada pedido intenta imprimir un ticket operativo en la impresora AVP-TC300 configurada en `192.168.30.10:80`. La impresión es best-effort y no bloquea la creación del pedido si falla.
- El ticket incluye logo textual, número de recogida, fecha/hora, alumno, turno, líneas, extras, ingredientes retirados, notas de cocina y total.
- Los pagos con Stripe usan SetupIntent para guardar tarjetas (sin cobro inicial) y PaymentIntent para recargas de monedero.
- Las recargas de monedero pueden realizarse de forma manual (transferencia directa) o con Stripe (tarjeta on-file o nuevo pago).
- En pedidos familiares se puede cobrar el importe exacto de una comida con tarjeta guardada, sin obligar a recargar primero el monedero.

## PWA

La app incluye manifest en `client/public/manifest.json`, iconos `icon-192.png` y `icon-512.png` con fondo blanco para asegurar legibilidad, y service worker en `client/public/sw.js`. En producción, `client/main.tsx` registra el service worker para permitir instalación desde navegador móvil/desktop. El service worker se versiona para evitar cachés obsoletas después de cada entrega.

## APK Android

La aplicación se empaqueta con Capacitor a partir de la build Vite en modo Android. La APK debug se genera con:

```bash
npm run android:apk:debug
```

El archivo resultante queda en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

La build Android usa `.env.android` para definir `VITE_API_BASE_URL`, ya que un dispositivo móvil no puede usar el proxy local `/api` de Vite ni `localhost` del PC. La APK de pruebas está configurada como **KOMOAPK**, con icono propio, pantalla completa y navegación móvil adaptada.

## Experiencia móvil

El frontend incorpora una capa de navegación pensada para móvil:

- Historial interno para que el botón atrás cierre detalle, carrito o vuelva a la pestaña anterior antes de cerrar la app.
- Gestos horizontales para cambiar entre catálogo, monedero, pedidos y perfil.
- Bloqueo de gestos sobre formularios y diálogos para no romper interacciones.
- Animaciones de deslizamiento entre pestañas y detalle de producto.
- Filtro de productos activos para que el alumnado no vea artículos desactivados.

## Pruebas

La validación automatizada actual se ejecuta con:

```bash
npm test
```

Resultado documentado: 3 ficheros de test y 11 pruebas superadas.
