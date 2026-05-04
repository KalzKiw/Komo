# CafeteriaSolo - Documentación de la App

## 1. Resumen
CafeteriaSolo es una aplicación para gestión de pedidos anticipados en cafeterías escolares.
Incluye:
- **Backend API**: Node.js + Express + TypeScript (puerto 3001).
- **Frontend Web Móvil**: React 19 + Vite 8 + Tailwind v4 (puerto 5173, incluida en build de producción).
- **Documentación OpenAPI**: Swagger UI en `/api-docs`.
- **Pagos**: integración Stripe para recargas de monedero familiar y gestión de tarjetas.

## 2. Módulos principales

### Autenticación
- Login por email (modo demo con headers mock).
- Registro 3 pasos: email/contraseña → rol (STUDENT/PARENT) → alérgenos opcionales.

### App de alumno/familia
- **Perfil**: datos persistentes (teléfono, tarjeta resumida).
- **Productos**: catálogo dinámico con alérgenos.
- **Personalizaciones**: detalles de producto con información sanitaria.
- **Carrito**: creación de pedidos en turnos (MORNING/AFTERNOON/NIGHT).
- **Pedidos**: historial, detalle, cancelación con devolución de saldo.
- **Monedero**: saldo de alumno, movimientos de transacciones.
- **Sistema familiar**: vinculación mediante códigos temporales, recarga de saldo de hijos.
- **Alérgenos**: edición completa con picker visual, aviso al confirmar pedidos.

### Panel de administración
- **Estudiantes**: listado, asignación de delegados, gestión de beneficiarios.
- **Productos**: CRUD con alérgenos, información sanitaria, imágenes.
- **Pedidos**: listado con filtros, cambio de estado, vista KDS.
- **Familias**: relaciones padre-hijo, códigos de vinculación.
- **Configuración**: horarios de corte, bypass para pruebas.

## 3. Stack técnico
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, lucide-react, Context API.
- **Backend**: Node.js, Express 4, TypeScript, Zod.
- **Base de datos**: Supabase/PostgreSQL.
- **Pagos**: Stripe API (SetupIntent para tarjetas, PaymentIntent para recargas).
- **Autenticación mock**: headers `x-user-id`, `x-user-role`, `x-user-beneficiary`.
- **Documentación API**: Swagger UI + swagger-jsdoc.
- **Pruebas**: Vitest.
- **Despliegue**: Vercel (frontend + API serverless) o Node autohospedado.

## 4. Estructura de carpetas

```
client/                    ← App React (Vite)
  screens/                 ← Pantallas completas
    LoginScreen.tsx        ← 3 accesos rápido (alumno/padre/admin)
    HomeScreen.tsx         ← Catálogo + carrito
    OrdersScreen.tsx       ← Historial y detalle de pedidos
    WalletScreen.tsx       ← Monedero (alumno/padre con hijos)
    AdminScreen.tsx        ← Panel admin (estudiantes, productos, KDS)
    AllergenPickerScreen.tsx
    ChildProfileScreen.tsx ← Perfil hijo (vista padre)
    ProfileScreenWrapper.tsx ← Enrutamiento por rol
  components/
    family/                ← Gestión familiar (StudentFamilyLink, ParentFamilyManager)
    CartModal.tsx, ProductDetail.tsx, StripeTopUpModal.tsx, etc.
  context/                 ← AuthContext, CartContext, ToastContext
  hooks/                   ← useApi (fetch automático con headers)
  lib/                     ← utils (money, allergens, family, productInfo, sanitary)

src/                       ← Backend Express
  routes/                  ← Rutas por dominio
    auth.routes.ts, main-app.routes.ts, orders.routes.ts, 
    family.routes.ts, payment.routes.ts, admin.routes.ts, health.routes.ts
  controllers/             ← Handlers finos
  services/                ← Lógica de negocio
    main-app.service.ts, auth.service.ts, order.service.ts, 
    family.service.ts, payment.service.ts, admin.service.ts, settings.service.ts
  middlewares/             ← auth, error, require-role, order-time-window
  validators/              ← Schemas Zod
  config/                  ← env, supabase, swagger
  types/                   ← domain.ts, express.d.ts

db/
  schema.sql               ← DDL completo
  seed.sql                 ← Datos iniciales
  migrations/              ← Incrementales por fecha (20260325..20260503)
  erd.mmd                  ← Diagrama relacional
```

## 5. Configuración local

```bash
cp .env.example .env
npm install
npm run dev
```

### Variables de entorno
```
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...         (opcional)
STRIPE_SECRET_KEY=...         (opcional, para pagos)
VITE_STRIPE_PUBLISHABLE_KEY=...(opcional, para pagos)
BYPASS_ORDER_CUTOFF=true      (salta límites horarios en dev)
```

## 6. Ejecución y build

```bash
npm run dev              # Backend + Frontend paralelo (3001 + 5173)
npm run dev:client       # Solo frontend (5173)
npm run build:client     # Build frontend (Vite → client-dist/)
npm run build            # Build backend (tsc)
npm run start            # Producción: backend en puerto 3001
```

## 7. Endpoints principales

### Autenticación
- `POST /api/auth/login` — login demo por email.
- `POST /api/auth/register` — registro 3 pasos.

### Perfil y alérgenos
- `GET /api/me` — datos del usuario autenticado.
- `PATCH /api/me` — actualizar teléfono, tarjeta resumida, etc.
- `GET /api/me/allergies` — alérgenos del usuario.
- `PUT /api/me/allergies` — actualizar alérgenos.
- `GET /api/allergens` — listado de alérgenos del catálogo.

### Monedero
- `GET /api/me/wallet-movements` — movimientos del monedero.
- `POST /api/me/wallet/topup` — recarga directa del monedero propio.

### Productos
- `GET /api/products` — catálogo activo con filtros.

### Pedidos
- `POST /api/orders` — crear pedido.
- `GET /api/orders` — listado para admin (con filtros).
- `GET /api/orders/:orderId` — detalle de pedido.
- `PATCH /api/orders/:orderId/status` — cambiar estado (admin).
- `PATCH /api/orders/:orderId/cancel` — cancelar pedido.
- `GET /api/me/orders` — mis pedidos.

### Sistema familiar
- `GET /api/family/children` — hijos vinculados.
- `POST /api/family/token` — generar código de vinculación.
- `POST /api/family/link` — canjear código de vinculación.
- `DELETE /api/family/links/:linkId` — desvinculación.
- `GET /api/family/children/:studentId/orders` — pedidos del hijo.
- `GET /api/family/children/:studentId/profile` — perfil completo del hijo.
- `POST /api/family/topup` — recarga de saldo del hijo (transferencia directa).

### Pagos con Stripe
- `GET /api/payments/config` — obtener clave pública de Stripe.
- `POST /api/payments/profile/card-setup-intent` — crear SetupIntent para guardar tarjeta.
- `GET /api/payments/profile/cards` — listar tarjetas guardadas.
- `POST /api/payments/profile/card-setup-confirm` — confirmar tarjeta guardada.
- `DELETE /api/payments/profile/cards/:paymentMethodId` — eliminar tarjeta.
- `POST /api/payments/family/topup-intent` — crear PaymentIntent para recarga.
- `POST /api/payments/family/topup-confirm` — confirmar recarga (webhook).
- `POST /api/payments/family/topup-saved-card` — recarga con tarjeta guardada.

### Admin
- `GET /api/admin/students` — listado de alumnos.
- `PATCH /api/admin/students/:studentId/delegate` — asignar delegado.
- `GET /api/admin/kds` — cola de cocina (KDS).
- `GET /api/admin/products` — gestión de productos.
- `POST /api/admin/products` — crear producto.
- `PATCH /api/admin/products/:productId` — actualizar producto.

### Utilidades
- `GET /api/health` — estado del servidor.
- `GET /api-docs` — Swagger UI.

## 8. Swagger / OpenAPI

- **URL local**: http://localhost:3001/api-docs
- **Autenticación mock**: la API usa headers `x-user-id` y `x-user-role`.
- **Roles permitidos**: ADMIN, STAFF, STUDENT, DELEGATE, PARENT.
- **Pruebas en Swagger**: incluir headers en el formulario de autenticación.

## 9. Pantallas frontend

| Pantalla | Archivo | Notas |
|---|---|---|
| Login | `LoginScreen.tsx` | 3 accesos rápido |
| Home/Catálogo | `HomeScreen.tsx` | carrito flotante |
| Pedidos | `OrdersScreen.tsx` | historial + detalle |
| Monedero | `WalletScreen.tsx` | alumno/padre con hijos |
| Perfil | `ProfileScreenWrapper.tsx` | subvistas (familia, alérgenos) |
| Picker alérgenos | `AllergenPickerScreen.tsx` | solo STUDENT |
| Perfil hijo | `ChildProfileScreen.tsx` | solo PARENT |
| Admin | `AdminScreen.tsx` | productos, pedidos, KDS |

## 10. Autenticación de desarrollo

```
Alumno:  student1@cafes.app    (STUDENT, color sky)
Padre:   parent1@cafes.app     (PARENT, color violet, Carmen García)
Admin:   admin1@cafes.app      (ADMIN, color amber)
```

Con `BYPASS_ORDER_CUTOFF=true` en `.env`, se saltan los límites horarios.
- x-user-id: opcional (si falta, se usa un UUID por defecto).
- x-user-beneficiary: opcional (true/false).

## 8. Endpoints principales
Auth:
- POST /api/auth/login

Health:
- GET /api/health

Main app:
- GET /api/me
- GET /api/products
- GET /api/me/orders
- GET /api/me/allergies

Orders:
- POST /api/orders
- GET /api/orders
- GET /api/orders/{orderId}
- DELETE /api/orders/{orderId}

Admin:
- GET /api/admin/students
- PATCH /api/admin/students/{studentId}/delegate
- GET /api/admin/kds
- GET /api/admin/products
- POST /api/admin/products
- PATCH /api/admin/products/{productId}

## 9. Flujo funcional resumido
1. Usuario inicia sesion.
2. Consulta perfil y catalogo.
3. Personaliza producto y agrega al carrito.
4. Crea pedido anticipado.
5. Consulta estado del pedido y puede cancelarlo segun reglas.
6. Admin monitoriza productos, estudiantes y cola KDS.

## 10. Estado actual de UI frontend
- Shell movil edge-to-edge.
- Header fijo con contenido scrolleable.
- Pantalla de Pedidos con filtros y detalle.
- Perfil simplificado para alumno.
- Modal de producto con enfoque de divulgacion progresiva:
  - alerta de alergenos,
  - resumen nutricional,
  - tabla nutricional completa bajo demanda,
  - ingredientes y conservacion.

## 11. Pendientes recomendados
- Unificar completamente frontend/productInfo.ts con el consumo runtime en frontend/app.js.
- Añadir tests de integracion de API.
- Mejorar ejemplos de request/response en Swagger para todos los endpoints.
- Definir estrategia real de autenticacion (JWT o sesion).
