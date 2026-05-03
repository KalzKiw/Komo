# Documentación Técnica

## Arquitectura General

CafeteriaSolo es una aplicación web para la gestión de pedidos anticipados en una cafetería escolar. La solución está organizada en tres capas principales:

- **Frontend**: aplicación React en `/client`, construida con Vite y Tailwind CSS.
- **Backend**: API Node.js/Express en `/src`, escrita en TypeScript.
- **Persistencia**: base de datos PostgreSQL gestionada mediante Supabase, con scripts SQL en `/db`.

La aplicación puede ejecutarse como un servicio Node único que sirve tanto la API como la build del frontend, o como despliegue en Vercel mediante una función serverless que redirige las rutas `/api/*` al backend Express.

## Estructura de Carpetas

- `/client`: frontend principal en React.
- `/src`: backend Express, rutas, controladores, servicios, validadores y configuración.
- `/api`: entrada serverless para Vercel.
- `/db`: esquema, migraciones, seed y diagrama ERD.
- `/documentacion`: documentación del proyecto.
- `/frontend`: versión legacy o experimental conservada como referencia.

## Tecnologías Usadas

- **Frontend**: React, Vite, Tailwind CSS, lucide-react.
- **Backend**: Node.js, Express, TypeScript, Zod.
- **Base de datos**: Supabase/PostgreSQL.
- **Documentación API**: Swagger UI y swagger-jsdoc.
- **Pruebas**: Vitest.
- **Despliegue**: Vercel para frontend/API serverless y opción Node con `npm start`.

## API Endpoints Principales

- `POST /api/auth/login`: login demo por email.
- `POST /api/auth/register`: registro de alumno o familiar.
- `GET /api/health`: comprobación de estado.
- `GET /api/me`: perfil del usuario autenticado.
- `PATCH /api/me`: actualización de datos persistentes de perfil, como teléfono y tarjeta guardada.
- `GET /api/me/wallet-movements`: movimientos del monedero del alumno.
- `POST /api/me/wallet/topup`: recarga del monedero propio del alumno.
- `GET /api/products`: catálogo activo.
- `GET /api/me/orders`: pedidos del usuario.
- `POST /api/orders`: creación de pedido.
- `GET /api/orders`: listado operativo para administración.
- `GET /api/orders/:orderId`: detalle de pedido.
- `PATCH /api/orders/:orderId/status`: cambio de estado por administración.
- `PATCH /api/orders/:orderId/cancel`: cancelación de pedido.
- `GET /api/admin/kds`: cola de cocina.
- `GET /api/admin/products`: gestión de productos.
- `GET /api/family/children`: hijos vinculados a una cuenta familiar.

Los endpoints protegidos usan cabeceras de autenticación mock:

- `x-user-id`
- `x-user-role`
- `x-user-beneficiary`

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
- `wallet_transactions`: movimientos de recarga del monedero.
- `settings`: configuración global, especialmente horarios de corte.

El diagrama se mantiene en `db/erd.mmd`.

## Reglas de Negocio Relevantes

- Los pedidos se organizan por turno: `MORNING`, `AFTERNOON` y `NIGHT`.
- Los límites de reserva por turno son configurables: mañana 09:00, tarde 15:00 y noche 18:00 por defecto.
- Administración puede desactivar temporalmente los límites de reserva para pruebas.
- Los estados de pedido son: `PENDING`, `IN_PREPARATION`, `READY`, `DELIVERED` y `CANCELLED`.
- El backend valida productos activos, cantidades, personalizaciones y alérgenos.
- La aplicación advierte cuando un producto contiene alérgenos declarados por el usuario.
- La cancelación puede generar devolución al monedero si cumple la ventana de cancelación.
- Las recargas de monedero actualizan el saldo en backend y se registran como movimientos.
- Teléfono y tarjeta se guardan en el perfil del usuario; por seguridad solo se conserva el último bloque visible de la tarjeta.
- Administración y cocina pueden consultar la cola KDS y actualizar estados.
