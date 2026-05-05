# CafeteriaSolo / KOMO - Documentación de la App

## 1. Resumen

CafeteriaSolo, mostrado como **KOMO** en la interfaz, es una aplicación para gestionar pedidos anticipados en una cafetería escolar. Incluye:

- **Backend API**: Node.js + Express + TypeScript.
- **Frontend web móvil**: React 19 + Vite 8 + Tailwind CSS v4.
- **Base de datos**: Supabase/PostgreSQL.
- **Documentación OpenAPI**: Swagger UI en `/api-docs`.
- **Pagos**: integración Stripe para tarjetas y recargas en modo test.
- **PWA**: manifest, iconos instalables y service worker versionado.
- **Android APK**: empaquetado con Capacitor a partir de la build Vite.
- **Tickets**: impresión best-effort en AVP-TC300 y previsualización PDF de prueba.

## 2. Módulos principales

### Autenticación

- Login por email en modo demo.
- Registro en 3 pasos: email/contraseña, rol y alérgenos opcionales.
- Roles soportados: STUDENT, PARENT, ADMIN, STAFF y DELEGATE.

### App de alumno/familia

- **Productos**: catálogo activo con categorías, alérgenos y fichas técnicas.
- **Detalle de producto**: información alimentaria, personalizaciones, extras y retirada de ingredientes.
- **Carrito**: cálculo de total, validaciones y creación de pedidos.
- **Pedidos**: historial, detalle, estados y cancelación cuando las reglas lo permiten.
- **Monedero**: saldo del alumno y movimientos.
- **Sistema familiar**: vinculación mediante códigos, consulta de hijos, recargas y pago directo con tarjeta guardada.
- **Alérgenos**: edición en perfil y aviso al confirmar pedidos.
- **UX móvil**: navegación por pestañas, botón atrás controlado, gestos horizontales y animaciones de deslizamiento.

### Panel de administración

- **Estudiantes**: listado, delegados y datos operativos.
- **Productos**: alta, edición, activación/desactivación, alérgenos e información alimentaria.
- **Pedidos**: filtros operativos y cambio de estado.
- **KDS**: pantalla para cocina, pensada para tablet horizontal.
- **Familias**: relaciones padre/madre-alumno.
- **Configuración**: horarios de corte, bypass de pruebas, preview PDF e impresión de ticket de prueba.

## 3. Stack técnico

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, lucide-react y Context API.
- **Backend**: Node.js, Express 4, TypeScript y Zod.
- **Base de datos**: Supabase/PostgreSQL.
- **Pagos**: Stripe API, SetupIntent y PaymentIntent.
- **PWA**: manifest, iconos y service worker propio.
- **Android**: Capacitor 8 con proyecto nativo en `/android`.
- **Documentación API**: Swagger UI y swagger-jsdoc.
- **Pruebas**: Vitest.
- **Despliegue**: Vercel, Railway o Node autohospedado.

## 4. Estructura de carpetas

```text
client/                    App React/Vite
  screens/                 Pantallas completas
  components/              Componentes reutilizables
  context/                 AuthContext, CartContext, ToastContext
  hooks/                   useApi
  lib/                     utilidades y datos auxiliares

src/                       Backend Express
  routes/                  Rutas por dominio
  controllers/             Handlers HTTP
  services/                Lógica de negocio
  middlewares/             auth, error, roles y ventanas horarias
  validators/              Schemas Zod
  config/                  env, supabase, swagger y horarios
  types/                   tipos compartidos de dominio

api/                       Entrada serverless para Vercel
android/                   Proyecto nativo Android Capacitor
db/                        Esquema, seed, migraciones y ERD
documentacion/             Manuales y documentación del proyecto
```

## 5. Configuración local

```bash
cp .env.example .env
npm install
```

Variables principales:

```text
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
VITE_API_BASE_URL=...
BYPASS_ORDER_CUTOFF=true
```

No se deben versionar `.env` ni `.env.android`.

## 6. Ejecución, build y APK

Desarrollo local:

```bash
npm run dev
npm run dev:client
```

`npm run dev` arranca el backend en `http://localhost:3001`. `npm run dev:client` arranca Vite en `http://localhost:5173`.

Build y pruebas:

```bash
npm run build:client
npm run build
npm test
```

Producción Node:

```bash
npm start
```

APK Android:

```bash
npm run android:apk:debug
```

La APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Para móvil real debe existir `.env.android` con `VITE_API_BASE_URL` apuntando a una API remota.

## 7. Endpoints principales

### Autenticación

- `POST /api/auth/login`: login demo por email.
- `POST /api/auth/register`: registro de alumno o familiar.

### Perfil y alérgenos

- `GET /api/me`: datos del usuario autenticado.
- `PATCH /api/me`: actualizar teléfono, tarjeta resumida y datos persistentes.
- `GET /api/me/allergies`: alérgenos del usuario.
- `PUT /api/me/allergies`: actualizar alérgenos.
- `GET /api/allergens`: listado de alérgenos.

### Monedero

- `GET /api/me/wallet-movements`: movimientos del monedero.
- `POST /api/me/wallet/topup`: recarga directa del monedero propio.

### Productos

- `GET /api/products`: catálogo activo con filtros.

### Pedidos

- `POST /api/orders`: crear pedido con monedero o tarjeta guardada.
- `GET /api/me/orders`: pedidos del usuario.
- `GET /api/orders`: listado operativo para administración.
- `GET /api/orders/:orderId`: detalle de pedido.
- `PATCH /api/orders/:orderId/status`: cambiar estado.
- `PATCH /api/orders/:orderId/cancel`: cancelar pedido.

### Sistema familiar

- `GET /api/family/children`: hijos vinculados.
- `POST /api/family/token`: generar código de vinculación.
- `POST /api/family/link`: canjear código.
- `DELETE /api/family/links/:linkId`: desvincular.
- `GET /api/family/children/:studentId/orders`: pedidos del hijo.
- `GET /api/family/children/:studentId/profile`: perfil completo del hijo.
- `POST /api/family/topup`: recarga directa de saldo.

### Pagos con Stripe

- `GET /api/payments/config`: configuración pública de Stripe.
- `POST /api/payments/profile/card-setup-intent`: crear SetupIntent.
- `GET /api/payments/profile/cards`: listar tarjetas.
- `POST /api/payments/profile/card-setup-confirm`: confirmar tarjeta.
- `DELETE /api/payments/profile/cards/:paymentMethodId`: eliminar tarjeta.
- `POST /api/payments/family/topup-intent`: crear PaymentIntent.
- `POST /api/payments/family/topup-confirm`: confirmar recarga.
- `POST /api/payments/family/topup-saved-card`: recarga con tarjeta guardada.

### Administración

- `GET /api/admin/students`: listado de alumnos.
- `PATCH /api/admin/students/:studentId/delegate`: asignar delegado.
- `GET /api/admin/kds`: cola de cocina.
- `GET /api/admin/products`: gestión de productos.
- `POST /api/admin/products`: crear producto.
- `PATCH /api/admin/products/:productId`: actualizar producto.
- `GET /api/admin/print-test-ticket/preview`: ticket de prueba en PDF.
- `POST /api/admin/print-test-ticket`: imprimir ticket de prueba.

### Utilidades

- `GET /api/health`: estado del servidor.
- `GET /api-docs`: Swagger UI.

## 8. Swagger / OpenAPI

- **URL local**: http://localhost:3001/api-docs
- **Autenticación demo**: headers `x-user-id`, `x-user-role` y `x-user-beneficiary`.
- **Roles permitidos**: ADMIN, STAFF, STUDENT, DELEGATE y PARENT.

## 9. Pantallas frontend

| Pantalla | Archivo | Notas |
| --- | --- | --- |
| Login | `LoginScreen.tsx` / `LoginModern.tsx` | Accesos demo y formulario |
| Home/Catálogo | `HomeScreen.tsx` | Productos activos, categorías y detalle |
| Pedidos | `OrdersScreen.tsx` | Historial, detalle y cancelación |
| Monedero | `WalletScreen.tsx` | Alumno y familiar con hijos |
| Perfil | `ProfileScreenWrapper.tsx` | Perfil por rol |
| Picker alérgenos | `AllergenPickerScreen.tsx` | Gestión de alérgenos |
| Perfil hijo | `ChildProfileScreen.tsx` | Vista familiar |
| Admin | `AdminScreen.tsx` | Productos, pedidos, KDS y ajustes |

## 10. Usuarios demo

```text
Alumno:  student1@cafes.app    STUDENT
Padre:   parent1@cafes.app     PARENT
Admin:   admin1@cafes.app      ADMIN
```

Con `BYPASS_ORDER_CUTOFF=true` en `.env`, se saltan los límites horarios durante pruebas.

## 11. Estado actual

- Web desplegada y funcional.
- PWA instalable con service worker versionado.
- APK Android debug generada como **KOMOAPK**.
- Catálogo real de cafetería cargado.
- Productos desactivados ocultos en compra.
- Gestos móviles y animaciones aplicados.
- Tests Vitest: 3 ficheros y 11 pruebas superadas.

## 12. Pendientes recomendados

- Sustituir autenticación demo por Supabase Auth o JWT.
- Añadir suite E2E con Playwright.
- Validar físicamente la impresora AVP-TC300.
- Completar estrategia offline avanzada para catálogo y KDS.
- Preparar APK release firmada.
